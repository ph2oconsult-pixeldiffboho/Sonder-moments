import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';
import { requireAuth, requireGrove, apiError, apiOk, parseBody } from '@/lib/middleware/auth';

// ── BOOK ─────────────────────────────────────────────────────
export async function bookGET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const groveCheck = requireGrove(auth.user);
  if (groveCheck) return groveCheck;

  const childId = req.nextUrl.searchParams.get('child_id');
  const year = req.nextUrl.searchParams.get('year');

  let query = supabase.from('book_entries')
    .select('*, child_profiles(name)')
    .eq('family_id', auth.user.id)
    .order('created_at', { ascending: false });
  if (childId) query = query.eq('child_id', childId);

  const { data: entries } = await query;
  return apiOk({ entries: entries || [] });
}

export async function bookPOST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const groveCheck = requireGrove(auth.user);
  if (groveCheck) return groveCheck;

  const body = await parseBody<any>(req);
  const parsed = z.object({
    child_id: z.string().uuid().optional(),
    entry_type: z.enum(['journal', 'milestone', 'badge', 'manual']),
    title: z.string().min(1).max(200),
    quote: z.string().max(500).optional(),
    body: z.string().max(2000).optional(),
    lesson_id: z.string().uuid().optional(),
  }).safeParse(body);
  if (!parsed.success) return apiError('Validation error', 400);

  if (parsed.data.child_id) {
    const { data: child } = await supabase.from('child_profiles').select('id').eq('id', parsed.data.child_id).eq('parent_id', auth.user.id).single();
    if (!child) return apiError('Child profile not found', 404);
  }

  const { data: entry } = await supabase.from('book_entries').insert({ family_id: auth.user.id, ...parsed.data }).select().single();
  return apiOk({ entry }, 201);
}

export async function bookDELETE(req: NextRequest, id: string) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { data: entry } = await supabase.from('book_entries').select('id').eq('id', id).eq('family_id', auth.user.id).single();
  if (!entry) return apiError('Entry not found', 404);
  await supabase.from('book_entries').delete().eq('id', id);
  return apiOk({ message: 'Entry deleted' });
}

// ── VALUES ───────────────────────────────────────────────────
export async function valuesGET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const groveCheck = requireGrove(auth.user);
  if (groveCheck) return groveCheck;

  const { data: values } = await supabase.from('family_values')
    .select('*').eq('family_id', auth.user.id).order('created_at');
  return apiOk({ values: values || [] });
}

export async function valuesPOST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const groveCheck = requireGrove(auth.user);
  if (groveCheck) return groveCheck;

  const body = await parseBody<any>(req);
  const parsed = z.object({
    owner_type: z.enum(['parent', 'child']),
    owner_id: z.string().uuid(),
    value_text: z.string().min(1).max(50),
  }).safeParse(body);
  if (!parsed.success) return apiError('Validation error', 400);

  if (parsed.data.owner_type === 'child') {
    const { data: child } = await supabase.from('child_profiles').select('id').eq('id', parsed.data.owner_id).eq('parent_id', auth.user.id).single();
    if (!child) return apiError('Child profile not found', 404);
  }

  const { data: value } = await supabase.from('family_values').insert({ family_id: auth.user.id, ...parsed.data }).select().single();
  return apiOk({ value }, 201);
}

// ── NOTIFICATIONS ────────────────────────────────────────────
export async function notifGET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { data: notifications } = await supabase.from('notifications').select('*').eq('user_id', auth.user.id).order('created_at', { ascending: false }).limit(50);
  return apiOk({ notifications: notifications || [] });
}

export async function notifPOST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const body = await parseBody<any>(req);

  if (body?.token) {
    await supabase.from('users').update({ expo_push_token: body.token }).eq('id', auth.user.id);
    return apiOk({ message: 'Token registered' });
  }
  if (body?.ids) {
    await supabase.from('notifications').update({ read: true }).in('id', body.ids).eq('user_id', auth.user.id);
    return apiOk({ message: 'Marked as read' });
  }
  return apiError('Invalid request', 400);
}

// ── PACKS ────────────────────────────────────────────────────
export async function packsGET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const groveCheck = requireGrove(auth.user);
  if (groveCheck) return groveCheck;

  const { data: packs } = await supabase.from('activity_packs').select('*, lessons(title)').eq('family_id', auth.user.id).order('created_at', { ascending: false });
  return apiOk({ packs: packs || [] });
}

export async function packsPOST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const groveCheck = requireGrove(auth.user);
  if (groveCheck) return groveCheck;

  const body = await parseBody<any>(req);
  const parsed = z.object({
    lesson_id: z.string().uuid(),
    child_name: z.string().optional(),
    includes: z.array(z.enum(['story', 'activity', 'charades', 'journal', 'parent_guide'])),
  }).safeParse(body);
  if (!parsed.success) return apiError('Validation error', 400);

  const { data: lesson } = await supabase.from('lessons').select('id').eq('id', parsed.data.lesson_id).single();
  if (!lesson) return apiError('Lesson not found', 404);

  const { data: pack } = await supabase.from('activity_packs').insert({ family_id: auth.user.id, ...parsed.data }).select().single();
  return apiOk({ pack, message: 'Pack generation queued.' }, 201);
}
