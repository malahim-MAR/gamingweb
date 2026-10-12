'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
type GameRow = {
  slug: string;
  name: string;
  enabled: boolean;
  premium: boolean;
  featured: boolean;
  plays: number;
};
type UserRow = { id: string; username: string; role: string; created_at: string };
export function AdminPanel({
  games,
  flags,
  users,
}: {
  games: GameRow[];
  flags: { key: string; enabled: boolean }[];
  users: UserRow[];
}) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function update(body: unknown) {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('Change saved. Public caches refresh within 60 seconds.');
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <p role="status" className="text-sm">
        {message}
      </p>
      <section className="surface overflow-x-auto p-6">
        <h2 className="mb-5 font-bold">Games</h2>
        <table className="w-full min-w-[550px] text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {['Game', 'Plays', 'Enabled', 'Premium', 'Featured'].map((s) => (
                <th className="pb-3" key={s}>
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.slug} className="border-b border-border last:border-0">
                <td className="py-4 font-semibold">{g.name}</td>
                <td>{g.plays.toLocaleString()}</td>
                {(['enabled', 'premium', 'featured'] as const).map((key) => (
                  <td key={key}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#ec633c]"
                      checked={g[key]}
                      disabled={busy}
                      aria-label={`${g.name} ${key}`}
                      onChange={(e) => void update({ kind: 'game', ...g, [key]: e.target.checked })}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="surface p-6">
        <h2 className="mb-5 font-bold">Feature flags</h2>
        <div className="flex flex-wrap gap-6">
          {flags.map((f) => (
            <label key={f.key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#ec633c]"
                disabled={busy}
                checked={f.enabled}
                onChange={(e) =>
                  void update({ kind: 'flag', key: f.key, enabled: e.target.checked })
                }
              />
              {f.key}
            </label>
          ))}
        </div>
      </section>
      <section className="surface overflow-x-auto p-6">
        <h2 className="mb-5 font-bold">
          Players{' '}
          <span className="text-xs font-normal text-muted-foreground">· most recent 100</span>
        </h2>
        <table className="w-full min-w-[450px] text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="pb-3">Player</th>
              <th>Joined</th>
              <th>Role</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="py-4 font-semibold">{u.username}</td>
                <td>{new Date(u.created_at).toLocaleDateString('en-US', { timeZone: 'UTC' })}</td>
                <td>{u.role}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      void update({
                        kind: 'user',
                        id: u.id,
                        role: u.role === 'admin' ? 'user' : 'admin',
                      })
                    }
                  >
                    {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
