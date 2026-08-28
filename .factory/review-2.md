# Adversarial first-read review 2 — Diagnostic Packet

- Work order: `dev-diagnostic-packet-review-2`
- Base reviewed: `806d03a18aa87346844bdf26986b86967481bbdd`
- Live URL: <https://dev-diagnostic-packet.sociobot.in>
- Review date: 2026-08-28 UTC
- Viewports: 390×844 and 1440×900, fresh Chromium contexts

## Verdict: FAIL

The first screen is now clear, the public source install works, the CLI demo is isolated from its launch directory, links are live, and the visual identity is specific to this product. The review still has **18 blocking findings, 10 high findings, 2 medium findings, and 5 low findings**. Most blockers are earlier claim findings whose new tagged tests pass without asserting the whole registered promise. PASS requires zero findings and no untested claim.

## Thirty-second cold read

Before scrolling, at both viewports:

- **What does it do?** It builds a bug-report packet from local logs and setup details, with inspection before sharing.
- **For whom?** Developers reporting local failures to maintainers.
- **What should I click first?** `Try it with sample data`; the adjacent note says it opens the bundled sample packet.

The exact first-screen copy was `Build a safe bug-report packet`, `For developers reporting local failures, collect the logs and setup details maintainers need, then inspect every file before sharing.`, and `Try it with sample data`. All three answers are available without scrolling at 390×844 and 1440×900.

## Findings

### Blocking — earlier findings still incomplete

#### F-1-3 — The landing-page CLI demo is still a scripted simulation

- **Exact location / quote:** landing `#demo`, `The command-line demo creates this packet in a new temporary folder.`
- **Evidence:** the one-click route shows realistic sample data and the required banner, but `site/src/main.ts` supplies hard-coded HTML strings for Preview, Capture, Inspect, and Export. There is no self-hosted terminal recording made from the real binary. The prior fix required both that recording and `diagnostic-packet demo`; only the latter exists.
- **Impact:** the screen says it is showing the command-line demo without showing observable output from a real run.
- **Fix:** record the real bundled CLI demo end to end, self-host that recording on the landing page, and keep the interactive explainer clearly labelled as a simulation if it remains.

#### F-1-6 — `local-only` still does not test its privacy claim

- **Quote / test:** `The CLI makes no network requests and writes only to local files.`; `@claim:local-only` only checks that demo output mentions bundled data and that a ZIP exists.
- **Why blocking:** it observes neither network access nor writes outside an allowed temporary root.
- **Fix:** run the binary with networking denied/intercepted and filesystem writes audited; fail on any socket or path outside the sandbox.

#### F-1-7 — `manifest-plan` does not prove the listed plan

- **Quote / test:** `A TOML manifest lists the collection items before capture.`; the test asserts only `{ valid: true, collector_count: 4 }`.
- **Why blocking:** a count does not prove that the four declared item names, types, paths, and commands are listed before capture.
- **Fix:** compare the complete preview output with every manifest entry and confirm no review output exists.

#### F-1-8 — `preview-read-only` does not prove that commands and evidence reads are absent

- **Quote / test:** `Preview reads nothing and runs no commands.`; the test checks only that `.diagnostic-packet` was not created.
- **Why blocking:** a command could run or another path could be read/written while this assertion still passes.
- **Fix:** instrument process execution and filesystem access, allowing only the manifest read, and assert zero collector reads, child processes, and writes.

#### F-1-9 — `command-approval` covers only rejection

- **Quote / test:** `Supported version commands run only after approval.`; the test verifies one unapproved CI capture fails.
- **Why blocking:** it does not show that an approved supported command runs, or that unsupported command/argument combinations remain blocked.
- **Fix:** cover approved success, unapproved rejection, unknown executable rejection, and unsafe-argument rejection in the tagged test.

#### F-1-10 — `redact-before-disk` checks too little and only after writing

- **Quote / test:** `Common secrets are redacted before copied logs reach the review folder.`; the test checks that one email and one token are absent from final evidence.
- **Why blocking:** landing copy also promises IP-address and home-path replacement, and the test cannot detect raw values written temporarily before replacement.
- **Fix:** test all advertised redaction classes and audit every write in the staging/review tree so raw fixture values never reach disk or the ZIP.

