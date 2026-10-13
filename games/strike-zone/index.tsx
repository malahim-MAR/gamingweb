'use client';
import { useEffect, useRef } from 'react';
import type { GameProps } from '@/types';

export default function StrikeZone({ seed, paused, onScore, onEnd }: GameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const confirmedPause = useRef<boolean | null>(null);
  const latest = useRef({ paused, onScore, onEnd });
  latest.current = { paused, onScore, onEnd };
  function synchronize() {
    frame.current?.contentWindow?.postMessage(
      { type: 'strike-zone:pause', paused: latest.current.paused },
      window.location.origin,
    );
  }
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow)
        return;
      const data = event.data;
      if (data?.type === 'strike-zone:ready') synchronize();
      if (data?.type === 'strike-zone:pause-state' && typeof data.paused === 'boolean')
        confirmedPause.current = data.paused;
      if (typeof data?.score !== 'number' || !Number.isFinite(data.score) || data.score < 0) return;
      if (data.type === 'strike-zone:score') latest.current.onScore(Math.floor(data.score));
      if (data.type === 'strike-zone:end') latest.current.onEnd(Math.floor(data.score), []);
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    confirmedPause.current = null;
    synchronize();
    const timer = window.setInterval(() => {
      if (confirmedPause.current !== latest.current.paused) synchronize();
    }, 250);
    return () => window.clearInterval(timer);
  }, [paused]);
  return (
    <div>
      <iframe
        ref={frame}
        title="Strike Zone 3D tactical shooter"
        src={`/strike-zone/index.html?seed=${seed}`}
        className="block w-full rounded-2xl border-0 bg-[#14232b]"
        style={{ height: 'clamp(620px, 78vh, 800px)' }}
        sandbox="allow-scripts allow-same-origin allow-pointer-lock"
        allow="fullscreen"
        allowFullScreen
        onLoad={synchronize}
      />
      <p className="mt-3 text-center text-xs leading-6 text-muted-foreground">
        WASD moves · Mouse / drag aims · Click fires · R reloads · E plants / defuses · B buys
        <br />
        Space jumps · Ctrl crouches · Shift walks · Tab shows scores · Esc pauses
      </p>
      <a
        href="/strike-zone/index.html"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-center text-xs font-semibold text-primary"
      >
        Open the full-screen standalone game ↗
      </a>
    </div>
  );
}
