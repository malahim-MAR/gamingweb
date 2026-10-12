'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Gamepad2, ArrowUpRight, Sun, Moon, Menu, X } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
export function Header() {
  const path = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [signed, setSigned] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const db = browserClient();
    db.auth.getUser().then(({ data }) => setSigned(!!data.user));
    const { data } = db.auth.onAuthStateChange((_event, session) => setSigned(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => setMenu(false), [path]);
  const links = [
    ['Discover', '/'],
    ['All games', '/games'],
    ['Leaderboards', '/leaderboard'],
    ['Premium', '/pricing'],
  ];
  return (
    <header className="site-header">
      <div className="layout flex h-[88px] items-center justify-between gap-4">
        <Link href="/" className="logo" aria-label="Playroom home">
          <span className="logo-mark">
            <Gamepad2 size={24} strokeWidth={2.5} />
          </span>
          playroom<span className="text-primary">.</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? 'page' : undefined}
              className={`nav-link ${path === href ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle color theme"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {mounted && resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href={signed ? '/profile' : '/login'}>{signed ? 'My profile' : 'Log in'}</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href={signed ? '/games' : '/signup'}>
              {signed ? 'Let’s play' : 'Join the fun'}
              <ArrowUpRight size={16} />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {menu && (
        <nav className="layout flex flex-col gap-4 pb-6 md:hidden" aria-label="Mobile navigation">
          {links.map(([l, h]) => (
            <Link key={h} href={h}>
              {l}
            </Link>
          ))}
          <Link href={signed ? '/profile' : '/login'}>{signed ? 'My profile' : 'Log in'}</Link>
        </nav>
      )}
    </header>
  );
}
