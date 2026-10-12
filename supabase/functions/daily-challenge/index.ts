import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const words = [
  'CRANE',
  'PLANT',
  'BRAVE',
  'CLOUD',
  'SWEET',
  'LIGHT',
  'SHARE',
  'GAMES',
  'DREAM',
  'FLAME',
  'GRAPE',
  'SMILE',
  'OCEAN',
  'PEACH',
  'SPARK',
  'TRAIL',
  'HEART',
  'GREEN',
  'SOUND',
  'STONE',
  'WORLD',
  'MAGIC',
  'BLOOM',
  'NIGHT',
  'CHESS',
  'RIVER',
  'APPLE',
  'HONEY',
];
Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`)
    return new Response('Unauthorized', { status: 401 });
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  for (const day of [date, tomorrow]) {
    const entropy = crypto.getRandomValues(new Uint32Array(2));
    const { error } = await db.from('daily_challenges').upsert(
      {
        date: day,
        game_slug: 'word-game',
        seed: (entropy[0] % 2147483646) + 1,
        solution: words[entropy[1] % words.length],
      },
      { onConflict: 'date', ignoreDuplicates: true },
    );
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }
  const yesterday = new Date(Date.parse(date) - 86400000).toISOString().slice(0, 10);
  const { error } = await db
    .from('profiles')
    .update({ streak: 0 })
    .lt('last_challenge_date', yesterday)
    .gt('streak', 0);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  await db
    .from('rate_limits')
    .delete()
    .lt('reset_at', new Date(Date.now() - 86400000).toISOString());
  await db
    .from('match_rooms')
    .update({ status: 'abandoned' })
    .in('status', ['waiting', 'playing'])
    .lt('updated_at', new Date(Date.now() - 3600000).toISOString());
  return Response.json({ ok: true, date });
});
