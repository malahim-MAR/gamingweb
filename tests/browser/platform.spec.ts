import { test, expect } from '@playwright/test';
test('landing, filters, and responsive layout', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little play. A lot of happy.' })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(5);
  await page.getByRole('button', { name: 'Arcade', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Cloud Runner' })).toBeVisible();
  await page.getByRole('button', { name: 'All games', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: `test-results/${info.project.name}-home.png`, fullPage: true });
  expect(errors).toEqual([]);
});
test('catalog search and premium filter', async ({ page }) => {
  await page.goto('/games');
  await page.getByRole('textbox', { name: 'Search games' }).fill('word');
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Word Club' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search games' }).fill('');
  await page.getByRole('combobox', { name: 'Free or premium' }).selectOption('Premium');
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Sweet Shuffle' })).toBeVisible();
});
test('2048 keyboard, pause, touch buttons, and game result', async ({ page }) => {
  await page.goto('/games/2048');
  await expect(page.getByRole('img', { name: /2048 board/ })).toBeVisible();
  const canvas = page.locator('canvas').first();
  await canvas.focus();
  for (const key of ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp']) await canvas.press(key);
  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.getByRole('heading', { name: 'Take a little breather.' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep playing' }).click();
  await page.getByRole('button', { name: 'Move left', exact: true }).click();
  await page.getByRole('button', { name: 'Save & finish' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'One more round' })).toBeVisible();
});
test('daily word guest practice and share result', async ({ page }) => {
  await page.goto('/games/word-game');
  await expect(page.getByRole('img', { name: /Word Club board/ })).toBeVisible();
  for (const letter of 'CRANE')
    await page.getByRole('button', { name: letter, exact: true }).click();
  await page.getByRole('button', { name: 'Submit guess', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('600', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View & share' }).click();
  await expect(page.getByRole('button', { name: 'Share your result' })).toBeVisible();
});
test('local Connect 4 detects a winning board', async ({ page }) => {
  await page.goto('/games/connect-4');
  await expect(page.getByRole('img', { name: /Connect 4/ })).toBeVisible();
  for (let i = 0; i < 7; i++)
    await page
      .getByRole('button', { name: `Drop in column ${i % 2 === 0 ? 1 : 2}`, exact: true })
      .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('100', { exact: true })).toBeVisible();
});
test('runner completes and premium game is gated', async ({ page }) => {
  await page.goto('/games/endless-runner');
  await expect(page.getByRole('img', { name: /Cloud Runner/ })).toBeVisible();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
  await page.goto('/games/match-3');
  await expect(page.getByRole('heading', { name: 'A sweeter kind of play.' })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
});
test('auth guards, billing sign-in, and metadata', async ({ page, request }) => {
  await page.goto('/profile');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Welcome back, player.' })).toBeVisible();
  await page.goto('/pricing');
  await page.getByRole('button', { name: 'Make room for more fun' }).click();
  await expect(page).toHaveURL(/\/login/);
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain('/games/2048');
  const manifest = await request.get('/manifest.webmanifest');
  expect((await manifest.json()).short_name).toBe('Playroom');
  const api = await request.post('/api/scores', {
    headers: { origin: 'http://localhost:3000' },
    data: { score: 999999 },
  });
  expect(api.status()).toBe(401);
  const forged = await request.post('/api/admin', {
    headers: { origin: 'https://untrusted.example' },
    data: { kind: 'user', role: 'admin' },
  });
  expect(forged.status()).toBe(403);
});
test('dark mode and offline practice shell', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
          once: true,
        });
      });
    }
  });
  await context.setOffline(true);
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'A little offline happy.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fresh start' })).toBeVisible();
  await page.getByRole('button', { name: 'Move left' }).click();
  await expect(page.getByRole('img', { name: /2048 offline practice/ })).toBeVisible();
  await context.setOffline(false);
});
