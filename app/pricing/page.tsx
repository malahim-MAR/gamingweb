import Link from 'next/link';
import { Check, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BillingButton } from '@/components/billing-button';
export const metadata = {
  title: 'Premium',
  description:
    'Make room for more fun. Unlock all Playroom games, exclusive skins, boosters, and an ad-free experience for $4.99 per month.',
};
export default function Pricing() {
  return (
    <div className="layout py-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="pill text-[#a08b54]">
          <Sparkles size={13} />A LITTLE EXTRA JOY
        </span>
        <h1 className="page-title mt-5">Your break, with a little more.</h1>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          Start with a little free fun. Stay for a whole room of possibilities.
          <br className="hidden sm:block" />
          Simple plans. More happy.
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-[820px] gap-6 md:grid-cols-2">
        <section className="surface p-8">
          <p className="eyebrow text-muted-foreground">EVERYDAY PLAY</p>
          <h2 className="mt-3 text-2xl font-bold">Free</h2>
          <p className="mt-5">
            <span className="text-5xl font-bold tracking-tight">$0</span>
            <span className="ml-2 text-sm text-muted-foreground">forever</span>
          </p>
          <p className="mb-7 mt-4 text-sm text-muted-foreground">
            A good time, whenever you need it.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/signup">Join the fun</Link>
          </Button>
          <ul className="mt-8 space-y-4">
            {[
              'Four free games',
              'Daily Word Club challenge',
              'Verified scores & leaderboards',
              'Private multiplayer rooms',
              'Your stats, streaks & achievements',
              'Supported by ad spaces',
            ].map((s) => (
              <li className="flex items-center gap-3 text-xs" key={s}>
                <Check size={16} className="shrink-0 text-[#7d9c79]" />
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section className="relative rounded-2xl border-2 border-[#d8b97b] bg-card p-8">
          <span className="absolute -top-3 right-6 rounded-full bg-[#e5c58b] px-3 py-1 text-[9px] font-bold tracking-widest text-[#574428]">
            MORE GOOD TIMES
          </span>
          <p className="eyebrow flex items-center gap-2 text-[#b08e4d]">
            <Crown size={13} />
            ALL-ACCESS HAPPY
          </p>
          <h2 className="mt-3 text-2xl font-bold">Premium</h2>
          <p className="mt-5">
            <span className="text-5xl font-bold tracking-tight">$4.99</span>
            <span className="ml-2 text-sm text-muted-foreground">/ month</span>
          </p>
          <p className="mb-7 mt-4 text-sm text-muted-foreground">
            Make every little break a better one.
          </p>
          <BillingButton />
          <ul className="mt-8 space-y-4">
            {[
              'Every game, including Sweet Shuffle',
              'An entirely ad-free experience',
              'Exclusive Cloud Runner skins',
              'Shuffle & hammer boosters',
              'Everything in the Free plan',
              'Cancel anytime in your billing portal',
            ].map((s) => (
              <li className="flex items-center gap-3 text-xs" key={s}>
                <Check size={16} className="shrink-0 text-[#b08e4d]" />
                {s}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Billed monthly in USD. Secure checkout with Stripe. Taxes may apply.
      </p>
      <div className="mx-auto mt-14 max-w-[820px]">
        <h2 className="section-title mb-6 text-center">A few things you might wonder.</h2>
        {[
          [
            'Can I play without an account?',
            'Of course. Free games are open for practice. Create a free account to save your scores, play the daily word, and invite a friend online.',
          ],
          [
            'How do I cancel?',
            'Open your profile and choose Manage subscription. Cancel anytime; you keep Premium until the end of your paid period.',
          ],
          [
            'Do I need to download anything?',
            'Nope. Play right in your browser on your phone, tablet, or computer. You can also add Playroom to your home screen.',
          ],
          [
            'What happens if I’m offline?',
            'Your installed app keeps an offline 2048 practice game ready. Ranked scores and online games need an internet connection.',
          ],
        ].map(([q, a]) => (
          <details key={q} className="border-b border-border py-5">
            <summary className="cursor-pointer text-sm font-semibold">{q}</summary>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
