import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';
import { requireAuth, apiError, apiOk, parseBody } from '@/lib/middleware/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  const { data: existing } = await supabase.from('child_profiles')
    .select('id').eq('id', params.id).eq('parent_id', auth.user.id).single();
  if (!existing) return apiError('Profile not found', 404);

  const body = await parseBody<any>(req);
  const parsed = z.object({
    name: z.string().min(1).max(50).optional(),
    age_band: z.enum(['5-6', '7-8', '9-10', '11-13', '14-16'] as const).optional(),
    sage_enabled: z.boolean().optional(),
    sage_parent_visible: z.boolean().optional(),
    sage_topic_alerts: z.boolean().optional(),
    expo_push_token: z.string().optional(),
  }).safeParse(body);
  if (!parsed.success) return apiError('Validation error', 400);

  const { data: profile } = await supabase.from('child_profiles')
    .update(parsed.data).eq('id', params.id).select().single();
  return apiOk({ profile });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;

  const { data: existing } = await supabase.from('child_profiles')
    .select('id').eq('id', params.id).eq('parent_id', auth.user.id).single();
  if (!existing) return apiError('Profile not found', 404);

  await supabase.from('child_profiles').delete().eq('id', params.id);
  return apiOk({ message: 'Profile deleted' });
}
