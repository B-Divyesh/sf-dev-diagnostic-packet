import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, statSync } from 'node:fs';
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

test('built static assets stay within budgets', async () => {
  const assetDir = 'dist/site/assets';
  const files = readdirSync(assetDir);
  const total = (suffix: string) => files.filter((file) => file.endsWith(suffix)).reduce((sum, file) => sum + statSync(join(assetDir, file)).size, 0);
  expect(total('.js')).toBeLessThanOrEqual(200 * 1024);
  expect(total('.css')).toBeLessThanOrEqual(50 * 1024);
  expect(statSync('dist/site/assets/packet-proof.webp').size).toBeLessThanOrEqual(300 * 1024);
});
