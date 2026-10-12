import type { MetadataRoute } from 'next';
import { games } from '@/lib/catalog';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return ['', '/games', '/pricing', '/leaderboard', ...games.map((g) => `/games/${g.slug}`)].map(
    (path) => ({
      url: `${base}${path}`,
      changeFrequency: path.includes('leaderboard') ? 'daily' : 'weekly',
      priority: path === '' ? 1 : 0.8,
    }),
  );
}
