# Polish 2 — cumulative finding closure map

Candidate repaired: `806d03a18aa87346844bdf26986b86967481bbdd`

Repair commit tested and deployed: `407780847cc29e28930a6e1d8f5e7e6bd8a4cf4f`

Live cold check: <https://dev-diagnostic-packet.sociobot.in/?demo=1#demo>, 2026-08-28 UTC

Screenshots: `.factory/evidence/polish-2/live/screenshot-desktop.png` and `screenshot-mobile.png`

Every exact command in `.factory/claims.json` passed separately from clean clone `/tmp/dp-polish2-clean-eXpLG2` at the deployed commit: 25/25 in 295 seconds. “Live check” below refers to the post-deploy cold Chromium route/storage/network/Axe/offline matrix unless a more specific URL is named.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Kept the working public Git install and made its test execute that exact remote command in a fresh Cargo root. | `@claim:free-source-install`; installed `diagnostic-packet 0.1.1`; live install command visible. |
| F-1-2 | Replaced the absolute “safe” wording with “Collect and redact bug-report evidence”; retained the audience sentence, one sample action, and three facts. | `first screen states the job…`; both live screenshots. |
| F-1-3 | Added the real CLI demo output as a self-hosted asciinema v2 cast plus an accessible transcript; labelled the scripted UI “Interactive packet explainer.” | `@claim:cli-demo-recording`, `@claim:cli-demo-isolation`; live cast returned 200. |
| F-1-4 | Expanded the registry to 25 claims with exactly one matching test tag for each. | Clean-clone 25/25 exact-command result; `.factory/claims.json`. |
| F-1-5 | Retained the designed broadsheet 404 and real deployment response override. | `@claim:routes-and-404`; live `/does-not-exist` returned HTTP 404. |
| F-1-6 | Added socket denial, filesystem-write auditing, full-demo request interception, and tracking checks. | `@claim:local-only`, `@claim:site-private`; live host set contained only the product origin. |
| F-1-7 | Compared the full preview title, item IDs, types, descriptions, commands, and approval flags with the sample checklist. | `@claim:manifest-plan`. |
| F-1-8 | Audited preview reads, writes, and child execution; copy now says it reads only the checklist. | `@claim:preview-read-only`. |
| F-1-9 | Covered approved success, unapproved rejection, unknown executables, and unsafe arguments. | `@claim:command-approval`. |
| F-1-10 | Covered tokens, email, IP, and home path with a write audit and scans of every review/ZIP file. | `@claim:redact-before-disk`. |
| F-1-11 | Independently calculated the fixture SHA-256 and checked its exact bytes never appear in output. | `@claim:config-hash-only`. |
| F-1-12 | Tested all five types plus unknown type, traversal, absolute path, symlink escape, unsafe command, and sensitive environment names. | `@claim:manifest-boundaries`. |
| F-1-13 | Recursively inventoried disk and compared the exact file set, sizes, hashes, and total with inspection.json. | `@claim:inspection-ledger`. |
| F-1-14 | Tested export before inspection, clean success after inspection, and rejection after mutation. | `@claim:inspection-required`. |
| F-1-15 | Compared every ZIP name and byte with the inspection ledger; checked readable HTML and the closed non-executable file pattern. | `@claim:archive-contents`. |
| F-1-16 | Reset now restores preview in memory without recreating storage; Install the CLI clears every demo key and preserves real keys. | `@claim:demo-sandbox`; live reset/exit both returned `demo: []`, `real: keep-me`. |
| F-1-17 | Retained reliable versioned shell precaching and offline demo initialization. | `@claim:offline-reload`; live offline H1 and Preview output loaded. |
| F-1-18 | Kept nonexistent release/single-binary distribution claims removed. | Copy audit; public install now names Git source only. |
| F-1-19 | The exact public Git install, installed version, CLI demo, MIT Cargo metadata, and license grant are asserted. | `@claim:free-source-install`. |
| F-1-20 | Tested root and every subcommand help, four JSON commands, CI approval, and exit codes 0/1/2. | `@claim:cli-contract`. |
| F-1-21 | Cloned a clean checkout, removed known outputs, ran `npm ci` and `npm run build`, and required both exact dist targets. | `@claim:clean-build`. |
| F-1-22 | Audited the full demo for request/script origins, tracking names, cookies, storage namespace, and account UI. | `@claim:site-private`. |
| F-1-23 | Replaced tautological cache deletion with Chrome’s clear-origin-data operation; asserted caches, storage, and registrations are gone. | `@claim:clear-cache`. |
| F-1-24 | Retained Left/Right/Home/End behavior and added the missing ArrowLeft assertion. | `@claim:demo-keyboard`. |
| F-1-25 | Added `og:url`, Twitter title/description/image, and icons to Demo, Privacy, Terms, and 404. | `@claim:routes-and-404`; live route matrix found all five metadata fields on every route. |
| F-1-26 | Retained robots and sitemap with all public routes. | Live `/robots.txt` and `/sitemap.xml` returned 200. |
| F-1-27 | Retained one route skeleton and replaced the stale commit label with `v0.1.1 · polish 2` everywhere. | Live route crawl; screenshots. |
| F-1-28 | Retained route H1 focus/announcement and back navigation tests. | `internal navigation moves focus…`; full browser suite. |
| F-1-29 | Retained explicit “opens GitHub” accessible text and safe external-link attributes. | Axe route suite; live link crawl. |
| F-1-30 | Kept product preview immediately after the first screen. | Live screenshots. |
| F-1-31 | Kept “Create a packet in four steps.” | `.factory/copy-audit.md`; live screenshot. |
| F-1-32 | Kept “Export the inspected files as a packet ZIP.” | Copy audit. |
| F-1-33 | Kept “Redact evidence before saving.” | Copy audit. |
| F-1-34 | Kept “Save a collection checklist in your project.” | Copy audit. |
| F-1-35 | Re-audited every README sentence; longest sentence is 19 words. | `.factory/copy-audit.md`. |
| F-1-36 | Kept “Reset demo” and made it truly discard state. | `@claim:demo-sandbox`. |
| F-1-37 | Kept the concrete README opening. | Copy audit. |
| F-1-38 | Introduced the file as “The diagnostic-packet.toml text file.” | README; copy audit. |
| F-1-39 | Kept “collection item” in prose. | Terminology table in copy audit. |
| F-1-40 | Kept direct approval language. | README; `@claim:command-approval`. |
| F-1-41 | Kept the five supported types named explicitly. | README; `@claim:manifest-boundaries`. |
| F-1-42 | Re-audited and standardized demo, review folder, packet ZIP, collection item, checklist, and SHA-256 hash. | Copy-audit terminology table. |
| F-1-43 | Retained the 44px issue-tracker action. | `all navigation and demo controls meet the 44px touch baseline`; live Axe. |
| F-2-1 | Removed “safe” from the H1, title, social title, Cargo description, and CLI description; bounded redaction wording remains. | `@claim:routes-and-404`; first-screen tests and screenshots. |
| F-2-2 | Registered CLI demo isolation and audited a sentinel launch directory plus dedicated TMPDIR. | `@claim:cli-demo-isolation`. |
| F-2-3 | Registered starter creation, required fields, and refusal to overwrite. | `@claim:starter-manifest`. |
| F-2-4 | Registered and measured `max_bytes=80` while confirming redaction remains applied. | `@claim:log-truncation`. |
| F-2-5 | Registered representative secret-like rejections and allowed names. | `@claim:sensitive-env`. |
| F-2-6 | Replaced “ready-to-publish crate” with the non-claiming instruction “Check the Rust package.” | Copy audit; clean-clone `cargo package --locked` passed. |
| F-2-7 | Removed background-process and remote-support marketing clauses; retained and fully tested no-network/no-telemetry boundaries. | README; `@claim:local-only`, `@claim:site-private`. |
| F-2-8 | Replaced “Open packet format” with “Inspectable packet ZIP”; tied free/MIT wording to license and install evidence. | `@claim:archive-contents`, `@claim:free-source-install`. |
| F-2-9 | Removed the README’s untested minimum-Rust claim. | README and copy audit. |
| F-2-10 | Captured the browser download, filename, and required checklist fields. | `@claim:download-starter`. |
| F-2-11 | Standardized prose on “SHA-256 hash”; `config-hash` remains only the literal schema value. | Copy-audit terminology table. |
| F-2-12 | Set 44px minima for banner actions and nav links; measured all rendered controls at 390px. | `all navigation and demo controls meet the 44px touch baseline`; mobile screenshot. |
| F-2-13 | Replaced unexplained TOML wording with “the project checklist in diagnostic-packet.toml” and “text file.” | Copy audit; screenshots. |
| F-2-14 | Rewrote `--ci` as “For automated builds, add --ci to disable prompts.” | README; copy audit. |
| F-2-15 | Replaced “I/O” with “file read/write” and removed “ready-to-publish.” | README; copy audit. |
| F-2-16 | Replaced “Start for real” with “Install the CLI,” linked it to `#install`, and cleared demo storage. | `@claim:demo-sandbox`; live URL became `/#install`. |
| F-2-17 | Rebuilt the audit from current static, dynamic, legal, README, and catalog copy with counts and terminology. | `.factory/copy-audit.md`: maximum 19 words, no banned terms. |

## Final verification

- Clean clone commit: `407780847cc29e28930a6e1d8f5e7e6bd8a4cf4f`.
- Exact claim commands: 25/25 passed individually in 295 seconds.
- Full clean-clone suite: 58 passed, 18 intentional mobile skips for CLI-only tests; zero failures.
- `npm run build`, strict Clippy, and `cargo package --locked`: passed in the clean clone.
- Local Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.96 s, CLS 0, TBT 0.
- Live cold check: home/demo/privacy/terms 200, unknown route 404, only product-origin requests, zero serious/critical Axe violations, no horizontal overflow, and offline demo reload passed.
- Deployed home SHA-256 equals local build: `b0056954cde0cc7ad9c5a9282f34ef3857517a4302a31fd76f9f4bfdfbc2dafa`.
