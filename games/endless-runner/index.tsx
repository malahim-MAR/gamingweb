'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvas, rounded } from '@/hooks/use-canvas';
import { random } from '@/lib/random';
import { initialRunner, stepRunner, RUNNER_GROUND } from './engine';
import { Button } from '@/components/ui/button';
import type { GameProps } from '@/types';
export default function Runner({ seed, paused, onScore, onEnd, skin = 'sunset' }: GameProps) {
  const rng = useRef(random(seed));
  const [state, setState] = useState(initialRunner);
  const stateRef = useRef(state);
  const jump = useRef(false);
  const jumps = useRef<{ tick: number; jump?: boolean; end?: boolean }[]>([]);
  const ended = useRef(false);
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#edf0fa';
      ctx.fillRect(0, 0, 640, 320);
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 4; i++) {
        const x = ((((i * 190 - state.tick * 0.4) % 760) + 760) % 760) - 80;
        rounded(ctx, x, 35 + (i % 2) * 35, 70, 17, 10, '#fff');
        rounded(ctx, x + 13, 25 + (i % 2) * 35, 38, 25, 15, '#fff');
      }
      ctx.fillStyle = '#dbe1ed';
      ctx.beginPath();
      ctx.moveTo(0, 255);
      ctx.lineTo(140, 167);
      ctx.lineTo(280, 255);
      ctx.lineTo(440, 148);
      ctx.lineTo(640, 255);
      ctx.fill();
      ctx.fillStyle = '#a7b7a6';
      ctx.fillRect(0, RUNNER_GROUND, 640, 65);
      ctx.fillStyle = '#819980';
      ctx.fillRect(0, RUNNER_GROUND, 640, 4);
      for (let i = 0; i < 20; i++)
        rounded(ctx, (((i * 45 - state.tick * 4) % 900) + 900) % 900, 275, 15, 3, 2, '#93a690');
      state.obstacles.forEach((o) => {
        rounded(ctx, o.x, RUNNER_GROUND - o.h, o.w, o.h, 5, '#5f735f');
        rounded(ctx, o.x + 4, RUNNER_GROUND - o.h + 4, 4, o.h - 8, 2, '#81967b');
      });
      const color = skin === 'mint' ? '#77b49b' : skin === 'lavender' ? '#aaa0d5' : '#ec633c';
      rounded(ctx, 82, state.y, 32, 32, 10, color);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(102, state.y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(100, state.y + 18, 5, 0, Math.PI);
      ctx.stroke();
      ctx.fillStyle = '#526251';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${state.score} m`, 18, 24);
      if (state.tick === 0) {
        ctx.font = 'bold 21px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('A tap is all it takes.', 320, 135);
      }
    },
    [state, skin],
  );
  const canvas = useCanvas(640, 320, draw);
  useEffect(() => {
    if (paused || ended.current) return;
    let raf = 0,
      last = 0,
      accumulator = 0;
    const loop = (time: number) => {
      if (!last) last = time;
      accumulator += Math.min(time - last, 100);
      last = time;
      while (accumulator >= 1000 / 60) {
        const shouldJump = jump.current;
        jump.current = false;
        if (shouldJump) jumps.current.push({ tick: stateRef.current.tick + 1, jump: true });
        const next = stepRunner(stateRef.current, shouldJump, rng.current);
        stateRef.current = next;
        accumulator -= 1000 / 60;
        if (next.tick % 6 === 0) onScore(next.score);
        if (next.over) {
          ended.current = true;
          onScore(next.score);
          onEnd(next.score, [...jumps.current, { tick: next.tick, end: true }]);
          break;
        }
      }
      setState({ ...stateRef.current });
      if (!ended.current) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, onEnd, onScore]);
  const tap = useCallback(() => {
    if (!paused && !ended.current) jump.current = true;
  }, [paused]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.code === 'Space' || e.code === 'ArrowUp') &&
        (e.target as HTMLElement).tagName !== 'BUTTON'
      ) {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [tap]);
  return (
    <div>
      <canvas
        ref={canvas}
        className="game-canvas"
        tabIndex={0}
        role="img"
        aria-label={`Cloud Runner. Distance ${state.score} meters. Press Space, tap, or click to jump.`}
        onPointerDown={tap}
      />
      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Keep your head in the clouds.</span>
        <Button variant="outline" onClick={tap} disabled={paused || ended.current}>
          Tap to jump ↑
        </Button>
      </div>
    </div>
  );
}
