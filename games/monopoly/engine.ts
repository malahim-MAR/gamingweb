export interface Square {
  name: string;
  kind: 'go' | 'property' | 'chance' | 'tax' | 'jail' | 'parking' | 'go-jail';
  price?: number;
  rent?: number;
  group?: number;
}
export const SQUARES: Square[] = [
  { name: 'GO', kind: 'go' },
  { name: 'Maple St', kind: 'property', price: 100, rent: 20, group: 0 },
  { name: 'Chance', kind: 'chance' },
  { name: 'Oak Lane', kind: 'property', price: 120, rent: 24, group: 0 },
  { name: 'City Tax', kind: 'tax' },
  { name: 'Pine Park', kind: 'property', price: 140, rent: 28, group: 0 },
  { name: 'Jail / Visit', kind: 'jail' },
  { name: 'Lake View', kind: 'property', price: 160, rent: 32, group: 1 },
  { name: 'Chance', kind: 'chance' },
  { name: 'River Walk', kind: 'property', price: 180, rent: 36, group: 1 },
  { name: 'Harbor Rd', kind: 'property', price: 200, rent: 40, group: 1 },
  { name: 'Market Tax', kind: 'tax' },
  { name: 'Free Parking', kind: 'parking' },
  { name: 'Sunset Ave', kind: 'property', price: 220, rent: 44, group: 2 },
  { name: 'Chance', kind: 'chance' },
  { name: 'Golden Way', kind: 'property', price: 240, rent: 48, group: 2 },
  { name: 'Hill Top', kind: 'property', price: 260, rent: 52, group: 2 },
  { name: 'Chance', kind: 'chance' },
  { name: 'Go to Jail', kind: 'go-jail' },
  { name: 'Skyline Dr', kind: 'property', price: 280, rent: 56, group: 3 },
  { name: 'City Tax', kind: 'tax' },
  { name: 'Royal Sq', kind: 'property', price: 300, rent: 60, group: 3 },
  { name: 'Chance', kind: 'chance' },
  { name: 'Crown Blvd', kind: 'property', price: 320, rent: 64, group: 3 },
];
export interface PropertyState {
  positions: number[];
  cash: number[];
  owners: (number | null)[];
  jail: boolean[];
  turn: number;
  round: number;
  phase: 'roll' | 'buy' | 'end' | 'over';
  message: string;
  dice: number[];
  winner: number | null;
}
export function initialProperty(): PropertyState {
  return {
    positions: [0, 0],
    cash: [1200, 1200],
    owners: SQUARES.map(() => null),
    jail: [false, false],
    turn: 0,
    round: 0,
    phase: 'roll',
    message: 'Coral starts with $1,200. Roll to build your little empire.',
    dice: [1, 1],
    winner: null,
  };
}
export const propertyPlayer = (p: number) => (p === 0 ? 'Coral' : 'Blue');
export function netWorth(s: PropertyState, p: number) {
  return (
    s.cash[p] +
    s.owners.reduce<number>((sum, owner, i) => sum + (owner === p ? SQUARES[i].price || 0 : 0), 0)
  );
}
export function rentFor(s: PropertyState, index: number) {
  const square = SQUARES[index],
    owner = s.owners[index];
  if (owner === null || square.kind !== 'property') return 0;
  const group = SQUARES.flatMap((tile, i) =>
    tile.kind === 'property' && tile.group === square.group ? [i] : [],
  );
  return square.rent! * (group.every((i) => s.owners[i] === owner) ? 2 : 1);
}
function checkBankruptcy(s: PropertyState): PropertyState {
  const broke = s.cash.findIndex((c) => c < 0);
  return broke < 0
    ? s
    : {
        ...s,
        phase: 'over',
        winner: 1 - broke,
        message: `${propertyPlayer(broke)} went bankrupt. ${propertyPlayer(1 - broke)} wins!`,
      };
}
export function rollProperty(s: PropertyState, dice: number[], chance: number): PropertyState {
  if (
    s.phase !== 'roll' ||
    dice.length !== 2 ||
    dice.some((d) => !Number.isInteger(d) || d < 1 || d > 6)
  )
    return s;
  const n: PropertyState = {
    ...s,
    positions: [...s.positions],
    cash: [...s.cash],
    jail: [...s.jail],
    dice,
    phase: 'end',
  };
  const p = s.turn;
  let prefix = '';
  if (n.jail[p]) {
    n.cash[p] -= 50;
    n.jail[p] = false;
    prefix = 'Paid $50 to leave jail. ';
  }
  const total = n.positions[p] + dice[0] + dice[1];
  if (total >= 24) {
    n.cash[p] += 200;
    prefix += 'Passed GO: +$200. ';
  }
  n.positions[p] = total % 24;
  const index = n.positions[p],
    tile = SQUARES[index],
    owner = n.owners[index];
  n.message = `${propertyPlayer(p)} landed on ${tile.name}. ${prefix}`;
  if (tile.kind === 'property') {
    if (owner === null) {
      n.phase = 'buy';
      n.message += `Buy for $${tile.price}, or pass.`;
    } else if (owner !== p) {
      const rent = rentFor(n, index);
      n.cash[p] -= rent;
      n.cash[owner] += rent;
      n.message += `Paid $${rent} rent to ${propertyPlayer(owner)}.`;
    } else n.message += 'Welcome back to your property.';
  } else if (tile.kind === 'tax') {
    n.cash[p] -= 100;
    n.message += 'Paid $100 in tax.';
  } else if (tile.kind === 'go-jail') {
    n.positions[p] = 6;
    n.jail[p] = true;
    n.message += 'Go to jail. Pay $50 on your next turn.';
  } else if (tile.kind === 'chance') {
    const cards = [
      { amount: 150, text: 'A good investment pays off: +$150.' },
      { amount: -100, text: 'Street repairs: pay $100.' },
      { amount: 100, text: 'A small bonus: +$100.' },
      { amount: -50, text: 'Pay a $50 service fee.' },
    ];
    const card = cards[Math.max(0, Math.min(3, Math.floor(chance * 4)))];
    n.cash[p] += card.amount;
    n.message += card.text;
  } else
    n.message +=
      tile.kind === 'parking'
        ? 'Take a little breather.'
        : tile.kind === 'jail'
          ? 'Just visiting.'
          : 'A fresh lap begins.';
  return checkBankruptcy(n);
}
export function buyProperty(s: PropertyState): PropertyState {
  const i = s.positions[s.turn],
    tile = SQUARES[i];
  if (
    s.phase !== 'buy' ||
    s.owners[i] !== null ||
    tile.kind !== 'property' ||
    s.cash[s.turn] < tile.price!
  )
    return s;
  const n = {
    ...s,
    owners: [...s.owners],
    cash: [...s.cash],
    phase: 'end' as const,
    message: `${propertyPlayer(s.turn)} bought ${tile.name}. Rent is $${tile.rent}; complete the color group to double it.`,
  };
  n.owners[i] = s.turn;
  n.cash[s.turn] -= tile.price!;
  return n;
}
export function endPropertyTurn(s: PropertyState): PropertyState {
  if (s.phase !== 'end' && s.phase !== 'buy') return s;
  const round = s.round + 1;
  if (round >= 24) {
    const a = netWorth(s, 0),
      b = netWorth(s, 1),
      winner = a === b ? -1 : a > b ? 0 : 1;
    return {
      ...s,
      round,
      phase: 'over',
      winner,
      message:
        winner === -1
          ? 'A draw! Your empires are equally valuable.'
          : `${propertyPlayer(winner)} wins with a net worth of $${Math.max(a, b)}.`,
    };
  }
  return {
    ...s,
    round,
    turn: 1 - s.turn,
    phase: 'roll',
    message: `${propertyPlayer(1 - s.turn)} plays next. Turn ${round + 1} of 24.`,
  };
}
export function squareCell(index: number): [number, number] {
  if (index <= 6) return [6, 6 - index];
  if (index <= 12) return [12 - index, 0];
  if (index <= 18) return [0, index - 12];
  return [index - 18, 6];
}
