import Link from 'next/link';
import { Trophy, Info } from 'lucide-react';
import { games } from '@/lib/catalog';
import { leaderboard } from '@/lib/data';
import { LeaderboardTable } from '@/components/leaderboard-table';
import type { GameSlug } from '@/types';
export const metadata = { title: 'Leaderboards' };
export default async function Leaderboards({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; period?: string }>;
}) {
  const params = await searchParams;
  const slug = games.some((g) => g.slug === params.game) ? (params.game as GameSlug) : 'global';
  const period = ['daily', 'weekly', 'all-time'].includes(params.period || '')
    ? (params.period as 'daily' | 'weekly' | 'all-time')
    : 'all-time';
  const data = await leaderboard(slug, period);
  return (
    <div className="layout max-w-[1000px] py-12">
      <p className="eyebrow mb-3 text-primary">THE HIGH-SCORE CLUB</p>
      <h1 className="page-title">A little friendly competition.</h1>
      <p className="mb-9 mt-4 text-sm text-muted-foreground">
        Personal bests. Proud moments. A good reason for one more game.
      </p>
      <div className="mb-5 flex flex-wrap gap-2">
        {[['global', 'Overall'], ...games.map((g) => [g.slug, g.name])].map(([s, n]) => (
          <Link
            key={s}
            href={`/leaderboard?game=${s}&period=${period}`}
            aria-current={slug === s ? 'page' : undefined}
            className={`rounded-full border px-4 py-2.5 text-xs font-semibold ${slug === s ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-muted'}`}
          >
            {n}
          </Link>
        ))}
      </div>
      <section className="surface p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Trophy size={18} className="text-[#bc9a57]" />
            {slug === 'global' ? 'Overall standings' : games.find((g) => g.slug === slug)?.name}
          </h2>
          <div className="flex rounded-lg bg-muted p-1">
            {[
              ['daily', 'Today'],
              ['weekly', 'This week'],
              ['all-time', 'All time'],
            ].map(([p, n]) => (
              <Link
                key={p}
                className={`rounded-md px-3 py-2 text-xs ${p === period ? 'bg-card font-semibold shadow-sm' : 'text-muted-foreground'}`}
                href={`/leaderboard?game=${slug}&period=${p}`}
              >
                {n}
              </Link>
            ))}
          </div>
        </div>
        <LeaderboardTable {...data} />
      </section>
      <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
        <Info size={14} className="mt-1 shrink-0" />
        {slug === 'global'
          ? 'Overall points reward your standing in each game: first place earns 100 points, second earns 99, and so on.'
          : 'Your best verified score in the selected period counts.'}{' '}
        Rankings refresh every 30 seconds. Daily and weekly periods follow UTC.
      </p>
    </div>
  );
}
