import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

for (const path of ['/', '/privacy/', '/terms/']) {
  test(`${path} has a clean accessible structure`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/Diagnostic Packet/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}

test('demo works by pointer and keyboard', async ({ page }) => {
  await page.goto('/#demo');
  const capture = page.getByRole('tab', { name: /Capture/ });
  await capture.click();
  await expect(capture).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#demo-status')).toContainText('redacted');
  await capture.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Inspect/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('button', { name: 'Test an unsafe path' }).click();
  await expect(page.getByRole('alert')).toContainText('leaves the project directory');
});

test('mobile layout does not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('img[alt]')).toBeVisible();
});

test('production shell reloads offline after service worker activation', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const cachedShell = await page.evaluate(async () => {
    const script = document.querySelector<HTMLScriptElement>('script[type="module"]');
    const cached = script ? await caches.match(script.src) : undefined;
    return { script: script?.src, cacheKeys: await caches.keys(), contentType: cached?.headers.get('content-type') };
  });
  expect(cachedShell.script).toContain('/assets/main-');
  expect(cachedShell.cacheKeys).toHaveLength(1);
  expect(cachedShell.contentType).toContain('javascript');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A bug report they can replay.');
  await expect(page.locator('#demo-output')).toContainText('Preview completed');
  expect(consoleErrors).toEqual([]);
  await context.close();
});

test('built static assets stay within budgets', async () => {
  const assetDir = 'dist/site/assets';
  const files = readdirSync(assetDir);
  const total = (suffix: string) => files.filter((file) => file.endsWith(suffix)).reduce((sum, file) => sum + statSync(join(assetDir, file)).size, 0);
  expect(total('.js')).toBeLessThanOrEqual(200 * 1024);
  expect(total('.css')).toBeLessThanOrEqual(50 * 1024);
  expect(statSync('dist/site/assets/packet-proof.webp').size).toBeLessThanOrEqual(300 * 1024);
});

test('generated service worker precaches the production shell', () => {
  const files = readdirSync('dist/site/assets');
  const serviceWorker = readFileSync('dist/site/sw.js', 'utf8');
  for (const file of files.filter((file) => /\.(css|js)$/.test(file))) {
    expect(serviceWorker).toContain(`"/assets/${file}"`);
  }
  expect(serviceWorker).toContain("event.waitUntil(caches.open(CACHE)");
  expect(serviceWorker).toContain('self.skipWaiting()');
  expect(serviceWorker).toContain('ignoreVary: true');
});

test('static deployment configuration protects response policy and hashed assets', () => {
  const config = JSON.parse(readFileSync('dist/site/staticwebapp.config.json', 'utf8'));
  expect(config.globalHeaders['Content-Security-Policy']).toContain("default-src 'self'");
  expect(config.globalHeaders['Permissions-Policy']).toContain('camera=()');
  expect(config.globalHeaders['X-Content-Type-Options']).toBe('nosniff');
  const assets = config.routes.find((route: { route: string }) => route.route === '/assets/*');
  const fonts = config.routes.find((route: { route: string }) => route.route === '/fonts/*');
  expect(assets.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
  expect(fonts.headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
});
