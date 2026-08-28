# Adversarial first-read review 1 — Diagnostic Packet

- Work order: `dev-diagnostic-packet-review-1`
- Base reviewed: `96c8fbac8cf856e8525eb1e6993dfee0880e7c85`
- Live URL: <https://dev-diagnostic-packet.sociobot.in>
- Review date: 2026-08-28 UTC
- Viewports: 390×844 and 1440×900, fresh Chromium contexts

## Verdict: FAIL

The public site is visually distinct and the repository's ordinary tests pass, but the product is not installable through either documented public path. The first screen does not clearly state who should use it or provide the required sample-data action. There is no real CLI demo, no claim registry, and no designed 404. There are **43 findings: 5 blocking, 19 high, 11 medium, and 8 low**. PASS requires zero.

## Thirty-second cold read

Before scrolling, my answers were:

- **What does it do?** I could infer that it collects versions, hashes, logs, and reproduction steps, but the headline “A bug report they can replay.” does not name the CLI's job or output.
- **For whom?** Not stated. “maintainers actually need” identifies the recipient, not the developer expected to run the tool.
- **What should I click first?** Unclear. The phone screen presents `Copy command`, `Walk through a packet`, and `Read the source`; none says “Try it with sample data.”

That fails the mandatory first-screen test at both viewports.

## Findings

### Blocking

#### F-1-1 — The advertised install paths do not exist

- **Location / quote:** first screen, `cargo install diagnostic-packet`; README, “Download the single binary for your platform from the project releases”.
- **Evidence:** from a clean temporary directory, `cargo install diagnostic-packet --root <temp>` exited 101 with `could not find diagnostic-packet in registry crates-io`. `cargo search diagnostic-packet` returned no package. The GitHub releases API returned an empty array.
- **Impact:** the most prominent first action cannot produce the product, and the fallback release instruction has nothing to download.
- **Fix:** publish a tested crate and platform binaries, or replace both instructions with a repository build command that works from a clean clone. Add a claim test that installs through the exact public command and runs `diagnostic-packet --version`.

#### F-1-2 — The first screen does not answer what, for whom, and first action

- **Location / quote:** H1 “A bug report they can replay.”; deck “Collect the versions, hashes, redacted logs, and reproduction steps maintainers actually need—then inspect every byte before it leaves your machine.”
- **Impact:** the headline is a metaphor, the deck uses unexplained technical terms, and the intended user is absent. Three competing actions leave the first step ambiguous.
- **Fix:** use `Build a safe bug-report packet` as the H1; use `For developers reporting local failures, collect the logs and setup details maintainers need, then inspect every file before sharing.` as the deck; make `Try it with sample data` the sole primary action and state what opens.

#### F-1-3 — There is no compliant one-click CLI demo

- **Location / quote:** first-screen action “Walk through a packet”; nav “Live demo”; `/#demo`; direct `/demo`; CLI help.
- **Evidence:** `/demo` and `/?demo=1` both return the ordinary landing page and title. `diagnostic-packet demo` exits 2 with `unrecognized subcommand 'demo'` in an empty temporary directory and creates no files. The in-page control is scripted HTML, not a recording or execution of the binary. There is no “Demo — sample data, nothing is saved” banner, `Reset demo`, `Start for real`, or `.factory/demo.md`.
- **Impact:** a visitor cannot try the real CLI without installing and configuring it, and a verifier cannot exercise claims through an isolated demo entry point.
- **Fix:** ship realistic inputs under `examples/`, implement `diagnostic-packet demo` so it works in a temporary directory and prints its output path, add a self-hosted recording of that exact run, expose `/demo`, and add the required banner, Reset, Start for real, and `.factory/demo.md`.

#### F-1-4 — The required claim registry and tagged tests are absent

- **Location:** `.factory/claims.json` does not exist; `rg '@claim:'` finds no test tags.
- **Evidence:** there were no listed commands to run. The full clean-clone suite passed, but none of its tests is mapped to public claims as required.
- **Impact:** public privacy, safety, offline, packaging, and CLI-behavior statements are untracked and cannot be accepted as verified claims.
- **Fix:** add `.factory/claims.json`; give every claim below exactly one `@claim:<id>` test against the demo entry point; remove any claim that cannot be tested.

