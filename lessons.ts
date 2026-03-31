import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { requireAuth, checkLessonAccess, apiError, apiOk } from '@/lib/middleware/auth';

// GET /api/lessons/worlds
export async function GET_worlds(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const childId = req.nextUrl.searchParams.get('child_id');
  const { data: worlds } = await supabase.from('worlds').select('*').order('sort_order');
  if (childId && worlds) {
    const enriched = await Promise.all(worlds.map(async (w) => {
      const { count } = await supabase.from('lesson_progress')
        .select('*, lessons!inner(world_id)', { count: 'exact', head: true })
        .eq('child_id', childId).eq('status', 'complete').eq('lessons.world_id', w.id);
      const { count: total } = await supabase.from('lessons')
        .select('*', { count: 'exact', head: true }).eq('world_id', w.id);
      return { ...w, completed_lessons: count || 0, total_lessons: total || 0 };
    }));
    return apiOk({ worlds: enriched });
  }
  return apiOk({ worlds: worlds || [] });
}

// GET /api/lessons/next/[childId]
export async function GET_next(req: NextRequest, childId: string) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { data: child } = await supabase.from('child_profiles')
    .select('id,age_band,track').eq('id', childId).eq('parent_id', auth.user.id).single();
  if (!child) return apiError('Child profile not found', 404);
  const { data: completed } = await supabase.from('lesson_progress')
    .select('lesson_id').eq('child_id', childId).eq('status', 'complete');
  const completedIds = completed?.map(p => p.lesson_id) || [];
  let query = supabase.from('lessons')
    .select('id,title,description,duration_mins,age_band,worlds(name,colour,slug)')
    .eq('track', child.track).eq('age_band', child.age_band)
    .order('sort_order').limit(1);
  if (completedIds.length > 0) {
    query = query.not('id', 'in', `(${completedIds.join(',')})`);
  }
  const { data: lessons } = await query;
  return apiOk({ lesson: lessons?.[0] || null });
}

// GET /api/lessons?world=slug&world_id=&age_band=&track=
export async function GET_list(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const { searchParams } = req.nextUrl;
  const worldSlug = searchParams.get('world');
  const worldId = searchParams.get('world_id');
  const ageBand = searchParams.get('age_band');
  const track = searchParams.get('track');

  // If filtering by slug, look up the world_id first
  let resolvedWorldId: number | null = null;
  if (worldSlug) {
    const { data: world } = await supabase.from('worlds').select('id').eq('slug', worldSlug).single();
    if (world) resolvedWorldId = world.id;
    else return apiOk({ lessons: [] });
  } else if (worldId) {
    resolvedWorldId = parseInt(worldId);
  }

  let query = supabase.from('lessons')
    .select('id,world_id,slug,title,description,age_band,track,duration_mins,lesson_number,is_sensitive,is_guided,sort_order,worlds(name,colour,slug)')
    .order('sort_order');

  if (resolvedWorldId) query = query.eq('world_id', resolvedWorldId);
  if (ageBand) query = query.eq('age_band', ageBand);
  if (track) query = query.eq('track', track);

  const { data: lessons } = await query;
  return apiOk({ lessons: lessons || [] });
}

// GET /api/lessons/[id]
export async function GET_lesson(req: NextRequest, lessonId: string) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const access = await checkLessonAccess(lessonId, auth.user.id);
  if (!access.allowed) return apiError(access.reason || 'Upgrade required', 403, 'UPGRADE_REQUIRED');
  const { data: lesson } = await supabase.from('lessons')
    .select('*,worlds(name,colour,slug)').eq('id', lessonId).single();
  if (!lesson) return apiError('Lesson not found', 404);
  const childId = req.nextUrl.searchParams.get('child_id');
  let progress = null;
  if (childId) {
    const { data: p } = await supabase.from('lesson_progress')
      .select('*').eq('lesson_id', lessonId).eq('child_id', childId).single();
    progress = p || null;
  }
  return apiOk({ lesson, progress });
}
