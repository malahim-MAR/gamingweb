import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminClient } from '@/lib/supabase/server';
import { apiUser, apiError, checkOrigin, rateLimit, ApiError } from '@/lib/api';
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await apiUser();
    await rateLimit(user.id, 'portal', 5);
    const { data } = await adminClient()
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();
    if (!data?.stripe_customer_id) throw new ApiError('No billing account yet.');
    const session = await stripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return apiError(e);
  }
}