#### F-1-5 — Unknown routes masquerade as the product home page

- **Location:** `/does-not-exist` and `/demo`.
- **Evidence:** both return HTTP 200 with the home title and H1. There is no 404 source page or route.
- **Impact:** bad links look valid, deep-link errors are hidden, and `/demo` falsely appears to exist.
- **Fix:** return a designed broadsheet 404 with a home action and a real non-200 response where the host permits it; exclude valid product routes from fallback and add route tests.

### High — unlisted claims

Each row is a separate unlisted-claim finding. The quotes are grouped only when they express the same testable claim in multiple places.

| ID | Exact quote / location | Why unlisted; concrete fix |
| --- | --- | --- |
| F-1-6 | Landing: “No telemetry”, “Local only”, “inspect every byte before it leaves your machine”, “local by default”; README: “It has no telemetry, network calls, background process, or remote-support access”, “All work happens on the local machine”; Privacy: “does not collect, transmit, or sell personal data” | Add one CLI + browser network-interception claim test that runs the full demo and asserts no non-approved request or background process; narrow “every byte” to “every generated file”. |
| F-1-7 | Landing: “Diagnostic Packet turns that follow-up loop into a manifest your project can version and every reporter can preview.”; README: “A checked-in TOML manifest declares exactly what may be collected.” | Add a demo test that validates a checked-in manifest and compares the preview with the declared collectors. |
| F-1-8 | Landing: “Nothing runs”, “Preview runs nothing”, “Nothing was collected or executed”; README: “Preview never collects data or runs commands.” | Add `@claim:preview-read-only` that snapshots the temp directory and intercepts process execution before and after preview. |
| F-1-9 | Landing: “Run only allowlisted version checks you approve”, “Version commands use exact safe flags and still require approval during capture”; README: “Allowlisted tool-version commands require an explicit approval flag.” | Add `@claim:command-approval` covering approved, unapproved, and disallowed executable/argument cases. |
| F-1-10 | Landing: “Redact before writing”, “Tokens, emails, IP addresses, and home paths are replaced before evidence reaches the packet directory”; README: “Logs are truncated to the declared limit and redacted for secrets, emails, IP addresses, and home-directory paths.” | Add `@claim:redact-before-disk` and assert raw fixtures never occur anywhere in the review directory or ZIP. |
| F-1-11 | Landing: “Configuration collectors fingerprint lockfiles and settings without copying their contents”; README manifest description | Add `@claim:config-hash-only` and assert the digest exists while source content does not. |
| F-1-12 | Landing: “Collector types are closed and paths cannot escape the project root”; README: “Collector types are a closed allowlist…”, “Paths must stay inside the manifest's project directory”, “Sensitive environment names are rejected.” | Add one manifest-boundary claim test covering every accepted type plus traversal, unknown types, and sensitive names. |
| F-1-13 | Landing: “Review staged HTML, JSON, logs, sizes, and SHA-256 fingerprints”; README: “Inspect the exact staged files, sizes, hashes, and redaction counts.” | Add `@claim:inspection-ledger` that compares every reported file, size, hash, and count with disk. |
| F-1-14 | Landing: “Seal the unchanged review directory…”, “Any later change blocks export”; README: “Export only after inspection.” | Add `@claim:inspection-required` covering export before inspection, after mutation, and after clean inspection. |
| F-1-15 | Landing: “Includes readable report.html. No executable content”; README: “A staged packet contains `report.html`, `report.json`, `inspection.json`, and redacted evidence… The ZIP contains those same files and no executable content.” | Add `@claim:archive-contents` that opens the ZIP and asserts the exact safe file set and readable HTML. |
| F-1-16 | Landing: “This sample is fixed and stays in your browser”, “No upload performed”; README: “The site demo uses fixed sample data and stores nothing”; Privacy repeats both claims. | Add `@claim:demo-sandbox` using `/demo`, request interception, storage snapshots, Reset, and Start for real. The current scripted preview has no separate demo mode. |
| F-1-17 | Landing footer: “Works offline after first visit” and “Offline · docs and demo remain available”; Privacy says the documentation remains available offline. | Register the existing offline test as `@claim:offline-reload` and run it against the deployed demo route. |
| F-1-18 | Landing: “Single binary”; README: “Download the single binary for your platform”. | Add a release-artifact test for each advertised platform and verify each artifact contains one executable. No releases currently exist. |
| F-1-19 | Landing: “Free, open source…”; README license link and install statement | Add a claim entry that verifies the repository license and that every public installation path is free and reachable. |
| F-1-20 | README: “Every command supports `--help`”, four commands support `--json`, `--ci` disables prompts, and the three exit-code meanings. | Add a parameterized CLI contract test for every command, JSON parsing, CI behavior, and exit status. |
| F-1-21 | README: “`npm run build` creates the release binary in `dist/` and the deployable static documentation site in `dist/site/`.” | Register a clean-build claim test asserting both outputs. |
| F-1-22 | Privacy: “The documentation site has no analytics, advertising, cookies, accounts, or third-party scripts.” | Add a clean-context browser claim test for requests, cookies, storage, script origins, and account controls. |
| F-1-23 | Privacy: “clearing site data removes that cache.” | Add a service-worker claim test that clears site data and proves all product caches disappear. |
| F-1-24 | Landing: “Use the arrow keys to move between stages.” | Register the existing keyboard behavior as `@claim:demo-keyboard` and assert Left, Right, Home, and End. |

