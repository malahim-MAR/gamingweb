import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';
import { createHash } from 'node:crypto';
const html = readFileSync(new URL('../public/strike-zone/index.html', import.meta.url), 'utf8');
const source = html.match(/<script id="game-core">([\s\S]*?)<\/script>/)![1];
const context = createContext({ window: {} });
new Script(source).runInContext(context);
const C = context.window.StrikeCore as Record<string, any>;
function game(side = 'CT') {
  const g = C.createGame(side, 'Normal', 19);
  g.aiClock = Infinity;
  return g;
}
function live(side = 'CT') {
  const g = game(side);
  g.phase = 'active';
  g.clock = 115;
  for (const a of g.actors) a.drawTime = 0;
  return g;
}
function advance(g: any, seconds: number, input = C.controls()) {
  for (let i = 0; i < Math.ceil(seconds / C.DT); i++) C.step(g, C.DT, input);
}
describe('standalone tactical shooter contract', () => {
  it('contains parseable modules and pinned Three.js without storage access', () => {
    new Script(html.match(/<script id="game-runtime">([\s\S]*?)<\/script>/)![1]);
    expect(html).toContain('three.js/r128/three.min.js');
    expect(html).toContain('integrity="sha384-');
    const library = readFileSync(new URL('./fixtures/three-r128.min.js', import.meta.url));
    expect(html).toContain(`sha384-${createHash('sha384').update(library).digest('base64')}`);
    expect(html).not.toMatch(/\b(?:localStorage|sessionStorage)\b/);
    expect(C.DT).toBe(1 / 128);
  });
  it('creates a balanced 5v5 match and freezes movement/firing for 15 seconds', () => {
    const g = game(),
      p = g.actors[0],
      old = { ...p.pos };
    expect(g.actors.filter((a: any) => C.actorSide(g, a) === 'T')).toHaveLength(5);
    expect(g.actors.filter((a: any) => !a.bot)).toHaveLength(1);
    expect(p.money).toBe(800);
    advance(g, 14, { ...C.controls(), forward: 1, fire: true, firePressed: true });
    expect(p.pos).toEqual(old);
    expect(p.weapons.usp.mag).toBe(12);
    expect(g.phase).toBe('freeze');
    advance(g, 1.02);
    expect(g.phase).toBe('active');
    expect(g.clock).toBeGreaterThan(114);
  });
  it('builds usable A* routes from both spawns to both sites', () => {
    const g = game();
    expect(g.graph.length).toBeGreaterThan(500);
    for (const z of [-36, 34])
      for (const site of C.SITES) {
        const path = C.astar(
          g.graph,
          C.nearestNode(g.graph, { x: 0, z }),
          C.nearestNode(g.graph, site),
        );
        expect(path.length).toBeGreaterThan(2);
        expect(path.every((n: any) => C.clearBody(g.world, n.x, n.y, n.z))).toBe(true);
      }
  });
});
describe('rounds and bomb objectives', () => {
  it('plants after a continuous stationary 3-second hold and awards $800', () => {
    const g = live('T'),
      p = g.actors[0];
    p.pos = C.vec(28, 1.2, -27);
    p.prev = { ...p.pos };
    p.ctrl.use = true;
    for (let i = 0; i < 128 * 2; i++) C.updateBomb(g, C.DT);
    expect(g.bomb.state).toBe('carried');
    p.ctrl.use = false;
    C.updateBomb(g, C.DT);
    expect(g.bomb.progress).toBe(0);
    p.ctrl.use = true;
    for (let i = 0; i < 128 * 3; i++) C.updateBomb(g, C.DT);
    expect(g.bomb.state).toBe('planted');
    expect(g.bomb.site).toBe('A');
    expect(g.bomb.timer).toBeGreaterThan(39.9);
    expect(p.money).toBe(1600);
  });
  it('defuses in 10 seconds, or 5 with a kit, and interrupts on release', () => {
    for (const kit of [false, true]) {
      const g = live(),
        p = g.actors[0];
      p.pos = C.vec(-30, 0, -27);
      p.kit = kit;
      p.ctrl.use = true;
      g.bomb = { ...g.bomb, state: 'planted', owner: null, pos: { ...p.pos }, timer: 40 };
      const duration = kit ? 5 : 10;
      for (let i = 0; i < 128 * (duration - 1); i++) C.updateBomb(g, C.DT);
      expect(g.bomb.state).toBe('planted');
      for (let i = 0; i < 128; i++) C.updateBomb(g, C.DT);
      expect(g.bomb.state).toBe('defused');
      expect(g.scores[0]).toBe(1);
    }
  });
  it('does not award CT elimination or timeout while a bomb is ticking', () => {
    const g = live();
    g.bomb.state = 'planted';
    g.bomb.owner = null;
    g.bomb.pos = C.vec(28, 1.2, -27);
    for (const a of g.actors) if (C.actorSide(g, a) === 'T') a.alive = false;
    g.clock = 0.01;
    advance(g, 0.1);
    expect(g.phase).toBe('active');
    g.bomb.timer = 0.01;
    advance(g, 0.1);
    expect(g.bomb.state).toBe('exploded');
    expect(g.scores[1]).toBe(1);
  });
  it('awards CT timeouts, drops a dead carrier’s bomb, and permits pickups', () => {
    const g = live('T'),
      p = g.actors[0],
      ally = g.actors[1];
    C.damage(g, p, 500, g.actors[5], 'awp', 'head');
    expect(g.bomb.state).toBe('dropped');
    expect(p.alive).toBe(false);
    ally.pos = { ...g.bomb.pos };
    C.updateBomb(g, C.DT);
    expect(g.bomb.owner).toBe(ally.id);
    const timeout = live();
    timeout.clock = 0.01;
    advance(timeout, 0.1);
    expect(timeout.scores[0]).toBe(1);
  });
  it('swaps sides at halftime, resets equipment/economy and keeps team scores', () => {
    const g = live('CT');
    g.totalRounds = 15;
    g.scores = [8, 7];
    g.actors[0].money = 9000;
    C.beginRound(g);
    expect(g.side[0]).toBe('T');
    expect(g.scores).toEqual([8, 7]);
    expect(g.actors[0].money).toBe(800);
    expect(g.actors[0].active).toBe('glock');
    expect(g.actors[0].hp).toBe(100);
  });
  it('ends at 16 wins or a 15–15 draw after 30 rounds', () => {
    const win = live();
    win.scores = [15, 7];
    win.totalRounds = 22;
    C.settle(win, 'CT', 'test');
    expect(win.phase).toBe('finished');
    expect(win.winner).toBe(0);
    const draw = live();
    draw.scores = [15, 14];
    draw.totalRounds = 29;
    C.settle(draw, 'T', 'test');
    expect(draw.winner).toBe(-1);
    expect(draw.totalRounds).toBe(30);
  });
  it('keeps death permanent until the next round and pause freezes all timers', () => {
    const g = live(),
      p = g.actors[0];
    C.damage(g, p, 500, null, 'fall');
    advance(g, 1);
    expect(p.alive).toBe(false);
    g.paused = true;
    const clock = g.clock;
    advance(g, 2);
    expect(g.clock).toBe(clock);
    C.beginRound(g);
    expect(p.alive).toBe(true);
  });
});
describe('loadouts, ammo and damage', () => {
  it('enforces money, side, phase, grenade limits and kit eligibility', () => {
    const g = game('CT'),
      p = g.actors[0];
    expect(C.buy(g, p, 'helmet').ok).toBe(false);
    expect(C.buy(g, p, 'kevlar').ok).toBe(true);
    expect(p.money).toBe(150);
    p.money = 16000;
    expect(C.buy(g, p, 'ak47').ok).toBe(false);
    expect(C.buy(g, p, 'm4a1').ok).toBe(true);
    expect(C.buy(g, p, 'kit').ok).toBe(true);
    expect(p.kit).toBe(true);
    expect(C.buy(g, p, 'he').ok).toBe(true);
    expect(C.buy(g, p, 'he').ok).toBe(false);
    g.phase = 'active';
    expect(C.buy(g, p, 'awp').ok).toBe(false);
  });
  it('uses capped loss streak rewards and money; applies weapon-specific kill rewards', () => {
    expect([1, 2, 3, 4, 5, 8].map((n) => C.lossReward(n))).toEqual([
      1400, 1900, 2400, 2900, 3400, 3400,
    ]);
    const g = live(),
      p = g.actors[0],
      foe = g.actors[5];
    p.money = 15900;
    C.grant(p, 3250);
    expect(p.money).toBe(16000);
    p.money = 0;
    C.damage(g, foe, 500, p, 'mp5', 'head');
    expect(p.money).toBe(600);
    expect(p.kills).toBe(1);
  });
  it('distinguishes body parts, armor and helmets', () => {
    const g = live(),
      p = g.actors[0],
      foe = g.actors[5];
    foe.armor = 100;
    foe.helmet = true;
    C.damage(g, foe, 100, p, 'usp', 'chest');
    expect(foe.hp).toBe(25);
    expect(foe.armor).toBe(75);
    foe.hp = 100;
    foe.helmet = false;
    C.damage(g, foe, 100, p, 'usp', 'head');
    expect(foe.alive).toBe(false);
  });
  it('hits heads and penetrates thin wood while stone blocks shots', () => {
    const g = live(),
      p = g.actors[0],
      foe = g.actors[5];
    g.world.boxes = [];
    p.pos = C.vec(0, 0, 10);
    p.yaw = 0;
    foe.pos = C.vec(0, 0, 5);
    const origin = C.eye(p),
      dir = C.direction(0);
    const hit = C.traceShot(g, p, origin, dir, 20);
    expect(hit.target.id).toBe(foe.id);
    expect(hit.region).toBe('head');
    g.world.boxes = [{ x: 0, y: 1, z: 7, w: 2, h: 3, d: 0.3, material: 'wood', penetrable: true }];
    expect(C.traceShot(g, p, origin, dir, 20).energy).toBeLessThan(1);
    p.active = 'knife';
    expect(C.traceShot(g, p, origin, dir, 20).blocked).toBe(true);
    p.active = 'usp';
    g.world.boxes[0].penetrable = false;
    expect(C.traceShot(g, p, origin, dir, 20).blocked).toBe(true);
  });
  it('honors firing cooldown, spray climb, finite reserve, and reload time', () => {
    const g = live(),
      p = g.actors[0];
    g.world.boxes = [];
    g.rng = () => 0.5;
    p.pos = C.vec(0, 0, 30);
    p.yaw = Math.PI;
    p.ctrl.firePressed = true;
    expect(C.fire(g, p)).toBe(true);
    expect(C.fire(g, p)).toBe(false);
    expect(p.recoilPitch).toBeGreaterThan(0);
    expect(p.weapons.usp.mag).toBe(11);
    expect(C.reload(g, p)).toBe(true);
    expect(C.fire(g, p)).toBe(false);
    advance(g, 2.3);
    expect(p.weapons.usp.mag).toBe(12);
    expect(p.weapons.usp.reserve).toBe(99);
  });
  it('keeps sniper zoom and movement penalties in its config', () => {
    expect(C.WEAPONS.awp.damage).toBeGreaterThan(115);
    expect(C.WEAPONS.awp.scope).toBe(true);
    expect(C.WEAPONS.awp.speed).toBeLessThan(C.WEAPONS.usp.speed);
    for (const cfg of Object.values(C.WEAPONS) as any[]) {
      expect(cfg.recoil.length).toBeGreaterThan(10);
      expect(cfg.spread.jump).toBeGreaterThanOrEqual(cfg.spread.stand);
    }
  });
});
describe('utility, movement and bot perception', () => {
  it('blocks bot LOS with 18-second smoke clouds and handles flashes by view angle', () => {
    const g = live(),
      p = g.actors[0];
    g.world.boxes = [];
    p.pos = C.vec(0, 0, 10);
    p.yaw = 0;
    const a = C.vec(0, 1.6, 10),
      b = C.vec(0, 1.6, 0);
    expect(C.lineOfSight(g, a, b)).toBe(true);
    C.burstGrenade(g, { kind: 'smoke', owner: 0, id: 1, pos: C.vec(0, 0, 5) });
    expect(g.smokes[0].time).toBe(18);
    expect(C.lineOfSight(g, a, b)).toBe(false);
    C.burstGrenade(g, { kind: 'flash', owner: 5, pos: C.vec(0, 1.6, 5) });
    const toward = p.flashBlind;
    p.flashBlind = 0;
    p.yaw = Math.PI;
    C.burstGrenade(g, { kind: 'flash', owner: 5, pos: C.vec(0, 1.6, 5) });
    expect(p.flashBlind).toBeLessThan(toward);
  });
  it('throws limited grenades with gravity/bounce and area damage falloff', () => {
    const g = live(),
      p = g.actors[0],
      near = g.actors[5],
      far = g.actors[6];
    g.world.boxes = [];
    p.utility.he = 1;
    C.equip(p, 'he');
    p.drawTime = 0;
    expect(C.throwGrenade(g, p, 'he')).toBe(true);
    expect(p.utility.he).toBe(0);
    expect(g.grenades).toHaveLength(1);
    const grenade = g.grenades[0],
      y = grenade.pos.y;
    C.grenadePhysics(g, 0.05);
    expect(grenade.pos.y).toBeGreaterThan(y);
    near.pos = C.vec(0, 0, 0);
    far.pos = C.vec(8, 0, 0);
    near.armor = far.armor = 0;
    C.burstGrenade(g, { kind: 'he', owner: 0, pos: C.vec(0, 1, 0) });
    expect(near.hp).toBeLessThan(far.hp);
  });
  it('uses capsule collision, friction, crouch speed, jump and traversable ramps', () => {
    const g = live(),
      p = g.actors[0];
    p.pos = C.vec(43, 0, 30);
    p.ctrl = { ...C.controls(), strafe: 1 };
    p.yaw = 0;
    for (let i = 0; i < 128; i++) C.moveActor(g, p, C.DT);
    expect(p.pos.x).toBeLessThan(43.65);
    p.pos = C.vec(0, 0, 34);
    p.vel = C.vec();
    p.ctrl = { ...C.controls(), jump: true };
    C.moveActor(g, p, C.DT);
    expect(p.grounded).toBe(false);
    expect(p.pos.y).toBeGreaterThan(0);
    p.ctrl.jump = false;
    for (let i = 0; i < 128; i++) C.moveActor(g, p, C.DT);
    expect(p.grounded).toBe(true);
    p.pos = C.vec(28, 0, -11);
    p.vel = C.vec();
    p.ctrl = { ...C.controls(), forward: 1 };
    p.yaw = 0;
    for (let i = 0; i < 128 * 3; i++) C.moveActor(g, p, C.DT);
    expect(p.pos.y).toBeCloseTo(1.2);
  });
  it('applies fall damage above the safe height threshold', () => {
    const g = live(),
      p = g.actors[0];
    p.pos = C.vec(0, 8, 34);
    p.grounded = false;
    p.airPeak = 8;
    p.armor = 100;
    p.ctrl = C.controls();
    for (let i = 0; i < 128 * 2; i++) C.moveActor(g, p, C.DT);
    expect(p.hp).toBeLessThan(100);
    expect(p.pos.y).toBe(0);
    expect(p.armor).toBe(100);
  });
  it('delays bot reaction, blocks blind vision, and sends a planter to a site', () => {
    const g = live(),
      bot = g.actors[5],
      player = g.actors[0];
    g.world.boxes = [];
    bot.pos = C.vec(0, 0, 5);
    bot.yaw = Math.PI;
    player.pos = C.vec(0, 0, 10);
    C.botAI(g, bot, 0.1);
    expect(bot.ctrl.fire).toBe(false);
    C.botAI(g, bot, 0.3);
    expect(bot.ctrl.fire).toBe(true);
    bot.flashBlind = 2;
    C.botAI(g, bot, 0.1);
    expect(bot.ctrl.fire).toBe(false);
    expect(bot.ai.state).toBe('retreat');
    const objective = live();
    const carrier = objective.actors[objective.bomb.owner];
    for (const foe of objective.actors)
      if (foe.faction !== carrier.faction) foe.pos = C.vec(40, 0, 40);
    C.botAI(objective, carrier, 0.1);
    expect(carrier.ai.state).toBe('plant');
    expect(carrier.ai.path.length).toBeGreaterThan(0);
  });
});
