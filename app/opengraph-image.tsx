import { ImageResponse } from 'next/og';
import { OgCard } from '@/lib/og';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Playroom — A little play. A lot of happy.';
export default function Image() {
  return new ImageResponse(
    <OgCard
      name="A little play. A lot of happy."
      description="Ten little games. Endless good times."
    />,
    size,
  );
}
