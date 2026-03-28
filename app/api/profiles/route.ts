import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';
import { requireAuth, requireGrove, apiError, apiOk, parseBody } from '@/lib/middleware/auth';

const AGE_BANDS = ['5-6', '7-8', '9-10', '11-13', '14-16'] as const;
const PLAN_LIMITS: Record<string, number> = { sprout: 1, grove: 3, forest: 999 };

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  const { data: profiles } = await supabase
    .from('child_profiles')
    .select(`*, lesson_progress(count), badges(count)`)
    .eq('parent_id', auth.user.id)
    .order('created_at');

  return apiOk({ profiles: profiles || [] });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  const { data: user } = await supabase.from('users').select('plan').eq('id', auth.user.id).single();
  const { count } = await supabase.from('child_profiles').select('*', { count: 'exact', head: true }).eq('parent_id', auth.user.id);

  if ((count || 0) >= PLAN_LIMITS[user?.plan || 'sprout']) {
    return apiError(`Your plan supports up to ${PLAN_LIMITS[user?.plan || 'sprout']} child profile(s). Upgrade to add more.`, 403);
  }

  const body = await parseBody<any>(req);
  const parsed = z.object({ name: z.string().min(1).max(50), age_band: z.enum(AGE_BANDS) }).safeParse(body);
  if (!parsed.success) return apiError('Validation error', 400);

  const { data: profile, error } = await supabase
    .from('child_profiles').insert({ parent_id: auth.user.id, ...parsed.data }).select().single();
  if (error) return apiError('Could not create profile', 500);
  return apiOk({ profile }, 201);
}
