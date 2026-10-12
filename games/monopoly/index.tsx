'use client';
import { useEffect, useRef, useState } from 'react';
import { random } from '@/lib/random';
import { Button } from '@/components/ui/button';
import { Bot, Users, Dice5, Home } from 'lucide-react';
import {
  SQUARES,
  initialProperty,
  rollProperty,
  buyProperty,
  endPropertyTurn,
  netWorth,
  rentFor,
  squareCell,
  propertyPlayer,
} from './engine';
import type { GameProps } from '@/types';
export default function PropertyGame({ seed, paused, onScore, onEnd }: GameProps) {
  const [state, setState] = useState(initialProperty),
    [mode, setMode] = useState<'bot' | 'local'>('bot'),
    [started, setStarted] = useState(false),
    [rolling, setRolling] = useState(false);
  const rng = useRef(random(seed)),
    ended = useRef(false),
    bot = mode === 'bot' && state.turn === 1;
  useEffect(() => {
    onScore(Math.max(0, netWorth(state, 0)));
    if (state.phase === 'over' && !ended.current) {
      ended.current = true;
      onEnd(Math.max(0, netWorth(state, 0)), []);
    }
  }, [state, onScore, onEnd]);
  useEffect(() => {
    if (!rolling || paused) return;
    const timer = setTimeout(() => {
      const dice = [1 + Math.floor(rng.current() * 6), 1 + Math.floor(rng.current() * 6)],
        chance = rng.current();
      setState((s) => rollProperty(s, dice, chance));
      setRolling(false);
    }, 550);
    return () => clearTimeout(timer);
  }, [rolling, paused]);
  useEffect(() => {
    if (!bot || !started || paused || rolling || state.phase === 'over') return;
    const timer = setTimeout(() => {
      if (state.phase === 'roll') setRolling(true);
      else if (state.phase === 'buy' && state.cash[1] > SQUARES[state.positions[1]].price! + 150)
        setState((s) => buyProperty(s));
      else setState((s) => endPropertyTurn(s));
    }, 850);
    return () => clearTimeout(timer);
  }, [bot, started, paused, rolling, state]);
  const colors = ['#e96d54', '#568fc0'],
    groups = ['#b99a7c', '#84babc', '#dba876', '#aa9bc2'];
  const disabled = paused || bot || rolling || state.phase === 'over';
  const tile = SQUARES[state.positions[state.turn]];
  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-between gap-2">
        <p className="self-center text-xs font-semibold">
          {mode === 'bot' ? 'You are Coral · Computer is Blue' : 'Two players · Same device'}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={mode === 'bot' ? 'default' : 'outline'}
            disabled={started || paused}
            onClick={() => setMode('bot')}
          >
            <Bot size={14} /> Computer
          </Button>
          <Button
            size="sm"
            variant={mode === 'local' ? 'default' : 'outline'}
            disabled={started || paused}
            onClick={() => setMode('local')}
          >
            <Users size={14} /> Two players
          </Button>
        </div>
      </div>
      <div
        className="property-board relative mx-auto grid aspect-square w-full max-w-[570px] grid-cols-[repeat(7,minmax(0,1fr))] grid-rows-[repeat(7,minmax(0,1fr))] gap-1 rounded-2xl bg-[#dbe6d7] p-2 text-[#30473c]"
        role="group"
        aria-label="Property Club board"
      >
        <div className="col-start-2 col-end-7 row-start-2 row-end-7 flex flex-col items-center justify-center p-2 text-center">
          <Home className="mb-2 text-[#5e8769]" size={32} />
          <h2 className="text-base font-extrabold tracking-tight sm:text-2xl">
            Property Club<span className="text-[#ec633c]">.</span>
          </h2>
          <p className="mt-1 text-[9px] uppercase tracking-widest sm:text-xs">
            Little streets. Big ambitions.
          </p>
          <div className="my-3 flex gap-2">
            {state.dice.map((d, i) => (
              <span
                key={i}
                className={`dice-face ${rolling ? 'dice-rolling' : ''}`}
                aria-label={`Die ${i + 1}: ${d}`}
              >
                {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][d - 1]}
              </span>
            ))}
          </div>
          <p className="text-[10px] font-semibold sm:text-xs">
            Turn {Math.min(24, state.round + 1)} / 24 · {propertyPlayer(state.turn)} plays
          </p>
        </div>
        {SQUARES.map((sq, i) => {
          const [r, c] = squareCell(i),
            owner = state.owners[i];
          return (
            <div
              key={i}
              className="relative flex min-w-0 flex-col items-center justify-center overflow-hidden rounded-md border border-[#bfcdb9] bg-[#f9f7ee] px-0.5 text-center"
              style={{ gridRow: r + 1, gridColumn: c + 1 }}
            >
              {sq.group !== undefined && (
                <span
                  className="absolute inset-x-0 top-0 h-[5px] sm:h-2"
                  style={{ background: groups[sq.group] }}
                />
              )}
              <span className="mt-1 text-[7px] font-bold leading-tight sm:text-[10px]">
                {sq.name}
              </span>
              <span className="mt-0.5 text-[7px] sm:text-[9px]">
                {sq.price
                  ? `$${sq.price}`
                  : sq.kind === 'go'
                    ? '+$200'
                    : sq.kind === 'tax'
                      ? '−$100'
                      : sq.kind === 'chance'
                        ? '?'
                        : ''}
              </span>
              <span className="mt-1 flex gap-0.5">
                {state.positions.map((pos, p) =>
                  pos === i ? (
                    <span
                      key={p}
                      className="board-pawn h-3 w-3 rounded-full border border-white shadow sm:h-4 sm:w-4"
                      style={{ background: colors[p] }}
                      aria-label={`${propertyPlayer(p)} on ${sq.name}`}
                    />
                  ) : null,
                )}
              </span>
              {owner !== null && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[3px]"
                  style={{ background: colors[owner] }}
                  aria-label={`Owned by ${propertyPlayer(owner)}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {state.cash.map((cash, p) => (
          <div key={p} className="surface p-3 text-xs" style={{ borderColor: colors[p] }}>
            <span className="font-bold" style={{ color: colors[p] }}>
              {propertyPlayer(p)}
            </span>
            <span className="float-right font-bold">${cash}</span>
            <p className="mt-2 text-muted-foreground">
              {state.owners.filter((o) => o === p).length} properties · Worth ${netWorth(state, p)}
            </p>
          </div>
        ))}
      </div>
      <p role="status" className="mt-4 min-h-12 text-center text-sm text-muted-foreground">
        {state.message}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {state.phase === 'roll' && (
          <Button
            disabled={disabled}
            onClick={() => {
              setStarted(true);
              setRolling(true);
            }}
          >
            <Dice5 size={16} />
            {rolling ? 'Rolling…' : 'Roll dice'}
          </Button>
        )}
        {state.phase === 'buy' && (
          <>
            <Button
              disabled={disabled || state.cash[state.turn] < tile.price!}
              onClick={() => setState((s) => buyProperty(s))}
            >
              Buy for ${tile.price}
            </Button>
            <Button
              variant="outline"
              disabled={disabled}
              onClick={() => setState((s) => endPropertyTurn(s))}
            >
              Pass property
            </Button>
          </>
        )}
        {state.phase === 'end' && (
          <Button disabled={disabled} onClick={() => setState((s) => endPropertyTurn(s))}>
            End turn →
          </Button>
        )}
      </div>
      <details className="mt-5 surface p-3 text-xs">
        <summary className="cursor-pointer font-semibold">Your property deeds</summary>
        <div className="mt-3 space-y-2">
          {state.owners.some((o) => o === 0) ? (
            state.owners.map((owner, i) =>
              owner === 0 ? (
                <p key={i} className="flex justify-between">
                  <span>{SQUARES[i].name}</span>
                  <span>Rent ${rentFor(state, i)}</span>
                </p>
              ) : null,
            )
          ) : (
            <p className="text-muted-foreground">Buy a property to start your collection.</p>
          )}
        </div>
      </details>
    </div>
  );
}