#### F-1-11 — `config-hash-only` does not validate the fingerprint

- **Quote / test:** `Configuration items record a SHA-256 fingerprint instead of file contents.`; the test looks for `SHA-256 recorded` and the unrelated literal `package-lock.json\": {}`.
- **Why blocking:** any bogus digest and most copied file content would pass.
- **Fix:** calculate the fixture SHA-256 independently, assert exact equality, and assert that the complete fixture bytes occur nowhere in review output or the ZIP.

#### F-1-12 — `manifest-boundaries` tests only one traversal string

- **Quote / test:** `Only supported collection types and project-relative paths are accepted.`; the test replaces one log path with `../outside.log`.
- **Why blocking:** accepted types, unknown types, absolute paths, symlink escapes, unsafe commands, and sensitive environment names are not asserted by the tagged test.
- **Fix:** parameterize all supported and rejected boundaries, including symlink resolution.

#### F-1-13 — `inspection-ledger` does not compare the ledger with disk

- **Quote / test:** `Inspection reports each review file, size, and SHA-256 fingerprint.`; the test only validates the shape of entries already in `inspection.json`.
- **Why blocking:** omitted files and invented sizes or hashes still pass.
- **Fix:** enumerate the review folder independently and compare exact file set, byte size, and calculated SHA-256 for every entry.

#### F-1-14 — `inspection-required` covers only one mutation case

- **Quote / test:** `Export works only after inspection and blocks changed review files.`; the test checks only a changed `report.json`.
- **Why blocking:** export-before-inspection and successful export of an unchanged inspected folder are untested.
- **Fix:** assert all three states: before inspection fails, unchanged after inspection succeeds, and every post-inspection mutation fails.

#### F-1-15 — `archive-contents` permits uninspected and unsafe content

- **Quote / test:** `The packet ZIP contains the inspected report and redacted evidence, not executables.`; the test checks for two names and rejects only five executable suffixes.
- **Why blocking:** extra uninspected files, raw evidence, and executables without those suffixes can pass.
- **Fix:** compare the ZIP with the exact inspection ledger, verify report readability and redacted fixture content, and reject every file not approved by inspection.

#### F-1-16 — Reset and Start for real do not discard demo state

- **Exact location:** live demo banner and `site/src/main.ts:109-112`.
- **Evidence:** after Capture, `Reset demo` removes the key and immediately calls `showStage('preview')`, which recreates `demo:diagnostic-packet:stage=preview`. `Start for real` returns home with that key still present. A pre-seeded `real:user-setting=keep-me` remained unchanged, so namespace isolation itself works.
- **Impact:** leaving demo mode does not discard demo data as promised by the demo contract, and the tagged test explicitly expects persistence instead of cleanup.
- **Fix:** reset in memory without rewriting storage; clear every `demo:diagnostic-packet:*` key before leaving; test unrelated real keys before and after both actions.

#### F-1-19 — `free-source-install` does not run the public install

- **Quote / test:** `The source install command is free and builds the documented binary.`; the test checks DOM text and accepts an existing local debug binary.
- **Why blocking:** the tagged test can pass when the public Git URL or release build is broken. The reviewer manually ran the exact command successfully, but the claim must remain automatically provable.
- **Fix:** install from the public Git URL into a fresh temporary root, then run the installed binary's version and demo commands; also assert the MIT license for the open-source claim.

#### F-1-20 — `cli-contract` checks only a fraction of the documented CLI

- **Quote / test:** `CLI commands have help, JSON output where documented, CI-safe approval, and documented exit codes.`; the test checks root help plus `init` and `preview --json`.
- **Why blocking:** subcommand help, capture/inspect/export JSON, CI approval behavior, and exit codes 0/1/2 are not covered.
- **Fix:** make the tagged test parameterized over every documented command, format, approval state, and exit status.

#### F-1-21 — `clean-build` is not a clean-build test

- **Quote / test:** `npm run build creates dist/diagnostic-packet and dist/site/.`; the test accepts `target/debug/diagnostic-packet` as a substitute for the release binary.
- **Why blocking:** it runs after earlier build steps and can pass without `dist/diagnostic-packet`.
- **Fix:** remove only known build outputs in a fresh checkout, run `npm run build`, and require both exact `dist` outputs.

