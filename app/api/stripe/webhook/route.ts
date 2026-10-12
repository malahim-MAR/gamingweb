import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { adminClient } from '@/lib/supabase/server';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET)
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 400 });
  let event: Stripe.Event;
  let billing;
  try {
    billing = stripe();
    event = billing.webhooks.constructEvent(
      await req.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }
  try {
    let subscriptionId: string | null = null;
    if (event.type.startsWith('customer.subscription.'))
      subscriptionId = (event.data.object as Stripe.Subscription).id;
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const s = event.data.object as Stripe.Checkout.Session;
      subscriptionId =
        typeof s.subscription === 'string' ? s.subscription : s.subscription?.id || null;
    }
    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = invoice.parent?.subscription_details?.subscription;
      subscriptionId = typeof sub === 'string' ? sub : sub?.id || null;
    }
    if (!subscriptionId) return NextResponse.json({ received: true });
    // Fetch canonical state so a delayed event cannot restore an old entitlement.
    const subscription = await billing.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.user_id;
    if (!userId)
      return NextResponse.json({ error: 'Subscription owner metadata missing.' }, { status: 500 });
    const period = subscription.items.data[0]?.current_period_end;
    const { error } = await adminClient().rpc('apply_subscription_event', {
      p_event: event.id,
      p_created: event.created,
      p_user: userId,
      p_customer:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
      p_subscription: subscription.id,
      p_status: subscription.status,
      p_end: period ? new Date(period * 1000).toISOString() : null,
      p_cancel: subscription.cancel_at_period_end,
    });
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(
      'Webhook processing failed',
      error instanceof Error ? error.message : 'Database error',
    );
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
