'use client';
import { useRef } from 'react';
import { useArcade } from '@/hooks/use-arcade';
import { ArcadeStart, HoldControl } from '@/components/arcade-controls';
import { Button } from '@/components/ui/button';
import { rounded } from '@/hooks/use-canvas';
import { hud, polygon } from '@/games/shared/road';
import { ARENA, createStrike, stepStrike, raycast, angleDelta, type StrikeState } from './engine';
import type { GameProps } from '@/types';
const FOV = Math.PI / 3;
function draw(ctx: CanvasRenderingContext2D, s: StrikeState) {
  const ceiling = ctx.createLinearGradient(0, 0, 0, 250);
  ceiling.addColorStop(0, '#395361');
  ceiling.addColorStop(1, '#afbfaa');
  ctx.fillStyle = ceiling;
  ctx.fillRect(0, 0, 800, 250);
  const floor = ctx.createLinearGradient(0, 250, 0, 500);
  floor.addColorStop(0, '#939988');
  floor.addColorStop(1, '#344b42');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 250, 800, 250);
  const depths: number[] = [];
  for (let x = 0; x < 800; x += 2) {
    const angle = s.angle + Math.atan((x / 400 - 1) * Math.tan(FOV / 2)),
      hit = raycast(s.x, s.y, angle),
      d = hit.distance * Math.cos(angle - s.angle);
    depths[x / 2] = d;
    const h = Math.min(1800, 430 / Math.max(0.08, d)),
      top = 250 - h / 2;
    const shade = Math.max(0.16, 1 - d / 20) * (hit.side ? 0.72 : 1),
      seam = (hit.side ? hit.x : hit.y) % 1;
    ctx.fillStyle = `rgb(${Math.floor(180 * shade)},${Math.floor(185 * shade)},${Math.floor(155 * shade)})`;
    ctx.fillRect(x, top, 2, h);
    ctx.fillStyle = `rgba(35,55,45,${seam < 0.025 ? 0.4 : 0.16})`;
    ctx.fillRect(x, top, 2, seam < 0.025 ? h : 2);
    for (let i = 1; i < 4; i++) {
      ctx.fillStyle = '#263c3525';
      ctx.fillRect(x, top + (h * i) / 4, 2, Math.max(1, h / 100));
    }
  }
  const bots = s.bots
    .filter((b) => b.hp > 0)
    .map((b) => ({
      b,
      d: Math.hypot(b.x - s.x, b.y - s.y),
      angle: angleDelta(Math.atan2(b.y - s.y, b.x - s.x), s.angle),
    }))
    .sort((a, b) => b.d - a.d);
  for (const { b, d, angle } of bots) {
    if (Math.abs(angle) > FOV * 0.8) continue;
    const depth = d * Math.cos(angle),
      screen = 400 + (Math.tan(angle) * 400) / Math.tan(FOV / 2),
      h = Math.min(600, 370 / Math.max(0.25, depth)),
      w = h * 0.45,
      y = 250 - h * 0.42;
    ctx.save();
    ctx.beginPath();
    for (
      let x = Math.max(0, Math.floor((screen - w / 2) / 2) * 2);
      x < Math.min(800, screen + w / 2);
      x += 2
    )
      if (depth < (depths[x / 2] || 30)) ctx.rect(x, 0, 2, 500);
    ctx.clip();
    const color = b.hit ? '#f8d886' : '#b66e54';
    rounded(ctx, screen - w * 0.31, y + h * 0.26, w * 0.62, h * 0.42, h * 0.04, color);
    rounded(ctx, screen - w * 0.35, y + h * 0.69, w * 0.23, h * 0.3, h * 0.025, '#3b4a48');
    rounded(ctx, screen + w * 0.1, y + h * 0.69, w * 0.23, h * 0.3, h * 0.025, '#3b4a48');
    ctx.fillStyle = '#d4ac83';
    ctx.beginPath();
    ctx.arc(screen, y + h * 0.17, h * 0.11, 0, Math.PI * 2);
    ctx.fill();
    rounded(ctx, screen - w * 0.26, y + h * 0.06, w * 0.52, h * 0.12, 3, '#4a6355');
    rounded(ctx, screen - w * 0.48, y + h * 0.36, w * 0.26, h * 0.29, 4, color);
    rounded(ctx, screen + w * 0.22, y + h * 0.36, w * 0.26, h * 0.29, 4, color);
    rounded(ctx, screen - w * 0.2, y + h * 0.48, w * 0.8, h * 0.07, 2, '#273b38');
    rounded(ctx, screen - w / 2, y - 9, w, 4, 2, '#283b37');
    rounded(ctx, screen - w / 2, y - 9, (w * b.hp) / 70, 4, 2, '#f1c66c');
    ctx.restore();
  }
  // Simple first-person weapon, crosshair, and a compact arena radar.
  const bob = Math.sin(s.time * 4) * 2,
    recoil = s.flash * 100;
  polygon(
    ctx,
    [
      [455, 500],
      [500, 422 + bob],
      [555, 430 + bob],
      [597, 500],
    ],
    '#3f5458',
  );
  polygon(
    ctx,
    [
      [484, 446 - recoil],
      [491, 343 - recoil],
      [523, 337 - recoil],
      [545, 448 - recoil],
    ],
    '#263c40',
  );
  rounded(ctx, 493, 339 - recoil, 28, 9, 2, '#7e9490');
  if (s.flash > 0)
    polygon(
      ctx,
      [
        [504, 342],
        [484, 313],
        [505, 320],
        [515, 288],
        [523, 317],
        [545, 306],
        [529, 340],
      ],
      '#ffe09b',
    );
  ctx.strokeStyle = s.flash ? '#f6cc72' : '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(389, 250);
  ctx.lineTo(396, 250);
  ctx.moveTo(404, 250);
  ctx.lineTo(411, 250);
  ctx.moveTo(400, 239);
  ctx.lineTo(400, 246);
  ctx.moveTo(400, 254);
  ctx.lineTo(400, 261);
  ctx.stroke();
  rounded(ctx, 16, 352, 132, 132, 9, '#142e32c9');
  ARENA.forEach((row, y) =>
    row.split('').forEach((cell, x) => {
      if (cell === '1') {
        ctx.fillStyle = '#82918a';
        ctx.fillRect(20 + x * 7.75, 356 + y * 7.75, 7, 7);
      }
    }),
  );
  for (const b of s.bots)
    if (b.hp > 0) {
      ctx.fillStyle = '#e98b66';
      ctx.beginPath();
      ctx.arc(20 + b.x * 7.75, 356 + b.y * 7.75, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  ctx.fillStyle = '#a2dbd4';
  ctx.beginPath();
  ctx.arc(20 + s.x * 7.75, 356 + s.y * 7.75, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a2dbd4';
  ctx.beginPath();
  ctx.moveTo(20 + s.x * 7.75, 356 + s.y * 7.75);
  ctx.lineTo(20 + (s.x + Math.cos(s.angle)) * 7.75, 356 + (s.y + Math.sin(s.angle)) * 7.75);
  ctx.stroke();
  hud(
    ctx,
    `HEALTH ${s.hp}  ·  ${s.reload ? 'RELOADING…' : `AMMO ${s.ammo}/12`}`,
    `WAVE ${s.wave}/3  ·  ${s.kills} TAGS`,
  );
  if (s.wait > 0) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(s.wave === 3 ? 'Arena cleared!' : 'Wave cleared. Catch your breath.', 400, 130);
  }
  if (!s.ammo && !s.reload) {
    ctx.fillStyle = '#ffe09b';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Press R or tap Reload', 400, 300);
  }
  if (s.damage > 0) {
    ctx.fillStyle = '#d66e4930';
    ctx.fillRect(0, 0, 800, 500);
  }
}
export default function StrikeZone(props: GameProps) {
  const game = useArcade(props, createStrike, stepStrike, draw, describe);
  const pointer = useRef({ x: 0, start: 0, moved: 0 });
  return (
    <div onKeyDown={game.keyDown} onKeyUp={game.keyUp} onBlur={game.blur}>
      <div className="relative">
        <canvas
          ref={game.canvas}
          tabIndex={0}
          role="img"
          className="game-canvas"
          aria-label={`Strike Zone first-person arena. ${game.summary} WASD to move, arrows or drag to aim, Space to fire, R to reload.`}
          onPointerDown={(e) => {
            e.currentTarget.focus();
            e.currentTarget.setPointerCapture(e.pointerId);
            pointer.current = { x: e.clientX, start: e.clientX, moved: 0 };
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId) && game.running && !props.paused) {
              const dx = e.clientX - pointer.current.x;
              game.state.current!.angle += dx * 0.006;
              pointer.current.moved += Math.abs(dx);
              pointer.current.x = e.clientX;
            }
          }}
          onPointerUp={() => {
            if (pointer.current.moved < 8) game.command('Space');
          }}
        />
        {!game.running && (
          <ArcadeStart
            title="Step into the arena."
            detail="A compact first-person challenge. Use cover, reload, and clear three waves of bots."
            start={game.start}
            label="Enter arena"
          />
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(
          [
            ['ArrowLeft', 'Turn left', '↶'],
            ['KeyA', 'Strafe left', '←'],
            ['KeyW', 'Move forward', '↑'],
            ['KeyS', 'Move backward', '↓'],
            ['KeyD', 'Strafe right', '→'],
            ['ArrowRight', 'Turn right', '↷'],
          ] as const
        ).map(([code, label, text]) => (
          <HoldControl
            key={code}
            code={code}
            label={label}
            hold={game.hold}
            disabled={!game.running || props.paused}
          >
            {text}
          </HoldControl>
        ))}
        <HoldControl
          code="Space"
          label="Fire"
          hold={game.hold}
          disabled={!game.running || props.paused}
        >
          Fire
        </HoldControl>
        <Button
          variant="outline"
          size="sm"
          disabled={!game.running || props.paused}
          onClick={() => game.command('KeyR')}
        >
          Reload
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        WASD moves · Arrows / drag to aim · Click / Space fires · R reloads
      </p>
      <p className="sr-only" aria-live="off">
        {game.summary}
      </p>
    </div>
  );
}
function describe(s: StrikeState) {
  return `Health ${s.hp}. Ammo ${s.ammo} of 12. ${s.reload ? 'Reloading.' : ''} Wave ${s.wave} of 3. ${s.kills} tags.`;
}
