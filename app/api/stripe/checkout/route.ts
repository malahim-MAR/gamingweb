import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminClient } from '@/lib/supabase/server';
import { apiError, apiUser, checkOrigin, rateLimit, ApiError } from '@/lib/api';
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await apiUser();
    await rateLimit(user.id, 'checkout', 5);
    if (!process.env.STRIPE_PREMIUM_PRICE_ID)
      throw new ApiError('Premium checkout is being set up. Check back soon.', 503);
    const db = adminClient(),
      billing = stripe();
    const { data } = await db
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    const base = process.env.NEXT_PUBLIC_SITE_URL!;
    if (
      data &&
      ['active', 'trialing'].includes(data.status) &&
      new Date(data.current_period_end) > new Date()
    )
      throw new ApiError('You already have Premium. Manage it from your profile.');
    let customer = data?.stripe_customer_id;
    if (!customer) {
      const created = await billing.customers.create(
        { email: user.email, metadata: { user_id: user.id } },
        { idempotencyKey: `customer:${user.id}` },
      );
      customer = created.id;
      const { error } = await db
        .from('subscriptions')
        .upsert({ user_id: user.id, stripe_customer_id: customer }, { onConflict: 'user_id' });
      if (error) throw error;
    }
    const session = await billing.checkout.sessions.create(
      {
        mode: 'subscription',
        customer,
        line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
        allow_promotion_codes: true,
        client_reference_id: user.id,
        subscription_data: { metadata: { user_id: user.id } },
        success_url: `${base}/profile?checkout=success`,
        cancel_url: `${base}/pricing?checkout=canceled`,
      },
      { idempotencyKey: `checkout:${user.id}:${Math.floor(Date.now() / 300000)}` },
    );
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return apiError(e);
  }
}
