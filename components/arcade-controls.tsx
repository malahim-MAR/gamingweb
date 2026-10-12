'use client';
import { Button } from '@/components/ui/button';
export function HoldControl({
  code,
  label,
  children,
  hold,
  disabled,
}: {
  code: string;
  label: string;
  children: React.ReactNode;
  hold: (code: string, down: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={label}
      disabled={disabled}
      className="touch-none select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        hold(code, true);
      }}
      onPointerUp={() => hold(code, false)}
      onPointerCancel={() => hold(code, false)}
      onLostPointerCapture={() => hold(code, false)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') hold(code, true);
      }}
      onKeyUp={() => hold(code, false)}
      onBlur={() => hold(code, false)}
    >
      {children}
    </Button>
  );
}
export function ArcadeStart({
  title,
  detail,
  start,
  label = 'Start game',
}: {
  title: string;
  detail: string;
  start: () => void;
  label?: string;
}) {
  return (
    <div className="arcade-start absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#142e32]/75 p-5 text-center text-white backdrop-blur-sm">
      <span className="mb-3 text-[10px] font-bold uppercase tracking-[3px] text-[#f4ca68]">
        READY WHEN YOU ARE
      </span>
      <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
      <p className="mb-6 mt-3 max-w-sm text-sm leading-6 text-white/80">{detail}</p>
      <Button onClick={start}>{label}</Button>
    </div>
  );
}
