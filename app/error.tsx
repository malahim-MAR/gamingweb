'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="layout py-24 text-center">
      <h1 className="page-title">A little hiccup.</h1>
      <p className="mb-7 mt-4 text-sm text-muted-foreground">
        Something didn’t load. Give it another try.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