### Medium

#### F-1-25 — Route metadata is incomplete

- **Location:** `/`, `/privacy/`, `/terms/` heads.
- **Evidence:** titles, descriptions, `lang`, one H1, and one main are present. Canonical links, Open Graph metadata, Twitter card metadata, SVG favicon, and apple-touch icon are absent on every route. The live favicon URLs return 404.
- **Fix:** add route-specific canonical and social metadata, a 1200×630 product-art image, SVG favicon, and 180px apple-touch icon. Keep the current 60-character home title and legal titles.

#### F-1-26 — `robots.txt` and `sitemap.xml` are missing

- **Evidence:** both live URLs return 404, and neither file exists under `site/public`.
- **Fix:** publish `robots.txt` and a sitemap listing `/`, `/demo`, `/privacy/`, `/terms/`, and the designed 404 route where applicable.

#### F-1-27 — Header and footer are not consistent and omit required ownership/version data

- **Location:** landing versus Privacy and Terms.
- **Evidence:** legal headers replace the landing navigation with only “Back to product”; legal footers omit the product one-liner, GitHub, Param Factory credit, and version/build ID. The landing footer also omits Param Factory and version/build ID.
- **Fix:** use one route-aware header/footer skeleton everywhere, including Privacy and Terms, and add “Built by Param Factory” plus the release/build ID.

#### F-1-28 — Route changes do not focus or announce the new H1

- **Evidence:** after opening Privacy from the landing page, `document.activeElement` is `BODY`; the H1 has no `tabindex`, and there is no route-announcement live region. Browser Back restores the prior page but focus remains on `BODY`.
- **Fix:** on each client navigation focus an H1 with `tabindex="-1"` and announce its text in a polite live region; add forward/back tests.

#### F-1-29 — External links do not identify themselves to assistive technology

- **Location / quote:** “Source”, “Read the source ↗”, “GitHub”, and “public issue tracker”. The arrow on “Read the source” is `aria-hidden`.
- **Fix:** add visually hidden “(opens GitHub)” text or equivalent accessible names and safe external-link attributes.

#### F-1-30 — Landing sections do not follow the required information order

- **Location:** `#workflow` appears before `#demo`.
- **Impact:** visitors read instructions before seeing the product itself; the standard skeleton requires the live preview before “How it works”.
- **Fix:** place the real demo immediately after the first screen, then the three-step explanation.

