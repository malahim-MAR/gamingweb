import Link from 'next/link';
import { Flame, Trophy, Gamepad2, Crown, Flag, Hash, Shield, ArrowUpRight } from 'lucide-react';
import { requireUser, isPremium } from '@/lib/auth';
import { serverClient } from '@/lib/supabase/server';
import { games } from '@/lib/catalog';
import { BillingButton } from '@/components/billing-button';
import { ProfileControls } from '@/components/profile-controls';
export const metadata = { title: 'Your profile' };
export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await requireUser();
  const db = await serverClient();
  const params = await searchParams;
  const [
    { data: profile },
    { data: scores },
    { data: achievements },
    { data: unlocked },
    { data: subscription },
    { data: skins },
    { data: owned },
    { count: finished },
  ] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).single(),
    db.from('personal_bests').select('score,game_slug').eq('user_id', user.id),
    db.from('achievements').select('*'),
    db.from('user_achievements').select('achievement_id').eq('user_id', user.id),
    db.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
    db.from('skins').select('*'),
    db.from('user_skins').select('skin_id').eq('user_id', user.id),
    db.from('scores').select('*', { head: true, count: 'exact' }).eq('user_id', user.id),
  ]);
  const premium = await isPremium(user.id);
  const visibleSkins = (skins || []).filter(
    (s) => !s.premium || (premium && owned?.some((o) => o.skin_id === s.id)),
  );
  const lastDay = profile?.last_challenge_date;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = lastDay && lastDay >= yesterday ? profile.streak : 0;
  return (
    <div className="layout py-12">
      {params.checkout === 'success' && (
        <div role="status" className="mb-6 rounded-xl bg-[#e5eddf] p-4 text-sm text-[#4d684c]">
          Welcome to a little more happy. Your subscription will appear once Stripe confirms
          payment. Refresh in a moment if it is still processing.
        </div>
      )}
      <div className="mb-9 flex items-center justify-between">
        <div>
          <p className="eyebrow mb-3 text-primary">YOUR LITTLE CORNER</p>
          <h1 className="page-title">Hey, {profile?.username || 'player'}.</h1>
          <p className="mt-4 text-sm text-muted-foreground">Look at all that happy you’ve made.</p>
        </div>
        <span className="hidden h-20 w-20 items-center justify-center rounded-3xl bg-[#dfe8da] text-3xl font-bold text-[#6f8869] sm:flex">
          {(profile?.username || 'P').slice(0, 1).toUpperCase()}
        </span>
      </div>
      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          [Gamepad2, 'Ranked games finished', finished || 0],
          [Flame, 'Current word streak', streak],
          [Trophy, 'Best word streak', profile?.best_streak || 0],
          [Flag, 'Achievements', unlocked?.length || 0],
        ].map(([Icon, label, value]) => {
          const I = Icon as typeof Gamepad2;
          return (
            <div key={String(label)} className="surface p-5">
              <I className="mb-4 text-[#9c9c79]" size={20} />
              <p className="text-3xl font-bold">{String(value)}</p>
              <p className="mt-2 text-xs text-muted-foreground">{String(label)}</p>
            </div>
          );
        })}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <section className="surface p-6">
            <h2 className="mb-5 font-bold">Your personal bests</h2>
            <div className="space-y-4">
              {games.map((g) => {
                const best = Math.max(
                  0,
                  ...(scores || []).filter((s) => s.game_slug === g.slug).map((s) => s.score),
                );
                return (
                  <Link
                    key={g.slug}
                    href={`/games/${g.slug}`}
                    className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <span className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ background: g.color }} />
                      {g.name}
                    </span>
                    <span className="flex items-center gap-3 font-bold">
                      {best.toLocaleString()}
                      <ArrowUpRight size={14} className="text-muted-foreground" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
          <section className="surface p-6">
            <h2 className="mb-5 font-bold">Little milestones</h2>
            <div className="space-y-4">
              {(achievements || []).map((a) => {
                const has = unlocked?.some((u) => u.achievement_id === a.id);
                const Icon = a.icon === 'flame' ? Flame : a.icon === 'hash' ? Hash : Flag;
                return (
                  <div key={a.id} className={`flex items-center gap-4 ${has ? '' : 'opacity-45'}`}>
                    <span className="rounded-xl bg-muted p-3">
                      <Icon size={20} />
                    </span>
                    <div>
                      <p className="text-sm font-bold">
                        {a.name}
                        {has ? ' ✓' : ''}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <section className="rounded-2xl bg-[#303f35] p-6 text-white">
            <Crown className="mb-4 text-[#e3c591]" size={23} />
            <h2 className="text-xl font-bold">
              {premium ? 'Your Premium happy place' : 'Make room for more fun'}
            </h2>
            <p className="my-4 text-xs leading-6 text-[#bcc9bd]">
              {premium
                ? `${subscription?.cancel_at_period_end ? 'Available until' : 'Next billing period ends'} ${new Date(subscription.current_period_end).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })}.`
                : 'Unlock all games, exclusive skins, and an ad-free break.'}
            </p>
            <BillingButton portal={!!subscription?.stripe_customer_id} />
          </section>
          <ProfileControls
            username={profile?.username || 'Player'}
            premium={premium}
            skins={visibleSkins}
          />
          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-xl border border-border p-4 text-sm"
            >
              <Shield size={16} />
              Open admin dashboard
              <ArrowUpRight size={14} className="ml-auto" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
