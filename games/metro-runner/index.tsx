'use client';
import { useRef } from 'react';
import { useArcade } from '@/hooks/use-arcade';
import { ArcadeStart } from '@/components/arcade-controls';
import { Button } from '@/components/ui/button';
import { rounded } from '@/hooks/use-canvas';
import { drawRoad, project, hud, polygon } from '@/games/shared/road';
import { createMetro, stepMetro, type MetroState } from './engine';
import type { GameProps } from '@/types';
function draw(ctx: CanvasRenderingContext2D, s: MetroState) {
  drawRoad(ctx, s.distance);
  for (const item of [...s.items].sort((a, b) => a.z - b.z)) {
    if (item.z < 0) continue;
    const p = project(item.lane, item.z),
      w = p.scale * 65;
    if (item.kind === 'coin') {
      ctx.fillStyle = '#f5c94f';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 23 * p.scale, 12 * p.scale, 17 * p.scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff1a1';
      ctx.lineWidth = 2 * p.scale;
      ctx.stroke();
    } else if (item.kind === 'train') {
      rounded(ctx, p.x - w / 2, p.y - w * 1.9, w, w * 1.9, 7 * p.scale, '#276b72');
      rounded(ctx, p.x - w * 0.35, p.y - w * 1.7, w * 0.7, w * 0.5, 4 * p.scale, '#9bd8df');
      rounded(ctx, p.x - w * 0.35, p.y - w * 0.3, w * 0.7, w * 0.12, 2, '#f4cc70');
    } else if (item.kind === 'barrier') {
      rounded(ctx, p.x - w / 2, p.y - w * 0.65, w, w * 0.65, 3, '#ec633c');
      polygon(
        ctx,
        [
          [p.x - w * 0.4, p.y - w * 0.5],
          [p.x - w * 0.15, p.y - w * 0.5],
          [p.x + w * 0.2, p.y - w * 0.1],
          [p.x - w * 0.05, p.y - w * 0.1],
        ],
        '#fff1d5',
      );
    } else {
      rounded(ctx, p.x - w / 2, p.y - w * 1.7, w * 0.12, w * 1.7, 2, '#dfaf64');
      rounded(ctx, p.x + w * 0.38, p.y - w * 1.7, w * 0.12, w * 1.7, 2, '#dfaf64');
      rounded(ctx, p.x - w / 2, p.y - w * 1.7, w, w * 0.7, 2, '#9a7eb0');
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${12 * p.scale}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('SLIDE', p.x, p.y - w * 1.25);
    }
  }
  const p = project(s.visualLane, 0.86),
    jumpY = s.jump ? Math.sin((s.jump / 0.85) * Math.PI) * 105 : 0;
  ctx.fillStyle = '#152e3440';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 5, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const y = p.y - jumpY,
    h = s.slide ? 30 : 62;
  rounded(ctx, p.x - 18, y - h, 36, h, 10, '#ec633c');
  ctx.fillStyle = '#ffe0b4';
  ctx.beginPath();
  ctx.arc(p.x, y - h - 10, 15, 0, Math.PI * 2);
  ctx.fill();
  rounded(ctx, p.x - 16, y - h - 26, 32, 13, 6, '#344f67');
  const stride = Math.sin(s.distance * 1.5) * 8;
  rounded(ctx, p.x - 17, y - 5, 12, 18 + stride, 4, '#344f67');
  rounded(ctx, p.x + 5, y - 5, 12, 18 - stride, 4, '#344f67');
  hud(ctx, `${Math.floor(s.distance)} m  ·  ${s.coins} coins`, 'METRO RUSH');
}
export default function MetroRunner(props: GameProps) {
  const game = useArcade(props, createMetro, stepMetro, draw, describe);
  const touch = useRef({ x: 0, y: 0 });
  return (
    <div onKeyDown={game.keyDown} onKeyUp={game.keyUp} onBlur={game.blur}>
      <div className="relative">
        <canvas
          ref={game.canvas}
          className="game-canvas"
          tabIndex={0}
          role="img"
          aria-label={`Metro Rush three-lane runner. ${game.summary} Use arrows to dodge, jump and slide.`}
          onPointerDown={(e) => {
            e.currentTarget.focus();
            touch.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={(e) => {
            const x = e.clientX - touch.current.x,
              y = e.clientY - touch.current.y;
            game.command(
              Math.max(Math.abs(x), Math.abs(y)) < 20
                ? 'Space'
                : Math.abs(x) > Math.abs(y)
                  ? x > 0
                    ? 'ArrowRight'
                    : 'ArrowLeft'
                  : y > 0
                    ? 'ArrowDown'
                    : 'ArrowUp',
            );
          }}
        />
        {!game.running && (
          <ArcadeStart
            title="Chase the horizon."
            detail="Dodge trains, jump barriers, slide under gates. Grab coins along the way."
            start={game.start}
            label="Start running"
          />
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {(
          [
            ['ArrowLeft', 'Move left', '←'],
            ['Space', 'Jump', 'Jump ↑'],
            ['ArrowDown', 'Slide', 'Slide ↓'],
            ['ArrowRight', 'Move right', '→'],
          ] as const
        ).map(([code, label, text]) => (
          <Button
            key={code}
            variant="outline"
            size="sm"
            aria-label={label}
            disabled={!game.running || props.paused}
            onClick={() => game.command(code)}
          >
            {text}
          </Button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Arrows / WASD · Space to jump · Swipe or tap on mobile
      </p>
      <p className="sr-only" aria-live="off">
        {game.summary}
      </p>
    </div>
  );
}
function describe(s: MetroState) {
  return `${Math.floor(s.distance)} meters, ${s.coins} coins. Lane ${s.lane + 2}. ${s.over ? 'Run complete.' : ''}`;
}
