import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronRight, ArrowUpRight, Trophy, Lightbulb, Gamepad2 } from 'lucide-react';
import { findGame } from '@/lib/catalog';
import { activeGames, leaderboard, featureFlags } from '@/lib/data';
import { getUser, isPremium } from '@/lib/auth';
import { GameShell } from '@/components/game-shell';
import { LeaderboardTable } from '@/components/leaderboard-table';
import { GameCard } from '@/components/game-card';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = findGame(slug);
  return {
    title: g?.name || 'Game not found',
    description: g?.description,
    openGraph: {
      title: `${g?.name} · Playroom`,
      description: g?.description,
      images: [`/games/${slug}/opengraph-image`],
    },
  };
}
export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const catalog = await activeGames();
  const game = catalog.find((g) => g.slug === slug);
  if (!game) notFound();
  const user = await getUser();
  const premium = user ? await isPremium(user.id) : false;
  const [ranks, flags] = await Promise.all([
    game.localOnly ? Promise.resolve({ rows: [], available: false }) : leaderboard(game.slug),
    featureFlags(),
  ]);
  return (
    <div className="layout py-8">
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/games">All games</Link>
        <ChevronRight size={13} />
        <span>{game.name}</span>
      </div>
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-2 text-primary">
            {game.category} · {game.tag}
          </p>
          <h1 className="page-title">{game.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{game.description}</p>
        </div>
        <span
          className="hidden rounded-2xl p-4 sm:block"
          style={{ background: game.color, color: '#354137' }}
        >
          <Gamepad2 size={28} />
        </span>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <GameShell
            game={game}
            signedIn={!!user}
            premium={premium}
            multiplayer={!!flags.multiplayer}
          />
          {!premium && flags.ads && (
            <aside
              aria-label="Advertisement"
              className="mt-5 flex h-20 flex-col items-center justify-center rounded-xl border border-dashed border-border"
            >
              <span className="text-[8px] tracking-[2px] text-muted-foreground">ADVERTISEMENT</span>
              <Link href="/pricing" className="mt-2 text-[11px] text-muted-foreground">
                More play. Fewer interruptions. Explore Premium →
              </Link>
            </aside>
          )}
          <section className="surface mt-6 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold">
              <Lightbulb size={17} className="text-[#b7975a]" />A few pointers
            </h2>
            <ol className="space-y-3">
              {game.instructions.map((s, i) => (
                <li key={s} className="flex gap-3 text-xs leading-6 text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="surface p-5">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Trophy size={17} className="text-[#b7975a]" />
            {game.localOnly ? 'Your own little challenge' : 'The high-score club'}
          </h2>
          <p className="mb-4 mt-2 text-xs text-muted-foreground">
            {game.localOnly
              ? 'Play freely, right here in your browser.'
              : 'A little friendly motivation.'}
          </p>
          {game.localOnly ? (
            <div className="rounded-xl bg-muted p-4 text-xs leading-6 text-muted-foreground">
              {game.memoryOnly
                ? 'Strike Zone keeps settings and match data in memory. Buy during the freeze phase and play the bomb objective. Use the game’s fullscreen button for an immersive view.'
                : 'Your best score saves on this device. Use the pause button for a breather, or restart for a fresh round.'}{' '}
              {game.category === 'Board'
                ? 'Choose the computer or play with a friend on the same device.'
                : 'Keyboard and touch controls are both available.'}
            </div>
          ) : (
            <>
              <LeaderboardTable {...ranks} compact />
              <Link
                className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold"
                href={`/leaderboard?game=${game.slug}`}
              >
                See the full leaderboard
                <ArrowUpRight size={14} />
              </Link>
            </>
          )}
        </aside>
      </div>
      <section className="mt-12">
        <h2 className="section-title mb-6">A little more your speed?</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {catalog
            .filter((g) => g.slug !== game.slug)
            .map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
        </div>
      </section>
    </div>
  );
}