#### F-1-31 — “Four deliberate steps. No background surprises.” is a vague heading

- **Why:** “deliberate” is an unproved marketing adjective and the heading does not identify the task out of context.
- **Rewrite:** `Create a packet in four steps.`

#### F-1-32 — Export copy uses metaphor and marketing adjectives

- **Location / quote:** “Seal the unchanged review directory into a portable, self-contained ZIP.”
- **Why:** “seal”, “portable”, and “self-contained” obscure the observable result.
- **Rewrite:** `Export the inspected files as a ZIP.`

#### F-1-33 — “Private by construction.” is an abstract, untestable heading

- **Rewrite:** `Redact evidence before saving.`

#### F-1-34 — “Version the questions you always ask.” uses “version” as jargon

- **Rewrite:** `Save a collection checklist in your project.`

#### F-1-35 — README contains a 27-word sentence

- **Quote:** “The CLI previews that plan, captures redacted evidence into a local directory, lets you inspect every file, and only then exports a self-contained ZIP with readable HTML.”
- **Rewrite:** `The CLI previews the plan and captures redacted evidence locally. You inspect every file before exporting a ZIP with an HTML report.`

### Low

#### F-1-36 — “Start again” does not name the result

- **Location:** final demo-stage button.
- **Rewrite:** `Reset demo`.

#### F-1-37 — README opening uses jargon and unsupported adjectives

- **Quote:** “Diagnostic Packet is a local-first CLI for turning a hard-to-reproduce development failure into a safe, inspectable handoff.”
- **Rewrite:** `Diagnostic Packet is a command-line tool that collects and redacts the evidence needed to report a local development failure.`

#### F-1-38 — README introduces the manifest with unexplained implementation language

- **Quote:** “A checked-in TOML manifest declares exactly what may be collected.”
- **Rewrite:** `A TOML file in your project lists the data the tool may collect.`

#### F-1-39 — README uses “collector” before explaining it

- **Quote:** “Review every proposed collector.”
- **Rewrite:** `Review every proposed item before capture.`

#### F-1-40 — README combines two unexplained terms

- **Quote:** “Allowlisted tool-version commands require an explicit approval flag.”
- **Rewrite:** `You must approve each supported version command before capture.`

#### F-1-41 — README uses “closed allowlist” where a direct statement is clearer

- **Quote:** “Collector types are a closed allowlist…”
- **Rewrite:** `The tool supports only these five collection types: …`

#### F-1-42 — The same concepts use inconsistent terms

| Concept | Current terms | Use consistently |
| --- | --- | --- |
| Try-out | Live demo, sample, site demo, proof desk, walk through a packet | demo; `Try it with sample data` |
| Staging location | local directory, review directory, packet directory, staged files, staged packet | review folder |
| Export | packet, ZIP, archive, self-contained ZIP | packet ZIP |
| Collected item | collector, collection type, evidence item | collection item in prose; collector only in TOML/API reference |

#### F-1-43 — One legal-page link misses the 44px target baseline

- **Location:** Privacy, inline “public issue tracker”.
- **Evidence:** its live box is 145×17px at phone and 154×18px at desktop. Axe reports no violation because inline links have a WCAG exception, but the attached product baseline requires 44px targets.
- **Fix:** render it as a separate 44px-tall link or add adequate block padding without disrupting the sentence.

## Complete copy audit

Word counts treat hyphenated compounds as one word. The landing prose averages **7.4 words** and has no sentence above 22 words. README prose averages **11.5 words**; one sentence exceeds 22 words (F-1-35). No banned plain-words terms were found. Copy-quality flags are F-1-2, F-1-3, and F-1-31 through F-1-42; claim flags are F-1-6 through F-1-24.

### Landing-page sentences

