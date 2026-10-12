import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'Playroom — A little play, every day.', template: '%s · Playroom' },
  description:
    'Your happy place for quick games. Play 2048, daily word puzzles, Cloud Runner, Sweet Shuffle, and Four in a Row.',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Playroom — A little play, every day.',
    description: 'Five little games. Endless good times.',
    type: 'website',
    images: ['/opengraph-image'],
  },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Playroom' },
  icons: { icon: '/icon.svg', apple: '/icons/icon-192.png' },
};
export const viewport: Viewport = { themeColor: '#ec633c', width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only z-[100] rounded-lg bg-primary p-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="min-h-[65vh]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
