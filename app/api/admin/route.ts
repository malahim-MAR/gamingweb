import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { apiUser, apiError, ApiError, checkOrigin, jsonBody, rateLimit } from '@/lib/api';
import { adminClient } from '@/lib/supabase/server';
const schema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('game'),
    slug: z.string().max(30),
    enabled: z.boolean(),
    premium: z.boolean(),
    featured: z.boolean(),
  }),
  z.object({ kind: z.literal('flag'), key: z.enum(['ads', 'multiplayer']), enabled: z.boolean() }),
  z.object({ kind: z.literal('user'), id: z.string().uuid(), role: z.enum(['admin', 'user']) }),
]);
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await apiUser();
    const db = adminClient();
    const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new ApiError('Admin access required.', 403);
    await rateLimit(user.id, 'admin', 30);
    const action = schema.parse(await jsonBody(req));
    let error;
    if (action.kind === 'game') {
      const res = await db
        .from('games')
        .update({ enabled: action.enabled, premium: action.premium, featured: action.featured })
        .eq('slug', action.slug);
      error = res.error;
      revalidateTag('catalog');
    } else if (action.kind === 'flag') {
      const res = await db
        .from('feature_flags')
        .update({ enabled: action.enabled })
        .eq('key', action.key);
      error = res.error;
      revalidateTag('flags');
    } else {
      if (action.id === user.id) throw new ApiError('You cannot change your own admin role.');
      const res = await db.from('profiles').update({ role: action.role }).eq('id', action.id);
      error = res.error;
    }
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
