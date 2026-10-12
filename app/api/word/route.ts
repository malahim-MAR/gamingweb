import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminClient } from '@/lib/supabase/server';
import { apiUser, apiError, ApiError, checkOrigin, jsonBody, rateLimit } from '@/lib/api';
import { WORDS, feedback } from '@/games/word-game/engine';
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await apiUser();
    await rateLimit(user.id, 'word', 20);
    const { sessionId, guess } = z
      .object({ sessionId: z.string().uuid(), guess: z.string().regex(/^[A-Z]{5}$/) })
      .parse(await jsonBody(req));
    if (!WORDS.has(guess)) throw new ApiError('That word isn’t in our dictionary yet.');
    const db = adminClient();
    const { data, error } = await db.rpc('record_word_guess', {
      p_session: sessionId,
      p_user: user.id,
      p_guess: guess,
    });
    if (error) throw new ApiError(error.message);
    const guesses = data.guesses as string[];
    const answer = data.answer as string;
    const won = guesses.includes(answer);
    const over = won || guesses.length >= 6;
    let saved = false;
    if (over) {
      const result = await db.rpc('complete_run', {
        p_session: sessionId,
        p_user: user.id,
        p_score: won ? (7 - guesses.length) * 100 : 0,
        p_won: won,
      });
      saved = !result.error;
    }
    return NextResponse.json(
      {
        guesses: guesses.map((word) => ({ word, feedback: feedback(word, answer) })),
        won,
        over,
        score: won ? (7 - guesses.length) * 100 : 0,
        saved,
        ...(over ? { answer } : {}),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return apiError(e);
  }
}
