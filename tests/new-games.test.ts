import { describe, it, expect } from 'vitest';
import { createMetro, stepMetro, runnerCollision } from '@/games/metro-runner/engine';
import { createRace, stepRace } from '@/games/car-racing/engine';
import {
  initialLudo,
  rollLudo,
  moveLudo,
  legalTokens,
  FINISH,
  TRACK,
  globalSquare,
} from '@/games/ludo/engine';
import {
  initialProperty,
  rollProperty,
  buyProperty,
  endPropertyTurn,
  rentFor,
  netWorth,
  SQUARES,
  squareCell,
} from '@/games/monopoly/engine';
import { createStrike, stepStrike, fire, raycast, wallAt, route } from '@/games/strike-zone/engine';
const input = (commands: string[] = [], held: string[] = []) => ({ commands, held: new Set(held) });
describe('Metro Rush', () => {
  it('keeps lane switches within the three lanes', () => {
    const s = createMetro(1);
    stepMetro(s, 0, input(['ArrowLeft', 'ArrowLeft']));
    expect(s.lane).toBe(-1);
    stepMetro(s, 0, input(['ArrowRight', 'ArrowRight', 'ArrowRight']));
    expect(s.lane).toBe(1);
  });
  it('requires jump height for barriers, slides for gates, and dodges for trains', () => {
    expect(runnerCollision('barrier', 0, 0)).toBe(true);
    expect(runnerCollision('barrier', 0.425, 0)).toBe(false);
    expect(runnerCollision('barrier', 0.84, 0)).toBe(true);
    expect(runnerCollision('gate', 0.425, 0)).toBe(true);
    expect(runnerCollision('gate', 0, 0.5)).toBe(false);
    expect(runnerCollision('train', 0.425, 0.5)).toBe(true);
  });
  it('collects each coin once and ends on an obstacle', () => {
    const s = createMetro(1);
    s.items = [{ lane: 0, z: 0.85, kind: 'coin' }];
    stepMetro(s, 0.05, input());
    expect(s.coins).toBe(1);
    stepMetro(s, 0.05, input());
    expect(s.coins).toBe(1);
    s.items = [{ lane: 0, z: 0.85, kind: 'train' }];
    expect(stepMetro(s, 0.05, input()).end).toBe(true);
  });
});
describe('Sunset Circuit', () => {
  it('accelerates, brakes, and slows on the shoulder', () => {
    const gas = createRace(2),
      brake = createRace(2);
    stepRace(gas, 0.2, input([], ['KeyW']));
    stepRace(brake, 0.2, input([], ['KeyS']));
    expect(gas.speed).toBeGreaterThan(brake.speed);
    const road = createRace(2),
      off = createRace(2);
    off.x = 1.6;
    stepRace(road, 0.2, input());
    stepRace(off, 0.2, input());
    expect(off.speed).toBeLessThan(road.speed);
  });
  it('counts crashes once during invulnerability and finishes after three', () => {
    const s = createRace(2);
    s.cars = [{ x: 0, z: 0.85, color: 'red' }];
    stepRace(s, 0.1, input());
    expect(s.crashes).toBe(1);
    s.cars = [{ x: 0, z: 0.85, color: 'red' }];
    s.speed = 140;
    stepRace(s, 0.1, input());
    expect(s.crashes).toBe(1);
    s.crashes = 2;
    s.invincible = 0;
    s.speed = 140;
    s.cars = [{ x: 0, z: 0.85, color: 'red' }];
    expect(stepRace(s, 0.1, input()).end).toBe(true);
  });
  it('awards a finish bonus at 3 km', () => {
    const s = createRace(2);
    s.distance = 2999;
    const result = stepRace(s, 0.1, input());
    expect(result.end).toBe(true);
    expect(result.score).toBeGreaterThan(5000);
  });
});
describe('Ludo rules', () => {
  it('has 52 unique shared track cells and opposite starting squares', () => {
    expect(TRACK).toHaveLength(52);
    expect(new Set(TRACK.map((c) => c.join(','))).size).toBe(52);
    expect(globalSquare(1, 0)).toBe(26);
  });
  it('requires a six to leave the yard and gives another roll', () => {
    expect(rollLudo(initialLudo(), 3).turn).toBe(1);
    const rolled = rollLudo(initialLudo(), 6);
    expect(legalTokens(rolled)).toHaveLength(4);
    const moved = moveLudo(rolled, 0);
    expect(moved.tokens[0][0]).toBe(0);
    expect(moved.turn).toBe(0);
    expect(moved.die).toBeNull();
  });
  it('captures only on unsafe cells', () => {
    const s = initialLudo();
    s.tokens = [
      [4, -1, -1, -1],
      [31, -1, -1, -1],
    ];
    const capture = moveLudo(rollLudo(s, 1), 0);
    expect(capture.tokens[1][0]).toBe(-1);
    expect(capture.turn).toBe(0);
    s.tokens = [
      [7, -1, -1, -1],
      [34, -1, -1, -1],
    ];
    const safe = moveLudo(rollLudo(s, 1), 0);
    expect(safe.tokens[1][0]).toBe(34);
    expect(safe.turn).toBe(1);
  });
  it('needs an exact home roll and wins only with all four home', () => {
    const s = initialLudo();
    s.tokens = [
      [55, 57, 57, 57],
      [-1, -1, -1, -1],
    ];
    expect(legalTokens(s, 3)).toEqual([]);
    const won = moveLudo(rollLudo(s, 2), 0);
    expect(won.tokens[0][0]).toBe(FINISH);
    expect(won.winner).toBe(0);
    expect(moveLudo(s, 2)).toBe(s);
  });
});
describe('Property Club economy', () => {
  it('maps 24 squares to a perimeter without duplicates', () => {
    const cells = SQUARES.map((_, i) => squareCell(i));
    expect(new Set(cells.map((c) => c.join(','))).size).toBe(24);
    expect(cells.every(([r, c]) => r === 0 || r === 6 || c === 0 || c === 6)).toBe(true);
  });
  it('buys a property only once and doubles full-group rent', () => {
    const s = initialProperty();
    s.positions[0] = 1;
    s.phase = 'buy';
    const bought = buyProperty(s);
    expect(bought.cash[0]).toBe(1100);
    expect(bought.owners[1]).toBe(0);
    expect(buyProperty(bought)).toBe(bought);
    expect(rentFor(bought, 1)).toBe(20);
    bought.owners[3] = 0;
    bought.owners[5] = 0;
    expect(rentFor(bought, 1)).toBe(40);
  });
  it('pays rent to the owner and detects bankruptcy', () => {
    const s = initialProperty();
    s.turn = 1;
    s.positions[1] = 23;
    s.owners[1] = 0;
    s.cash[1] = 5;
    const n = rollProperty(s, [1, 1], 0);
    expect(n.cash[0]).toBe(1220);
    expect(n.cash[1]).toBe(185); // passes GO first
    s.positions[1] = 0;
    s.owners[3] = 0;
    s.cash[1] = 5;
    const broke = rollProperty(s, [1, 2], 0);
    expect(broke.phase).toBe('over');
    expect(broke.winner).toBe(0);
  });
  it('sends players to jail and charges release once', () => {
    const s = initialProperty();
    s.positions[0] = 16;
    const jail = rollProperty(s, [1, 1], 0);
    expect(jail.positions[0]).toBe(6);
    expect(jail.jail[0]).toBe(true);
    jail.phase = 'roll';
    const release = rollProperty(jail, [1, 1], 0.1);
    expect(release.jail[0]).toBe(false);
    expect(release.cash[0]).toBe(1300);
  });
  it('rejects unaffordable purchases and ends after 24 turns by net worth', () => {
    const s = initialProperty();
    s.positions[0] = 1;
    s.cash[0] = 10;
    s.phase = 'buy';
    expect(buyProperty(s)).toBe(s);
    s.round = 23;
    s.cash = [1200, 1100];
    s.owners[23] = 1;
    expect(netWorth(s, 1)).toBe(1420);
    expect(endPropertyTurn(s).winner).toBe(1);
  });
});
describe('Strike Zone arena', () => {
  it('casts rays to walls and finds routes around obstacles', () => {
    expect(raycast(2.5, 2.5, 0).distance).toBeCloseTo(12.5);
    expect(raycast(2.5, 2.5, Math.PI).distance).toBeCloseTo(1.5);
    const path = route(2.5, 3.5, 6.5, 3.5);
    expect(path.length).toBeGreaterThan(4);
    expect(path.every(([x, y]) => !wallAt(x, y))).toBe(true);
  });
  it('blocks movement through walls and normalizes diagonal speed', () => {
    const s = createStrike(4);
    s.x = 1.25;
    s.angle = Math.PI;
    stepStrike(s, 0.1, input([], ['KeyW']));
    expect(s.x).toBeGreaterThanOrEqual(1.2);
    const a = createStrike(4),
      b = createStrike(4);
    stepStrike(a, 0.1, input([], ['KeyW']));
    stepStrike(b, 0.1, input([], ['KeyW', 'KeyD']));
    expect(Math.hypot(a.x - 2.5, a.y - 2.5)).toBeCloseTo(Math.hypot(b.x - 2.5, b.y - 2.5));
  });
  it('hits visible bots, blocks shots through cover, and respects cooldown', () => {
    const s = createStrike(4);
    s.bots = [{ x: 5.5, y: 2.5, hp: 70, attack: 10, path: [], repath: 1, hit: 0 }];
    expect(fire(s)).toBe(true);
    expect(s.bots[0].hp).toBe(35);
    expect(s.ammo).toBe(11);
    expect(fire(s)).toBe(false);
    s.cooldown = 0;
    fire(s);
    expect(s.kills).toBe(1);
    s.cooldown = 0;
    s.y = 3.5;
    s.bots = [{ x: 7.5, y: 3.5, hp: 70, attack: 10, path: [], repath: 1, hit: 0 }];
    fire(s);
    expect(s.bots[0].hp).toBe(70);
  });
  it('prevents firing with an empty magazine, reloads, and advances waves', () => {
    const s = createStrike(4);
    s.ammo = 0;
    expect(fire(s)).toBe(false);
    stepStrike(s, 0.1, input(['KeyR']));
    expect(s.reload).toBeGreaterThan(0);
    stepStrike(s, 1.3, input());
    expect(s.ammo).toBe(12);
    s.bots = [];
    stepStrike(s, 1.6, input());
    expect(s.wave).toBe(2);
    expect(s.bots).toHaveLength(3);
    s.wave = 3;
    s.bots = [];
    expect(stepStrike(s, 1.6, input()).end).toBe(true);
  });
});
