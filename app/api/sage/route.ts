import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';
import { requireAuth, requireGrove, apiError, apiOk, parseBody } from '@/lib/middleware/auth';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const CRISIS_PATTERNS = [
  /\b(kill|hurt|harm)\s*(myself|yourself|me)\b/i,
  /\b(suicide|suicidal|want to die|end my life)\b/i,
  /\b(cut|cutting|self.harm|self harm)\b/i,
  /\b(abuse|abused|hitting me|hurting me)\b/i,
  /\b(don't want to be here|wish i was dead)\b/i,
];

const CRISIS_RESPONSE = `I hear you, and what you're feeling matters deeply. This sounds really difficult, and you deserve proper support right now.

Please talk to a trusted adult — a parent, teacher, or counsellor — about what you're going through. If you need to talk to someone right now:

UK: Childline 0800 1111 (free, 24/7)
US: Crisis Text Line — text HOME to 741741
International: findahelpline.com

You don't have to go through this alone.`;

const SAGE_SYSTEM = `You are Sage, a warm and honest thinking partner for teenagers aged 11-16 using the Sonder personal development app. Ask only ONE question per response. Never give direct advice. Never exceed 120 words. Be direct and honest. Treat the teenager as an intelligent person.`;

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const groveCheck = requireGrove(auth.user);
  if (groveCheck) return groveCheck;

  const body = await parseBody<any>(req);
  const parsed = z.object({
    child_id: z.string().uuid(),
    session_id: z.string().uuid().optional(),
    message: z.string().min(1).max(1000),
    lesson_id: z.string().uuid().optional(),
  }).safeParse(body);
  if (!parsed.success) return apiError('Validation error', 400);
  const { child_id, session_id, message, lesson_id } = parsed.data;

  const { data: child } = await supabase.from('child_profiles')
    .select('id,name,track,sage_enabled,sage_parent_visible,sage_topic_alerts')
    .eq('id', child_id).eq('parent_id', auth.user.id).single();
  if (!child) return apiError('Child profile not found', 404);
  if (child.track !== 'beneath') return apiError('Sage is only available for ages 11–16', 400);
  if (!child.sage_enabled) return apiError('Sage has been disabled for this profile', 403);

  const hasCrisis = CRISIS_PATTERNS.some(p => p.test(message));

  // Get or create session
  let session: any;
  if (session_id) {
    const { data } = await supabase.from('sage_sessions').select('*').eq('id', session_id).eq('child_id', child_id).single();
    if (!data) return apiError('Session not found', 404);
    session = data;
  } else {
    const { data } = await supabase.from('sage_sessions').insert({ child_id, lesson_id: lesson_id || null, messages: [] }).select().single();
    session = data;
  }

  const messages = [...(session.messages || []), { role: 'teen', content: message, timestamp: new Date().toISOString() }];

  if (hasCrisis) {
    messages.push({ role: 'sage', content: CRISIS_RESPONSE, timestamp: new Date().toISOString() });
    await supabase.from('sage_sessions').update({ messages, flagged: true, flag_reason: 'Crisis language detected' }).eq('id', session.id);
    if (child.sage_topic_alerts) {
      await supabase.from('notifications').insert({ user_id: auth.user.id, type: 'sage_flag', title: 'Important: Sage detected something concerning', body: `${child.name}'s Sage session needs your attention.`, data: { session_id: session.id, child_id } });
    }
    return apiOk({ session_id: session.id, response: CRISIS_RESPONSE, flagged: true });
  }

  // Build context
  let lessonContext = '';
  if (lesson_id) {
    const { data: lesson } = await supabase.from('lessons').select('title').eq('id', lesson_id).single();
    if (lesson) lessonContext = `\n\nThis conversation is about the lesson: "${lesson.title}".`;
  }

  const systemPrompt = `${SAGE_SYSTEM}${lessonContext}\n\nThe teenager's name is ${child.name}.`;
  const recentMessages = messages.slice(-10);
  const aiMessages = recentMessages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({ role: m.role === 'teen' ? 'user' as const : 'assistant' as const, content: m.content }));

  const aiResponse = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20251022',
    max_tokens: parseInt(process.env.SAGE_MAX_TOKENS || '300'),
    system: systemPrompt,
    messages: aiMessages,
  });

  const sageMessage = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : "I'm here. Tell me more about that.";
  messages.push({ role: 'sage', content: sageMessage, timestamp: new Date().toISOString() });

  await supabase.from('sage_sessions').update({ messages }).eq('id', session.id);

  if (messages.length === 4 && child.sage_parent_visible) {
    await supabase.from('notifications').insert({ user_id: auth.user.id, type: 'sage_session_complete', title: `${child.name} had a Sage session`, body: `${child.name} explored something meaningful with Sage today.`, data: { session_id: session.id, child_id } });
  }

  return apiOk({ session_id: session.id, response: sageMessage, flagged: false });
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if ('status' in auth) return auth;
  const groveCheck = requireGrove(auth.user);
  if (groveCheck) return groveCheck;

  const childId = req.nextUrl.searchParams.get('child_id');
  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!childId) return apiError('child_id required', 400);

  const { data: child } = await supabase.from('child_profiles').select('id').eq('id', childId).eq('parent_id', auth.user.id).single();
  if (!child) return apiError('Child profile not found', 404);

  if (sessionId) {
    const { data: session } = await supabase.from('sage_sessions').select('*').eq('id', sessionId).eq('child_id', childId).single();
    if (!session) return apiError('Session not found', 404);
    await supabase.from('sage_sessions').update({ parent_read: true }).eq('id', sessionId);
    return apiOk({ session });
  }

  const { data: sessions } = await supabase.from('sage_sessions').select('id,lesson_id,flagged,parent_read,created_at,messages').eq('child_id', childId).order('created_at', { ascending: false }).limit(20);
  return apiOk({ sessions: sessions || [] });
}
