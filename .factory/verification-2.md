# Independent verification 2 — PASS

- Work order: `dev-diagnostic-packet-verify-2`
- Candidate: `b2f2a15719fa059b3a8f39a29ac39b4113b6e824`
- Live URL: <https://dev-diagnostic-packet.sociobot.in/>
- Date: 2026-08-28 UTC

## Verdict

**PASS.** The candidate meets the brief: an opt-in, allowlisted local CLI previews, captures redacted evidence, requires inspection, and exports an inspectable ZIP. The earlier default-path and offline-reload failures are not reproducible. Live files match this candidate exactly. No product source was modified during verification.

## Clean build and package

| Check | Result |
| --- | --- |
| `npm ci` | Passed; 23 packages audited, 0 vulnerabilities. |
| `npm test` | Passed: format check, 7 Rust unit tests, 3 CLI integrations, production site build, 18 Playwright checks. |
| `cargo clippy --all-targets --all-features -- -D warnings` | Passed. |
| `npm run build` | Passed; produced `dist/diagnostic-packet` and `dist/site/`. |
| `cargo package --locked` | Passed: 16 files, 72.5 KiB unpacked / 21.2 KiB compressed. |

The packed crate was unpacked into a fresh consumer and installed with `cargo install --path … --root … --locked`. The installed v0.1.1 binary printed useful `--help` and completed the literal documented flow:

```sh
diagnostic-packet init
diagnostic-packet preview --json
diagnostic-packet --ci capture --approve-commands --json
diagnostic-packet inspect --json
diagnostic-packet export --json
```

The ZIP contained only `report.html`, `report.json`, `inspection.json`, `evidence/system.txt`, and `evidence/git.txt`.

## Product and privacy behavior

A clean custom manifest exercised system, approved `node --version`, config-hash, bounded log, and safe environment collectors. A log containing a token assignment, email, IPv4 address, and `/home` path staged exactly:

```text
[REDACTED_SECRET] [REDACTED_EMAIL] [REDACTED_IP] [HOME]
```

The raw values were absent from the review directory and ZIP; config was hash-only. The following recovery and boundary paths each returned exit code `2`: manifest overwrite, unapproved CI capture (with no output directory), traversal path, `max_bytes = 0`, sensitive `API_TOKEN` environment name, export before inspection, export after mutation, and archive overwrite. Source inspection and runtime behavior found no telemetry, background collection, automatic CLI network call, or remote-support access.

## Web, PWA, policy, and performance

Fresh live Chromium checks at 1440×1000 and 390×844 found title, `lang=en`, one `h1`, one `main`, no horizontal overflow, zero console/page errors, and zero axe serious/critical findings. Keyboard Tab exposed the skip link with a visible double outline; ArrowRight selected the next demo tab. Reduced-motion computed scroll behavior was `auto`.

The live request host set was only `dev-diagnostic-packet.sociobot.in`; no third-party, analytics, or telemetry request occurred. After worker activation and an online reload, an offline reload retained the heading and initialized Preview without errors.

SHA-256 matched local candidate output for live `/`, `/privacy/`, `/terms/`, `sw.js`, emitted JS/CSS, and both WebP hero files. HTML and worker responses have no-store caching; hashed assets/fonts have one-year immutable caching. Checked live responses include HSTS, same-origin CSP, Permissions-Policy, `nosniff`, strict-origin Referrer-Policy, and no `Set-Cookie`.

Asset budgets pass: JS 5,555 B, CSS 13,475 B, WOFF2 116,112 B, desktop hero 93,486 B, mobile hero 39,054 B. Local mobile Lighthouse: Performance **99**, Accessibility **100**, Best Practices **96**, SEO **92**; LCP 2,025 ms, CLS 0, and total blocking time 0 ms.

## Defects by severity

| Severity | Findings |
| --- | --- |
| Critical | None observed. |
| High | None observed. |
| Medium | None observed. |
| Low | None observed. |

## Non-blocking limitations

Automated redaction cannot identify every project-specific secret; the product documents this and requires inspection before export. This verifier exercised the produced Linux binary; release automation should also cross-compile and sign macOS and Windows artifacts.

