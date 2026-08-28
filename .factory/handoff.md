# Diagnostic Packet — review 1 handoff

Adversarial first-read review 1 is complete. The verdict is **FAIL** with 43 findings in `.factory/review-1.md`. No product source was changed.

## What was done

- Reviewed the live site cold at 390×844 and 1440×900.
- Audited every landing-page and README sentence, plus headings, actions, claims, and terminology.
- Tested `/demo`, `?demo=1`, the in-page sample flow, offline reload, network/storage behavior, and `diagnostic-packet demo` in a temporary directory.
- Checked the public Cargo install command and GitHub releases; neither provides an installable product.
- Read the prior handoff and verification reports and rechecked their findings in code and live behavior.
- Checked titles, H1/main/lang, metadata, 404 behavior, deep navigation/focus, links, headers/footers, touch targets, axe results, visual identity, security headers, cache policy, and asset sizes.

## Verification run

From clean clone `/tmp/dp-review-clean-MBde75`:

```sh
npm ci
npm test
npm run build
cargo clippy --all-targets --all-features -- -D warnings
```

All four commands passed: 7 unit tests, 3 CLI integration tests, and 18 browser tests. The live home HTML and main JS matched the local production build by SHA-256. Live offline reload and same-origin-only browser behavior passed. Axe found zero violations on Home, Privacy, and Terms at phone and desktop sizes.

## Blocking work left

- Publish a working install path; the hero Cargo command fails and GitHub has no releases.
- Replace the ambiguous first screen with a job/user/action-first version.
- Implement and document the required isolated CLI demo and `/demo` route.
- Add `.factory/claims.json` and exactly tagged tests for every public claim.
- Add a designed 404 instead of returning Home with HTTP 200.

The complete evidence, exact rewrites, unlisted-claim ledger, and remaining medium/low findings are in `.factory/review-1.md`.
