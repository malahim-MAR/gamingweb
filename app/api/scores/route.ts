import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { adminClient } from '@/lib/supabase/server';
import { apiUser, apiError, ApiError, checkOrigin, jsonBody, rateLimit } from '@/lib/api';
import { replay2048 } from '@/games/2048/engine';
import { replayRunner } from '@/games/endless-runner/engine';
import { replayMatch } from '@/games/match-3/engine';
const directions = z.array(z.enum(['left', 'right', 'up', 'down'])).max(10000);
const matchActions = z
  .array(
    z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('swap'),
        a: z.number().int().min(0).max(48),
        b: z.number().int().min(0).max(48),
      }),
      z.object({ kind: z.literal('hammer'), a: z.number().int().min(0).max(48) }),
      z.object({ kind: z.literal('shuffle') }),
    ]),
  )
  .max(32);
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await apiUser();
    await rateLimit(user.id, 'scores', 10);
    const body = z
      .object({
        sessionId: z.string().uuid(),
        score: z.number().int().min(0).max(10000000),
        actions: z.array(z.unknown()).max(10000),
      })
      .parse(await jsonBody(req));
    const db = adminClient();
    const { data: s, error } = await db
      .from('game_sessions')
      .select('*')
      .eq('id', body.sessionId)
      .eq('user_id', user.id)
      .single();
    if (error || !s) throw new ApiError('Unknown game session.');
    if (new Date(s.expires_at) < new Date())
      throw new ApiError('Session expired. Start a new game.');
    if (s.finished_at) {
      const { data } = await db.from('scores').select('score').eq('session_id', s.id).single();
      return NextResponse.json({ ok: true, score: data?.score });
    }
    const elapsed = (Date.now() - Date.parse(s.started_at)) / 1000;
    let score = 0,
      won = false;
    try {
      if (s.game_slug === '2048') {
        const actions = directions.parse(body.actions);
        if (actions.length > elapsed * 15 + 10) throw new Error('Moves faster than allowed.');
        const state = replay2048(s.seed, actions);
        score = state.score;
        won = state.won;
      } else if (s.game_slug === 'endless-runner') {
        const log = z
          .array(
            z.object({
              tick: z.number().int().positive().max(432000),
              jump: z.boolean().optional(),
              end: z.boolean().optional(),
            }),
          )
          .max(20000)
          .parse(body.actions);
        if (!log.length || !log.at(-1)?.end) throw new Error('Missing end tick.');
        const ticks = log.at(-1)!.tick;
        const jumps = log.filter((a) => a.jump).map((a) => a.tick);
        if (ticks > elapsed * 60 + 120 || jumps.some((t, i) => i > 0 && t <= jumps[i - 1]))
          throw new Error('Invalid run timing.');
        score = replayRunner(s.seed, jumps, ticks).score;
      } else if (s.game_slug === 'match-3') {
        const actions = matchActions.parse(body.actions);
        if (actions.length > elapsed * 8 + 3) throw new Error('Moves faster than allowed.');
        score = replayMatch(s.seed, actions).score;
      } else if (s.game_slug === 'word-game') {
        const { data } = await db
          .from('daily_challenges')
          .select('solution')
          .eq('date', s.challenge_date)
          .single();
        const guesses = s.guesses as string[];
        won = guesses.includes(data?.solution);
        if (!won && guesses.length < 6) throw new Error('Complete the daily word first.');
        score = won ? (7 - guesses.length) * 100 : 0;
      } else throw new Error('Multiplayer scores are recorded by the room.');
    } catch (e) {
      throw new ApiError(e instanceof Error ? e.message : 'Invalid game log.');
    }
    if (score !== body.score) throw new ApiError('Score does not match the recorded game.');
    const { error: saveError } = await db.rpc('complete_run', {
      p_session: s.id,
      p_user: user.id,
      p_score: score,
      p_won: won,
    });
    if (saveError) throw new ApiError(saveError.message);
    revalidateTag('leaderboard');
    return NextResponse.json({ ok: true, score });
  } catch (e) {
    return apiError(e);
  }
}
