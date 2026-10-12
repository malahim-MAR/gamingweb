import { describe, it, expect } from 'vitest';
import { mergeLine, move2048, canMove, replay2048 } from '@/games/2048/engine';
import { feedback } from '@/games/word-game/engine';
import { initialRunner, replayRunner } from '@/games/endless-runner/engine';
import { initialMatch, matchMove, matches, replayMatch } from '@/games/match-3/engine';
import { emptyBoard, drop, winner } from '@/games/connect-4/engine';
import { random } from '@/lib/random';
describe('2048 rules and score authority', () => {
  it('merges each pair only once and scores the resulting values', () => {
    expect(mergeLine([2, 2, 2, 2])).toEqual({ line: [4, 4, 0, 0], score: 8 });
    expect(mergeLine([2, 2, 4, 0])).toEqual({ line: [4, 4, 0, 0], score: 4 });
  });
  it('does not spawn or consume randomness for a blocked move', () => {
    let calls = 0;
    const rng = () => {
      calls++;
      return 0.1;
    };
    const s = { board: [2, 0, 0, 0, ...Array(12).fill(0)], score: 0, over: false, won: false };
    expect(move2048(s, 'left', rng)).toBe(s);
    expect(calls).toBe(0);
  });
  it('recognizes game over and produces deterministic replays', () => {
    expect(canMove([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2])).toBe(false);
    const a = ['left', 'down', 'right', 'up'] as const;
    expect(replay2048(42, [...a])).toEqual(replay2048(42, [...a]));
  });
});
describe('Word Club duplicate letters', () => {
  it('does not award more occurrences than the answer contains', () => {
    expect(feedback('ALLEY', 'APPLE')).toEqual([
      'correct',
      'present',
      'absent',
      'present',
      'absent',
    ]);
    expect(feedback('CRANE', 'CRANE')).toEqual(Array(5).fill('correct'));
  });
});
describe('Cloud Runner replay', () => {
  it('rejects a run after its collision and orphan jump ticks', () => {
    let collision = 0;
    for (let ticks = 1; ticks < 250; ticks++) {
      try {
        const s = replayRunner(7, [], ticks);
        if (s.over) {
          collision = ticks;
          break;
        }
      } catch {
        break;
      }
    }
    expect(collision).toBeGreaterThan(0);
    expect(() => replayRunner(7, [], collision + 1)).toThrow('collision');
    expect(() => replayRunner(7, [10], 9)).toThrow('jump log');
    expect(initialRunner().score).toBe(0);
  });
});
describe('Sweet Shuffle', () => {
  it('starts without accidental matches', () => {
    for (let seed = 1; seed < 100; seed++)
      expect(matches(initialMatch(random(seed)).board).size).toBe(0);
  });
  it('charges a life for an invalid swap and permits boosters only once', () => {
    const b = Array.from({ length: 49 }, (_, i) => (i + Math.floor(i / 7)) % 5);
    const state = {
      board: b,
      score: 0,
      moves: 30,
      lives: 3,
      over: false,
      hammer: true,
      shuffle: true,
    };
    const next = matchMove(state, { kind: 'swap', a: 0, b: 1 }, random(1));
    expect(next.lives).toBe(2);
    expect(next.board).toEqual(b);
    expect(() => replayMatch(9, [{ kind: 'shuffle' }, { kind: 'shuffle' }])).toThrow(
      'already used',
    );
  });
});
describe('Connect 4', () => {
  it('drops from the bottom and rejects full columns', () => {
    let b = emptyBoard();
    for (let i = 0; i < 6; i++) b = drop(b, 0, (i % 2) + 1);
    expect(b[5][0]).toBe(1);
    expect(() => drop(b, 0, 1)).toThrow('full');
  });
  it('detects horizontal, vertical, and diagonal wins without wrapping', () => {
    let b = emptyBoard();
    for (let c = 0; c < 4; c++) b = drop(b, c, 1);
    expect(winner(b)).toBe(1);
    b = emptyBoard();
    for (let i = 0; i < 4; i++) b = drop(b, 2, 2);
    expect(winner(b)).toBe(2);
    b = emptyBoard();
    for (let i = 0; i < 4; i++) b[5 - i][i] = 1;
    expect(winner(b)).toBe(1);
  });
});
