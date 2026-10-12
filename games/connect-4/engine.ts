export function emptyBoard() {
  return Array.from({ length: 6 }, () => Array(7).fill(0) as number[]);
}
export function drop(board: number[][], column: number, player: number) {
  if (!Number.isInteger(column) || column < 0 || column > 6) throw new Error('Invalid column.');
  const b = board.map((r) => [...r]);
  let row = 5;
  while (row >= 0 && b[row][column]) row--;
  if (row < 0) throw new Error('Column is full.');
  b[row][column] = player;
  return b;
}
export function winner(board: number[][]) {
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 7; c++) {
      const p = board[r][c];
      if (!p) continue;
      for (const [dr, dc] of [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ])
        if ([1, 2, 3].every((i) => board[r + dr * i]?.[c + dc * i] === p)) return p;
    }
  return 0;
}
