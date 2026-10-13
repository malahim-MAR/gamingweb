import { test, expect } from '@playwright/test';
import { usePinnedThree } from './shooter-fixture';
async function seedGame(page: import('@playwright/test').Page, seed: number) {
  await page.addInitScript((value) => {
    const original = crypto.getRandomValues.bind(crypto);
    Object.defineProperty(crypto, 'getRandomValues', {
      value: (array: Uint32Array) => {
        if (array instanceof Uint32Array && array.length === 1) {
          array[0] = value;
          return array;
        }
        return original(array);
      },
    });
  }, seed);
}
test('new categories, artwork and all five game routes', async ({ page }, info) => {
  test.setTimeout(90000);
  await usePinnedThree(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/games');
  for (const [category, count] of [
    ['Racing', 1],
    ['Board', 2],
    ['Action', 1],
  ] as const) {
    await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption(category);
    await expect(page.locator('article')).toHaveCount(count);
  }
  for (const [slug, name, selector] of [
    ['metro-runner', 'Metro Rush', 'canvas'],
    ['car-racing', 'Sunset Circuit', 'canvas'],
    ['ludo', 'Ludo Lounge', '.ludo-board'],
    ['monopoly', 'Property Club', '.property-board'],
    ['strike-zone', 'Strike Zone', 'iframe'],
  ]) {
    await page.goto(`/games/${slug}`);
    await expect(page.getByRole('heading', { name, exact: true }).first()).toBeVisible();
    await expect(page.locator(selector).first()).toBeVisible({ timeout: 15000 });
    if (slug === 'strike-zone')
      await expect(page.frameLocator('iframe').locator('#menu-status')).toContainText(
        'Arena ready',
        { timeout: 30000 },
      );
    await page.locator(selector).first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(850);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page
      .locator(selector)
      .first()
      .screenshot({
        path: `test-results/${info.project.name}-${slug}.png`,
      });
  }
  expect(errors).toEqual([]);
});
test('new runner starts, changes lanes, pauses and restarts', async ({ page }) => {
  await seedGame(page, 268);
  await page.goto('/games/metro-runner');
  await page.getByRole('button', { name: 'Start running', exact: true }).click();
  const view = page.getByRole('img', { name: /Metro Rush three-lane/ });
  await view.press('ArrowLeft');
  await expect(view).toHaveAttribute('aria-label', /Lane 1/);
  await page.getByRole('button', { name: 'Jump', exact: true }).click();
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  const before = await view.getAttribute('aria-label');
  await page.waitForTimeout(350);
  expect(await view.getAttribute('aria-label')).toBe(before);
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await page.getByRole('button', { name: 'Restart game', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start running', exact: true })).toBeVisible();
});
test('racing touch controls accelerate and brake', async ({ page }) => {
  await seedGame(page, 29);
  await page.goto('/games/car-racing');
  await page.getByRole('button', { name: 'Start racing', exact: true }).click();
  const view = page.getByRole('img', { name: /Sunset Circuit car racing/ });
  const gas = page.getByRole('button', { name: 'Accelerate', exact: true });
  await gas.hover();
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.up();
  await view.focus();
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowUp');
  await expect(view).toHaveAttribute('aria-label', /km\/h/);
  const fast = Number((await view.getAttribute('aria-label'))?.match(/(\d+) km\/h/)?.[1]);
  const brake = page.getByRole('button', { name: 'Brake', exact: true });
  await brake.hover();
  await page.mouse.down();
  await page.waitForTimeout(650);
  await page.mouse.up();
  await expect
    .poll(async () => Number((await view.getAttribute('aria-label'))?.match(/(\d+) km\/h/)?.[1]))
    .toBeLessThan(fast);
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Take a little breather.' })).toBeVisible();
});
test('board games roll and property decisions advance a turn', async ({ page }) => {
  await page.goto('/games/ludo');
  await page.getByRole('button', { name: 'Two players', exact: true }).click();
  await page.getByRole('button', { name: 'Coral: roll dice', exact: true }).click();
  await expect(page.locator('.ludo-board').locator('button')).toHaveCount(8);
  await expect(page.getByRole('status').filter({ hasText: /rolled/ })).toBeVisible();
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await page.goto('/games/monopoly');
  await page.getByRole('button', { name: 'Two players', exact: true }).click();
  await page.getByRole('button', { name: 'Roll dice', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /landed/ })).toBeVisible();
  const buy = page.getByRole('button', { name: /Buy for/ });
  if (await buy.isVisible()) await buy.click();
  await page.getByRole('button', { name: 'End turn →', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /Blue plays next/ })).toBeVisible();
});
test('3D tactical shooter buys, fires, reloads and synchronizes pause', async ({ page }, info) => {
  test.setTimeout(90000);
  await usePinnedThree(page);
  await seedGame(page, 19);
  await page.goto('/games/strike-zone');
  await page.locator('iframe').scrollIntoViewIfNeeded();
  const frame = page.frameLocator('iframe[title="Strike Zone 3D tactical shooter"]');
  await expect(frame.locator('#menu-status')).toContainText('Arena ready', { timeout: 30000 });
  await frame.locator('#difficulty').selectOption('Easy');
  await frame.locator('#touch-setting').check();
  await frame.locator('#play').click();
  const snapshot = await frame
    .locator('body')
    .evaluate(() => (window as any).StrikeZone.snapshot());
  expect(snapshot.actors.filter((a: any) => a.side === 'CT')).toHaveLength(5);
  expect(snapshot.actors).toHaveLength(10);
  await frame.locator('#view').press('KeyB');
  await frame.locator('#view').press('Digit6');
  await frame.locator('#view').press('Digit1');
  await expect(frame.locator('#buy-money')).toHaveText('$150');
  await frame.locator('#view').press('KeyB');
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await expect
    .poll(() => frame.locator('body').evaluate(() => (window as any).StrikeZone.snapshot().paused))
    .toBe(true);
  const before = await frame.locator('#timer').textContent();
  await page.waitForTimeout(400);
  expect(await frame.locator('#timer').textContent()).toBe(before);
  await page.getByRole('button', { name: 'Keep playing', exact: true }).click();
  await page.locator('iframe').scrollIntoViewIfNeeded();
  await expect
    .poll(() => frame.locator('body').evaluate(() => (window as any).StrikeZone.snapshot().phase), {
      timeout: 45000,
    })
    .toBe('active');
  await frame.locator('#fire-button').click();
  await expect(frame.locator('#ammo')).toHaveText('11 / 100');
  await frame.locator('[data-action="reload"]').click();
  await expect(frame.locator('#weapon-name')).toContainText('RELOADING');
  await expect(frame.locator('#ammo')).toHaveText('12 / 99', { timeout: 10000 });
  await frame.locator('#score-button').click();
  await expect(frame.locator('#score-table tbody tr')).toHaveCount(10);
  await frame.locator('#score-close').click();
  await page
    .locator('iframe')
    .screenshot({ path: `test-results/${info.project.name}-strike-active.png` });
});
test('reduced motion disables decorative animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('article')).toHaveCount(10);
  const duration = await page
    .locator('.page-motion')
    .evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.001);
});
