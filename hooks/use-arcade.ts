'use client';
import { useEffect, useRef, useState } from 'react';
import type { GameProps } from '@/types';

export interface ArcadeInput {
  held: Set<string>;
  commands: string[];
}
export interface FrameResult {
  score: number;
  end?: boolean;
}
export function useArcade<S>(
  props: GameProps,
  create: (seed: number) => S,
  update: (state: S, dt: number, input: ArcadeInput) => FrameResult,
  draw: (ctx: CanvasRenderingContext2D, state: S) => void,
  describe?: (state: S) => string,
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef<S | null>(null);
  if (!state.current) state.current = create(props.seed);
  const input = useRef<ArcadeInput>({ held: new Set(), commands: [] });
  const latest = useRef(props);
  latest.current = props;
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState(() => describe?.(state.current!) || 'Ready to play.');
  const ended = useRef(false);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = 800 * dpr;
    el.height = 500 * dpr;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    draw(ctx, state.current!);
    if (!running || props.paused || ended.current) {
      input.current.commands = [];
      input.current.held.clear();
      return;
    }
    let frame = 0,
      last = 0,
      report = 0;
    const loop = (time: number) => {
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 0;
      last = time;
      if (running && !latest.current.paused && !ended.current) {
        const result = update(state.current!, dt, input.current);
        input.current.commands = [];
        if (time - report > 150 || result.end) {
          latest.current.onScore(result.score);
          report = time;
          setSummary(describe?.(state.current!) || `${result.score} points`);
        }
        if (result.end) {
          ended.current = true;
          latest.current.onEnd(result.score, []);
        }
      } else {
        input.current.commands = [];
        input.current.held.clear();
      }
      draw(ctx, state.current!);
      if (!ended.current) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const clear = () => input.current.held.clear();
    window.addEventListener('blur', clear);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('blur', clear);
    };
  }, [running, props.paused, update, draw, describe]);
  const command = (code: string) => {
    if (running && !latest.current.paused && !ended.current) input.current.commands.push(code);
  };
  return {
    canvas,
    state,
    running,
    summary,
    command,
    start: () => {
      setRunning(true);
      canvas.current?.focus();
    },
    hold: (code: string, down: boolean) => {
      if (down) {
        input.current.held.add(code);
        command(code);
      } else input.current.held.delete(code);
    },
    keyDown: (e: React.KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('button, input, select')) return;
      if (
        [
          'Space',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'KeyR',
        ].includes(e.code)
      ) {
        e.preventDefault();
        input.current.held.add(e.code);
        if (!e.repeat) command(e.code);
      }
    },
    keyUp: (e: React.KeyboardEvent) => input.current.held.delete(e.code),
    clear: () => input.current.held.clear(),
    blur: (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) input.current.held.clear();
    },
  };
}
