'use client';
import Link from 'next/link';
import { ArrowUpRight, Heart, Crown } from 'lucide-react';
import { GameArt } from '@/components/game-art';
import { usePreferences } from '@/store/preferences';
import type { Game } from '@/types';
export function GameCard({ game }: { game: Game }) {
  const { favorites, toggleFavorite } = usePreferences();
  return (
    <article className="game-card relative">
      <Link href={`/games/${game.slug}`} className="block">
        <div className="relative" style={{ background: game.color }}>
          <GameArt slug={game.slug} className="h-[180px]" />
          <span className="absolute left-3 top-3 rounded-md bg-white/85 px-2 py-1 text-[9px] font-bold tracking-[1px] text-[#354137]">
            {game.tag}
          </span>
        </div>
        <div className="p-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight">{game.name}</h3>
            <ArrowUpRight size={19} className="text-muted-foreground" />
          </div>
          <p className="mb-4 min-h-[40px] text-xs leading-relaxed text-muted-foreground">
            {game.description}
          </p>
          <div className="flex items-center justify-between border-t border-border pt-3 text-[11px]">
            <span className="text-muted-foreground">{game.category}</span>
            <span
              className={`flex items-center gap-1 font-semibold ${game.premium ? 'text-[#b18a41]' : 'text-[#65826a]'}`}
            >
              {game.premium && <Crown size={12} />} {game.premium ? 'Premium' : 'Free to play'}
            </span>
          </div>
        </div>
      </Link>
      <button
        onClick={() => toggleFavorite(game.slug)}
        className="absolute right-3 top-3 rounded-full bg-white/85 p-2 text-[#354137] transition hover:scale-110"
        aria-label={`${favorites.includes(game.slug) ? 'Remove' : 'Add'} ${game.name} ${favorites.includes(game.slug) ? 'from' : 'to'} favorites`}
      >
        <Heart
          size={14}
          fill={favorites.includes(game.slug) ? '#ec633c' : 'none'}
          stroke={favorites.includes(game.slug) ? '#ec633c' : 'currentColor'}
        />
      </button>
    </article>
  );
}