| # | Words | Sentence |
| ---: | ---: | --- |
| 1 | 21 | Collect the versions, hashes, redacted logs, and reproduction steps maintainers actually need—then inspect every byte before it leaves your machine. |
| 2 | 6 | Scattered local evidence, assembled for review. |
| 3 | 12 | “Which version? Which config? Can you send the log—without the token?” |
| 4 | 18 | Diagnostic Packet turns that follow-up loop into a manifest your project can version and every reporter can preview. |
| 5 | 9 | Validate the manifest and print the exact collection plan. |
| 6 | 2 | Nothing runs. |
| 7 | 7 | Run only allowlisted version checks you approve. |
| 8 | 3 | Redact before writing. |
| 9 | 9 | Review staged HTML, JSON, logs, sizes, and SHA-256 fingerprints. |
| 10 | 10 | Seal the unchanged review directory into a portable, self-contained ZIP. |
| 11 | 9 | This sample is fixed and stays in your browser. |
| 12 | 8 | Use the arrow keys to move between stages. |
| 13 | 2 | Preview completed. |
| 14 | 5 | Nothing was collected or executed. |
| 15 | 3 | CAPTURED system.txt |
| 16 | 3 | CAPTURED node.txt |
| 17 | 3 | HASHED package-lock.json |
| 18 | 3 | REDACTED editor.log |
| 19 | 3 | Inspection marker written. |
| 20 | 5 | Any later change blocks export. |
| 21 | 4 | Includes readable report.html. |
| 22 | 3 | No executable content. |
| 23 | 3 | No upload performed. |
| 24 | 5 | Could not preview this manifest. |
| 25 | 7 | Path ../private.env leaves the project directory. |
| 26 | 11 | Use a relative path inside the manifest folder, then preview again. |
| 27 | 15 | Tokens, emails, IP addresses, and home paths are replaced before evidence reaches the packet directory. |
| 28 | 10 | Configuration collectors fingerprint lockfiles and settings without copying their contents. |
| 29 | 3 | Preview runs nothing. |
| 30 | 12 | Version commands use exact safe flags and still require approval during capture. |
| 31 | 11 | A project-owned TOML file turns maintainer knowledge into a repeatable checklist. |
| 32 | 11 | Collector types are closed and paths cannot escape the project root. |
| 33 | 7 | Free, open source, and local by default. |
| 34 | 9 | Built for the moment a bug leaves one machine. |

### Landing headings, actions, facts, and labels

| Words | Copy | Kind |
| ---: | --- | --- |
| 5 | Open packet format · No telemetry | Eyebrow |
| 6 | A bug report they can replay. | H1 |
| 2 | Copy command | Button, twice |
| 4 | Walk through a packet | Primary link |
| 3 | Read the source | Link |
| 2 each | Local only; Explicit consent; Single binary | Facts |
| 3 | The missing context | Section label |
| 2 | 01 / Method | Section label |
| 6 | Four deliberate steps. No background surprises. | H2 |
| 1 each | Preview; Capture; Inspect; Export | H3 and tabs |
| 3 | 02 / Proof desk | Section label |
| 4 | See what gets collected. | H2 |
| 3–4 | Approve and capture; Test an unsafe path; Inspect staged files; Export packet ZIP | Buttons |
| 2 | Start again | Button |
| 3 | 03 / Redaction desk | Section label |
| 3 | Private by construction. | H2 |
| 3 each | Redact before disk; Hash, don’t copy; Consent is explicit | H3 |
| 3 | 04 / The manifest | Section label |
| 6 | Version the questions you always ask. | H2 |
| 4 each | OS family and architecture; Approved version commands only; SHA-256 without file content; Bounded, redacted text copy; Explicit safe variable names | Definitions |
| 3 | Download starter manifest | Button |
| 5 | Ready for the next incident | Section label |
| 4 | Send evidence. Not guesswork. | H2 |
| 5 | Works offline after first visit | Footer status |
| 6 | Offline · docs and demo remain available | Footer status |
| 1–3 | Diagnostic Packet; How it works; Live demo; Manifest; Source; Privacy; Terms; GitHub | Navigation/product labels |

### README sentences and headings

