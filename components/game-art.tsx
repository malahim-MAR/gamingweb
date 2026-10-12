import { Cloud, Star } from 'lucide-react';
import type { GameSlug } from '@/types';
import { NewGameArt } from '@/components/new-game-art';
export function GameArt({ slug, className = '' }: { slug: GameSlug; className?: string }) {
  return (
    <div className={`game-art ${className}`} aria-hidden="true">
      <div className="art-grid" />
      {['metro-runner', 'car-racing', 'ludo', 'monopoly', 'strike-zone'].includes(slug) ? (
        <NewGameArt slug={slug} />
      ) : slug === '2048' ? (
        <div className="grid rotate-[-8deg] grid-cols-2 gap-2">
          {[2, 8, 16, 2048].map((n, i) => (
            <div
              key={n}
              className={`tile h-[60px] w-[60px] ${i === 3 ? 'text-lg text-white' : 'text-2xl text-[#745436]'}`}
              style={{ background: ['#f9e9cc', '#f2d5a4', '#eaa153', '#e77f37'][i] }}
            >
              {n}
            </div>
          ))}
        </div>
      ) : slug === 'word-game' ? (
        <div className="rotate-[-5deg]">
          <div className="mb-2 flex gap-1.5">
            {'HAPPY'.split('').map((l, i) => (
              <span
                key={i}
                className="tile h-10 w-10 border-2 border-white/30 bg-[#5c8a64] text-xl text-white"
              >
                {l}
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            {'PLAYS'.split('').map((l, i) => (
              <span
                key={i}
                className="tile h-10 w-10 text-xl text-white"
                style={{ background: i % 2 ? '#c69d4b' : '#83a888' }}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      ) : slug === 'endless-runner' ? (
        <div className="relative h-full w-full">
          <Cloud className="absolute left-[15%] top-[18%] fill-white/70 text-white/70" size={45} />
          <Cloud className="absolute right-[12%] top-[30%] fill-white/50 text-white/50" size={35} />
          <div className="absolute bottom-9 left-0 h-3 w-full rounded-full bg-[#858eae]" />
          <div className="absolute bottom-12 left-[35%] flex h-12 w-12 -rotate-12 items-center justify-center rounded-[14px] bg-[#ec633c] text-white shadow-lg">
            <span className="absolute left-3 top-3 h-1.5 w-1.5 rounded-full bg-white" />
            <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-white" />
            <span className="mt-3 text-lg">⌣</span>
          </div>
          <div className="absolute bottom-12 right-[24%] h-7 w-5 rounded-t bg-[#5e6585]" />
          <Star size={22} className="absolute right-[30%] top-9 fill-[#f9e4a3] text-[#f9e4a3]" />
        </div>
      ) : slug === 'match-3' ? (
        <div className="grid rotate-[8deg] grid-cols-3 gap-2">
          {[
            '#ed827e',
            '#f4ca68',
            '#a9ba81',
            '#b5a4d9',
            '#ed827e',
            '#f4ca68',
            '#f4ca68',
            '#b5a4d9',
            '#a9ba81',
          ].map((c, i) => (
            <div
              key={i}
              className={`h-10 w-10 border-b-4 border-black/10 ${i % 3 === 0 ? 'rounded-full' : i % 3 === 1 ? 'rounded-xl rotate-12' : 'rounded-[12px]'}`}
              style={{ background: c }}
            />
          ))}
        </div>
      ) : (
        <div className="grid rotate-[-7deg] grid-cols-5 gap-2 rounded-xl border-b-[5px] border-[#4a7e99] bg-[#6197b3] p-3">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="h-6 w-6 rounded-full shadow-inner"
              style={{
                background: [0, 1, 5, 7, 10, 11, 12, 16, 18].includes(i)
                  ? i % 2
                    ? '#f3cc69'
                    : '#ee7659'
                  : '#acd0e0',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
