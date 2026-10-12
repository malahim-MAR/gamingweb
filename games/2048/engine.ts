import { random } from '@/lib/random';
export type Direction = 'left' | 'right' | 'up' | 'down';
export interface State2048 {
  board: number[];
  score: number;
  over: boolean;
  won: boolean;
}
export function mergeLine(line: number[]) {
  const n = line.filter(Boolean);
  const result: number[] = [];
  let score = 0;
  for (let i = 0; i < n.length; i++) {
    if (n[i] === n[i + 1]) {
      result.push(n[i] * 2);
      score += n[i] * 2;
      i++;
    } else result.push(n[i]);
  }
  return { line: [...result, ...Array(4 - result.length).fill(0)], score };
}
export function addTile(board: number[], rng: () => number) {
  const free = board.map((n, i) => (n === 0 ? i : -1)).filter((i) => i >= 0);
  if (free.length) {
    board[free[Math.floor(rng() * free.length)]] = rng() < 0.9 ? 2 : 4;
  }
}
export function initial2048(rng: () => number): State2048 {
  const board = Array(16).fill(0);
  addTile(board, rng);
  addTile(board, rng);
  return { board, score: 0, over: false, won: false };
}
export function canMove(board: number[]) {
  if (board.includes(0)) return true;
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c;
      if ((c < 3 && board[i] === board[i + 1]) || (r < 3 && board[i] === board[i + 4])) return true;
    }
  return false;
}
export function move2048(state: State2048, direction: Direction, rng: () => number): State2048 {
  if (state.over) return state;
  const board = [...state.board];
  let score = state.score;
  for (let k = 0; k < 4; k++) {
    let indices = Array.from({ length: 4 }, (_, i) =>
      direction === 'left' || direction === 'right' ? k * 4 + i : i * 4 + k,
    );
    if (direction === 'right' || direction === 'down') indices = indices.reverse();
    const merged = mergeLine(indices.map((i) => state.board[i]));
    indices.forEach((i, j) => (board[i] = merged.line[j]));
    score += merged.score;
  }
  if (board.every((n, i) => n === state.board[i])) return state;
  addTile(board, rng);
  return { board, score, over: !canMove(board), won: board.some((n) => n >= 2048) };
}
export function replay2048(seed: number, actions: Direction[]) {
  const rng = random(seed);
  let state = initial2048(rng);
  for (const action of actions) {
    if (state.over) throw new Error('Moves after game over.');
    state = move2048(state, action, rng);
  }
  return state;
}
