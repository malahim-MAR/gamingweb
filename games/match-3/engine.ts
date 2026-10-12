import { random } from '@/lib/random';
export interface MatchState {
  board: number[];
  score: number;
  moves: number;
  lives: number;
  over: boolean;
  hammer: boolean;
  shuffle: boolean;
}
export type MatchAction =
  { kind: 'swap'; a: number; b: number } | { kind: 'hammer'; a: number } | { kind: 'shuffle' };
export function matches(b: number[]) {
  const hit = new Set<number>();
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++) {
      const i = r * 7 + c;
      if (c < 5 && b[i] >= 0 && b[i] === b[i + 1] && b[i] === b[i + 2]) {
        let k = c;
        while (k < 7 && b[r * 7 + k] === b[i]) hit.add(r * 7 + k++);
      }
      if (r < 5 && b[i] >= 0 && b[i] === b[i + 7] && b[i] === b[i + 14]) {
        let k = r;
        while (k < 7 && b[k * 7 + c] === b[i]) hit.add(k++ * 7 + c);
      }
    }
  return hit;
}
export function freshBoard(rng: () => number) {
  const b: number[] = [];
  for (let i = 0; i < 49; i++) {
    let n;
    do {
      n = Math.floor(rng() * 5);
    } while (
      (i % 7 >= 2 && b[i - 1] === n && b[i - 2] === n) ||
      (i >= 14 && b[i - 7] === n && b[i - 14] === n)
    );
    b.push(n);
  }
  return b;
}
export function initialMatch(rng: () => number): MatchState {
  return {
    board: freshBoard(rng),
    score: 0,
    moves: 30,
    lives: 3,
    over: false,
    hammer: true,
    shuffle: true,
  };
}
function resolve(board: number[], rng: () => number) {
  let score = 0;
  for (let cascade = 0; cascade < 100; cascade++) {
    const hit = matches(board);
    if (!hit.size) break;
    score += hit.size * 10 * (cascade + 1);
    hit.forEach((i) => (board[i] = -1));
    for (let c = 0; c < 7; c++) {
      const column = Array.from({ length: 7 }, (_, r) => board[r * 7 + c]).filter((n) => n >= 0);
      while (column.length < 7) column.unshift(Math.floor(rng() * 5));
      column.forEach((n, r) => (board[r * 7 + c] = n));
    }
  }
  return { board, score };
}
export function matchMove(s: MatchState, a: MatchAction, rng: () => number): MatchState {
  if (s.over) throw new Error('Game over.');
  let board = [...s.board];
  let lives = s.lives,
    score = s.score,
    moves = s.moves - 1,
    hammer = s.hammer,
    shuffle = s.shuffle;
  if (a.kind === 'shuffle') {
    if (!shuffle) throw new Error('Shuffle already used.');
    shuffle = false;
    board = freshBoard(rng);
    moves = s.moves;
  } else if (a.kind === 'hammer') {
    if (!hammer || a.a < 0 || a.a > 48) throw new Error('Invalid hammer.');
    hammer = false;
    score += 10;
    board[a.a] = Math.floor(rng() * 5);
    const r = resolve(board, rng);
    score += r.score;
  } else {
    if (
      a.a < 0 ||
      a.b < 0 ||
      a.a > 48 ||
      a.b > 48 ||
      !(
        Math.abs(a.a - a.b) === 7 ||
        (Math.floor(a.a / 7) === Math.floor(a.b / 7) && Math.abs(a.a - a.b) === 1)
      )
    )
      throw new Error('Choose adjacent candies.');
    [board[a.a], board[a.b]] = [board[a.b], board[a.a]];
    if (!matches(board).size) {
      board = [...s.board];
      lives--;
    } else {
      const r = resolve(board, rng);
      score += r.score;
    }
  }
  return { board, score, moves, lives, hammer, shuffle, over: lives <= 0 || moves <= 0 };
}
export function replayMatch(seed: number, actions: MatchAction[]) {
  const rng = random(seed);
  let s = initialMatch(rng);
  for (const a of actions) s = matchMove(s, a, rng);
  return s;
}
