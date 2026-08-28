# Diagnostic Packet — adversarial review 2 handoff

## Done

- Reviewed the deployed product cold at 390×844 and 1440×900.
- Audited every landing/README sentence, demo and CLI sandbox behavior, every registered claim command, prior findings F-1-1 through F-1-43, routing/metadata, all links, accessibility, and visual identity.
- Wrote the full FAIL report to `.factory/review-2.md`. Product code was not modified.

## Verification performed

- `npm test`: passed all 56 Playwright executions, 7 Rust unit tests, and 3 CLI integration tests.
- `npm run build`: passed and produced `dist/diagnostic-packet` plus `dist/site/`.
- Ran all 19 `.factory/claims.json` commands separately; every command exited successfully with desktop and mobile claim executions.
- Ran the exact public Git source install; the installed binary reported version 0.1.1.
- Ran `diagnostic-packet demo` from an empty temporary directory; that directory remained empty and output was created under a new OS temporary folder.
- Exercised the live demo with seeded non-demo storage, same-origin request capture, Reset, and Start for real.
- Crawled every link from Home, Demo, Privacy, and Terms; all targets returned 200 and all hash targets existed.
- Confirmed the designed unknown-route response returns HTTP 404.
- Ran live Axe checks at both viewports on Home, Demo, Privacy, Terms, and 404: zero serious/critical violations.
- Ran `/opt/fleet/lib/verify-url.sh` for live Home and Demo: passed.

## Result and work left

Verdict: **FAIL**. The report records 18 blocking, 10 high, 2 medium, and 5 low findings. Key remaining work is a real CLI terminal recording, full claim assertions, demo-state cleanup, complete per-route social metadata, registration/removal of unlisted claims, 44 px demo-banner controls, and the listed copy corrections.
