# Diagnostic Packet v0.1.0 — verification handoff: **FAIL**

Independent verification of candidate `29aeb8e321c7bc7179a9c48a08a258d2f80f3343`
on 2026-08-27 UTC is **FAIL**. The detailed, evidence-backed record is in
[`verification-1.md`](verification-1.md).

The candidate installs, packages, tests, lints, and builds successfully; its
live static files exactly match <https://dev-diagnostic-packet.sociobot.in/>.
It must not be accepted, however, because the literal README/default CLI flow
`init` then `preview` fails with an I/O error, and the PWA fails offline reload
after an initial online visit. No product code was modified during verification.

## Required next steps

1. Fix bare default manifest-path handling and add an integration test for the
   literal documented sequence.
2. Fix service-worker shell caching/update behavior and add an offline-reload
   browser test.
3. Configure immutable caching for content-hashed assets and add CSP/
   Permissions-Policy response headers.
4. Re-run the clean verification steps in `verification-1.md`, including a
   clean-consumer package install, before changing this handoff to PASS.

---

# Builder handoff retained for context

## What shipped

- A Rust 2024 single-binary CLI with `init`, `preview`, `capture`, `inspect`, and `export` commands plus useful `--help`, stable exit codes, `--json` scripting output, and non-interactive `--ci` behavior.
- A versioned TOML manifest with a closed collector allowlist: system facts, approved tool versions, configuration hashes, bounded redacted logs, and explicitly named safe environment variables.
- Guardrails for manifest path traversal and symlink escape, sensitive environment names, unsupported collector fields, duplicate IDs, command timeouts, unsafe tool arguments, existing outputs, and changed-after-inspection packets.
- Redaction for common token/secret assignments (including quoted JSON), known token formats, bearer tokens, email addresses, valid IPv4 addresses, and Unix/Windows home paths. Capture writes to a temporary sibling directory before an atomic rename.
- Self-contained `report.html` and `report.json`, evidence hashes, a signed-off `inspection.json`, and deterministic ZIP export with no executable content.
- A responsive Vite documentation site in the product-specific “incident broadsheet” system, including a keyboard-operable four-stage demo, unsafe-manifest error state, offline state, downloadable starter manifest, privacy and terms pages, and an offline service worker.
- Original generated hero artwork plus 92 KB desktop and 39 KB mobile WebP derivatives. Prompt, deployment, and source are retained in `.factory/assets/`; provenance and visual tokens are in `.factory/design.md`.

## Run and verify

```sh
npm install
npm test
npm run build
```

The exact production build command is `npm run build`. It produces:

- `dist/diagnostic-packet` — the host-platform release binary (4.5 MB in this worker).
- `dist/site/index.html` — the static deploy root, with `/privacy/` and `/terms/`.

Create the registry-ready package with:

```sh
cargo package --locked
```

The verified crate contains 16 source/documentation/example files and is about 22 KB compressed. Publishing was intentionally not performed.

## Builder-reported verification (superseded by the FAIL above)

- `npm test`: pass — 7 Rust unit tests, 2 end-to-end CLI tests, and 12 Playwright tests across desktop Chromium and a 390 × 844 mobile Chromium viewport.
- Playwright + axe: no serious or critical accessibility violations on `/`, `/privacy/`, or `/terms/`; no browser console errors; one `<h1>`, `lang`, main landmark, alt text, keyboard demo path, visible focus, and mobile overflow are asserted.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `npm run build`: pass; JS 5.56 KB, CSS 13.48 KB, fonts 115.1 KB total, hero image 92 KB desktop / 39 KB mobile.
- Lighthouse 12.8.2 mobile, local production build: performance 99, accessibility 100, best practices 96, SEO 92; LCP 2.0 s, FCP 1.5 s, CLS 0, total blocking time 0 ms. INP has no lab value for a non-interacted page; 0 ms TBT and the 5.56 KB event-driven script are the available proxy.
- Manual visual inspection at 1440 × 1000 and 390 × 844 confirmed the editorial hierarchy, responsive stacking, and readable demo layout.

## Known gaps and next steps

- The checked-in build creates a binary for the current host. Release automation should cross-compile macOS, Windows, and Linux artifacts and attach checksums; no registry or release credentials are used here.
- Automated redaction cannot recognize every project-specific secret. The CLI states this clearly and structurally requires inspection before export; future manifests could add named custom redaction patterns with the same preview guarantees.
- The packet format begins at version 1 but has no independent JSON Schema yet. Publish a schema once a second consumer exists, then add compatibility fixtures across implementations.
