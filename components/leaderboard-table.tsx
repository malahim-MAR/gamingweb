import { Trophy } from 'lucide-react';
import type { LeaderboardRow } from '@/types';
export function LeaderboardTable({
  rows,
  available,
  compact = false,
}: {
  rows: LeaderboardRow[];
  available: boolean;
  compact?: boolean;
}) {
  if (!rows.length)
    return (
      <div className="empty">
        <Trophy className="mx-auto mb-3 text-[#c2a169]" size={26} />
        {available
          ? 'A fresh leaderboard. Your name could be first.'
          : 'Rankings will appear after the database is connected.'}
      </div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Players ranked by their verified best scores.</caption>
        <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
          <tr>
            <th className="px-3 py-3 font-medium">Rank</th>
            <th className="py-3 font-medium">Player</th>
            <th className="px-3 py-3 text-right font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, compact ? 5 : 50).map((r) => (
            <tr key={r.user_id} className="border-b border-border last:border-0">
              <td className="px-3 py-4 font-semibold">
                {r.rank <= 3 ? (
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${r.rank === 1 ? 'bg-[#f1dfaf] text-[#92752e]' : 'bg-muted'}`}
                  >
                    {r.rank}
                  </span>
                ) : (
                  r.rank
                )}
              </td>
              <td className="max-w-[140px] truncate py-4 text-xs font-semibold">{r.username}</td>
              <td className="px-3 py-4 text-right text-xs font-bold tabular-nums">
                {r.score.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
