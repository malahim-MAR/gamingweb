'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCanvas, rounded } from '@/hooks/use-canvas';
import { random } from '@/lib/random';
import { initial2048, move2048, type Direction } from './engine';
import { Button } from '@/components/ui/button';
import type { GameProps } from '@/types';
const colors: Record<number, string> = {
  2: '#eee9df',
  4: '#eddfc8',
  8: '#eab46d',
  16: '#e99b59',
  32: '#ea8356',
  64: '#e46a47',
  128: '#e9cb65',
  256: '#e8c151',
  512: '#ddb63f',
  1024: '#d6aa32',
  2048: '#cda029',
};
export default function Game2048({ seed, paused, onScore, onEnd }: GameProps) {
  const rng = useRef(random(seed));
  const [state, setState] = useState(() => {
    rng.current = random(seed);
    return initial2048(rng.current);
  });
  const stateRef = useRef(state);
  const actions = useRef<Direction[]>([]);
  const ended = useRef(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const move = useCallback(
    (d: Direction) => {
      if (paused || ended.current) return;
      const next = move2048(stateRef.current, d, rng.current);
      if (next !== stateRef.current) {
        actions.current.push(d);
        stateRef.current = next;
        setState(next);
        onScore(next.score);
        if (next.over) {
          ended.current = true;
          onEnd(next.score, actions.current);
        }
      }
    },
    [paused, onEnd, onScore],
  );
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      rounded(ctx, 0, 0, 440, 440, 18, '#b8afa2');
      state.board.forEach((n, i) => {
        const x = 12 + (i % 4) * 107,
          y = 12 + Math.floor(i / 4) * 107;
        rounded(ctx, x, y, 95, 95, 9, n ? colors[n] || '#3d5443' : '#cac2b6');
        if (n) {
          ctx.fillStyle = n < 8 ? '#786b5a' : '#fffaf1';
          ctx.font = `bold ${n >= 1024 ? 29 : n >= 128 ? 35 : 43}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(n), x + 47.5, y + 49);
        }
      });
    },
    [state],
  );
  const canvas = useCanvas(440, 440, draw);
  useEffect(() => {
    canvas.current?.focus({ preventScroll: true });
  }, [canvas]);
  function key(e: React.KeyboardEvent) {
    const map: Record<string, Direction> = {
      ArrowLeft: 'left',
      a: 'left',
      ArrowRight: 'right',
      d: 'right',
      ArrowUp: 'up',
      w: 'up',
      ArrowDown: 'down',
      s: 'down',
    };
    if (map[e.key]) {
      e.preventDefault();
      move(map[e.key]);
    }
  }
  return (
    <div className="mx-auto max-w-[440px]">
      <canvas
        ref={canvas}
        className="game-canvas"
        role="img"
        tabIndex={0}
        aria-label={`2048 board. Score ${state.score}. Use arrow keys or swipe to move.`}
        onKeyDown={key}
        onPointerDown={(e) => {
          touch.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.focus();
        }}
        onPointerUp={(e) => {
          if (!touch.current) return;
          const dx = e.clientX - touch.current.x,
            dy = e.clientY - touch.current.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) > 20)
            move(
              Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up',
            );
          touch.current = null;
        }}
      />
      <div className="sr-only" aria-live="polite">
        {state.board.map((n, i) => `${i + 1}: ${n || 'empty'}`).join(', ')}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        {(
          [
            ['left', ArrowLeft],
            ['up', ArrowUp],
            ['down', ArrowDown],
            ['right', ArrowRight],
          ] as const
        ).map(([d, Icon]) => (
          <Button
            key={d}
            variant="outline"
            size="icon"
            disabled={paused || ended.current}
            aria-label={`Move ${d}`}
            onClick={() => move(d)}
          >
            <Icon size={18} />
          </Button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {state.won ? '2048! Keep chasing your best.' : 'Join the numbers. Find your flow.'}
        </span>
        <button
          className="font-semibold underline underline-offset-4"
          disabled={paused || ended.current}
          onClick={() => {
            ended.current = true;
            onEnd(state.score, actions.current);
          }}
        >
          Save & finish
        </button>
      </div>
    </div>
  );
}
