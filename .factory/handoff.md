# Diagnostic Packet v0.1.1 — repair handoff: **PASS (local release gates)**

This repair addresses every release-blocking finding in independent verification
of candidate `29aeb8e321c7bc7179a9c48a08a258d2f80f3343` (report recorded in
[`verification-1.md`](verification-1.md)). The artifact remains a Rust single-
binary CLI with the Vite static documentation site at `dist/site/`.

## Repairs

1. **Default CLI workflow:** `manifest::load` now treats the empty parent of a
   bare path such as `diagnostic-packet.toml` as `.` before canonicalizing.
   The new CLI integration test runs the exact default sequence from an
   isolated current directory: `init`, `preview --json`, `--ci capture
   --approve-commands`, `inspect`, and `export`.
2. **Offline documentation reload:** the Vite build now generates `sw.js`
   after every production build. It fingerprints and precaches the generated
   HTML routes, hashed JS/CSS, fonts, and local artwork before `skipWaiting`.
   Same-origin cache reads use `ignoreVary` so preloaded fonts are also served
   offline. The browser regression test activates the worker, reloads online,
   takes the context offline, reloads again, and asserts initialized demo
   content with no console errors.
3. **Response policy and caching:** `site/public/staticwebapp.config.json`
   configures Azure Static Web Apps with a same-origin CSP, restrictive
   Permissions-Policy, `nosniff`, referrer policy, no-store HTML/worker
   responses, and one-year immutable caching for `/assets/*` and `/fonts/*`.
   Build tests assert this configuration and that the generated worker includes
   each emitted JS and CSS asset.

## Run and verify

```sh
npm ci
npm test
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package --locked
```

For a dirty development tree, use `cargo package --allow-dirty --locked`; the
release/CI command above stays `cargo package --locked`.

`npm run build` produces `dist/diagnostic-packet` and `dist/site/`. The
documentation build generates a versioned `dist/site/sw.js`; do not edit that
file by hand. The registry-ready archive is `target/package/diagnostic-
packet-0.1.1.crate`; publishing is intentionally not performed.

## Exact local evidence (2026-08-28 UTC)

- `npm ci`: pass; 23 packages audited, 0 vulnerabilities.
- `npm test`: pass — cargo format check, 7 Rust unit tests, 3 CLI integration
  tests, production site build, and 18 Playwright checks across Desktop
  Chromium and 390 × 844 mobile Chromium. The suite includes axe checks with
  no serious/critical findings on `/`, `/privacy/`, and `/terms/`; keyboard
  tab/arrow operation, no mobile overflow, asset budgets, production shell
  precache, response-policy config, and offline reload are covered.
- `cargo clippy --all-targets --all-features -- -D warnings`: pass.
- `npm run build`: pass. Emitted JS is 5.56 KB and CSS 13.48 KB; the generated
  worker precaches 11 local shell files. The release binary is 4.5 MB on this
  Linux worker.
- Local Lighthouse against the production preview: performance **99**,
  accessibility **100**, best practices **96**, SEO **92**; LCP **1998 ms**,
  CLS **0**, and total blocking time **0 ms**.
- `cargo package --allow-dirty --locked`: pass — 16 files, 21.2 KiB compressed.
  The archive was unpacked into a fresh temporary consumer, installed with
  `cargo install --path … --root … --locked`, and its `--help` was checked.
  In a new empty current directory, the installed binary completed the literal
  default flow and exported a ZIP containing only `report.html`, `report.json`,
  `inspection.json`, `evidence/git.txt`, and `evidence/system.txt`.

## Deployment and live verification

The static deployment and live URL evidence are added immediately after the
release upload. Expected live assertions are HTTPS 200, the generated shell
loading after an offline reload, immutable asset/font cache headers, CSP,
Permissions-Policy, and no third-party network requests.

## Known gaps / next steps

- This worker produces the host Linux binary. Release automation should
  cross-compile and sign/checksum macOS, Windows, and Linux artifacts.
- Automated redaction cannot recognize every project-specific secret. The CLI
  still requires local inspection before export; named custom redaction rules
  can be considered only with the same preview guarantees.
- The packet format starts at version 1 and has no independent JSON Schema;
  publish one when a second consumer exists.
