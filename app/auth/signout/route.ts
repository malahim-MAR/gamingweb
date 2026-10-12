import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
import { checkOrigin, apiError } from '@/lib/api';
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    await (await serverClient()).auth.signOut();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