#### F-1-22 — `site-private` proves only same-origin requests and no cookies

- **Quote / test:** `The documentation site has no analytics, cookies, accounts, or third-party scripts.`
- **Why blocking:** the test would allow same-origin analytics and does not inspect script origins, storage, account UI, or tracking endpoints.
- **Fix:** exercise the full demo, enumerate scripts and requests, assert the documented demo-only storage namespace, and assert no analytics/account identifiers or controls.

#### F-1-23 — `clear-cache` deletes the cache itself and then observes deletion

- **Quote / test:** `Clearing site data removes the documentation cache.`; the test executes `caches.delete` directly.
- **Why blocking:** this is tautological and does not exercise the browser's clear-site-data action.
- **Fix:** clear origin storage through the browser/CDP mechanism a user or verifier relies on, reload, and assert cache, service-worker registration, and demo storage are gone.

#### F-1-25 — Route social metadata remains incomplete

- **Exact location:** live `/demo/`, `/privacy/`, `/terms/`, and unknown-route 404 documents.
- **Evidence:** Demo, Privacy, and Terms lack `og:url` plus Twitter title, description, and image. The 404 lacks Open Graph, Twitter, and apple-touch metadata entirely.
- **Impact:** the earlier “every route” metadata finding was only partly fixed.
- **Fix:** add the complete route-specific Open Graph/Twitter set and icons to every published document, and assert all required fields per route.

### High — unlisted claims

#### F-2-1 — “Safe” is an unlisted, absolute claim

- **Quote / location:** title `Diagnostic Packet — Safe bug-report packets`; H1 `Build a safe bug-report packet`.
- **Why:** the Terms page correctly says automatic redaction is not a guarantee, but no claim defines or proves “safe.”
- **Fix:** use `Collect and redact bug-report evidence` in the H1/title, or define a bounded safety claim and test every stated boundary.

#### F-2-2 — CLI demo isolation is unlisted

- **Quote / location:** landing `The command-line demo creates this packet in a new temporary folder.`; README `Try the bundled sample without touching your project:`
- **Fix:** add `cli-demo-isolation` and assert an empty launch directory stays byte-for-byte unchanged while outputs appear only below a fresh OS temporary directory.

#### F-2-3 — Starter-manifest creation is unlisted

- **Quote / location:** README `Create a starter manifest in the current project:` followed by `diagnostic-packet init`.
- **Fix:** add a claim test that checks the documented file contents and refusal to overwrite an existing manifest.

#### F-2-4 — Log truncation is unlisted

- **Quote / location:** README `Logs stop at the declared limit ...`
- **Fix:** add a quantitative fixture larger than `max_bytes` and assert the copied evidence stops at that limit without breaking redaction.

#### F-2-5 — Sensitive environment-name rejection is unlisted

- **Quote / location:** README `Sensitive environment names are rejected.`
- **Fix:** register the rule and test representative secret-like names plus allowed names.

#### F-2-6 — Ready-to-publish packaging is unlisted

- **Quote / location:** README `Create the ready-to-publish crate with cargo package --locked ...`
- **Fix:** add a packaging claim that runs `cargo package --locked` in a clean checkout and inspects the package, or replace “ready-to-publish” with a non-claiming build instruction.

#### F-2-7 — Background-process and remote-support claims are unlisted

- **Quote / location:** README `It has no telemetry, network calls, background process, or remote-support access.`
- **Fix:** expand `local-only` to name and test process lifetime and listening/network behavior, or remove the two untested clauses.

#### F-2-8 — Open-format and open-source claims are unlisted

- **Quote / location:** landing `Open packet format · No telemetry` and `Free and open source`.
- **Fix:** add a claim that validates the MIT license and a documented, parseable packet-format specification, or remove “open packet format.”

#### F-2-9 — Rust 1.85 compatibility is an unlisted quantitative claim

- **Quote / location:** README `Build from this repository with Rust 1.85+:`
- **Fix:** compile in CI with the exact minimum toolchain and register the claim, or omit the minimum version.

#### F-2-10 — Starter-manifest download is an unlisted product action

- **Quote / location:** landing button `Download starter manifest`.
- **Fix:** add a browser claim that captures the download and parses the resulting TOML, including filename and required fields.

### Medium

#### F-2-11 — The same SHA-256 concept has two names

