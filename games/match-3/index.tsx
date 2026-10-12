'use client';
import { useCallback, useRef, useState } from 'react';
import { Heart, Shuffle, Hammer } from 'lucide-react';
import { useCanvas, rounded } from '@/hooks/use-canvas';
import { random } from '@/lib/random';
import { initialMatch, matchMove, type MatchAction } from './engine';
import { Button } from '@/components/ui/button';
import type { GameProps } from '@/types';
const colors = ['#ec8988', '#e6b948', '#88b493', '#a99ad0', '#78b3cb'];
export default function Match3({ seed, paused, onScore, onEnd }: GameProps) {
  const rng = useRef(random(seed));
  const [state, setState] = useState(() => {
    rng.current = random(seed);
    return initialMatch(rng.current);
  });
  const current = useRef(state);
  const [selected, setSelected] = useState<number | null>(null);
  const [cursor, setCursor] = useState(0);
  const [hammer, setHammer] = useState(false);
  const [message, setMessage] = useState('');
  const actions = useRef<MatchAction[]>([]);
  const ended = useRef(false);
  const apply = useCallback(
    (a: MatchAction) => {
      if (paused || ended.current) return;
      try {
        const next = matchMove(current.current, a, rng.current);
        actions.current.push(a);
        setMessage(next.lives < current.current.lives ? 'No match — one life used.' : 'Sweet!');
        current.current = next;
        setState(next);
        onScore(next.score);
        if (next.over) {
          ended.current = true;
          onEnd(next.score, actions.current);
        }
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Try another move.');
      }
      setSelected(null);
      setHammer(false);
    },
    [paused, onEnd, onScore],
  );
  const choose = (i: number) => {
    if (paused || ended.current) return;
    if (hammer) {
      apply({ kind: 'hammer', a: i });
      return;
    }
    if (selected === null) setSelected(i);
    else if (selected === i) setSelected(null);
    else apply({ kind: 'swap', a: selected, b: i });
  };
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      rounded(ctx, 0, 0, 440, 440, 18, '#f4e9ed');
      state.board.forEach((n, i) => {
        const x = 13 + (i % 7) * 60,
          y = 13 + Math.floor(i / 7) * 60;
        rounded(ctx, x, y, 54, 54, 10, selected === i ? '#dbc3d1' : '#fff7f7');
        rounded(ctx, x + 8, y + 8, 38, 38, n === 0 ? 19 : n === 1 ? 7 : 12, colors[n]);
        rounded(ctx, x + 15, y + 13, 17, 4, 2, '#ffffff66');
        if (i === cursor) {
          ctx.strokeStyle = '#796077';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x + 2, y + 2, 50, 50, 9);
          ctx.stroke();
        }
      });
    },
    [state, selected, cursor],
  );
  const canvas = useCanvas(440, 440, draw);
  return (
    <div className="mx-auto max-w-[440px]">
      <div className="mb-4 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1">
          {Array.from({ length: 3 }, (_, i) => (
            <Heart key={i} size={16} fill={i < state.lives ? '#ec8988' : 'none'} stroke="#ec8988" />
          ))}
        </span>
        <span className="font-semibold">{state.moves} moves left</span>
      </div>
      <canvas
        ref={canvas}
        className="game-canvas"
        role="img"
        tabIndex={0}
        aria-label={`Match 3 board. ${state.moves} moves, ${state.lives} lives. Use arrow keys and Enter to select candies.`}
        onPointerDown={(e) => {
          const b = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - b.left) / b.width) * 440,
            y = ((e.clientY - b.top) / b.height) * 440;
          const col = Math.floor((x - 13) / 60),
            row = Math.floor((y - 13) / 60);
          if (col >= 0 && col < 7 && row >= 0 && row < 7) {
            setCursor(row * 7 + col);
            choose(row * 7 + col);
          }
          e.currentTarget.focus();
        }}
        onKeyDown={(e) => {
          const delta: Record<string, number> = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -7,
            ArrowDown: 7,
          };
          if (e.key in delta) {
            e.preventDefault();
            setCursor((c) => Math.min(48, Math.max(0, c + delta[e.key])));
          }
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            choose(cursor);
          }
        }}
      />
      <div aria-live="polite" className="sr-only">
        Selected candy {selected !== null ? selected + 1 : 'none'}.{' '}
        {state.board
          .map(
            (v, i) =>
              `${i + 1}: ${['red circle', 'gold square', 'green candy', 'purple candy', 'blue candy'][v]}`,
          )
          .join(', ')}
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={paused || ended.current || !state.shuffle}
          onClick={() => apply({ kind: 'shuffle' })}
        >
          <Shuffle size={14} />
          Shuffle
        </Button>
        <Button
          variant={hammer ? 'default' : 'outline'}
          size="sm"
          disabled={paused || ended.current || !state.hammer}
          onClick={() => {
            setHammer(!hammer);
            setMessage('Select a candy to clear with your hammer.');
          }}
        >
          <Hammer size={14} />
          Hammer
        </Button>
        <span className="ml-auto self-center text-[10px] text-muted-foreground">
          One of each per game
        </span>
      </div>
      <p role="status" className="mt-3 min-h-5 text-center text-xs text-muted-foreground">
        {message || 'A colorful little escape. Select two adjacent candies.'}
      </p>
    </div>
  );
}
