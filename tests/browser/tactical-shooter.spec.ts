import { test, expect } from '@playwright/test';
import { usePinnedThree } from './shooter-fixture';

test('standalone 3D game loads pinned Three.js and uses memory-only settings', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await usePinnedThree(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Shooter attempted storage read');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Shooter attempted storage write');
    };
  });
  await page.goto('/strike-zone/index.html');
  await expect(page.locator('#menu-status')).toContainText('Arena ready', { timeout: 30000 });
  expect(await page.evaluate(() => (window as any).THREE.REVISION)).toBe('128');
  await page.locator('#side').selectOption('T');
  await page.locator('#difficulty').selectOption('Hard');
  if (info.project.name === 'mobile') await page.locator('#touch-setting').check();
  await page.locator('#play').click();
  const snapshot = await page.evaluate(() => (window as any).StrikeZone.snapshot());
  expect(snapshot.actors[0].side).toBe('T');
  expect(snapshot.actors[0].active).toBe('glock');
  expect(snapshot.bomb.owner).toBe(0);
  expect(snapshot.phase).toBe('freeze');
  if (info.project.name === 'desktop') {
    await expect
      .poll(() => page.evaluate(() => document.pointerLockElement?.id), { timeout: 10000 })
      .toBe('view');
    await page.keyboard.press('Escape');
  } else await page.locator('#pause-button').click();
  await expect(page.locator('#pause-menu')).toBeVisible();
  await page.locator('#return-menu').click();
  await expect(page.locator('#side')).toHaveValue('T');
  await expect(page.locator('#difficulty')).toHaveValue('Hard');
  await page.screenshot({ path: `test-results/${info.project.name}-tactical-menu.png` });
  expect(errors).toEqual([]);
});

test('shooting iframe has scoped security headers and ignores forged parent scores', async ({
  page,
  request,
}) => {
  await usePinnedThree(page);
  const asset = await request.get('/strike-zone/index.html');
  expect(asset.ok()).toBe(true);
  expect(asset.headers()['x-frame-options']).toBe('SAMEORIGIN');
  expect(asset.headers()['content-security-policy']).toContain("frame-ancestors 'self'");
  expect(asset.headers()['content-security-policy']).toContain('https://cdnjs.cloudflare.com');
  const root = await request.get('/');
  expect(root.headers()['x-frame-options']).toBe('DENY');
  expect(root.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  await page.goto('/games/strike-zone');
  await expect(page.locator('iframe')).toBeVisible();
  await page.evaluate(() =>
    window.postMessage({ type: 'strike-zone:score', score: 999999 }, window.location.origin),
  );
  await expect(page.locator('main').getByText('999,999', { exact: true })).toHaveCount(0);
});