- **Locations:** landing uses `fingerprint`; README uses `hashes`; the schema calls the type `config-hash`.
- **Impact:** the terminology table omits this inconsistency.
- **Fix:** use `SHA-256 hash` in prose and retain `config-hash` only as the literal schema value.

#### F-2-12 — Demo-banner controls miss the 44 px touch baseline

- **Evidence:** at 390 px, `Reset demo` is 98×36 px and `Start for real` is 100×36 px. The desktop `Demo` nav target is 42×44 px.
- **Fix:** give every control a minimum rendered size of 44×44 px and remeasure both viewports.

### Low — copy and audit quality

#### F-2-13 — TOML is introduced as unexplained jargon

- **Quotes:** `Check the TOML list.` and `A TOML file names each collection item.`
- **Rewrite:** `Check the project checklist in diagnostic-packet.toml.` and `The diagnostic-packet.toml text file names each collection item.`

#### F-2-14 — `--ci` is unexplained jargon

- **Quote:** README `Add --ci to disable prompts.`
- **Rewrite:** `For automated builds, add --ci to disable prompts.`

#### F-2-15 — `I/O` and “ready-to-publish crate” are avoidable jargon

- **Quotes:** `Exit code 1 means collection or I/O failure.` and `Create the ready-to-publish crate ...`
- **Rewrite:** `Exit code 1 means collection or file read/write failure.` and `Check the Rust package with cargo package --locked.`

#### F-2-16 — “Start for real” does not name its result

- **Location:** demo banner. It only links to `/`.
- **Rewrite/behavior:** use `Install the CLI`, clear demo storage, and link directly to the install command.

#### F-2-17 — The repository copy audit is incomplete and stale

- **Location:** `.factory/copy-audit.md` lists 12 combined landing rows, omits the README, and counts the 19-word deck as 18 words. It also omits `in copied logs` from the live redaction sentence.
- **Fix:** regenerate it from current rendered/static/dynamic copy, with one row per sentence and the terminology/flag tables below.

## Complete copy audit

Counts treat a hyphenated term as one word. Code blocks are excluded, while their introductory sentences are included. No sentence exceeds 22 words and no banned marketing word appears. `U`, `J`, and `T` refer to unlisted-claim, jargon, and terminology findings above.

### Landing-page sentences

| # | Words | Sentence | Flag |
| ---: | ---: | --- | --- |
| 1 | 19 | For developers reporting local failures, collect the logs and setup details maintainers need, then inspect every file before sharing. | — |
| 2 | 5 | Opens the bundled sample packet. | — |
| 3 | 5 | Local evidence, ready for review. | — |
| 4 | 11 | The command-line demo creates this packet in a new temporary folder. | U: F-2-2 |
| 5 | 2 | Preview completed. | — |
| 6 | 5 | Nothing was collected or executed. | Claim gap: F-1-8 |
| 7 | 3 | Inspection marker written. | — |
| 8 | 5 | Any later change blocks export. | Claim gap: F-1-14 |
| 9 | 3 | Includes readable report.html. | Claim gap: F-1-15 |
| 10 | 3 | No executable content. | Claim gap: F-1-15 |
| 11 | 3 | No upload performed. | Claim gap: F-1-6 |
| 12 | 5 | Could not preview this manifest. | — |
| 13 | 6 | Path ../private.env leaves the project directory. | — |
| 14 | 11 | Use a relative path inside the manifest folder, then preview again. | — |
| 15 | 4 | Check the TOML list. | J: F-2-13 |
| 16 | 7 | Preview reads nothing and runs no commands. | Claim gap: F-1-8 |
| 17 | 4 | Approve supported version checks. | Claim gap: F-1-9 |
| 18 | 5 | Redact logs before saving them. | Claim gap: F-1-10 |
| 19 | 8 | Check each file, size, fingerprint, and redaction count. | T: F-2-11 |
| 20 | 8 | Export the inspected files as a packet ZIP. | Claim gap: F-1-14/F-1-15 |
| 21 | 12 | Emails, IP addresses, tokens, and home paths are replaced in copied logs. | Claim gap: F-1-10 |
| 22 | 10 | Configuration items record a SHA-256 fingerprint instead of file contents. | T; claim gap: F-1-11 |
| 23 | 10 | Only supported version commands can run, and only after approval. | Claim gap: F-1-9 |
| 24 | 7 | A TOML file names each collection item. | J: F-2-13 |
| 25 | 7 | It cannot use paths outside your project. | Claim gap: F-1-12 |
| 26 | 4 | Then run diagnostic-packet demo. | — |
| 27 | 7 | Collect and redact evidence for local failures. | — |
| 28 | 10 | Demo — sample data, nothing is saved to your project. | Claim gap: F-1-16 |

