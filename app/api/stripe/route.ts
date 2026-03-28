import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { supabase } from '@/lib/db/supabase';
import { requireAuth, apiError, apiOk, parseBody } from '@/lib/middleware/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const PRICE_TO_PLAN: Record<string, 'grove' | 'forest'> = {
  [process.env.STRIPE_GROVE_MONTHLY_PRICE_ID!]: 'grove',
  [process.env.STRIPE_GROVE_ANNUAL_PRICE_ID!]: 'grove',
  [process.env.STRIPE_FOREST_MONTHLY_PRICE_ID!]: 'forest',
  [process.env.STRIPE_FOREST_ANNUAL_PRICE_ID!]: 'forest',
};

export async function POST(req: NextRequest) {
  const url = req.nextUrl.pathname;

  // Stripe webhook — raw body required
  if (url.endsWith('/webhook')) {
    const sig = req.headers.get('stripe-signature')!;
    const rawBody = await req.text();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.sonder_user_id;
      if (userId) {
        const priceId = sub.items.data[0]?.price.id;
        const plan = PRICE_TO_PLAN[priceId] || 'sprout';
        await supabase.from('users').update({ plan, plan_expires_at: new Date(sub.current_period_end * 1000).toISOString(), stripe_subscription_id: sub.id }).eq('id', userId);
      }
    }
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata.sonder_user_id;
      if (userId) await supabase.from('users').update({ plan: 'sprout', plan_expires_at: null, stripe_subscription_id: null }).eq('id', userId);
    }
    return NextResponse.json({ received: true });
  }

  // Create checkout session
  if (url.endsWith('/checkout')) {
    const auth = requireAuth(req);
    if ('status' in auth) return auth;
    const body = await parseBody<any>(req);
    const { price_id } = z.object({ price_id: z.string() }).parse(body);
    if (!PRICE_TO_PLAN[price_id]) return apiError('Invalid price ID', 400);

    const { data: user } = await supabase.from('users').select('stripe_customer_id').eq('id', auth.user.id).single();
    let customerId = user?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: auth.user.email, name: auth.user.name, metadata: { sonder_user_id: auth.user.id } });
      customerId = customer.id;
      await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', auth.user.id);
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      subscription_data: { metadata: { sonder_user_id: auth.user.id } },
    });
    return apiOk({ url: session.url });
  }

  // Customer portal
  if (url.endsWith('/portal')) {
    const auth = requireAuth(req);
    if ('status' in auth) return auth;
    const { data: user } = await supabase.from('users').select('stripe_customer_id').eq('id', auth.user.id).single();
    if (!user?.stripe_customer_id) return apiError('No active subscription', 400);
    const session = await stripe.billingPortal.sessions.create({ customer: user.stripe_customer_id, return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings` });
    return apiOk({ url: session.url });
  }

  return apiError('Not found', 404);
}
