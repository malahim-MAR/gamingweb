import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <div className="layout py-24 text-center">
      <p className="eyebrow text-primary">A LITTLE LOST?</p>
      <h1 className="page-title mt-4">Let’s find your happy.</h1>
      <p className="mb-7 mt-4 text-sm text-muted-foreground">
        This page has wandered off. There are plenty of good games waiting.
      </p>
      <Button asChild>
        <Link href="/games">Back to the games</Link>
      </Button>
    </div>
  );
}