### Landing headings, labels, facts, and actions

| Words | Copy | Result |
| ---: | --- | --- |
| 5 | Open packet format · No telemetry | U: F-2-8; claim gap F-1-6 |
| 6 | Build a safe bug-report packet | U: F-2-1 |
| 5 | Try it with sample data | Clear result-naming action |
| 2–4 | No telemetry; Local review folder; Free and open source | Privacy/storage/price facts; F-1-6 and F-2-8 |
| 4 | Review the bundled sample | Clear H2 |
| 1 each | Preview; Capture; Inspect; Export | Clear stage labels |
| 2–4 | Capture sample; Test an unsafe path; Inspect review files; Export packet ZIP; Reset demo | Clear result/action names |
| 7 | Create a packet in four steps | Clear H2 |
| 5 | Redact evidence before saving | Clear H2 |
| 3 / 3 / 2 | Replace common secrets; Record a fingerprint; Approve commands | Clear H3s; `fingerprint` has F-2-11 |
| 7 | Save a collection checklist in your project | Clear H2 |
| 3 / 4 | Run it locally; Start with the sample | Clear labels |
| 2 / 3 | Copy command; Download starter manifest | Verb + result; download has F-2-10 |
| 2 | Reset demo | Clear result; behavior fails F-1-16 |
| 3 | Start for real | Not result-naming: F-2-16 |

### README sentences

| # | Words | Sentence | Flag |
| ---: | ---: | --- | --- |
| 1 | 19 | Diagnostic Packet is a command-line tool that collects and redacts the evidence needed to report a local development failure. | — |
| 2 | 13 | A TOML file in your project lists the data the tool may collect. | J: F-2-13 |
| 3 | 10 | The CLI previews the plan and captures redacted evidence locally. | — |
| 4 | 13 | You inspect every file before exporting a packet ZIP with an HTML report. | Claim gaps: F-1-13–F-1-15 |
| 5 | 16 | It is for developers reporting CLI, editor, workspace, or environment failures to a teammate or maintainer. | — |
| 6 | 11 | It has no telemetry, network calls, background process, or remote-support access. | U: F-2-7; claim gap F-1-6 |
| 7 | 7 | Build from this repository with Rust 1.85+: | U: F-2-9 |
| 8 | 8 | Create a starter manifest in the current project: | U: F-2-3 |
| 9 | 8 | Try the bundled sample without touching your project: | U: F-2-2 |
| 10 | 4 | Review every proposed item. | — |
| 11 | 7 | Preview never collects data or runs commands: | Claim gap: F-1-8 |
| 12 | 5 | Capture into a review folder. | — |
| 13 | 9 | You must approve each supported version command before capture: | Claim gap: F-1-9 |
| 14 | 10 | Inspect the review folder's files, sizes, hashes, and redaction counts: | T; claim gap F-1-13 |
| 15 | 4 | Export only after inspection: | Claim gap: F-1-14 |
| 16 | 4 | Every command supports --help. | Claim gap: F-1-20 |
| 17 | 9 | preview, capture, inspect, and export support --json for scripts. | Claim gap: F-1-20 |
| 18 | 5 | Add --ci to disable prompts. | J: F-2-14; claim gap F-1-20 |
| 19 | 8 | Capture then fails unless command execution was approved. | Claim gap: F-1-9/F-1-20 |
| 20 | 5 | Exit code 0 means success. | Claim gap: F-1-20 |
| 21 | 8 | Exit code 2 means invalid or unsafe input. | Claim gap: F-1-20 |
| 22 | 8 | Exit code 1 means collection or I/O failure. | J: F-2-15; claim gap F-1-20 |
| 23 | 14 | The tool supports only these five collection types: system, tool-version, config-hash, log, and environment. | Claim gap: F-1-12 |
| 24 | 7 | Paths stay inside the manifest's project directory. | Claim gap: F-1-12 |
| 25 | 8 | Tool commands are argument arrays, never shell strings. | Claim gap: F-1-12 |
| 26 | 15 | Logs stop at the declared limit and redact secrets, emails, IP addresses, and home paths. | U: F-2-4; claim gap F-1-10 |
| 27 | 5 | Sensitive environment names are rejected. | U: F-2-5 |
| 28 | 17 | npm run build creates the release binary in dist/ and the deployable static documentation site in dist/site/. | Claim gap: F-1-21 |
| 29 | 8 | Run the site locally with npm run dev. | — |
| 30 | 16 | Create the ready-to-publish crate with cargo package --locked; registry credentials and publishing remain with the factory. | U: F-2-6; J: F-2-15 |
| 31 | 7 | All work happens on the local machine. | Claim gap: F-1-6 |
| 32 | 12 | A review folder contains report.html, report.json, inspection.json, and redacted evidence under evidence/. | Claim gaps: F-1-13/F-1-15 |
| 33 | 11 | The packet ZIP contains those same files and no executable content. | Claim gap: F-1-15 |
| 34 | 10 | Review the folder before exporting and the ZIP before sharing. | — |
| 35 | 11 | The site demo uses fixed sample data in separate browser storage. | Claim gap: F-1-16 |

