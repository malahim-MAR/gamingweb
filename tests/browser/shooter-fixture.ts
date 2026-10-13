import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from '@playwright/test';

// Exact, integrity-verified r128 bytes; the shipped game continues to use cdnjs.
const three = readFileSync(resolve(process.cwd(), 'tests/fixtures/three-r128.min.js'));
export async function usePinnedThree(page: Page) {
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: three,
    }),
  );
}