| # | Kind | Words | Copy |
| ---: | --- | ---: | --- |
| 1 | H1 | 2 | Diagnostic Packet |
| 2 | Sentence | 17 | Diagnostic Packet is a local-first CLI for turning a hard-to-reproduce development failure into a safe, inspectable handoff. |
| 3 | Sentence | 10 | A checked-in TOML manifest declares exactly what may be collected. |
| 4 | Sentence | 27 | The CLI previews that plan, captures redacted evidence into a local directory, lets you inspect every file, and only then exports a self-contained ZIP with readable HTML. |
| 5 | Sentence | 16 | It is for developers reporting CLI, editor, workspace, or environment failures to a teammate or maintainer. |
| 6 | Sentence | 11 | It has no telemetry, network calls, background process, or remote-support access. |
| 7 | H2 | 1 | Install |
| 8 | Sentence | 18 | Download the single binary for your platform from the project releases, or build it with Rust 1.85+: |
| 9 | H2 | 1 | Usage |
| 10 | Sentence | 8 | Create a starter manifest in the current project: |
| 11 | Sentence | 4 | Review every proposed collector. |
| 12 | Sentence | 7 | Preview never collects data or runs commands: |
| 13 | Sentence | 5 | Capture into a review directory. |
| 14 | Sentence | 8 | Allowlisted tool-version commands require an explicit approval flag: |
| 15 | Sentence | 10 | Inspect the exact staged files, sizes, hashes, and redaction counts: |
| 16 | Sentence | 4 | Export only after inspection: |
| 17 | Sentence | 4 | Every command supports `--help`. |
| 18 | Sentence | 9 | `preview`, `capture`, `inspect`, and `export` support `--json` for scripts. |
| 19 | Sentence | 14 | Add `--ci` to disable prompts; capture then fails unless command execution was explicitly approved. |
| 20 | Sentence | 19 | Exit code `0` means success, `2` means invalid or unsafe input, and `1` means collection or I/O failure. |
| 21 | H3 | 1 | Manifest |
| 22 | Sentence | 12 | Collector types are a closed allowlist: `system`, `tool-version`, `config-hash`, `log`, and `environment`. |
| 23 | Sentence | 8 | Paths must stay inside the manifest's project directory. |
| 24 | Sentence | 19 | Tool commands are argument arrays—never shell strings—and the executable must be in Diagnostic Packet's built-in version-tool allowlist. |
| 25 | Sentence | 17 | Logs are truncated to the declared limit and redacted for secrets, emails, IP addresses, and home-directory paths. |
| 26 | Sentence | 5 | Sensitive environment names are rejected. |
| 27 | H2 | 3 | Develop and verify |
| 28 | Sentence | 18 | `npm run build` creates the release binary in `dist/` and the deployable static documentation site in `dist/site/`. |
| 29 | Sentence | 8 | Run the site locally with `npm run dev`. |
| 30 | Sentence | 16 | Create the ready-to-publish crate with `cargo package --locked`; registry credentials and publishing remain with the factory. |
| 31 | H2 | 4 | Privacy and packet format |
| 32 | Sentence | 7 | All work happens on the local machine. |
| 33 | Sentence | 15 | A staged packet contains `report.html`, `report.json`, `inspection.json`, and redacted evidence under `evidence/`. |
| 34 | Sentence | 10 | The ZIP contains those same files and no executable content. |
| 35 | Sentence | 10 | Review the directory before exporting and the ZIP before sharing. |
| 36 | Sentence | 10 | The site demo uses fixed sample data and stores nothing. |
| 37 | H2 | 1 | Project |
| 38 | List item | 6 | Product site: https://dev-diagnostic-packet.sociobot.in |
| 39 | List item | 3 | Changelog: CHANGELOG.md |
| 40 | List item | 2 | License: MIT |

Code blocks are excluded from sentence counts; their introductory sentences are included. The README has no buttons.

## Demo and sandbox evidence

