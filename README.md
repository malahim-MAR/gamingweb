# Playroom

A Next.js 15 App Router gaming platform with TypeScript, Tailwind CSS, shadcn/ui components, Supabase Auth/Postgres/Realtime, Stripe subscriptions, Zustand preferences, and Zod validation. Ten isolated, lazy-loaded games are included. The supplied Supabase public URL and publishable key are configured in the ignored `.env.local` on this checkout.

## Run locally

Requires Node.js 22 LTS and npm. From this directory:

```sh
npm ci
cp .env.example .env.local
# Fill in your environment variables.
npm run dev
```

On Windows use `Copy-Item .env.example .env.local`. Do not overwrite the existing `.env.local` if it already contains your configuration. Open http://localhost:3000. Guest practice games and the landing page work before the database migration is applied. Ranked games, daily words, stats, and multiplayer require the migration. Match-3 requires Premium.

```sh
npm run typecheck
npm test
npm run build
npm start
```

On this Windows checkout you can also run `powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1`; it finds the portable Node installation used during development. The execution-policy override applies to this invocation only. `npm run test:browser` runs the desktop/mobile Playwright checks against a production build and requires Google Chrome.

To test a production build while the development server is running, use an isolated build directory and port in PowerShell:

```powershell
$env:PLAYROOM_BUILD_DIR = '.next-production'
$env:NEXT_PUBLIC_SITE_URL = 'http://localhost:3001'
npm.cmd run build
$env:PLAYROOM_TEST_PORT = '3001'
$env:PLAYROOM_TEST_ORIGIN = 'http://localhost:3001'
npm.cmd run test:browser -- --workers=1
```

There is no external image, font, or audio asset dependency. Artwork uses SVG, CSS, Canvas, and procedural WebGL geometry. Strike Zone loads integrity-pinned Three.js r128 from cdnjs and therefore needs an internet connection for its 3D library. App icons are checked in.

## Supabase setup

1. Open your Supabase project. Apply both files in `supabase/migrations/` in order using the SQL editor, or use the Supabase CLI:

   ```sh
   supabase login
   supabase link --project-ref kminwwwovknovqshytqa
   supabase db push
   ```

2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The publishable key and the legacy anon JWT are alternative public keys; only one is required. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side, without a `NEXT_PUBLIC_` prefix. The public keys cannot apply migrations or perform privileged writes.
3. Enable email/password Auth and email confirmation. Configure custom SMTP for production deliverability. Set the Auth Site URL to your deployment URL. Add `http://localhost:3000/auth/callback` and your production `/auth/callback` to allowed redirects.
4. Configure Google in Auth > Providers with your Google OAuth client. Add the Supabase callback URL shown in the provider panel to Google's authorized redirects. The app exchanges a PKCE code at `/auth/callback`.
5. For email confirmation, use the Supabase email template link `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. The callback supports token-hash verification and OAuth code exchange.
6. Realtime publication of `match_rooms` is included in the migration. The browser receives room rows only when the signed-in user is a member. Do not expose service-role credentials to the browser.
7. Make your own account an administrator after signing up:

   ```sql
   update public.profiles set role = 'admin'
   where id = 'YOUR_AUTH_USER_UUID';
   ```

   Role and entitlement columns are not writable by a normal client. Admin actions also verify your role in their server route. `/admin` offers game enablement, Premium/featured settings, feature flags, user roles, and seven-day event counts.

The migration creates every requested table, plus private game sessions, atomic rate limits, feature flags, analytics events, and webhook deduplication records. Every table has RLS. Authoritative scores, streaks, entitlements, and multiplayer moves cannot be inserted or updated through direct client table requests. Leaderboard views use `security_invoker` so underlying RLS applies.

## Daily challenge cron

The migration seeds the next 30 days. The Edge Function maintains today's and tomorrow's daily word and resets missed streaks; streak increments are transactional when a ranked daily word is solved. The day boundary is midnight UTC.

```sh
supabase secrets set CRON_SECRET=YOUR_RANDOM_SECRET
supabase functions deploy daily-challenge --no-verify-jwt
```

In Supabase Database > Extensions enable `pg_cron` and `pg_net`. Use the Dashboard Vault interface to create:

- `playroom_cron_secret`: the same random `CRON_SECRET`.
- `playroom_project_url`: your `https://PROJECT.supabase.co` URL.

Run `supabase/cron.sql` once. It schedules the function at 00:01 UTC. The function verifies its own bearer secret and uses Supabase's injected server credentials. Never put cron secrets in a URL or commit them. Test the function via the Dashboard before depending on the schedule.

