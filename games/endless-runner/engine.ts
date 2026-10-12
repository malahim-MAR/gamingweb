import { random } from '@/lib/random';
export interface RunnerState {
  tick: number;
  y: number;
  vy: number;
  score: number;
  over: boolean;
  obstacles: { x: number; w: number; h: number }[];
  nextSpawn: number;
}
export const RUNNER_WIDTH = 640,
  RUNNER_GROUND = 255;
export function initialRunner(): RunnerState {
  return {
    tick: 0,
    y: RUNNER_GROUND - 32,
    vy: 0,
    score: 0,
    over: false,
    obstacles: [],
    nextSpawn: 85,
  };
}
export function stepRunner(s: RunnerState, jump: boolean, rng: () => number): RunnerState {
  if (s.over) return s;
  const tick = s.tick + 1;
  const speed = 4 + Math.min(6, tick / 1800);
  let vy = jump && s.y >= RUNNER_GROUND - 32 ? -11.2 : s.vy;
  vy += 0.55;
  const y = Math.min(RUNNER_GROUND - 32, s.y + vy);
  if (y === RUNNER_GROUND - 32) vy = 0;
  const obstacles = s.obstacles
    .map((o) => ({ ...o, x: o.x - speed }))
    .filter((o) => o.x + o.w > -10);
  let nextSpawn = s.nextSpawn;
  if (tick >= nextSpawn) {
    obstacles.push({
      x: RUNNER_WIDTH,
      w: 22 + Math.floor(rng() * 14),
      h: 28 + Math.floor(rng() * 18),
    });
    nextSpawn = tick + Math.floor(72 + rng() * 45);
  }
  const over = obstacles.some(
    (o) => 85 < o.x + o.w - 3 && 85 + 27 > o.x + 3 && y + 29 > RUNNER_GROUND - o.h + 3,
  );
  return { tick, y, vy, score: Math.floor(tick / 6), over, obstacles, nextSpawn };
}
export function replayRunner(seed: number, jumps: number[], ticks: number) {
  const rng = random(seed);
  let s = initialRunner();
  let i = 0;
  for (let t = 1; t <= ticks; t++) {
    if (s.over) throw new Error('Run continues after collision.');
    const jump = jumps[i] === t;
    if (jump) i++;
    s = stepRunner(s, jump, rng);
  }
  if (i !== jumps.length) throw new Error('Invalid jump log.');
  return s;
}
