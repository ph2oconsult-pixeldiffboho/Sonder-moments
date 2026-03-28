import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';
import { requireAuth, apiError, apiOk, parseBody } from '@/lib/middleware/auth';

async function checkAndAwardBadges(childId: string, parentId: string) {
  const { data: earned } = await supabase.from('badges').select('badge_key').eq('child_id', childId);
  const earnedSet = new Set(earned?.map((b: any) => b.badge_key) || []);
  const { data: child } = await supabase.from('child_profiles').select('name').eq('id', childId).single();

  const BADGES = [
    {
      key: 'first_seed', name: 'First seed',
      check: async () => {
        const { count } = await supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('child_id', childId).eq('status', 'complete');
        return (count || 0) >= 1;
      }
    },
    {
      key: 'feeling_finder', name: 'Feeling finder',
      check: async () => {
        const { data: world } = await supabase.from('worlds').select('id').eq('slug', 'emotions').single();
        if (!world) return false;
        const { data: lessons } = await supabase.from('lessons').select('id').eq('world_id', (world as any).id);
        const lessonIds = lessons?.map((l: any) => l.id) || [];
        if (!lessonIds.length) return false;
        const { count } = await supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('child_id', childId).eq('status', 'complete').in('lesson_id', lessonIds);
        return (count || 0) >= 5;
      }
    },
    {
      key: 'deep_roots', name: 'Deep roots',
      check: async () => {
        const { data: world } = await supabase.from('worlds').select('id').eq('slug', 'emotions').single();
        if (!world) return false;
        const { data: lessons } = await supabase.from('lessons').select('id').eq('world_id', (world as any).id);
        const lessonIds = lessons?.map((l: any) => l.id) || [];
        if (!lessonIds.length) return false;
        const { count } = await supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('child_id', childId).eq('status', 'complete').in('lesson_id', lessonIds);
        return (count || 0) >= 8;
      }
    },
    {
      key: 'still_waters', name: 'Still waters',
      check: async () => {
        const { data: world } = await supabase.from('worlds').select('id').eq('slug', 'mindfulness').single();
        if (!world) return false;
        const { data: lessons } = await supabase.from('lessons').select('id').eq('world_id', (world as any).id);
        const lessonIds = lessons?.map((l: any) => l.id) || [];
        if (!lessonIds.length) return false;
        const { count } = await supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('child_id', childId).eq('status', 'complete').in('lesson_id', lessonIds);
        return (count || 0) >= 8;
      }
    },
    {
      key: 'yet', name: 'Yet',
      check: async () => {
        const { data: world } = await supabase.from('worlds').select('id').eq('slug', 'growth').single();
        if (!world) return false;
        const { data: lessons } = await supabase.from('lessons').select('id').eq('world_id', (world as any).id);
        const lessonIds = lessons?.map((l: any) => l.id) || [];
        if (!lessonIds.length) return false;
        const { count } = await supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('child_id', childId).eq('status', 'complete').in('lesson_id', lessonIds);
        return (count || 0) >= 8;
      }
    },
    {
      key: 'true_north', name: 'True north',
      check: async () => {
        const { data: world } = await supabase.from('worlds').select('id').eq('slug', 'values').single();
        if (!world) return false;
        const { data: lessons } = await supabase.from('lessons').select('id').eq('world_id', (world as any).id);
        const lessonIds = lessons?.map((l: any) => l.id) || [];
        if (!lessonIds.length) return false;
        const { count } = await supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('child_id', childId).eq('status', 'complete').in('lesson_id', lessonIds);
        return (count || 0) >= 8;
      }
    },
  ];

  for (const badge of BADGES) {
    if (earnedSet.has(badge.key)) continue;
    if (!(await badge.check())) continue;

    await supabase.from('badges').upsert(
      { child_id: childId, badge_key: badge.key },
      { onConflict: 'child_id,badge_key', ignoreDuplicates: true }
    );
    await supabase.from('book_entries').insert({
      family_id: parentId,
      child_id: childId,
      entry_type: 'badge',
      title: `Badge earned: ${badge.name}`,
      badge_key: badge.key,
    });
    await supabase.from('notifications').insert({
      user_id: parentId,
      type: 'badge_earned',
      title: `${child?.name} earned a new badge`,
      body: `"${badge.name}" — ${child?.name} reached something real today.`,
      data: { child_id: childId, badge_key: badge.key },
    });
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  const body = await parseBody<any>(req);
  const parsed = z.object({
    child_id: z.string().uuid(),
    lesson_id: z.string().uuid(),
    status: z.enum(['in_progress', 'complete']),
  }).safeParse(body);
  if (!parsed.success) return apiError('Validation error', 400);
  const { child_id, lesson_id, status } = parsed.data;

  const { data: child } = await supabase.from('child_profiles')
    .select('id').eq('id', child_id).eq('parent_id', auth.user.id).single();
  if (!child) return apiError('Child profile not found', 404);

  const now = new Date().toISOString();
  const { data: progress } = await supabase.from('lesson_progress').upsert(
    { child_id, lesson_id, status, started_at: now, completed_at: status === 'complete' ? now : null },
    { onConflict: 'child_id,lesson_id' }
  ).select().single();

  if (status === 'complete') {
    await checkAndAwardBadges(child_id, auth.user.id);
  }

  return apiOk({ progress });
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  const childId = req.nextUrl.searchParams.get('child_id');
  if (!childId) return apiError('child_id required', 400);

  const { data: child } = await supabase.from('child_profiles')
    .select('id').eq('id', childId).eq('parent_id', auth.user.id).single();
  if (!child) return apiError('Child profile not found', 404);

  const { data: progress } = await supabase.from('lesson_progress')
    .select('*, lessons(title, world_id, worlds(name))')
    .eq('child_id', childId)
    .order('completed_at', { ascending: false, nullsFirst: false });

  return apiOk({ progress: progress || [] });
}