## Stripe setup

1. In Stripe test mode, create a Premium product with a recurring **USD $4.99/month** price. The marketing page uses that price; change its copy if you configure a different price.
2. Set `STRIPE_SECRET_KEY`, `STRIPE_PREMIUM_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` in the server environment.
3. Enable Customer Portal, including payment method updates and cancellation.
4. Register `https://YOUR_DOMAIN/api/stripe/webhook` for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. For local testing:

   ```sh
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

   Copy the listener's signing secret into `.env.local` and restart the dev server. Complete Checkout with Stripe's test card `4242 4242 4242 4242` and a future expiration date.

Checkout redirects never grant Premium. Only a signature-verified webhook updates the subscription. Webhook processing retrieves the canonical Stripe subscription, applies an atomic event deduplication record, and guards against older event timestamps. Failed webhook processing returns 500 so Stripe retries. Premium requires `active` or `trialing` and an unexpired period. Cancellation retains access through the paid period; `past_due`, `unpaid`, and canceled subscriptions do not grant access.

## Deploy to Vercel

1. Push this repository to GitHub, import it into Vercel, and choose the Next.js framework preset. Node.js 22 is supported. Build command: `npm run build`.
2. Add every variable from `.env.example`. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS deployment origin, without a trailing slash. Never use a preview domain for your production Stripe webhook.
3. Public variables are compiled into the browser bundle; redeploy after changing them. Service-role and Stripe keys must be server-only environment secrets.
4. Apply the Supabase migration, configure redirects and Google, deploy the cron function, and register the production Stripe webhook before launching ranked or paid games.
5. Redeploy, then check signup/confirmation, login, daily-word persistence, score submission, two separate authenticated browsers in a Connect 4 room, Checkout, cancellation, and an attempted non-admin `/api/admin` request.

The runtime does not need a direct Postgres connection. Supabase is accessed through its HTTPS API. Public leaderboards and game settings are cached with Next's `unstable_cache` (30/60 seconds); successful score/admin writes invalidate the appropriate tags. Authenticated data and APIs are not cached in the service worker. Middleware refreshes auth cookies and protects `/profile` and `/admin`; sensitive route handlers also authenticate independently.

## Games and score validation

The five new games below run locally for both guests and signed-in players, without database setup or Premium. Metro Rush, Sunset Circuit, Ludo and Property Club save completed-round best scores in browser local storage. Strike Zone keeps settings and match data in memory and does not write scores to storage. None of these five games submit ranked scores. Ludo and Property Club offer a computer opponent or two players on the same device. Property Club is a simplified Monopoly-style game without auctions, mortgages, houses, or online rooms.

- **Metro Rush:** a forward-facing, three-lane runner. Arrows/WASD switch lanes, jump, and slide. Space jumps. Swipe on the track or use touch buttons. Dodge trains, clear barriers and gates, and collect coins as speed increases.
- **Sunset Circuit:** a perspective highway race over 3 km. Hold arrows/WASD or touch controls to steer, accelerate, and brake. Traffic collisions cost a life; the shoulder slows the car. Three crashes end the race.
- **Ludo Lounge:** two colors with four tokens each, a 52-square track, safe squares, captures, extra rolls on sixes/captures, and exact rolls to finish. Roll and select a highlighted token. Bring all four home to win.
- **Property Club:** a 24-square property board. Roll, buy or pass, collect rent, double rent by completing color groups, and pass GO for $200. Includes chance cards, tax, and jail. Bankruptcy or 24 turns ends the game, with property value included in net worth.
- **Strike Zone — Dustline:** a Three.js 3D, 5v5 tactical bomb-defusal game. Includes T/CT selection, three bot difficulties, 15-second freeze/buy phases, 1:55 rounds, 3-second planting, 40-second bomb fuses, 10-second defusing (5 with a kit), no mid-round respawns, teammate spectating, MR15 halftime, first to 16, and a 15–15 draw at 30 rounds. Loadouts cover knife, USP/Glock, Deagle, MP5, AK/M4, AWP, shotgun, armor, helmet, kit, HE, flash, and smoke. Includes recoil/spread, hit regions, cover penetration, scoped aiming, finite ammo/reloading, acceleration/friction/jumping/crouching, ramps/stairs/fall damage, waypoint A* bots, hearing/vision, radar, kill feed, scoreboard, procedural audio, and pooled visual effects. WASD moves; mouse/pointer lock or drag aims; click fires; R reloads; E interacts; B buys; Ctrl crouches; Shift walks; Tab scores; Esc pauses. Touch controls and basic rebinding are available in the menu.

The complete standalone shooter is `public/strike-zone/index.html`, served at `/strike-zone/index.html` and embedded at `/games/strike-zone`. It contains all CSS, game code, procedural textures/models, and synthesized audio in one file, with the requested external Three.js r128 script. Its simulation runs at 128 Hz with interpolated rendering; 60 FPS is a target dependent on GPU/device performance. The website bridge validates message source/origin and synchronizes external pause/restart. Only the shooter HTML allows same-origin framing and the pinned CDN script; other pages retain their framing restrictions. `tests/tactical-shooter.test.ts` executes the actual simulation extracted from this HTML, rather than a separate duplicate engine.

Browser tests intercept the cdnjs request with the exact integrity-verified r128 bytes in `tests/fixtures/three-r128.min.js`, with its MIT license alongside it, so CDN availability does not affect UI checks. The standalone game itself still uses the requested CDN URL.

All pages have entrance transitions, off-screen scroll reveals, interactive hover/press feedback, and animated game artwork. Dialogs, dice, and selectable Ludo tokens animate. Decorative animations respect `prefers-reduced-motion`; gameplay remains responsive to controls.

- **2048:** arrow keys, WASD, swipe, or direction buttons. Every valid move is recorded and replayed with the server-issued seed; blocked moves consume no randomness. Use Save & finish or play until the board is full.
- **Word Club:** six dictionary-checked guesses. The answer stays server-side until the round ends. Guesses are locked in Postgres, allowing resume and preventing parallel requests from adding extra tries. One ranked attempt per user per UTC day. Practice uses a sample word. Results can be shared without revealing the answer.
- **Cloud Runner:** Space, Up, tap, or click to jump. Fixed 60 Hz simulation, increasing speed, deterministic obstacles. The server replays jump ticks, verifies elapsed time, and rejects play after a collision. Premium skins are persisted as user preferences and entitlements are granted by webhook.
- **Sweet Shuffle:** adjacent swaps with touch or arrow keys/Enter. Thirty moves, three lives, one shuffle and one hammer. Invalid swaps cost a life. The server replays swaps and boosters and derives the score.
- **Four in a Row:** local two-player practice or authenticated room codes. Column buttons, number keys 1–7, or arrows/Enter. Postgres locks the room, checks membership and turn, applies gravity, detects wins, and awards a verified online win. Realtime updates sync both players; heartbeat polling also repairs missed updates. A 90-second disconnect grace period ends abandoned rooms without awarding a win. Active rooms resume after reload.

Guest play does not submit ranked scores. Single-player sessions expire after two hours; the daily word expires at the end of its UTC day. Database-backed rate limits work across server instances and reject requests on failure. Validation prevents invented scores and illegal moves; it is not a proof of human play or a bot-detection system. Global standings compare per-game ranks (100 points for first, 99 for second, etc.), avoiding direct addition of incomparable game scores.

## PWA, accessibility, and analytics

The manifest includes normal and maskable icons. The production service worker caches an isolated offline 2048 shell and public icons only. Ranked APIs, authenticated pages, and payment routes stay online. Install over HTTPS to use offline mode; service workers are disabled during development.

Keyboard controls, touch controls, visible focus, skip navigation, reduced-motion styling, Canvas text alternatives, game-state announcements, and Radix dialogs are included. Both light and dark modes are available. Game metadata, per-game OpenGraph PNGs, robots, and sitemap routes are generated locally.

Authoritative `game_start` and `game_end` events are saved during ranked sessions; `purchase` is recorded after a confirmed paid entitlement. Guest practice is intentionally not tracked. Ad spaces are placeholders: connect your ad provider in the ad component area of `app/games/[slug]/page.tsx` if required. The feature flag removes placements, and Premium suppresses them.

## Project layout

```text
app/                    Pages, metadata, route handlers
components/             Game shell, marketing UI, admin, profile, shadcn/ui
games/<name>/           Isolated Canvas components and shared pure engines
hooks/                  Canvas rendering
lib/                    Supabase, Stripe, auth, API guards, cached queries
store/                  Zustand persisted favorites and skins
types/                  Shared TypeScript types
supabase/migrations/    Schema, RLS, atomic score/room/billing RPCs
supabase/functions/     Daily challenge Edge Function
public/                 PWA offline shell, service worker, icons
tests/                  Engine and security invariants
```

All files are in this repository. No database or live payment setup is claimed complete until the migration, server secrets, provider configuration, and deployment checks above have been completed.
