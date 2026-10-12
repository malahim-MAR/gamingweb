import 'server-only';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function apiError(error: unknown) {
  if (error instanceof ApiError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof z.ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message ?? 'Invalid request.' },
      { status: 400 },
    );
  console.error('API error:', error instanceof Error ? error.message : 'Unknown error');
  return NextResponse.json(
    { error: 'This service is unavailable. Please try again shortly.' },
    { status: 503 },
  );
}
export async function apiUser() {
  const user = await getUser();
  if (!user) throw new ApiError('Sign in to continue.', 401);
  return user;
}
export function checkOrigin(req: Request) {
  const allowed = new URL(process.env.NEXT_PUBLIC_SITE_URL || req.url).origin;
  if (req.headers.get('origin') !== allowed)
    throw new ApiError('Request origin is not allowed.', 403);
}
export async function jsonBody(req: Request) {
  if (Number(req.headers.get('content-length') || 0) > 250000)
    throw new ApiError('Request is too large.', 413);
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError('Request body is missing.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 250000) {
      await reader.cancel();
      throw new ApiError('Request is too large.', 413);
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(joined));
  } catch {
    throw new ApiError('Invalid JSON.');
  }
}
export async function rateLimit(userId: string, scope: string, limit = 20) {
  const { data, error } = await adminClient().rpc('consume_rate_limit', {
    p_key: `${scope}:${userId}`,
    p_limit: limit,
    p_window: 60,
  });
  if (error) throw error;
  if (!data) throw new ApiError('Too many requests. Please wait one minute.', 429);
}
