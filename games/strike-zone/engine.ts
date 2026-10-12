import { random } from '@/lib/random';
import type { ArcadeInput } from '@/hooks/use-arcade';
export const ARENA = [
  '1111111111111111',
  '1000000000000001',
  '1000000000000001',
  '1000110000110001',
  '1000110000110001',
  '1000000000000001',
  '1000001100000001',
  '1000001100000001',
  '1000000000000001',
  '1001100001100001',
  '1001100001100001',
  '1000000000000001',
  '1000000000000001',
  '1000000000000001',
  '1000000000000001',
  '1111111111111111',
];
export function wallAt(x: number, y: number) {
  return ARENA[Math.floor(y)]?.[Math.floor(x)] !== '0';
}
export function raycast(x: number, y: number, angle: number, max = 30) {
  const dx = Math.cos(angle),
    dy = Math.sin(angle),
    deltaX = Math.abs(1 / dx),
    deltaY = Math.abs(1 / dy);
  let mapX = Math.floor(x),
    mapY = Math.floor(y),
    side = 0,
    distance = 0;
  const stepX = dx < 0 ? -1 : 1,
    stepY = dy < 0 ? -1 : 1;
  let sideX = (dx < 0 ? x - mapX : mapX + 1 - x) * deltaX,
    sideY = (dy < 0 ? y - mapY : mapY + 1 - y) * deltaY;
  for (let i = 0; i < 128; i++) {
    if (sideX < sideY) {
      distance = sideX;
      sideX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      distance = sideY;
      sideY += deltaY;
      mapY += stepY;
      side = 1;
    }
    if (distance >= max) return { distance: max, side, x: x + dx * max, y: y + dy * max };
    if (wallAt(mapX, mapY)) break;
  }
  return { distance, side, x: x + dx * distance, y: y + dy * distance };
}
export const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
export interface Enemy {
  x: number;
  y: number;
  hp: number;
  attack: number;
  path: number[][];
  repath: number;
  hit: number;
}
const SPAWNS = [
  [12.5, 2.5],
  [12.5, 12.5],
  [2.5, 12.5],
  [8.5, 5.5],
  [7.5, 12.5],
];
export function spawnBots(wave: number, rng: () => number): Enemy[] {
  return SPAWNS.slice(0, wave + 1).map(([x, y]) => ({
    x,
    y,
    hp: 70,
    attack: 1.5 + rng(),
    path: [],
    repath: 0,
    hit: 0,
  }));
}
export function createStrike(seed: number) {
  const rng = random(seed);
  return {
    x: 2.5,
    y: 2.5,
    angle: 0,
    hp: 100,
    ammo: 12,
    reload: 0,
    cooldown: 0,
    flash: 0,
    damage: 0,
    kills: 0,
    wave: 1,
    wait: 0,
    over: false,
    bots: spawnBots(1, rng),
    rng,
    time: 0,
  };
}
export type StrikeState = ReturnType<typeof createStrike>;
export function route(sx: number, sy: number, tx: number, ty: number): number[][] {
  const start = [Math.floor(sx), Math.floor(sy)],
    target = [Math.floor(tx), Math.floor(ty)];
  const queue = [start],
    visited = new Map<string, number[] | null>([[start.join(','), null]]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const cell = queue[cursor];
    if (cell[0] === target[0] && cell[1] === target[1]) break;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = [cell[0] + dx, cell[1] + dy],
        key = n.join(',');
      if (!wallAt(n[0], n[1]) && !visited.has(key)) {
        visited.set(key, cell);
        queue.push(n);
      }
    }
  }
  const path: number[][] = [];
  let cell: number[] | null = target;
  if (!visited.has(target.join(','))) return path;
  while (cell && cell.join(',') !== start.join(',')) {
    path.unshift([cell[0] + 0.5, cell[1] + 0.5]);
    cell = visited.get(cell.join(',')) || null;
  }
  return path;
}
function moveBody(body: { x: number; y: number }, dx: number, dy: number) {
  const clear = (x: number, y: number) =>
    [-0.2, 0.2].every((ox) => [-0.2, 0.2].every((oy) => !wallAt(x + ox, y + oy)));
  if (clear(body.x + dx, body.y)) body.x += dx;
  if (clear(body.x, body.y + dy)) body.y += dy;
}
export function fire(s: StrikeState) {
  if (s.cooldown > 0 || s.reload > 0 || s.ammo <= 0 || s.over) return false;
  s.ammo--;
  s.cooldown = 0.24;
  s.flash = 0.09;
  const blocking = raycast(s.x, s.y, s.angle).distance;
  const hit = s.bots
    .filter((b) => b.hp > 0)
    .map((bot) => ({
      bot,
      d: Math.hypot(bot.x - s.x, bot.y - s.y),
      a: Math.atan2(bot.y - s.y, bot.x - s.x),
    }))
    .filter(
      ({ d, a }) => d < blocking + 0.05 && Math.abs(angleDelta(a, s.angle)) < Math.atan2(0.36, d),
    )
    .sort((a, b) => a.d - b.d)[0];
  if (hit) {
    hit.bot.hp -= 35;
    hit.bot.hit = 0.15;
    if (hit.bot.hp <= 0) s.kills++;
  }
  return true;
}
export function stepStrike(s: StrikeState, dt: number, input: ArcadeInput) {
  if (s.over) return { score: s.kills * 100, end: true };
  s.time += dt;
  s.cooldown = Math.max(0, s.cooldown - dt);
  s.flash = Math.max(0, s.flash - dt);
  s.damage = Math.max(0, s.damage - dt);
  if (s.reload > 0) {
    s.reload = Math.max(0, s.reload - dt);
    if (!s.reload) s.ammo = 12;
  }
  const held = (...codes: string[]) => codes.some((c) => input.held.has(c));
  s.angle += (Number(held('ArrowRight')) - Number(held('ArrowLeft'))) * dt * 1.8;
  const forward = Number(held('KeyW', 'ArrowUp')) - Number(held('KeyS', 'ArrowDown'));
  const strafe = Number(held('KeyD')) - Number(held('KeyA')),
    norm = Math.hypot(forward, strafe) || 1;
  moveBody(
    s,
    ((Math.cos(s.angle) * forward - Math.sin(s.angle) * strafe) * dt * 2.5) / norm,
    ((Math.sin(s.angle) * forward + Math.cos(s.angle) * strafe) * dt * 2.5) / norm,
  );
  if (input.commands.includes('KeyR') && !s.reload && s.ammo < 12) s.reload = 1.25;
  if (input.commands.includes('Space') || held('Space')) fire(s);
  for (const bot of s.bots) {
    if (bot.hp <= 0) continue;
    bot.hit = Math.max(0, bot.hit - dt);
    bot.attack -= dt;
    bot.repath -= dt;
    const d = Math.hypot(s.x - bot.x, s.y - bot.y),
      a = Math.atan2(s.y - bot.y, s.x - bot.x);
    const visible = raycast(bot.x, bot.y, a).distance > d - 0.1;
    if (d > 2) {
      if (bot.repath <= 0) {
        bot.path = route(bot.x, bot.y, s.x, s.y);
        bot.repath = 0.65;
      }
      const dest = bot.path[0];
      if (dest) {
        const dist = Math.hypot(dest[0] - bot.x, dest[1] - bot.y);
        if (dist < 0.15) bot.path.shift();
        else
          moveBody(
            bot,
            ((dest[0] - bot.x) / dist) * dt * (0.65 + s.wave * 0.12),
            ((dest[1] - bot.y) / dist) * dt * (0.65 + s.wave * 0.12),
          );
      }
    }
    if (visible && d < 8 && bot.attack <= 0) {
      s.hp = Math.max(0, s.hp - 8);
      s.damage = 0.18;
      bot.attack = 1.8 + s.rng() * 0.8;
    }
  }
  if (s.hp <= 0) s.over = true;
  if (!s.bots.some((b) => b.hp > 0)) {
    s.wait += dt;
    if (s.wait > 1.5) {
      if (s.wave === 3) s.over = true;
      else {
        s.wave++;
        s.wait = 0;
        s.hp = Math.min(100, s.hp + 25);
        s.ammo = 12;
        s.reload = 0;
        s.bots = spawnBots(s.wave, s.rng);
      }
    }
  }
  return { score: s.kills * 100 + (s.over && s.hp > 0 ? 500 : 0), end: s.over };
}
