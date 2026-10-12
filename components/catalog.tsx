'use client';
import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { GameCard } from '@/components/game-card';
import type { Game } from '@/types';
export function Catalog({ games }: { games: Game[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [tier, setTier] = useState('All games');
  const shown = games.filter(
    (g) =>
      (g.name + ' ' + g.description).toLowerCase().includes(search.toLowerCase()) &&
      (category === 'All categories' || g.category === category) &&
      (tier === 'All games' || (tier === 'Premium') === g.premium),
  );
  return (
    <>
      <div className="mb-8 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-4 top-3.5 text-muted-foreground" size={18} />
          <input
            className="field pl-11"
            aria-label="Search games"
            placeholder="Find your kind of fun…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Category"
          className="field w-auto"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {['All categories', 'Puzzle', 'Word', 'Arcade', 'Multiplayer'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Free or premium"
          className="field w-auto"
          value={tier}
          onChange={(e) => setTier(e.target.value)}
        >
          {['All games', 'Free', 'Premium'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <SlidersHorizontal size={13} />
        {shown.length} games to make your day
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>
      {!shown.length && <div className="empty">No matches. Try another category or search.</div>}
    </>
  );
}
