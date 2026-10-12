'use client';
import { useState } from 'react';
import {
  Sparkles,
  LayoutGrid,
  Brain,
  Type,
  Zap,
  Users,
  Heart,
  Car,
  Dice5,
  Crosshair,
} from 'lucide-react';
import { GameCard } from '@/components/game-card';
import { usePreferences } from '@/store/preferences';
import type { Game } from '@/types';
export function HomeGames({ games }: { games: Game[] }) {
  const [filter, setFilter] = useState('All games');
  const favorites = usePreferences((s) => s.favorites);
  const filters = [
    ['All games', LayoutGrid],
    ['Puzzle', Brain],
    ['Word', Type],
    ['Arcade', Zap],
    ['Multiplayer', Users],
    ['Racing', Car],
    ['Board', Dice5],
    ['Action', Crosshair],
    ['Favorites', Heart],
  ] as const;
  const shown = games.filter(
    (g) =>
      filter === 'All games' ||
      (filter === 'Favorites' ? favorites.includes(g.slug) : g.category === filter),
  );
  return (
    <>
      <div className="mb-7 flex flex-wrap items-center gap-2">
        {filters.map(([label, Icon]) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            aria-pressed={filter === label}
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${filter === label ? 'border-foreground bg-foreground text-background' : 'border-border bg-transparent text-muted-foreground hover:bg-card'}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
        <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-muted-foreground lg:flex">
          <Sparkles size={13} /> Pick a game. Find your flow.
        </span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {shown.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>
      {!shown.length && <div className="empty">Tap a heart on a game to save it here.</div>}
    </>
  );
}
