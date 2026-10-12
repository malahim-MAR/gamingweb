import Link from 'next/link';
import { Gamepad2, ArrowUpRight } from 'lucide-react';
export function Footer() {
  return (
    <footer className="layout mt-16 border-t border-border py-8">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          <Gamepad2 size={22} />
          playroom<span className="text-primary">.</span>
        </Link>
        <p className="text-sm text-muted-foreground">A little play goes a long way.</p>
        <div className="flex gap-6 text-sm">
          <Link href="/games">
            Find your next favorite <ArrowUpRight className="inline" size={14} />
          </Link>
          <Link href="/pricing">Go premium</Link>
        </div>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Playroom. Made for your downtime.
      </p>
    </footer>
  );
}
