# Independent verification — FAIL

- **Work order:** `dev-diagnostic-packet-verify-1`
- **Candidate:** `29aeb8e321c7bc7179a9c48a08a258d2f80f3343`
- **Repository / ref tested:** clean detached checkout of the candidate
- **Live URL:** <https://dev-diagnostic-packet.sociobot.in/>
- **Date:** 2026-08-27 UTC

## Verdict

**FAIL.** The documented, default CLI workflow cannot get past its first
`preview`, which blocks the product's primary job. The public PWA also fails
an offline reload after an initial visit, despite claiming that it works
offline after first visit.

No product source was changed during this verification.

## What passed

### Clean install, quality gates, and package

| Check | Fresh evidence |
| --- | --- |
| Toolchain | Node `v22.23.2`, npm `10.9.8`, cargo `1.98.0` |
| Install | `npm ci` succeeded; `npm audit --audit-level=high` reported 0 vulnerabilities |
| Test suite | `npm test` passed: cargo fmt check, 7 Rust unit tests, 2 CLI integration tests, Vite production build, and 12 Playwright tests (desktop and 390×844 mobile) |
| Lint | `cargo clippy --all-targets --all-features -- -D warnings` passed |
| Exact build | `npm run build` passed and produced `dist/diagnostic-packet` (4,641,176 bytes) and `dist/site/` |
| Pack / clean consumer | `cargo package --locked` verified a 16-file crate (20.9 KiB compressed); unpacked it into a clean directory, `cargo install --path … --root … --locked` succeeded, and installed `diagnostic-packet 0.1.0` printed useful `--help` |

### CLI behavior that was exercised

Using the installed package and an explicit safe manifest path
(`--manifest ./diagnostic-packet.toml`), the intended normal flow succeeded:
`init` → JSON `preview` → approved JSON `capture` → `inspect` → JSON `export`.
The resulting ZIP contained only `report.html`, `report.json`,
`inspection.json`, and two text evidence files; it contained no executable
content.

The following recovery/guardrail paths behaved as intended in that same clean
consumer:

- a second `init` preserved the manifest and exited `2`;
- `--ci capture` without `--approve-commands` exited `2` and created no review
  directory;
- export before inspection exited `2`;
- export to an existing archive exited `2`.

The passing unit tests also independently cover redaction of emails, valid
IPv4 addresses, common/quoted secrets, and home paths; invalid path traversal,
sensitive environment names, restricted version commands, changed-after-
inspection packets, and log/config evidence handling.

### Live site, privacy, accessibility, and visual checks

- The live `/`, `/privacy/`, `/terms/`, JS, CSS, hero asset, and `sw.js` were
  fetched over HTTPS. SHA-256 values of all compared live files matched the
  candidate build exactly. The home HTML was byte-for-byte identical
  (`2754dc5f…3894a4`). The prior deployment-only concern is therefore **not
  reproducible** for this candidate.
- Live 390×844 Chromium: title loaded, no console/page errors, zero horizontal
  overflow, and axe reported no serious or critical violations. Its only
  network host was `dev-diagnostic-packet.sociobot.in`; there were no third-
  party requests, analytics, cookies, storage calls, or CLI network code.
- Local production build: inspected visually at 1440×1000 and 390×844. The
  layout is readable and stacks intentionally on mobile. Keyboard Tab reveals
  the skip link with a `3px double` focus outline; the demo's ArrowRight moved
  selection from Capture to Inspect. Under reduced motion, computed document
  scroll behavior was `auto`; the stylesheet reduces animation/transition
  duration. The unsafe-manifest demo has a labelled alert/recovery message.
- Asset budgets pass: initial JS 5,555 B, CSS 13,475 B, fonts 116,112 B total,
  desktop hero 93,486 B, mobile hero 39,054 B.
- Live responses include HTTPS/HSTS, `Referrer-Policy:
  strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and
  no `Set-Cookie`.

## Defects

### Critical — default documented CLI workflow is unusable

**Reproduction (clean consumer):**

```sh
diagnostic-packet init
diagnostic-packet preview
```

The first command writes `diagnostic-packet.toml`; the second exits `1` with
`error: I/O error: No such file or directory (os error 2)`. Default `capture`
fails identically. The root cause is visible in `manifest::load`: for a bare
filename, `Path::parent()` yields the empty path, then `canonicalize()` is
called on that empty path. `./diagnostic-packet.toml` works because its parent
is `.`. This contradicts both the CLI's `init` next-step text and every README
example that uses the default filename. The existing integration test misses
it because it passes an absolute temporary manifest path.

**Required fix:** treat an empty parent as `.` before canonicalizing, then add
an integration test for the exact README/default command sequence.

### High — PWA does not survive an offline reload after first visit

**Reproduction:** Visit the production build normally, wait for the service
worker to become ready, reload once while online, set the browser offline, and
reload again. The document HTML loads, but Chromium reports:

```text
Failed to load module script: Expected a JavaScript-or-Wasm module script but
the server responded with a MIME type of "text/html".
```

The page cannot initialize offline. `sw.js` precaches neither the hashed JS
nor CSS and starts cache writes in `fetch` without `event.waitUntil`, so those
writes are not reliable before the worker stops. This contradicts the UI and
privacy-page promise that docs work offline after first visit.

**Required fix:** precache the generated JS/CSS in a versioned manifest (or
reliably wait for runtime cache writes), test offline reload in CI, and retain
the existing update behavior (`skipWaiting`/cache cleanup) only after the new
shell is complete.

### Medium — live hashed assets are not cached immutably

The candidate-matching live JS, CSS, image, and service worker all return
`Cache-Control: public, must-revalidate, max-age=30`. Hashed static assets
should have long-lived immutable caching per the performance contract. This is
likely deployment configuration rather than app logic, but it is observable on
the release URL and prevents the requested cache policy from passing.

### Low — response-policy hardening is incomplete

The live responses do not send a Content-Security-Policy or Permissions-Policy
header. No third-party content is presently loaded, so this is not the cause
of a current exploit, but a restrictive CSP would preserve the local-first,
no-third-party guarantee if the page changes.

## Suggested re-verification

After fixes, run from a clean checkout:

```sh
npm ci
npm test
npm run build
cargo clippy --all-targets --all-features -- -D warnings
cargo package --locked
```

Then install the `.crate` into a clean Cargo root and run the literal README
workflow without an explicit `--manifest`; confirm a complete staged packet
and ZIP. Finally, visit the deployed site, wait for worker activation, reload
online once, then reload offline and verify the demo initializes without a
module/MIME console error. Confirm immutable cache headers and CSP at the live
URL.
