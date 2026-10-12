'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
export function PageMotion({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = host.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.classList.add('motion-visible');
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    const seen = new WeakSet<Element>();
    const watch = () =>
      root.querySelectorAll('section, .game-card, .surface, .empty').forEach((el, i) => {
        if (seen.has(el)) return;
        seen.add(el);
        // Only prepare off-screen elements, so first paint and keyboard access remain immediate.
        if (el.getBoundingClientRect().top > window.innerHeight) {
          el.classList.add('motion-reveal');
          (el as HTMLElement).style.setProperty(
            '--reveal-delay',
            `${Math.min((i % 5) * 45, 180)}ms`,
          );
          observer.observe(el);
        }
      });
    watch();
    const mutations = new MutationObserver(watch);
    mutations.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [path]);
  return (
    <div ref={host} key={path} className="page-motion">
      {children}
    </div>
  );
}
