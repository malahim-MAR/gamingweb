import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFile } from 'node:fs/promises';
let db: PGlite;
const A = '11111111-1111-4111-8111-111111111111',
  B = '22222222-2222-4222-8222-222222222222',
  C = '33333333-3333-4333-8333-333333333333';
async function asUser(id: string) {
  await db.exec(
    `reset role;select set_config('request.jwt.claim.sub','${id}',false);set role authenticated;`,
  );
}
async function asServer() {
  await db.exec('reset role;');
}
beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;create publication supabase_realtime;`,
  );
  for (const migration of ['001_platform.sql', '002_stats_and_room_guards.sql'])
    await db.exec(
      await readFile(new URL(`../supabase/migrations/${migration}`, import.meta.url), 'utf8'),
    );
  await db.exec(
    `insert into auth.users(id,email) values('${A}','alice@example.com'),('${B}','bob@example.com'),('${C}','carol@example.com');`,
  );
}, 60000);
afterAll(async () => {
  await db?.close();
});
describe('Postgres migration, RLS, and transactional invariants', () => {
  it('enables RLS on every application table', async () => {
    const { rows } = await db.query<{ relname: string }>(
      "select relname from pg_class c join pg_namespace n on c.relnamespace=n.oid where n.nspname='public' and c.relkind='r' and not c.relrowsecurity",
    );
    expect(rows).toEqual([]);
  });
  it('prevents direct score writes, role escalation, and private answer/session reads', async () => {
    await asUser(A);
    await expect(
      db.exec(`insert into scores(user_id,game_slug,score) values('${A}','2048',999999);`),
    ).rejects.toThrow('permission denied');
    await expect(db.exec(`update profiles set role='admin' where id='${A}';`)).rejects.toThrow(
      'permission denied',
    );
    await expect(db.exec('select solution from daily_challenges;')).rejects.toThrow(
      'permission denied',
    );
    await expect(db.exec('select * from game_sessions;')).rejects.toThrow('permission denied');
    await expect(
      db.exec(`select complete_run(gen_random_uuid(),'${A}',100,true);`),
    ).rejects.toThrow('permission denied');
    await asServer();
  });
  it('allows only the owner to edit their player name', async () => {
    await asUser(A);
    await db.exec(
      `update profiles set username='Alice' where id='${A}';update profiles set username='Hacked' where id='${B}';`,
    );
    await asServer();
    const { rows } = await db.query<{ username: string }>(
      'select username from profiles where id=$1',
      [B],
    );
    expect(rows[0].username).not.toBe('Hacked');
  });
  it('deduplicates completed runs and increments streak only once', async () => {
    await asServer();
    const { rows } = await db.query<{ id: string }>(
      `insert into game_sessions(user_id,game_slug,seed,challenge_date) values($1,'word-game',1,(now() at time zone 'UTC')::date) returning id`,
      [A],
    );
    const id = rows[0].id;
    await db.query('select complete_run($1,$2,600,true)', [id, A]);
    await db.query('select complete_run($1,$2,600,true)', [id, A]);
    const scores = await db.query<{ count: number }>(
      'select count(*)::integer as count from scores where session_id=$1',
      [id],
    );
    expect(scores.rows[0].count).toBe(1);
    const p = await db.query<{ streak: number }>('select streak from profiles where id=$1', [A]);
    expect(p.rows[0].streak).toBe(1);
  });
  it('deduplicates payment events and prevents old events reverting entitlement', async () => {
    const args = [A, 'cus_test', 'sub_test'];
    await db.query(
      `select apply_subscription_event('evt_new',100,$1,$2,$3,'active',now()+interval '1 month',false)`,
      args,
    );
    await db.query(
      `select apply_subscription_event('evt_old',90,$1,$2,$3,'canceled',now(),false)`,
      args,
    );
    const again = await db.query<{ applied: boolean }>(
      `select apply_subscription_event('evt_new',100,$1,$2,$3,'active',now()+interval '1 month',false) as applied`,
      args,
    );
    expect(again.rows[0].applied).toBe(false);
    const s = await db.query<{ status: string }>(
      'select status from subscriptions where user_id=$1',
      [A],
    );
    expect(s.rows[0].status).toBe('active');
    await asUser(B);
    const hidden = await db.query('select * from subscriptions where user_id=$1', [A]);
    expect(hidden.rows).toEqual([]);
    await asServer();
  });
  it('creates private rooms, rejects out-of-turn moves, and records a win exactly once', async () => {
    await asUser(A);
    const created = await db.query<{ id: string; code: string }>(
      'select id,code from create_match_room()',
    );
    const room = created.rows[0];
    await asUser(B);
    await db.query('select join_match_room($1)', [room.code]);
    await expect(db.query('select play_match_move($1,0)', [room.id])).rejects.toThrow(
      'not your turn',
    );
    await asUser(C);
    const hidden = await db.query('select * from match_rooms where id=$1', [room.id]);
    expect(hidden.rows).toEqual([]);
    await expect(db.query('select play_match_move($1,0)', [room.id])).rejects.toThrow('member');
    for (let i = 0; i < 7; i++) {
      await asUser(i % 2 === 0 ? A : B);
      await db.query('select play_match_move($1,$2)', [room.id, i % 2 === 0 ? 0 : 1]);
    }
    await asServer();
    const r = await db.query<{ status: string; winner_id: string }>(
      'select status,winner_id from match_rooms where id=$1',
      [room.id],
    );
    expect(r.rows[0]).toEqual({ status: 'finished', winner_id: A });
    const score = await db.query<{ score: number }>(
      'select score from scores where room_id=$1 order by score desc',
      [room.id],
    );
    expect(score.rows).toEqual([{ score: 100 }, { score: 0 }]);
    await asUser(B);
    await expect(db.query('select play_match_move($1,2)', [room.id])).rejects.toThrow(
      'Invalid move',
    );
    await asServer();
  });
  it('limits guesses transactionally and cannot add a seventh guess', async () => {
    const { rows } = await db.query<{ id: string }>(
      `insert into game_sessions(user_id,game_slug,seed,challenge_date) values($1,'word-game',1,(now() at time zone 'UTC')::date) returning id`,
      [B],
    );
    for (let i = 0; i < 6; i++)
      await db.query('select record_word_guess($1,$2,$3)', [rows[0].id, B, 'ZZZZZ']);
    await expect(
      db.query('select record_word_guess($1,$2,$3)', [rows[0].id, B, 'ZZZZZ']),
    ).rejects.toThrow('No guesses');
  });
  it('enforces distributed rate limits and disabled multiplayer even on direct RPC calls', async () => {
    const one = await db.query<{ ok: boolean }>("select consume_rate_limit('test',1,60) as ok");
    const two = await db.query<{ ok: boolean }>("select consume_rate_limit('test',1,60) as ok");
    expect(one.rows[0].ok).toBe(true);
    expect(two.rows[0].ok).toBe(false);
    await db.exec("update feature_flags set enabled=false where key='multiplayer'");
    await asUser(A);
    await expect(db.exec('select create_match_room()')).rejects.toThrow('unavailable');
    await asServer();
  });
});
