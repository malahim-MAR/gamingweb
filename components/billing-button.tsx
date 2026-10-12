'use client';
import { useState } from 'react';
import { Loader2, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function BillingButton({
  portal = false,
  className = '',
}: {
  portal?: boolean;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function checkout() {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch(`/api/stripe/${portal ? 'portal' : 'checkout'}`, { method: 'POST' });
      const data = await res.json();
      if (res.status === 401) {
        window.location.assign(`/login?next=${portal ? '/profile' : '/pricing'}`);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      if (
        typeof data.url !== 'string' ||
        !/^https:\/\/(checkout\.stripe\.com|billing\.stripe\.com)\//.test(data.url)
      )
        throw new Error('Invalid payment URL.');
      window.location.assign(data.url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Please try again.');
      setBusy(false);
    }
  }
  return (
    <div className={className}>
      <Button onClick={() => void checkout()} disabled={busy} className="w-full">
        {busy ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            {portal ? 'Manage subscription' : 'Make room for more fun'}
            <ArrowUpRight size={16} />
          </>
        )}
      </Button>
      {message && (
        <p role="status" className="mt-3 text-xs leading-5">
          {message}
        </p>
      )}
    </div>
  );
}
