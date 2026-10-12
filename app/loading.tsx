export default function Loading() {
  return (
    <div className="layout py-14" aria-label="Loading" role="status">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
      <div className="mt-6 h-[350px] animate-pulse rounded-3xl bg-muted" />
      <p className="sr-only">Loading your happy place…</p>
    </div>
  );
}
