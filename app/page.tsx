import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  Smile,
  Gamepad2,
  Sparkles,
  Flame,
  Crown,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { HeroArt } from '@/components/hero-art';
import { HomeGames } from '@/components/home-games';
import { Button } from '@/components/ui/button';
import { activeGames } from '@/lib/data';
export default async function Home() {
  const games = await activeGames();
  return (
    <div className="layout">
      <div className="flex items-center justify-between py-6 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#79a582]" /> YOUR DAILY DOSE OF HAPPY
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <Sparkles size={13} /> Less scrolling. More playing.
        </span>
      </div>
      <section className="hero grid rounded-3xl px-7 py-9 sm:px-12 sm:py-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="relative z-10 flex flex-col justify-center">
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#b8c5ae] px-3 py-1.5 text-[10px] font-semibold">
              <span className="text-primary">✳</span> A HAPPY PLACE FOR YOUR DOWNTIME
            </span>
          </div>
          <h1 className="max-w-[540px] text-[44px] font-extrabold leading-[1.08] tracking-[-2.6px] sm:text-[60px]">
            A little play.
            <br />A lot of <span className="text-primary">happy.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
            Big on fun. Light on commitment. Discover feel-good games made for your five-minute
            breaks.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/games">
                Find your next favorite <ArrowUpRight size={17} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-[#c5cec0] bg-transparent">
              <Link href="/games/word-game">
                Daily challenge <Flame size={16} />
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex gap-5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check size={13} /> No downloads
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={13} /> Instant fun
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={13} /> Play anywhere
            </span>
          </div>
        </div>
        <HeroArt />
      </section>
      <div className="grid grid-cols-1 gap-6 border-b border-border py-7 sm:grid-cols-3">
        <div className="flex items-center justify-center gap-3">
          <div className="rounded-xl bg-[#f1e4d4] p-2.5 text-[#b98850]">
            <Clock size={19} />
          </div>
          <div>
            <p className="text-xs font-bold">Small breaks. Big smiles.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              A good time in five minutes or less.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="rounded-xl bg-[#e4eadf] p-2.5 text-[#7c9675]">
            <Gamepad2 size={19} />
          </div>
          <div>
            <p className="text-xs font-bold">Pick up & play</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              No installs. No waiting. Just play.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="rounded-xl bg-[#ebe4ef] p-2.5 text-[#9981af]">
            <Smile size={19} />
          </div>
          <div>
            <p className="text-xs font-bold">Your kind of fun</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              A little something for every mood.
            </p>
          </div>
        </div>
      </div>
      <section className="py-9">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2 text-primary">THE GOOD STUFF</p>
            <h2 className="section-title">What are we playing today?</h2>
          </div>
          <Link href="/games" className="hidden items-center gap-2 text-xs font-semibold sm:flex">
            Explore all games <ArrowRight size={15} />
          </Link>
        </div>
        <HomeGames games={games.filter((g) => g.featured !== false)} />
      </section>
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="relative overflow-hidden rounded-2xl border border-[#dddcc8] bg-[#eeeddf] p-7 text-[#354137]">
          <div className="relative z-10 max-w-[75%]">
            <span className="eyebrow flex items-center gap-2 text-[#8e8b59]">
              <Flame size={13} /> MAKE IT A DAILY THING
            </span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">One word. A fresh start.</h2>
            <p className="mt-2 max-w-xs text-xs leading-6 text-[#747764]">
              Meet your daily Word Club challenge. Six guesses, a little brain stretch, and a streak
              worth keeping.
            </p>
            <Link
              href="/games/word-game"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold"
            >
              Take today’s challenge <ArrowUpRight size={15} />
            </Link>
          </div>
          <div
            className="absolute -right-4 top-14 grid rotate-12 grid-cols-2 gap-2 opacity-80"
            aria-hidden="true"
          >
            {'PLAY'.split('').map((c, i) => (
              <span key={c} className="tile h-14 w-14 bg-[#92aa84] text-2xl text-white">
                {c}
              </span>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-[#303f35] p-7 text-[#f7f6ed]">
          <span className="eyebrow flex items-center gap-2 text-[#d7c590]">
            <Crown size={13} /> A LITTLE EXTRA JOY
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">More play. Zero interruptions.</h2>
          <p className="mt-2 text-xs leading-6 text-[#b8c5b9]">
            All games, exclusive skins, and an ad-free happy place. That’s Playroom Premium.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#efc786]"
          >
            Explore Premium <ArrowUpRight size={15} />
          </Link>
        </section>
      </div>
      <section className="py-12 text-center">
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[2px] text-muted-foreground">
          <ShieldCheck size={14} /> EASY TO START. HARD TO PUT DOWN.
        </span>
        <h2 className="mt-3 text-[25px] font-bold tracking-tight">
          Save your scores. Find your people.
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Make yourself at home. Your next personal best is waiting.
        </p>
        <Button asChild className="mt-5" variant="dark">
          <Link href="/signup">
            Create your free account <ArrowUpRight size={16} />
          </Link>
        </Button>
      </section>
    </div>
  );
}
