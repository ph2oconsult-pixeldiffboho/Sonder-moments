import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';
import { requireAuth, apiError, apiOk, parseBody } from '@/lib/middleware/auth';

// ── POST /api/auth/register ──────────────────────────────────
export async function POST_register(req: NextRequest) {
  const body = await parseBody<any>(req);
  const parsed = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    pd_level: z.string().optional(),
  }).safeParse(body);
  if (!parsed.success) return apiError('Validation error', 400);

  const { email, password, name, pd_level } = parsed.data;
  const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
  if (existing) return apiError('An account with this email already exists', 409);

  const password_hash = await bcrypt.hash(password, 12);
  const { data: user, error } = await supabase
    .from('users').insert({ email, password_hash, name, pd_level }).select('id,email,name,plan').single();
  if (error || !user) return apiError('Could not create account', 500);

  const tokens = await generateAndSaveTokens(user);
  return apiOk({ user: { id: user.id, email: user.email, name: user.name, plan: user.plan }, ...tokens }, 201);
}

// ── POST /api/auth/login ─────────────────────────────────────
export async function POST_login(req: NextRequest) {
  const body = await parseBody<any>(req);
  const parsed = z.object({ email: z.string().email(), password: z.string() }).safeParse(body);
  if (!parsed.success) return apiError('Validation error', 400);

  const { email, password } = parsed.data;
  const { data: user } = await supabase.from('users').select('id,email,name,plan,password_hash').eq('email', email).single();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return apiError('Invalid email or password', 401);
  }

  await supabase.from('users').update({ last_active_at: new Date().toISOString() }).eq('id', user.id);
  const tokens = await generateAndSaveTokens(user);
  return apiOk({ user: { id: user.id, email: user.email, name: user.name, plan: user.plan }, ...tokens });
}

// ── POST /api/auth/refresh ───────────────────────────────────
export async function POST_refresh(req: NextRequest) {
  const body = await parseBody<any>(req);
  if (!body?.refreshToken) return apiError('Refresh token required', 400);

  const hash = crypto.createHash('sha256').update(body.refreshToken).digest('hex');
  const { data: stored } = await supabase
    .from('refresh_tokens')
    .select('user_id, expires_at, users(email, name, plan)')
    .eq('token_hash', hash)
    .single();

  if (!stored) return apiError('Invalid refresh token', 401);
  if (new Date(stored.expires_at) < new Date()) {
    await supabase.from('refresh_tokens').delete().eq('token_hash', hash);
    return apiError('Refresh token expired, please log in again', 401);
  }

  await supabase.from('refresh_tokens').delete().eq('token_hash', hash);
  const u = stored.users as any;
  const tokens = await generateAndSaveTokens({ id: stored.user_id, email: u.email, name: u.name, plan: u.plan });
  return apiOk(tokens);
}

// ── POST /api/auth/logout ────────────────────────────────────
export async function POST_logout(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const body = await parseBody<any>(req);
  if (body?.refreshToken) {
    const hash = crypto.createHash('sha256').update(body.refreshToken).digest('hex');
    await supabase.from('refresh_tokens').delete().eq('token_hash', hash);
  }
  return apiOk({ message: 'Logged out' });
}

// ── GET /api/auth/me ─────────────────────────────────────────
export async function GET_me(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { data: user } = await supabase
    .from('users')
    .select('id,email,name,plan,pace_setting,journey_style,notification_time,notif_daily_reminder,notif_milestones,notif_workshop,notif_weekly_summary,created_at')
    .eq('id', auth.user.id)
    .single();
  if (!user) return apiError('User not found', 404);
  return apiOk({ user });
}

// ── Helpers ──────────────────────────────────────────────────
async function generateAndSaveTokens(user: { id: string; email: string; name: string; plan: string }) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, name: user.name, plan: user.plan },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('refresh_tokens').insert({ user_id: user.id, token_hash: hash, expires_at: expiresAt });
  return { accessToken, refreshToken };
}
