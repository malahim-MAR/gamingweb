'use client';
import { useEffect, useRef, useState } from 'react';
import { random } from '@/lib/random';
import { Button } from '@/components/ui/button';
import { Dice5, Users, Bot } from 'lucide-react';
import {
  FINISH,
  SAFE,
  TRACK,
  initialLudo,
  legalTokens,
  rollLudo,
  moveLudo,
  tokenCell,
  playerName,
} from './engine';
import type { GameProps } from '@/types';
export default function Ludo({ seed, paused, onScore, onEnd }: GameProps) {
  const [state, setState] = useState(initialLudo),
    [mode, setMode] = useState<'bot' | 'local'>('bot');
  const [started, setStarted] = useState(false),
    [rolling, setRolling] = useState(false),
    [lastDie, setLastDie] = useState(1);
  const rng = useRef(random(seed)),
    ended = useRef(false);
  const legal = legalTokens(state),
    bot = mode === 'bot' && state.turn === 1;
  useEffect(() => {
    const score =
      state.tokens[0].reduce((a, p) => a + Math.max(0, p), 0) +
      state.tokens[0].filter((p) => p === FINISH).length * 100;
    onScore(score);
    if (state.winner !== null && !ended.current) {
      ended.current = true;
      onEnd(state.winner === 0 ? 1000 : score, []);
    }
  }, [state, onScore, onEnd]);
  useEffect(() => {
    if (!rolling || paused) return;
    const timer = setTimeout(() => {
      const die = 1 + Math.floor(rng.current() * 6);
      setLastDie(die);
      setState((s) => rollLudo(s, die));
      setRolling(false);
    }, 550);
    return () => clearTimeout(timer);
  }, [rolling, paused]);
  useEffect(() => {
    if (!bot || !started || paused || rolling || state.winner !== null) return;
    const timer = setTimeout(() => {
      if (state.die === null) setRolling(true);
      else {
        const choices = legalTokens(state);
        const best = [...choices].sort((a, b) => state.tokens[1][b] - state.tokens[1][a])[0];
        setState((s) => moveLudo(s, best));
      }
    }, 750);
    return () => clearTimeout(timer);
  }, [bot, started, paused, rolling, state]);
  const colors = ['#e96d54', '#568fc0'];
  const pieces = state.tokens.flatMap((row, p) =>
    row.map((pos, t) => ({ p, t, pos, cell: tokenCell(p, t, pos) })),
  );
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold">
          {mode === 'bot' ? 'You are Coral · Computer is Blue' : 'Coral vs Blue · Same device'}
        </span>
        <div className="flex gap-2">
          <Button
            variant={mode === 'bot' ? 'default' : 'outline'}
            size="sm"
            disabled={started || paused}
            onClick={() => setMode('bot')}
          >
            <Bot size={14} /> Computer
          </Button>
          <Button
            variant={mode === 'local' ? 'default' : 'outline'}
            size="sm"
            disabled={started || paused}
            onClick={() => setMode('local')}
          >
            <Users size={14} /> Two players
          </Button>
        </div>
      </div>
      <div
        className="ludo-board relative mx-auto grid aspect-square w-full max-w-[510px] grid-cols-[repeat(15,minmax(0,1fr))] grid-rows-[repeat(15,minmax(0,1fr))] overflow-hidden rounded-2xl border-2 border-[#354e46] bg-[#f9f7ef] p-1"
        role="group"
        aria-label="Ludo board"
      >
        {Array.from({ length: 225 }, (_, i) => {
          const r = Math.floor(i / 15),
            c = i % 15,
            index = TRACK.findIndex(([row, col]) => row === r && col === c);
          const yard =
            r < 6 && c < 6 ? 0 : r > 8 && c > 8 ? 1 : r < 6 && c > 8 ? 2 : r > 8 && c < 6 ? 3 : -1;
          const home = r === 7 && c > 0 && c < 7 ? 0 : r === 7 && c > 7 && c < 14 ? 1 : -1;
          const bg =
            yard === 0
              ? '#f2c3b8'
              : yard === 1
                ? '#bfdaed'
                : yard === 2
                  ? '#d7e4c9'
                  : yard === 3
                    ? '#f5e3ad'
                    : home >= 0
                      ? colors[home]
                      : index >= 0
                        ? '#fff'
                        : r >= 6 && r <= 8 && c >= 6 && c <= 8
                          ? '#dde5d7'
                          : '#f9f7ef';
          return (
            <div
              key={i}
              className={`relative flex items-center justify-center ${index >= 0 || home >= 0 ? 'border border-[#d8ded0]' : ''}`}
              style={{ background: bg }}
            >
              {index >= 0 && SAFE.has(index) && (
                <span className="absolute text-sm text-[#a9b39c]" aria-hidden="true">
                  ★
                </span>
              )}
            </div>
          );
        })}
        <div className="pointer-events-none absolute inset-1">
          {pieces.map(({ p, t, pos, cell: [r, c] }) => {
            const enabled = p === state.turn && legal.includes(t) && !bot && !paused && !rolling;
            const same = pieces.filter((piece) => piece.cell[0] === r && piece.cell[1] === c),
              index = same.findIndex((piece) => piece.p === p && piece.t === t),
              stacked = same.length > 1;
            return (
              <button
                key={`${p}:${t}`}
                className={`ludo-token pointer-events-auto absolute z-10 flex items-center justify-center rounded-full border-2 border-white text-[9px] font-extrabold text-white shadow-md ${enabled ? 'token-playable' : ''}`}
                style={{
                  background: colors[p],
                  left: `${((c + 0.5 + (stacked ? (index % 2) * 0.38 - 0.19 : 0)) * 100) / 15}%`,
                  top: `${((r + 0.5 + (stacked ? Math.floor(index / 2) * 0.38 - 0.19 : 0)) * 100) / 15}%`,
                  width: stacked ? '3%' : '5.5%',
                  maxWidth: '24px',
                  aspectRatio: '1',
                  translate: '-50% -50%',
                }}
                aria-label={`${playerName(p)} token ${t + 1}${pos === FINISH ? ' home' : pos === -1 ? ' in yard' : ` at ${pos}`}`}
                disabled={!enabled}
                onClick={() => setState((s) => moveLudo(s, t))}
              >
                {t + 1}
              </button>
            );
          })}
        </div>
      </div>
      {state.die !== null && !bot && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {legal.map((t) => (
            <Button
              key={t}
              variant="outline"
              size="sm"
              disabled={paused || rolling}
              onClick={() => setState((s) => moveLudo(s, t))}
            >
              Move token {t + 1}
            </Button>
          ))}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4">
        <div
          className={`dice-face ${rolling ? 'dice-rolling' : ''}`}
          aria-label={`Dice ${lastDie}`}
        >
          {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][lastDie - 1]}
        </div>
        <Button
          disabled={paused || rolling || bot || state.die !== null || state.winner !== null}
          onClick={() => {
            setStarted(true);
            setRolling(true);
          }}
        >
          <Dice5 size={17} />
          {rolling ? 'Rolling…' : `${playerName(state.turn)}: roll dice`}
        </Button>
        <span className="text-xs text-muted-foreground">
          Home: {state.tokens[0].filter((p) => p === FINISH).length}/4 Coral ·{' '}
          {state.tokens[1].filter((p) => p === FINISH).length}/4 Blue
        </span>
      </div>
      <p className="mt-4 min-h-10 text-center text-sm text-muted-foreground" role="status">
        {state.message}
      </p>
    </div>
  );
}
