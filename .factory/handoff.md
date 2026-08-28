# Diagnostic Packet — polish 1 handoff

Repair closes all 43 findings from review 1. The CLI remains a Rust/clap single binary and the docs remain a Vite static site.

## Delivered

- Working `diagnostic-packet demo`: writes bundled sample files to a fresh OS temporary directory, captures, inspects, exports, and prints review-folder and packet-ZIP paths.
- One-click `?demo=1` and `/demo/` sample paths with isolated-demo banner, Reset demo, and Start for real.
- Testable claims, demo docs, copy audit, catalog description, metadata/assets, legal skeleton, robots/sitemap, and a designed 404 response configuration.
- Plain-language first screen and README, plus a working Git source install path instead of nonexistent crates.io/releases instructions.

## Verification

- `npm test`: passed 56 Playwright executions (desktop + 390px mobile), 7 Rust unit tests, and 3 CLI integration tests. It includes every `@claim:*` test, Axe serious/critical checks, offline reload, privacy, mobile overflow, route-focus, and static budget checks.
- `npm run build`: passed; produced `dist/diagnostic-packet` and `dist/site/`. Built JS gzip: 2.86 KB; CSS gzip: 3.90 KB; social image: 76 KB.
- `cargo clippy --all-targets --all-features -- -D warnings`: passed.
- `/opt/fleet/lib/verify-url.sh` passed locally for `/demo/` and cold on the deployed Home and Demo pages. Evidence is in `.factory/evidence/local`, `.factory/evidence/live`, and `.factory/evidence/live-home`; each report has no console errors, `lang=en`, one H1, a main landmark, and no missing image alt text.
- Standalone `npx @axe-core/cli` could not launch its Selenium Chrome binary in this container. The repo's `@axe-core/playwright` integration passed with zero serious/critical violations on Home, Privacy, and Terms at both viewports.

## Run

```sh
npm ci
npm test
npm run build
./dist/diagnostic-packet demo
```

## Known gaps

None. Commit `aa11a6163b01fefa4148423d6e5fbf73c6c85534` is pushed and deployed to <https://dev-diagnostic-packet.sociobot.in>. Cold live recheck: Home, `?demo=1`, `/demo/`, Privacy, Terms, metadata assets, robots, and sitemap returned 200; `/does-not-exist` returned the designed page with HTTP 404.
