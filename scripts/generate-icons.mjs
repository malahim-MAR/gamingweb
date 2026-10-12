// Run once after installing dependencies when changing public/icon.svg.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/icons', { recursive: true });
for (const size of [192, 512])
  await sharp('public/icon.svg').resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
const small = await sharp('public/icon.svg').resize(330, 330).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#ec633c' } })
  .composite([{ input: small, gravity: 'center' }])
  .png()
  .toFile('public/icons/icon-maskable.png');
