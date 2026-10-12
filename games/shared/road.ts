export function project(lane: number, depth: number) {
  const scale = Math.pow(Math.max(0, Math.min(1, depth)), 1.6);
  return { x: 400 + lane * (25 + scale * 205), y: 165 + scale * 335, scale: 0.12 + scale * 1.35 };
}
export function polygon(ctx: CanvasRenderingContext2D, points: number[][], color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
}
export function drawRoad(ctx: CanvasRenderingContext2D, distance: number, racing = false) {
  const sky = ctx.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, racing ? '#b07b91' : '#67b9c8');
  sky.addColorStop(0.42, '#ffe0b4');
  sky.addColorStop(1, '#ced4ac');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 800, 500);
  ctx.fillStyle = '#fff0c7';
  ctx.beginPath();
  ctx.arc(530, 100, 40, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 14; i++) {
    const x = i * 63,
      h = 30 + ((i * 43) % 74);
    ctx.fillStyle = i % 2 ? '#77938c' : '#97aca0';
    ctx.fillRect(x, 165 - h, 48, h);
    ctx.fillStyle = '#e2d7ae';
    for (let y = 175 - h; y < 156; y += 16) ctx.fillRect(x + 8, y, 5, 6);
  }
  polygon(
    ctx,
    [
      [355, 165],
      [445, 165],
      [800, 500],
      [0, 500],
    ],
    '#46535c',
  );
  polygon(
    ctx,
    [
      [345, 165],
      [355, 165],
      [0, 500],
      [-45, 500],
    ],
    '#f3d6b2',
  );
  polygon(
    ctx,
    [
      [445, 165],
      [455, 165],
      [845, 500],
      [800, 500],
    ],
    '#f3d6b2',
  );
  for (let i = 0; i < 18; i++) {
    const z = (i / 18 + distance * 0.007) % 1;
    for (const lane of [-0.5, 0.5]) {
      const a = project(lane, z),
        b = project(lane, Math.min(1, z + 0.024));
      polygon(
        ctx,
        [
          [a.x - 1, a.y],
          [a.x + 1, a.y],
          [b.x + 3, b.y],
          [b.x - 3, b.y],
        ],
        racing ? '#f0ddd0' : '#8a999c',
      );
    }
    if (!racing) {
      const a = project(-1.35, z),
        b = project(1.35, z);
      ctx.strokeStyle = '#75868a';
      ctx.lineWidth = a.scale * 3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  if (!racing)
    for (const lane of [-1.3, 1.3]) {
      const a = project(lane, 0),
        b = project(lane, 1);
      ctx.strokeStyle = '#bdc5bc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
}
export function hud(ctx: CanvasRenderingContext2D, left: string, right: string) {
  ctx.fillStyle = '#142e32c9';
  ctx.beginPath();
  ctx.roundRect(16, 16, 768, 42, 12);
  ctx.fill();
  ctx.font = 'bold 15px system-ui';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(left, 32, 43);
  ctx.textAlign = 'right';
  ctx.fillText(right, 768, 43);
  ctx.textAlign = 'left';
}
