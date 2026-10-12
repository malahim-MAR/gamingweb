'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Check } from 'lucide-react';
import { browserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { usePreferences } from '@/store/preferences';
export function ProfileControls({
  username,
  premium,
  skins,
}: {
  username: string;
  premium: boolean;
  skins: { id: string; name: string; color: string }[];
}) {
  const [name, setName] = useState(username);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const { skin, setSkin } = usePreferences();
  const router = useRouter();
  async function save() {
    if (name.trim().length < 2 || name.trim().length > 24) {
      setMessage('Use a name between 2 and 24 characters.');
      return;
    }
    setBusy(true);
    const db = browserClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    const { error } = await db
      .from('profiles')
      .update({ username: name.trim() })
      .eq('id', user?.id);
    setBusy(false);
    setMessage(error ? error.message : 'Your player name is saved.');
    router.refresh();
  }
  return (
    <section className="surface p-6">
      <h2 className="mb-5 font-bold">Make it yours</h2>
      <label className="block text-xs font-semibold">Player name</label>
      <div className="mt-2 flex gap-2">
        <input
          className="field"
          aria-label="Player name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={24}
        />
        <Button variant="outline" disabled={busy} onClick={() => void save()}>
          Save
        </Button>
      </div>
      <p className="mt-3 text-xs" role="status">
        {message}
      </p>
      <h3 className="mb-3 mt-6 text-xs font-semibold">
        Cloud Runner skin {premium ? '' : '· Premium unlocks more'}
      </h3>
      <div className="flex flex-wrap gap-2">
        {skins.map((s) => (
          <button
            key={s.id}
            className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${skin === s.id ? 'border-primary' : 'border-border'}`}
            onClick={() => setSkin(s.id)}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-lg text-white"
              style={{ background: s.color }}
            >
              {skin === s.id && <Check size={12} />}
            </span>
            {s.name}
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-6"
        onClick={async () => {
          const res = await fetch('/auth/signout', { method: 'POST' });
          if (res.ok) {
            router.push('/');
            router.refresh();
          } else setMessage('Unable to sign out. Please try again.');
        }}
      >
        <LogOut size={14} />
        Log out
      </Button>
    </section>
  );
}
