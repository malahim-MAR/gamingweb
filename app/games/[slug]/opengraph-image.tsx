import { ImageResponse } from 'next/og';
import { findGame } from '@/lib/catalog';
import { OgCard } from '@/lib/og';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Play a little. Find your happy.';
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = findGame(slug);
  return new ImageResponse(
    <OgCard
      name={game?.name || 'Playroom'}
      description={game?.description || 'Find your next favorite.'}
      color={game?.color}
    />,
    size,
  );
}
