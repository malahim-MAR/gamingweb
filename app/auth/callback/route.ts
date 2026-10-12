import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const token = url.searchParams.get('token_hash');
  const db = await serverClient();
  const result = code
    ? await db.auth.exchangeCodeForSession(code)
    : token
      ? await db.auth.verifyOtp({ token_hash: token, type: 'email' })
      : { error: true };
  const base = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  return NextResponse.redirect(
    new URL(result.error ? '/login?error=confirmation' : '/profile', base),
  );
}
