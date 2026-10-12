export const FINISH = 57;
export const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
export const TRACK: [number, number][] = [
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 4],
  [6, 5],
  [5, 6],
  [4, 6],
  [3, 6],
  [2, 6],
  [1, 6],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 8],
  [2, 8],
  [3, 8],
  [4, 8],
  [5, 8],
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [6, 13],
  [6, 14],
  [7, 14],
  [8, 14],
  [8, 13],
  [8, 12],
  [8, 11],
  [8, 10],
  [8, 9],
  [9, 8],
  [10, 8],
  [11, 8],
  [12, 8],
  [13, 8],
  [14, 8],
  [14, 7],
  [14, 6],
  [13, 6],
  [12, 6],
  [11, 6],
  [10, 6],
  [9, 6],
  [8, 5],
  [8, 4],
  [8, 3],
  [8, 2],
  [8, 1],
  [8, 0],
  [7, 0],
  [6, 0],
];
export interface LudoState {
  tokens: number[][];
  turn: number;
  die: number | null;
  winner: number | null;
  message: string;
}
export const playerName = (p: number) => (p === 0 ? 'Coral' : 'Blue');
export function initialLudo(): LudoState {
  return {
    tokens: [
      [-1, -1, -1, -1],
      [-1, -1, -1, -1],
    ],
    turn: 0,
    die: null,
    winner: null,
    message: 'Coral starts. Roll a six to leave the yard.',
  };
}
export function legalTokens(s: LudoState, die = s.die) {
  if (!die || s.winner !== null) return [];
  return s.tokens[s.turn].flatMap((p, i) =>
    (p === -1 ? die === 6 : p < FINISH && p + die <= FINISH) ? [i] : [],
  );
}
export function rollLudo(s: LudoState, die: number): LudoState {
  if (s.die !== null || s.winner !== null || !Number.isInteger(die) || die < 1 || die > 6) return s;
  const next = {
    ...s,
    die,
    message: `${playerName(s.turn)} rolled ${die}. Choose a highlighted token.`,
  };
  if (!legalTokens(next).length)
    return {
      ...s,
      turn: 1 - s.turn,
      die: null,
      message: `${playerName(s.turn)} rolled ${die}: no moves. ${playerName(1 - s.turn)} plays next.`,
    };
  return next;
}
export function globalSquare(player: number, progress: number) {
  return (progress + player * 26) % 52;
}
export function moveLudo(s: LudoState, token: number): LudoState {
  if (!legalTokens(s).includes(token)) return s;
  const tokens = s.tokens.map((row) => [...row]),
    p = s.turn,
    old = tokens[p][token];
  const dest = old === -1 ? 0 : old + s.die!;
  tokens[p][token] = dest;
  let captured = false;
  if (dest < 52 && !SAFE.has(globalSquare(p, dest))) {
    tokens[1 - p] = tokens[1 - p].map((pos) => {
      if (pos >= 0 && pos < 52 && globalSquare(1 - p, pos) === globalSquare(p, dest)) {
        captured = true;
        return -1;
      }
      return pos;
    });
  }
  const winner = tokens[p].every((pos) => pos === FINISH) ? p : null;
  const extra = s.die === 6 || captured,
    turn = extra ? p : 1 - p;
  return {
    tokens,
    turn,
    die: null,
    winner,
    message:
      winner !== null
        ? `${playerName(p)} wins! All four tokens are home.`
        : `${playerName(p)} ${captured ? 'captured a rival' : dest === FINISH ? 'brought a token home' : 'moved a token'}. ${playerName(turn)} ${extra ? 'rolls again' : 'plays next'}.`,
  };
}
export function tokenCell(player: number, token: number, progress: number): [number, number] {
  if (progress < 0)
    return player === 0
      ? [2 + Math.floor(token / 2) * 2, 2 + (token % 2) * 2]
      : [10 + Math.floor(token / 2) * 2, 10 + (token % 2) * 2];
  if (progress < 52) return TRACK[globalSquare(player, progress)];
  return [7, player === 0 ? progress - 51 : 65 - progress];
}
