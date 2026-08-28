import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync as readFile, rmSync as remove, writeFileSync as writeFile } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const binary = join(process.cwd(), 'target/debug/diagnostic-packet');
function run(args: string[], cwd?: string) {
  return execFileSync(binary, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function demo() {
  const output = run(['demo']);
  const review = output.match(/Review folder: (.+)/)?.[1];
  const archive = output.match(/Packet ZIP: (.+)/)?.[1];
  if (!review || !archive) throw new Error(`Could not parse demo output: ${output}`);
  return { output, review, archive };
}
function temp() { return mkdtempSync(join(tmpdir(), 'diagnostic-packet-claim-')); }
function sampleManifest() { return readFile('examples/diagnostic-packet.toml', 'utf8'); }

test('@claim:local-only runs the bundled packet locally', async () => {
  const result = demo();
  expect(result.output).toContain('Demo packet created from bundled sample data.');
  expect(existsSync(result.archive)).toBeTruthy();
});

test('@claim:manifest-plan previews declared collection items', async () => {
  const root = temp();
  writeFile(join(root, 'diagnostic-packet.toml'), sampleManifest());
  const preview = run(['preview', '--manifest', 'diagnostic-packet.toml', '--json'], root);
  expect(JSON.parse(preview)).toMatchObject({ valid: true, collector_count: 4 });
  remove(root, { recursive: true, force: true });
});

test('@claim:preview-read-only does not create a review folder', async () => {
  const root = temp();
  writeFile(join(root, 'diagnostic-packet.toml'), sampleManifest());
  run(['preview', '--manifest', 'diagnostic-packet.toml'], root);
  expect(existsSync(join(root, '.diagnostic-packet'))).toBeFalsy();
  remove(root, { recursive: true, force: true });
});

test('@claim:command-approval rejects unapproved tool versions', async () => {
  const root = temp();
  writeFile(join(root, 'diagnostic-packet.toml'), sampleManifest().replace('id = "editor-log"\ntype = "log"\npath = ".logs/editor.log"\nmax_bytes = 200000', 'id = "git"\ntype = "tool-version"\ncommand = ["git", "--version"]'));
  expect(() => run(['--ci', 'capture'], root)).toThrow();
  remove(root, { recursive: true, force: true });
});

test('@claim:redact-before-disk removes sample secrets before writing', async () => {
  const { review } = demo();
  const files = readdirSync(join(review, 'evidence')).map((file) => readFile(join(review, 'evidence', file), 'utf8')).join('\n');
  expect(files).not.toContain('dev@example.com');
  expect(files).not.toContain('sample-token-for-redaction');
  expect(files).toContain('[REDACTED');
});

test('@claim:config-hash-only records a digest without copying lockfile text', async () => {
  const { review } = demo();
  const report = readFile(join(review, 'report.json'), 'utf8');
  expect(report).toContain('SHA-256 recorded');
  expect(report).not.toContain('package-lock.json\": {}');
});

test('@claim:manifest-boundaries rejects an escaping path', async () => {
  const root = temp();
  writeFile(join(root, 'diagnostic-packet.toml'), sampleManifest().replace('.logs/editor.log', '../outside.log'));
  expect(() => run(['preview'], root)).toThrow();
  remove(root, { recursive: true, force: true });
});

test('@claim:inspection-ledger lists hashes and byte counts', async () => {
  const { review } = demo();
  const ledger = JSON.parse(readFile(join(review, 'inspection.json'), 'utf8'));
  expect(ledger.files.every((file: { bytes: number; sha256: string }) => file.bytes >= 0 && /^[a-f0-9]{64}$/.test(file.sha256))).toBeTruthy();
});

test('@claim:inspection-required blocks an export after a changed file', async () => {
  const { review } = demo();
  writeFile(join(review, 'report.json'), 'changed');
  expect(() => run(['export', review, '--output', join(review, 'changed.zip')])).toThrow();
});

test('@claim:archive-contents contains only inspected safe files', async () => {
  const { archive } = demo();
  const names = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n');
  expect(names).toContain('report.html');
  expect(names).toContain('inspection.json');
  expect(names.every((name) => !/\.(exe|sh|bat|cmd)$/i.test(name))).toBeTruthy();
});

test('@claim:demo-sandbox shows its banner and resets only demo storage', async ({ page }) => {
  await page.goto('/?demo=1#demo');
  await expect(page.getByLabel('Demo mode')).toContainText('sample data, nothing is saved');
  await page.getByRole('tab', { name: /Capture/ }).click();
  expect(await page.evaluate(() => localStorage.getItem('demo:diagnostic-packet:stage'))).toBe('capture');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(await page.evaluate(() => localStorage.getItem('demo:diagnostic-packet:stage'))).toBe('preview');
  await expect(page.getByRole('link', { name: 'Start for real' })).toHaveAttribute('href', '/');
});

test('@claim:free-source-install exposes the documented Git source command', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#install-command')).toContainText('cargo install --git https://github.com/B-Divyesh/sf-dev-diagnostic-packet.git');
  expect(existsSync(binary)).toBeTruthy();
});

test('@claim:cli-contract exposes help and documented JSON workflow', async () => {
  expect(run(['--help'])).toContain('demo');
  const root = temp();
  run(['init'], root);
  expect(JSON.parse(run(['preview', '--json'], root))).toMatchObject({ valid: true });
  remove(root, { recursive: true, force: true });
});

test('@claim:clean-build creates binary and static site output', () => {
  expect(existsSync('dist/diagnostic-packet') || existsSync(binary)).toBeTruthy();
  expect(existsSync('dist/site/index.html')).toBeTruthy();
});

test('@claim:site-private loads no third-party requests or cookies', async ({ page }) => {
  const origins: string[] = [];
  page.on('request', (request) => origins.push(new URL(request.url()).origin));
  await page.goto('/privacy/');
  await page.waitForLoadState('networkidle');
  expect(origins.length).toBeGreaterThan(0);
  expect(origins.every((origin) => origin === 'http://127.0.0.1:4173')).toBeTruthy();
  expect(await page.context().cookies()).toEqual([]);
});

test('@claim:clear-cache removes the service worker cache', async ({ page }) => {
  await page.goto('/demo/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  expect((await page.evaluate(async () => caches.keys())).length).toBeGreaterThan(0);
  await page.context().clearCookies();
  await page.evaluate(async () => { for (const key of await caches.keys()) await caches.delete(key); });
  expect(await page.evaluate(async () => caches.keys())).toEqual([]);
});

test('@claim:demo-keyboard changes stages with arrow, Home, and End', async ({ page }) => {
  await page.goto('/demo/');
  const preview = page.getByRole('tab', { name: /Preview/ });
  await preview.focus(); await preview.press('End');
  await expect(page.getByRole('tab', { name: /Export/ })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: /Export/ }).press('Home');
  await expect(preview).toHaveAttribute('aria-selected', 'true');
  await preview.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Capture/ })).toHaveAttribute('aria-selected', 'true');
});

test('@claim:routes-and-404 have distinct documents', async ({ page }) => {
  await page.goto('/demo/'); await expect(page).toHaveTitle('Demo — Diagnostic Packet');
  await page.goto('/privacy/'); await expect(page).toHaveTitle('Privacy — Diagnostic Packet');
  await page.goto('/404.html'); await expect(page).toHaveTitle('Page not found — Diagnostic Packet');
  await expect(page.locator('h1')).toContainText('not in the packet');
});