| Check | Result |
| --- | --- |
| Required one-click label | FAIL — no “Try it with sample data” |
| First screen after landing action | PARTIAL — hash link scrolls to a realistic manifest preview, but it is a scripted web mock rather than the CLI |
| Direct demo URL | FAIL — `/demo` and `?demo=1` show home |
| Real CLI demo | FAIL — `diagnostic-packet demo` is unknown |
| Persistent banner | FAIL |
| Reset demo | FAIL — “Start again” only cycles the mock; no named sandbox reset |
| Start for real | FAIL |
| Isolated storage namespace | FAIL — no demo mode or namespace exists |
| Browser storage during mock flow | PASS as observed — localStorage, sessionStorage, IndexedDB, and cookies stayed empty; only the service-worker cache existed |
| Browser network during mock flow | PASS as observed — requests were same-origin only |
| Offline reload | PASS — after worker activation, the live page and preview reloaded offline with no console errors |
| Real data untouched | UNTESTABLE for the required CLI demo because that entry point does not exist |

## Claims and clean-clone test evidence

There is no `.factory/claims.json`, so **zero listed claim commands** existed to run and all public claims remain outside the required registry.

From clean clone `/tmp/dp-review-clean-MBde75`:

- `npm ci`: PASS, 0 vulnerabilities.
- `npm test`: PASS — 7 Rust unit, 3 CLI integration, 18 Playwright tests.
- `npm run build`: PASS — `dist/diagnostic-packet` and `dist/site/` produced.
- `cargo clippy --all-targets --all-features -- -D warnings`: PASS.
- Live/local SHA-256: PASS for home HTML and main JS.
- Exact public install command: FAIL as F-1-1.

## Structure, accessibility, and link checks

- Live `/`, `/privacy/`, and `/terms/`: one H1, one main, `lang=en`, no console/page errors.
- Axe on all three routes at phone and desktop: zero violations at any impact level.
- 390px layout: no horizontal overflow; all landing controls measured at least 44px.
- Privacy inline issue link: below the attached 44px product baseline (F-1-43).
- Keyboard: skip link and demo tabs work; focus styling is visible; ArrowRight changes stages.
- Reduced motion and live offline reload: existing clean-clone tests pass.
- Link crawl: all unique links from `/`, `/privacy/`, and `/terms/` return 200; no dead linked URL found.
- Visual identity: PASS. The cream stock, black rules, serif broadsheet typography, red proof marks, generated evidence still life, and squared controls match `.factory/design.md` and do not resemble a generic SaaS template.
- Asset budgets: 5,555-byte JS and 13,475-byte CSS; no third-party hosts observed.

## Earlier-review and handoff audit

No earlier `.factory/review-*.md` or `.factory/polish-*.md` existed. I read the prior handoff and both verification reports, then checked their defects in the live site and code.

| Earlier item | Current verification |
| --- | --- |
| Verification 1 critical: bare default manifest path failed | FIXED — `manifest.rs` treats an empty parent as `.`, and the clean integration test `default_command_sequence_builds_an_inspected_archive` passes. |
| Verification 1 high: offline reload failed | FIXED — live service-worker activation followed by offline reload works; generated worker precaches JS/CSS and uses `event.waitUntil`. |
| Verification 1 medium: immutable asset caching absent | FIXED — live hashed JS returns `Cache-Control: public, max-age=31536000, immutable`. |
| Verification 1 low: CSP and Permissions-Policy absent | FIXED — both are present live and in `staticwebapp.config.json`. |
| Handoff limitation: macOS/Windows/Linux release automation remains future work | UNFIXED and now blocking under F-1-1 — there are no GitHub releases and the crate is not on crates.io. |
| Handoff verdict “PASS — no defects” | NOT CONFIRMED under this review contract because F-1-1 through F-1-43 remain. |

No earlier finding had an `F-*` identifier to carry forward unchanged.

## What would make this perfect

Publish an installable release; make the first screen name the job, user, and one sample-data action; implement the real isolated CLI demo; register and test every public claim; add a genuine 404 and complete route metadata; unify navigation/footer/focus behavior; then apply every copy rewrite above. Re-run this entire checklist from fresh contexts and a clean clone. The acceptable result is zero findings and zero untested claims.
