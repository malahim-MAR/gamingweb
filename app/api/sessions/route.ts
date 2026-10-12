import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { adminClient } from '@/lib/supabase/server';
import { apiUser, apiError, ApiError, checkOrigin, jsonBody, rateLimit } from '@/lib/api';
import { feedback } from '@/games/word-game/engine';
import { utcDay } from '@/lib/utils';
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await apiUser();
    await rateLimit(user.id, 'session', 12);
    const { slug } = z
      .object({ slug: z.enum(['2048', 'word-game', 'endless-runner', 'match-3']) })
      .parse(await jsonBody(req));
    const db = adminClient();
    const { data: game, error: gameError } = await db
      .from('games')
      .select('premium,enabled')
      .eq('slug', slug)
      .single();
    if (gameError || !game) throw new ApiError('Database setup is not complete.', 503);
    if (!game.enabled) throw new ApiError('This game is taking a break.', 403);
    if (game.premium) {
      const { data } = await db
        .from('subscriptions')
        .select('status,current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();
      if (
        !data ||
        !['active', 'trialing'].includes(data.status) ||
        new Date(data.current_period_end) <= new Date()
      )
        throw new ApiError('Premium is required for this game.', 403);
    }
    let challenge = null;
    if (slug === 'word-game') {
      const { data } = await db.from('daily_challenges').select('*').eq('date', utcDay()).single();
      if (!data) throw new ApiError('Today’s word is not ready. Please try again later.', 503);
      challenge = data;
    }
    const date = challenge?.date;
    let session;
    if (date) {
      const { data } = await db
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_slug', slug)
        .eq('challenge_date', date)
        .maybeSingle();
      session = data;
    }
    if (!session) {
      const { data, error } = await db
        .from('game_sessions')
        .insert({
          user_id: user.id,
          game_slug: slug,
          seed: challenge?.seed ?? randomInt(1, 2147483647),
          challenge_date: date ?? null,
          ...(date ? { expires_at: `${date}T23:59:59.999Z` } : {}),
        })
        .select('*')
        .single();
      if (error) {
        if (date && error.code === '23505') {
          const existing = await db
            .from('game_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('challenge_date', date)
            .single();
          session = existing.data;
        } else throw error;
      } else session = data;
      await db
        .from('analytics_events')
        .insert({ user_id: user.id, event: 'game_start', game_slug: slug });
    }
    if (!session) throw new ApiError('Unable to start session.', 503);
    const guesses = (session.guesses || []) as string[];
    return NextResponse.json(
      {
        id: session.id,
        seed: session.seed,
        date: session.challenge_date,
        guesses: challenge
          ? guesses.map((word) => ({ word, feedback: feedback(word, challenge.solution) }))
          : [],
        completed:
          !!session.finished_at || guesses.length === 6 || guesses.includes(challenge?.solution),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiError(e);
  }
}
