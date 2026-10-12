import { random } from '@/lib/random';
import type { ArcadeInput } from '@/hooks/use-arcade';
export function createRace(seed: number) {
  return {
    x: 0,
    speed: 100,
    distance: 0,
    crashes: 0,
    invincible: 0,
    spawn: 1,
    cars: [] as { x: number; z: number; color: string }[],
    rng: random(seed),
    over: false,
  };
}
export type RaceState = ReturnType<typeof createRace>;
export function stepRace(s: RaceState, dt: number, input: ArcadeInput) {
  if (s.over) return { score: Math.floor(s.distance), end: true };
  const held = (...codes: string[]) => codes.some((c) => input.held.has(c));
  const target = held('ArrowDown', 'KeyS') ? 65 : held('ArrowUp', 'KeyW') ? 220 : 140;
  s.speed += (target - s.speed) * dt * 1.3;
  s.x +=
    (Number(held('ArrowRight', 'KeyD')) - Number(held('ArrowLeft', 'KeyA'))) *
    dt *
    (1.5 + s.speed / 180);
  s.x = Math.max(-1.7, Math.min(1.7, s.x));
  if (Math.abs(s.x) > 1.35) s.speed = Math.max(40, s.speed - dt * 130);
  s.distance += (s.speed / 3.6) * dt;
  s.invincible = Math.max(0, s.invincible - dt);
  s.spawn -= dt;
  if (s.spawn <= 0) {
    s.cars.push({
      x: Math.floor(s.rng() * 3) - 1,
      z: 0,
      color: ['#d78565', '#78a8c9', '#b4a0ce'][Math.floor(s.rng() * 3)],
    });
    s.spawn = 0.9 + s.rng() * 0.9;
  }
  for (const car of s.cars) {
    const previous = car.z;
    car.z += dt * Math.max(0.08, (s.speed - 30) / 310);
    if (previous < 0.86 && car.z >= 0.86 && Math.abs(car.x - s.x) < 0.47 && !s.invincible) {
      s.crashes++;
      s.invincible = 2;
      s.speed *= 0.5;
    }
  }
  s.cars = s.cars.filter((c) => c.z < 1.2);
  s.over = s.crashes >= 3 || s.distance >= 3000;
  return {
    score:
      Math.floor(s.distance) + (s.distance >= 3000 ? Math.round(1000 + (3 - s.crashes) * 500) : 0),
    end: s.over,
  };
}
