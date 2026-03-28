import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { supabase } from '@/lib/db/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: 'sprout' | 'grove' | 'forest';
}

// Extract and verify JWT from Authorization header
export function getAuthUser(req: NextRequest): AuthUser | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.split(' ')[1], process.env.JWT_SECRET!) as AuthUser;
  } catch {
    return null;
  }
}

// Middleware helper — returns user or 401 response
export function requireAuth(req: NextRequest): { user: AuthUser } | NextResponse {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return { user };
}

// Plan gate helpers
export function requireGrove(user: AuthUser): NextResponse | null {
  if (user.plan === 'sprout') {
    return NextResponse.json({ error: 'Grove plan required', upgrade_url: '/pricing' }, { status: 403 });
  }
  return null;
}

export function requireForest(user: AuthUser): NextResponse | null {
  if (user.plan !== 'forest') {
    return NextResponse.json({ error: 'Forest plan required', upgrade_url: '/pricing' }, { status: 403 });
  }
  return null;
}

// Check lesson access for Sprout plan
export async function checkLessonAccess(lessonId: string, userId: string) {
  const { data: user } = await supabase.from('users').select('plan').eq('id', userId).single();
  if (!user) return { allowed: false, reason: 'User not found' };
  if (user.plan !== 'sprout') return { allowed: true };

  const { data: lesson } = await supabase
    .from('lessons')
    .select('lesson_number, worlds(sort_order)')
    .eq('id', lessonId)
    .single();

  if (!lesson) return { allowed: false, reason: 'Lesson not found' };
  const worldOrder = (lesson.worlds as any)?.sort_order;
  if (worldOrder > 2) return { allowed: false, reason: 'Upgrade to Grove to unlock all 6 worlds' };
  if (lesson.lesson_number > 3) return { allowed: false, reason: 'Upgrade to Grove to unlock all 8 lessons' };
  return { allowed: true };
}

// Standard error response helper
export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, ...(code && { code }) }, { status });
}

// Standard JSON response
export function apiOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// Parse body safely
export async function parseBody<T>(req: NextRequest): Promise<T | null> {
  try {
    return await req.json() as T;
  } catch {
    return null;
  }
}
