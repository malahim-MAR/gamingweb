'use client';
import { useArcade } from '@/hooks/use-arcade';
import { ArcadeStart, HoldControl } from '@/components/arcade-controls';
import { rounded } from '@/hooks/use-canvas';
import { drawRoad, project, hud } from '@/games/shared/road';
import { createRace, stepRace, type RaceState } from './engine';
import type { GameProps } from '@/types';
function car(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  const w = 45 * scale,
    h = 85 * scale;
  rounded(ctx, x - w * 0.6, y - h * 0.8, w * 0.16, h * 0.25, 2, '#202d36');
  rounded(ctx, x + w * 0.44, y - h * 0.8, w * 0.16, h * 0.25, 2, '#202d36');
  rounded(ctx, x - w * 0.6, y - h * 0.2, w * 0.16, h * 0.25, 2, '#202d36');
  rounded(ctx, x + w * 0.44, y - h * 0.2, w * 0.16, h * 0.25, 2, '#202d36');
  rounded(ctx, x - w / 2, y - h, w, h, 7 * scale, color);
  rounded(ctx, x - w * 0.36, y - h * 0.72, w * 0.72, h * 0.27, 3 * scale, '#314b5d');
  rounded(ctx, x - w * 0.3, y - h * 0.24, w * 0.6, h * 0.13, 2 * scale, '#435c68');
  rounded(ctx, x - w * 0.42, y - h * 0.08, w * 0.18, h * 0.05, 1, '#ffcc9e');
  rounded(ctx, x + w * 0.24, y - h * 0.08, w * 0.18, h * 0.05, 1, '#ffcc9e');
}
function draw(ctx: CanvasRenderingContext2D, s: RaceState) {
  drawRoad(ctx, s.distance, true);
  for (const c of [...s.cars].sort((a, b) => a.z - b.z)) {
    const p = project(c.x, c.z);
    car(ctx, p.x, p.y, p.scale, c.color);
  }
  const p = project(s.x, 0.86);
  if (!s.invincible || Math.floor(s.invincible * 8) % 2) car(ctx, p.x, p.y, 1.4, '#ed6842');
  hud(
    ctx,
    `${Math.round(s.speed)} km/h  ·  ${Math.floor(s.distance)}/3000 m`,
    `${'●'.repeat(3 - s.crashes)}${'○'.repeat(s.crashes)}  SUNSET CIRCUIT`,
  );
  rounded(ctx, 20, 472, 760, 8, 4, '#ffffff40');
  rounded(ctx, 20, 472, 760 * Math.min(1, s.distance / 3000), 8, 4, '#f4ca68');
}
export default function Racing(props: GameProps) {
  const game = useArcade(props, createRace, stepRace, draw, describe);
  return (
    <div onKeyDown={game.keyDown} onKeyUp={game.keyUp} onBlur={game.blur}>
      <div className="relative">
        <canvas
          ref={game.canvas}
          tabIndex={0}
          role="img"
          className="game-canvas"
          aria-label={`Sunset Circuit car racing. ${game.summary} Arrows or WASD steer, accelerate and brake.`}
          onPointerDown={(e) => e.currentTarget.focus()}
        />
        {!game.running && (
          <ArcadeStart
            title="Your road. Your rhythm."
            detail="Race 3 km through sunset traffic. Stay on the road and keep your three lives."
            start={game.start}
            label="Start racing"
          />
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(
          [
            ['ArrowLeft', 'Steer left', '←'],
            ['ArrowDown', 'Brake', 'Brake'],
            ['ArrowUp', 'Accelerate', 'Gas ↑'],
            ['ArrowRight', 'Steer right', '→'],
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
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Hold arrows / WASD or the buttons · Three crashes end your race
      </p>
    </div>
  );
}
function describe(s: RaceState) {
  return `${Math.floor(s.distance)} of 3000 meters. ${Math.round(s.speed)} km/h. ${3 - s.crashes} lives.`;
}
