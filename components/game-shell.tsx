'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Pause, Play, RotateCcw, Maximize, Minimize, Loader2, Trophy, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { usePreferences } from '@/store/preferences';
import type { Game, GameProps } from '@/types';
const loading = () => (
  <div className="flex min-h-[360px] items-center justify-center gap-3 text-sm text-muted-foreground">
    <Loader2 className="animate-spin" size={20} />
    Unboxing your next little escape…
  </div>
);
const gameComponents = {
  '2048': dynamic(() => import('@/games/2048'), { ssr: false, loading }),
  'word-game': dynamic(() => import('@/games/word-game'), { ssr: false, loading }),
  'endless-runner': dynamic(() => import('@/games/endless-runner'), { ssr: false, loading }),
  'match-3': dynamic(() => import('@/games/match-3'), { ssr: false, loading }),
  'connect-4': dynamic(() => import('@/games/connect-4'), { ssr: false, loading }),
  'metro-runner': dynamic(() => import('@/games/metro-runner'), { ssr: false, loading }),
  'car-racing': dynamic(() => import('@/games/car-racing'), { ssr: false, loading }),
  ludo: dynamic(() => import('@/games/ludo'), { ssr: false, loading }),
  monopoly: dynamic(() => import('@/games/monopoly'), { ssr: false, loading }),
  'strike-zone': dynamic(() => import('@/games/strike-zone'), { ssr: false, loading }),
};
interface Session {
  id?: string;
  seed: number;
  date?: string;
  guesses?: GameProps['initialGuesses'];
  completed?: boolean;
}
export function GameShell({
  game,
  signedIn,
  premium,
  multiplayer,
}: {
  game: Game;
  signedIn: boolean;
  premium: boolean;
  multiplayer: boolean;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(false);
  const [status, setStatus] = useState('');
  const [starting, setStarting] = useState(false);
  const [run, setRun] = useState(0);
  const [full, setFull] = useState(false);
  const [pending, setPending] = useState<{ score: number; actions: unknown[] } | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const skin = usePreferences((s) => s.skin);
  const gated = game.premium && !premium;
  const start = useCallback(async () => {
    if (gated) return;
    setStarting(true);
    setPaused(false);
    setResult(false);
    setScore(0);
    setStatus('');
    setPending(null);
    setSession(null);
    try {
      if (signedIn && !game.localOnly && game.slug !== 'connect-4') {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: game.slug }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSession(data);
      } else {
        setSession({ seed: crypto.getRandomValues(new Uint32Array(1))[0] });
        setStatus(
          game.localOnly
            ? game.memoryOnly
              ? 'Local tactical match. Settings and match data stay in memory.'
              : 'Local play. Scores for this game stay on this device.'
            : game.slug === 'connect-4'
              ? 'Online results save automatically. Local games are for practice.'
              : 'Practice mode. Sign in to save scores and build a streak.',
        );
      }
      setRun((n) => n + 1);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Unable to start your game.');
    } finally {
      setStarting(false);
    }
  }, [gated, signedIn, game.slug, game.localOnly, game.memoryOnly]);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void start();
    }
  }, [start]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden && game.slug !== 'connect-4') setPaused(true);
    };
    const fullscreen = () => setFull(!!document.fullscreenElement);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('fullscreenchange', fullscreen);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('fullscreenchange', fullscreen);
    };
  }, [game.slug]);
  const submit = useCallback(
    async (data: { score: number; actions: unknown[] }) => {
      if (!session?.id || game.slug === 'connect-4') return;
      setStatus('Saving your little victory…');
      try {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: session.id, ...data }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setStatus('Score saved. Nicely played!');
        setPending(null);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Score could not be saved.');
        setPending(data);
      }
    },
    [session, game.slug],
  );
  const end = useCallback(
    (points: number, actions: unknown[]) => {
      setScore(points);
      if (game.slug !== 'strike-zone') setResult(true);
      if (game.memoryOnly) setStatus('Local match complete. Start another match inside the game.');
      if (game.localOnly && !game.memoryOnly) {
        try {
          const key = `playroom:best:${game.slug}`;
          const best = Math.max(points, Number(localStorage.getItem(key)) || 0);
          localStorage.setItem(key, String(best));
          setStatus(`Local best: ${best.toLocaleString()} points. Saved on this device.`);
        } catch {
          setStatus('Local round complete.');
        }
      }
      void submit({ score: points, actions });
    },
    [submit, game.localOnly, game.slug, game.memoryOnly],
  );
  const scoreChange = useCallback((points: number) => setScore(points), []);
  const GameComponent = gameComponents[game.slug];
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await host.current?.requestFullscreen();
    } catch {
      setStatus('Fullscreen is unavailable in this browser.');
    }
  }
  return (
    <div ref={host} className="surface overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Trophy size={17} />
          </span>
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              {game.slug === 'endless-runner' ? 'DISTANCE' : 'YOUR SCORE'}
            </p>
            <p aria-live="off" className="text-xl font-bold leading-6">
              {score.toLocaleString()}
              {game.slug === 'endless-runner' ? ' m' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label={paused ? 'Resume game' : 'Pause game'}
            disabled={!session || result}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={17} /> : <Pause size={17} />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Restart game"
            disabled={starting || gated || (game.slug === 'word-game' && !!session?.id)}
            onClick={() => void start()}
          >
            <RotateCcw size={17} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={full ? 'Exit fullscreen' : 'Enter fullscreen'}
            onClick={() => void fullscreen()}
          >
            {full ? <Minimize size={17} /> : <Maximize size={17} />}
          </Button>
        </div>
      </div>
      <div className="relative p-5 sm:p-7">
        {gated ? (
          <div className="flex min-h-[390px] flex-col items-center justify-center text-center">
            <div className="mb-5 rounded-2xl bg-[#eee7d5] p-5 text-[#b28b46]">
              <Crown size={32} />
            </div>
            <h2 className="text-2xl font-bold">A sweeter kind of play.</h2>
            <p className="mb-6 mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
              Sweet Shuffle is part of Premium. Unlock every game, boosters, and a happy place
              without ads.
            </p>
            <Button asChild>
              <Link href="/pricing">Explore Premium</Link>
            </Button>
          </div>
        ) : session ? (
          <GameComponent
            key={`${run}:${session.seed}`}
            seed={session.seed}
            paused={paused}
            onScore={scoreChange}
            onEnd={end}
            sessionId={session.id}
            initialGuesses={session.guesses}
            completed={session.completed}
            date={session.date}
            skin={premium ? skin : 'sunset'}
            {...(game.slug === 'connect-4' ? { multiplayer } : {})}
          />
        ) : starting ? (
          loading()
        ) : (
          <div className="flex min-h-[350px] items-center justify-center text-sm text-muted-foreground">
            Your game is taking a little breather.
          </div>
        )}
        {paused && session && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/90 backdrop-blur-sm">
            <h2 className="text-2xl font-bold">Take a little breather.</h2>
            <p className="mb-5 mt-2 text-sm text-muted-foreground">Your game will be right here.</p>
            <Button onClick={() => setPaused(false)}>
              <Play size={16} />
              Keep playing
            </Button>
          </div>
        )}
      </div>
      <div className="border-t border-border px-5 py-3">
        <p role="status" className="text-center text-[11px] text-muted-foreground">
          {status || 'Your next personal best is waiting.'}
        </p>
        {!session && !starting && !gated && (
          <div className="mt-3 text-center">
            <Button size="sm" variant="outline" onClick={() => void start()}>
              Try again
            </Button>
          </div>
        )}
        {pending && (
          <div className="mt-3 text-center">
            <Button variant="outline" size="sm" onClick={() => void submit(pending)}>
              Retry saving score
            </Button>
          </div>
        )}
      </div>
      <Modal
        open={result}
        onOpenChange={setResult}
        title={
          game.slug === 'word-game' ? 'Your daily little victory.' : 'That was a good little break.'
        }
      >
        <div className="py-7 text-center">
          <span className="mb-3 inline-flex rounded-2xl bg-[#f3e9d8] p-4 text-[#bd974e]">
            <Trophy size={30} />
          </span>
          <p className="text-4xl font-extrabold">{score.toLocaleString()}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {game.slug === 'endless-runner' ? 'METERS OF HAPPY' : 'POINTS · NICELY PLAYED'}
          </p>
        </div>
        <p className="mb-5 text-center text-xs text-muted-foreground">{status}</p>
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => {
              setResult(false);
              if (game.slug !== 'word-game') void start();
            }}
          >
            {game.slug === 'word-game' ? 'View & share' : 'One more round'} <RotateCcw size={15} />
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/games">More games</Link>
          </Button>
        </div>
        {!signedIn && !game.localOnly && (
          <Link
            href="/signup"
            className="mt-5 block text-center text-xs font-semibold text-primary"
          >
            Make it official. Save your scores →
          </Link>
        )}
      </Modal>
    </div>
  );
}
