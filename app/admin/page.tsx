import { requireAdmin } from '@/lib/auth';
import { adminClient } from '@/lib/supabase/server';
import { AdminPanel } from '@/components/admin-panel';
export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export default async function Admin() {
  await requireAdmin();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return (
      <div className="layout py-12">
        <h1 className="page-title">Admin dashboard</h1>
        <p className="mt-6">
          Add SUPABASE_SERVICE_ROLE_KEY to the server environment to enable administration.
        </p>
      </div>
    );
  const db = adminClient();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const [games, flags, users, players, starts, ends, purchases] = await Promise.all([
    db.from('games').select('*').order('name'),
    db.from('feature_flags').select('*'),
    db
      .from('profiles')
      .select('id,username,role,created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('profiles').select('*', { head: true, count: 'exact' }),
    ...['game_start', 'game_end', 'purchase'].map((event) =>
      db
        .from('analytics_events')
        .select('*', { head: true, count: 'exact' })
        .eq('event', event)
        .gte('created_at', since),
    ),
  ]);
  return (
    <div className="layout py-12">
      <p className="eyebrow mb-3 text-primary">BEHIND THE GOOD TIMES</p>
      <h1 className="page-title">Admin dashboard</h1>
      <p className="mt-3 text-sm text-muted-foreground">Manage the room. Keep the happy running.</p>
      <div className="mb-7 mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Total players', players.count],
          ['Game starts · 7 days', starts.count],
          ['Games finished · 7 days', ends.count],
          ['New purchases · 7 days', purchases.count],
        ].map(([label, count]) => (
          <div className="surface p-5" key={String(label)}>
            <p className="text-3xl font-bold">{Number(count || 0).toLocaleString()}</p>
            <p className="mt-2 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <AdminPanel games={games.data || []} flags={flags.data || []} users={users.data || []} />
    </div>
  );
}
