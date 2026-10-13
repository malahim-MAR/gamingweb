# Verification

Latest local verification performed on October 13, 2026:

Strike Zone 3D update:

- Replaced the wave-based raycast shooter with `public/strike-zone/index.html`, a complete standalone Three.js r128 tactical shooter embedded in the game route. Verified the actual CDN build in Chrome, then used integrity-verified copies of the same r128 bytes for deterministic browser checks. The fixture includes its MIT license.
- Final production build and TypeScript validation passed. All 53 simulation/database tests passed. Shooter tests execute the actual HTML simulation and validate 5v5 teams, freeze phases, plant/defuse timing, kits, elimination rules, bomb/round timeouts, halftime, match endings, money limits, buying, hitboxes/armor, penetration, recoil/reloading, grenade effects, bot perception/navigation, collision/ramp movement and fall damage.
- All 32 distinct desktop/mobile browser checks passed across the full suite and targeted reruns. The targeted checks cover the embedded buy/fire/reload/scoreboard/pause flow, native desktop pointer lock/Esc, touch controls, memory-only standalone settings, scoped framing/CDN headers, and rejection of forged parent scores. The final embedded pause tests passed on desktop and mobile after adding pause-state acknowledgement/retries.
- Retained the other nine games and existing platform behavior. Strike Zone does not persist settings or scores. Its standalone runtime uses a fixed 128 Hz simulation, interpolated rendering and pooled shot effects. A 60 FPS render rate is a device-dependent target, not a measured guarantee across hardware.

Earlier ten-game catalog update:

- Added five locally playable games: Metro Rush, Sunset Circuit, Ludo Lounge, Property Club, and Strike Zone. Keyboard/touch controls, pause/restart, computer/local board-game modes, and local best scores are implemented. New games do not submit ranked scores.
- The final production build passed with TypeScript validation. Production QA used `.next-production` on port 3001 alongside the existing development server.
- All 36 Vitest engine/database tests passed, including new runner/racing collisions, Ludo safe squares/captures/exact finish, property purchases/rent/bankruptcy/jail, and FPS raycasting/cover/pathfinding/reloading/waves.
- All 28 distinct desktop/mobile Playwright checks passed: 27 passed in the final full run, and the remaining desktop catalog/all-game-route check passed on a targeted rerun after allowing 15 seconds for a cold lazy-loaded game chunk. Controls use deterministic test seeds to avoid random collisions during UI checks.
- Inspected desktop/mobile game screenshots and the active first-person arena. Verified responsive layouts, category filters, reduced-motion behavior, pause/restart, steering/braking, dice/property decisions, and both touch-button and keyboard firing/reloading.

Earlier platform verification on October 12, 2026:

- Next.js 15.5.27 production build passed, including TypeScript validation.
- 17 engine and PostgreSQL tests passed under Vitest. PostgreSQL tests apply both migrations to PGlite with Supabase-style roles and `auth.uid()`, then verify RLS, protected columns, private answers, score and webhook deduplication, streak updates, turn enforcement, winning moves, guess limits, and feature flags.
- 16 Playwright checks passed in desktop Chrome and a mobile Chromium viewport. They cover landing/catalog filters, responsive layout, 2048 controls and pause, word completion/sharing, local Connect 4 wins, runner game-over, Premium gating, auth redirects, origin rejection, metadata, dark mode, and the offline shell.
- `npm audit` reported zero vulnerabilities across runtime and development dependencies.
- After the final auth changes, the production build passed again and all four targeted desktop/mobile game-access and auth-guard checks passed.

The Supabase project migrations were not applied remotely. No service-role key, Stripe secrets, or privileged deployment credentials were provided. Live email confirmation, Google OAuth, ranked score persistence against the hosted project, two authenticated Realtime clients, Stripe Checkout/Portal/webhook delivery, the scheduled Edge Function, and Vercel deployment still require the configuration and live checks in README.md. Local tests verify the code and database logic; they do not claim those external services have been activated.
