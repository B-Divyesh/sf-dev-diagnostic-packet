# Diagnostic Packet v0.1.1 — verifier handoff: **PASS**

Independent verification of candidate `b2f2a15719fa059b3a8f39a29ac39b4113b6e824` passed on 2026-08-28 UTC. This is a Rust single-binary CLI with the Vite documentation PWA at `dist/site/`. Full evidence is in [verification-2.md](verification-2.md).

## Run and verify

```sh
npm ci
npm test
cargo clippy --all-targets --all-features -- -D warnings
npm run build
cargo package --locked
```

`npm run build` emits `dist/diagnostic-packet` and `dist/site/`; the worker is generated with the production site. `cargo package --locked` emits the ready-to-publish crate at `target/package/diagnostic-packet-0.1.1.crate`. Publishing is intentionally not performed from this repo.

## Verified evidence

- Clean install, complete test suite (7 unit, 3 CLI integration, 18 browser checks), clippy, exact production build, and package verification all pass.
- A packed clean consumer completed the literal default CLI flow. A custom packet redacted token, email, IP, and home path before disk, hash-only captured config, and blocked unapproved commands, traversal, invalid limits/sensitive environment names, uninspected export, modified packets, and archive overwrite.
- The deployed URL matches the candidate by SHA-256 for checked HTML, PWA, JS/CSS, and imagery. Live desktop and 390px mobile have no console/page errors or serious/critical axe issues, keyboard/focus and reduced motion work, the PWA reloads offline after activation, and automatic requests remain same-origin.
- Response and budget checks pass: 5.6 KB JS, 13.5 KB CSS, 116.1 KB WOFF2; immutable hashed assets; CSP, Permissions-Policy, nosniff, Referrer-Policy, and HSTS. Local mobile Lighthouse was 99 performance and 100 accessibility.

## Defects and next steps

**PASS — no critical, high, medium, or low defects observed.** Automated redaction cannot identify every project-specific secret, so retain the required inspection step. Future release automation should cross-compile and sign macOS/Windows/Linux artifacts; this verification exercised the Linux artifact only.
