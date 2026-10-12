import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Playroom — A little play, every day.',
    short_name: 'Playroom',
    description: 'Your happy place for quick games.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8f7f2',
    theme_color: '#ec633c',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