README headings `Diagnostic Packet`, `Install`, `Usage`, `Manifest`, `Develop and verify`, `Privacy and packet format`, and `Project` make sense in context. There are no README buttons. Terminology is consistent for `demo`, `review folder`, `packet ZIP`, and `collection item`; SHA-256 `hash`/`fingerprint` is the exception in F-2-11.

## Demo and sandbox evidence

| Check | Result |
| --- | --- |
| One-click first-screen action | PASS — visible at both viewports |
| Populated first screen after click | PASS — realistic editor-startup manifest and four-item collection plan |
| Persistent banner | PASS |
| Reset behavior | FAIL — stage resets visually but demo storage is recreated |
| Start for real | FAIL — returns home without discarding demo storage |
| Real browser storage isolation | PASS — a seeded `real:user-setting` remained unchanged |
| Browser network boundary | PASS — all observed demo requests were same-origin |
| Real CLI demo from empty temp cwd | PASS — cwd remained empty; review folder and ZIP were created under `/tmp/diagnostic-packet-demo-*` |
| Real CLI recording on landing | FAIL — hard-coded simulation only |

AI assistance would add privacy/cost friction to a deterministic evidence collector and is not implied by the brief. Import/export leverage is already covered by the manifest, review folder, report, and packet ZIP. No missed-leverage finding is added.

## Claims execution

The worktree was clean at the requested base before tests. Every exact command from `.factory/claims.json` was run separately. Each command reran the Rust/build setup and produced two passing Playwright executions (desktop and mobile):

| Claim IDs | Command result |
| --- | --- |
| local-only, manifest-plan, preview-read-only, command-approval, redact-before-disk, config-hash-only, manifest-boundaries, inspection-ledger, inspection-required, archive-contents | PASS |
| demo-sandbox, offline-reload, free-source-install, cli-contract, clean-build, site-private, clear-cache, demo-keyboard, routes-and-404 | PASS |

There were no nonzero test exits. PASS here means the current assertions ran; F-1-6 through F-1-16 and F-1-19 through F-1-23 explain why the assertions do not yet prove their full registered sentences. The exact public Git install also succeeded manually and produced `diagnostic-packet 0.1.1`.

## Structure, links, accessibility, and visual identity

- `/`, `/demo/`, `/privacy/`, and `/terms/` return 200; an unknown route returns the designed broadsheet 404 with HTTP 404.
- All five documents have `lang=en`, one H1, one main landmark, route-specific titles/descriptions/canonicals, and live favicons. Metadata exceptions are F-1-25.
- Browser back and forward focus the destination H1; direct deep links work.
- Every internal/hash/external link crawled successfully. GitHub and the public issue tracker returned 200.
- `robots.txt`, `sitemap.xml`, SVG favicon, apple-touch icon, and the 1200×630 social image return 200.
- The complete Home and Demo `verify-url.sh` checks passed with no console errors. Live Axe scans found no serious/critical violations on Home, Demo, Privacy, Terms, or the 404 at both viewports. No route overflowed at 390 px.
- Touch-size exceptions are F-2-12.
- The incident-broadsheet typography, paper/ink palette, redaction marks, editorial rules, and original still-life art are distinct and match `.factory/design.md`; this does not look like a generic SaaS template.

