import { random } from '@/lib/random';
import type { ArcadeInput } from '@/hooks/use-arcade';
export interface RunnerItem {
  lane: number;
  z: number;
  kind: 'coin' | 'barrier' | 'gate' | 'train';
}
export function createMetro(seed: number) {
  return {
    lane: 0,
    visualLane: 0,
    distance: 0,
    coins: 0,
    jump: 0,
    slide: 0,
    spawn: 0.6,
    items: [] as RunnerItem[],
    over: false,
    rng: random(seed),
  };
}
export type MetroState = ReturnType<typeof createMetro>;
export function runnerCollision(kind: RunnerItem['kind'], jump: number, slide: number) {
  const jumpHeight = jump > 0 ? Math.sin((jump / 0.85) * Math.PI) * 105 : 0;
  return (
    kind === 'train' || (kind === 'barrier' && jumpHeight < 45) || (kind === 'gate' && slide <= 0)
  );
}
export function stepMetro(s: MetroState, dt: number, input: ArcadeInput) {
  if (s.over) return { score: Math.floor(s.distance) + s.coins * 25, end: true };
  for (const code of input.commands) {
    if (code === 'ArrowLeft' || code === 'KeyA') s.lane = Math.max(-1, s.lane - 1);
    if (code === 'ArrowRight' || code === 'KeyD') s.lane = Math.min(1, s.lane + 1);
    if (['ArrowUp', 'KeyW', 'Space'].includes(code) && !s.jump) {
      s.jump = 0.85;
      s.slide = 0;
    }
    if (['ArrowDown', 'KeyS'].includes(code) && !s.jump) s.slide = 0.8;
  }
  s.visualLane += (s.lane - s.visualLane) * Math.min(1, dt * 18);
  s.jump = Math.max(0, s.jump - dt);
  s.slide = Math.max(0, s.slide - dt);
  const speed = 0.32 + Math.min(0.3, s.distance / 4000);
  s.distance += dt * speed * 95;
  s.spawn -= dt;
  if (s.spawn <= 0) {
    const lane = Math.floor(s.rng() * 3) - 1;
    const kind = (['barrier', 'gate', 'train'] as const)[Math.floor(s.rng() * 3)];
    s.items.push({ lane, z: 0, kind });
    const coinLane = ((lane + 2) % 3) - 1;
    for (let i = 0; i < 3; i++) s.items.push({ lane: coinLane, z: -0.12 * i, kind: 'coin' });
    s.spawn = 1.35 + s.rng() * 0.55;
  }
  for (const item of s.items) {
    const previous = item.z;
    item.z += dt * speed;
    if (previous < 0.86 && item.z >= 0.86 && item.lane === s.lane) {
      if (item.kind === 'coin') {
        s.coins++;
        item.z = 2;
      } else if (runnerCollision(item.kind, s.jump, s.slide)) s.over = true;
    }
  }
  s.items = s.items.filter((i) => i.z < 1.2);
  return { score: Math.floor(s.distance) + s.coins * 25, end: s.over };
}
