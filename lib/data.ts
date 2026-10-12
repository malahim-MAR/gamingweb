import 'server-only';
import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { games } from '@/lib/catalog';
import type { GameSlug, LeaderboardRow } from '@/types';
function publicClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export const activeGames = unstable_cache(
  async () => {
    const db = publicClient();
    if (!db) return games;
    const { data, error } = await db
      .from('games')
      .select('slug,premium,featured')
      .eq('enabled', true);
    if (error) return games;
    return games
      .filter((g) => data.some((d) => d.slug === g.slug))
      .map((g) => ({
        ...g,
        premium: !!data.find((d) => d.slug === g.slug)?.premium,
        featured: !!data.find((d) => d.slug === g.slug)?.featured,
      }));
  },
  ['catalog'],
  { revalidate: 60, tags: ['catalog'] },
);
export const leaderboard = unstable_cache(
  async (slug: GameSlug | 'global', period: 'daily' | 'weekly' | 'all-time' = 'all-time') => {
    const db = publicClient();
    if (!db) return { rows: [] as LeaderboardRow[], available: false };
    if (slug === 'global' && period !== 'all-time') {
      const { data, error } = await db
        .from(period === 'daily' ? 'leaderboard_daily' : 'leaderboard_weekly')
        .select('*');
      if (error) return { rows: [], available: false };
      const totals = new Map<string, LeaderboardRow>();
      for (const row of data) {
        const old = totals.get(row.user_id);
        totals.set(row.user_id, {
          ...row,
          score: (old?.score || 0) + Math.max(0, 101 - Number(row.rank)),
        });
      }
      const sorted = Array.from(totals.values()).sort((a, b) => b.score - a.score);
      let rank = 1;
      const rows = sorted.slice(0, 50).map((r, i) => {
        if (i > 0 && r.score !== sorted[i - 1].score) rank++;
        return { ...r, rank };
      });
      return { rows, available: true };
    }
    let query = db
      .from(
        slug === 'global'
          ? 'leaderboard_global'
          : period === 'all-time'
            ? 'leaderboard_all_time'
            : `leaderboard_${period}`,
      )
      .select('*')
      .order('score', { ascending: false })
      .limit(50);
    if (slug !== 'global') query = query.eq('game_slug', slug);
    const { data, error } = await query;
    return { rows: (data || []) as LeaderboardRow[], available: !error };
  },
  ['leaderboard'],
  { revalidate: 30, tags: ['leaderboard'] },
);
export const featureFlags = unstable_cache(
  async () => {
    const db = publicClient();
    if (!db) return { ads: true, multiplayer: true };
    const { data } = await db.from('feature_flags').select('*');
    return Object.fromEntries(
      (
        data || [
          { key: 'ads', enabled: true },
          { key: 'multiplayer', enabled: true },
        ]
      ).map((d) => [d.key, d.enabled]),
    ) as Record<string, boolean>;
  },
  ['flags'],
  { revalidate: 30, tags: ['flags'] },
);