## Earlier-finding verification

| Earlier ID | Live/code result |
| --- | --- |
| F-1-1 | FIXED — exact public Git install succeeded and ran `--version`/`--help`. |
| F-1-2 | FIXED — cold first screen answers what, who, and first action. |
| F-1-3 | BLOCKING — CLI command exists; required real terminal recording does not. |
| F-1-4 | FIXED — registry and exactly one tagged test per ID now exist. Test sufficiency is rechecked under each original claim finding below. |
| F-1-5 | FIXED — unknown live route is a designed HTTP 404. |
| F-1-6 | BLOCKING — local-only test does not observe network or write scope. |
| F-1-7 | BLOCKING — manifest test checks count only. |
| F-1-8 | BLOCKING — preview test checks one absent folder only. |
| F-1-9 | BLOCKING — approval test covers rejection only. |
| F-1-10 | BLOCKING — redaction test covers two values after writing. |
| F-1-11 | BLOCKING — hash test does not calculate/compare the hash. |
| F-1-12 | BLOCKING — boundary test covers one traversal case. |
| F-1-13 | BLOCKING — ledger is not compared with disk. |
| F-1-14 | BLOCKING — before-inspection and clean success are untested. |
| F-1-15 | BLOCKING — exact inspected archive contents are untested. |
| F-1-16 | BLOCKING — Reset/Start for real retain demo state. |
| F-1-17 | FIXED — tagged offline reload uses browser offline mode after service-worker activation. |
| F-1-18 | FIXED — nonexistent release/single-binary claim was removed. |
| F-1-19 | BLOCKING — tagged test does not execute the public install or inspect the license. |
| F-1-20 | BLOCKING — tagged test covers only root help and preview JSON. |
| F-1-21 | BLOCKING — clean-build test allows a debug binary substitute. |
| F-1-22 | BLOCKING — privacy test does not cover the full registered sentence. |
| F-1-23 | BLOCKING — test manually deletes the cache it then checks. |
| F-1-24 | FIXED — Arrow Left/Right, Home, and End are implemented and tagged. |
| F-1-25 | BLOCKING — social metadata is incomplete outside Home. |
| F-1-26 | FIXED — robots and sitemap are live. |
| F-1-27 | FIXED — header/footer, owner, and build ID are consistent. |
| F-1-28 | FIXED — forward/back navigation focuses the destination H1. |
| F-1-29 | FIXED — external GitHub links have accessible destination text and safe attributes. |
| F-1-30 | FIXED — sample preview follows the first screen. |
| F-1-31 | FIXED — method heading is concrete. |
| F-1-32 | FIXED — export copy names the packet ZIP result. |
| F-1-33 | FIXED — privacy heading names redaction timing. |
| F-1-34 | FIXED — manifest heading names the checklist job. |
| F-1-35 | FIXED — no README sentence exceeds 22 words. |
| F-1-36 | FIXED — final stage says Reset demo. |
| F-1-37 | FIXED — README opening is concrete. |
| F-1-38 | FIXED — README introduces a TOML file, though jargon remains F-2-13. |
| F-1-39 | FIXED — prose uses collection item. |
| F-1-40 | FIXED — approval sentence is direct. |
| F-1-41 | FIXED — five types are named. |
| F-1-42 | FIXED — the four terminology concepts reported in round 1 are consistent; the newly audited SHA-256 pair is F-2-11. |
| F-1-43 | FIXED — the issue-tracker action meets the target baseline; new banner controls fail separately in F-2-12. |

## What would make this perfect

Close every blocking claim gap with tests that observe the full promise, replace the simulated CLI presentation with a recording of a real demo run, discard demo storage on reset/exit, complete route metadata, register or remove every remaining claim, and clear the copy/touch-target findings. Then repeat the cold read, claim commands, live storage/network interception, link crawl, metadata matrix, Axe checks, and full build from a clean checkout. There is no PASS-adjacent shortcut while any row above remains.
