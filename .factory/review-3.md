# Adversarial first-read review 3 — Diagnostic Packet

- Work order: `dev-diagnostic-packet-review-3`
- Reviewed commit: `a1ecca90e829bc31c43121b7e7d886c8ae5978d1`
- Live URL: <https://dev-diagnostic-packet.sociobot.in>
- Review date: 2026-08-28 UTC
- Viewports: fresh Chromium contexts at 390×844 and 1440×900

## Verdict: PASS

There are no findings. The deployed site, current source, and clean-clone claim suite satisfy the review checklist. This is a pass only because every check below completed; it does not turn pattern-based redaction into a guarantee.

## Thirty-second cold read

Before scrolling, at both viewports:

- **What it does:** collects and redacts local bug-report evidence, then lets the developer inspect it before sharing.
- **For whom:** developers reporting local failures to a maintainer.
- **First action:** `Try it with sample data`; the adjacent text says `Opens the bundled sample packet.`

The exact first-screen text is `Collect and redact bug-report evidence` and `For developers reporting local failures, collect the logs and setup details maintainers need, then inspect every file before sharing.` The headline is a five-word, verb-first job statement; the audience sentence is 19 words. The job, audience, and first click are all visible without scrolling at 390 px and desktop. No blocking first-read finding applies.

## Copy audit

Counts treat hyphenated compounds and command names as one word. Code samples, nav labels, labels, and headings without sentence punctuation are excluded from the sentence inventory and were checked separately. All landing-page and README sentences are listed here. No sentence exceeds 22 words, no banned marketing adjective occurs, terminology is consistent, and every button names an outcome or action (`Try`, `Capture`, `Test`, `Download`, `Copy`, `Reset`, `Install`). Headings such as `Create a packet in four steps.` and `Save a collection checklist in your project.` remain meaningful out of context.

### Landing page and dynamic demo copy

| Words | Sentence |
| ---: | --- |
| 19 | For developers reporting local failures, collect the logs and setup details maintainers need, then inspect every file before sharing. |
| 5 | Opens the bundled sample packet. |
| 5 | Local evidence, ready for review. |
| 12 | The real command-line demo created the recording below in a new temporary folder. |
| 6 | Demo packet created from bundled sample data. |
| 7 | Redacted 4 sensitive values; exported 6 files. |
| 2 | Preview completed. |
| 5 | Nothing was collected or executed. |
| 3 | Inspection marker written. |
| 5 | Any later change blocks export. |
| 3 | Includes readable report.html. |
| 3 | No executable content. |
| 3 | No upload performed. |
| 5 | Could not preview this manifest. |
| 6 | Path ../private.env leaves the project directory. |
| 11 | Use a relative path inside the manifest folder, then preview again. |
| 6 | Check the project checklist in diagnostic-packet.toml. |
| 9 | Preview reads only that file and runs no commands. |
| 4 | Approve supported version checks. |
| 5 | Redact logs before saving them. |
| 9 | Check each file, size, SHA-256 hash, and redaction count. |
| 8 | Export the inspected files as a packet ZIP. |
| 12 | Emails, IP addresses, tokens, and home paths are replaced in copied logs. |
| 10 | Configuration items record a SHA-256 hash instead of file contents. |
| 12 | Only supported version commands can run, and only after approval. |
| 10 | The diagnostic-packet.toml text file names each collection item. |
| 7 | It cannot use paths outside your project. |
| 4 | Start with the sample. |
| 7 | Then run diagnostic-packet demo. |
| 7 | Collect and redact evidence for local failures. |
| 10 | Demo — sample data, nothing is saved to your project. |
| 2 | Demo reset. |
| 4 | The sample packet is ready. |

### README

| Words | Sentence |
| ---: | --- |
| 19 | Diagnostic Packet is a command-line tool that collects and redacts the evidence needed to report a local development failure. |
| 14 | The diagnostic-packet.toml text file in your project lists the data the tool may collect. |
| 10 | The CLI previews the plan and captures redacted evidence locally. |
| 13 | You inspect every file before exporting a packet ZIP with an HTML report. |
| 16 | It is for developers reporting CLI, editor, workspace, or environment failures to a teammate or maintainer. |
| 8 | The CLI has no telemetry or network calls. |
| 6 | Install from the public source repository. |
| 8 | Create a starter manifest in the current project. |
| 4 | Try the bundled sample. |
| 8 | It writes only to a new operating-system temporary folder. |
| 4 | Review every proposed item. |
| 9 | Preview reads only the checklist and runs no commands. |
| 5 | Capture into a review folder. |
| 9 | You must approve each supported version command before capture. |
| 11 | Inspect the review folder's files, sizes, SHA-256 hashes, and redaction counts. |
| 4 | Export only after inspection. |
| 4 | Every command supports --help. |
| 9 | Preview, capture, inspect, and export support --json for scripts. |
| 9 | For automated builds, add --ci to disable prompts. |
| 8 | Capture then fails unless command execution was approved. |
| 5 | Exit code 0 means success. |
| 8 | Exit code 2 means invalid or unsafe input. |
| 11 | Exit code 1 means a collection or file read/write failure. |
| 14 | The tool supports only these five collection types: system, tool-version, config-hash, log, and environment. |
| 7 | Paths stay inside the manifest's project directory. |
| 8 | Tool commands are argument arrays, never shell strings. |
| 15 | Logs stop at the declared limit and redact secrets, emails, IP addresses, and home paths. |
| 5 | Sensitive environment names are rejected. |
| 17 | npm run build creates the release binary in dist and the deployable static documentation site in dist/site. |
| 8 | Run the site locally with npm run dev. |
| 16 | Check the Rust package with cargo package --locked; registry credentials and publishing remain with the factory. |
| 7 | All work happens on the local machine. |
| 12 | A review folder contains report.html, report.json, inspection.json, and redacted evidence under evidence. |
| 11 | The packet ZIP contains those same files and no executable content. |
| 10 | Review the folder before exporting and the ZIP before sharing. |
| 11 | The site demo uses fixed sample data in separate browser storage. |

Terminology confirmed: **demo**, **review folder**, **packet ZIP**, **collection item**, **SHA-256 hash**, and **checklist** (introduced as `diagnostic-packet.toml`). `.factory/copy-audit.md` independently records the same audit.

## Demo and privacy sandbox

The first-screen sample link opened `/?demo=1#demo` in one click. It immediately showed a realistic editor-startup incident, a four-item collection plan, redaction outcome, and the recording from `diagnostic-packet demo`. The visible banner read `Demo — sample data, nothing is saved to your project.` and exposed `Reset demo` plus `Install the CLI`.

In a fresh browser context, I wrote `real:user-setting=keep-me`, entered the demo, advanced to Capture, reset, and exited. Capture created only `demo:diagnostic-packet:stage`; Reset and exit removed every demo-prefixed key and preserved the real key. Direct `/demo/` had the same banner and sample. A full-flow request capture contained only `https://dev-diagnostic-packet.sociobot.in`.

For the CLI sandbox, I ran the built `diagnostic-packet demo` from a sentinel launch directory with a dedicated `TMPDIR`. Its output named a fresh `diagnostic-packet-demo-*` directory below that temporary root. The launch directory retained only the sentinel and captured command output; the review folder and packet ZIP appeared only under the temporary root.

After service-worker activation, setting the fresh browser context offline and reloading `/demo/` retained `Run a sample packet.` and the populated preview without console errors.

## Claims

`.factory/claims.json` contains 25 claims. In a separate clean clone at `/tmp/dp-review3-clean-yMwv6i`, after `npm ci`, I ran each exact listed `npm test -- --grep @claim:<id>` command separately. All 25 completed successfully. The final Playwright receipt was `{"status":"passed","failedTests":[]}`. Source inspection also found exactly one matching `@claim:` tag for each claim id.

The live landing page and README were then re-read against the registry. Their claim-like statements are covered by `local-only`, `manifest-plan`, `preview-read-only`, `command-approval`, `redact-before-disk`, `config-hash-only`, `manifest-boundaries`, `inspection-required`, `archive-contents`, `cli-demo-isolation`, `free-source-install`, `site-private`, `offline-reload`, and the relevant CLI contract claims. The quantified demo transcript is covered by `cli-demo-recording`, which runs the real binary and checks its signature output. No unlisted claim remains.

## Earlier findings and regression check

I read `review-1.md`, `review-2.md`, `polish-1.md`, `polish-2.md`, and the previous handoff, then checked every prior finding against live behavior and source:

- **F-1-1–F-1-5:** public Git installation, clear first screen, real CLI recording/demo, tagged registry, and real designed 404 are present.
- **F-1-6–F-1-26:** the privacy, collection, redaction, inspection, archive, offline, contract, build, metadata, and crawler claims have one observed test each; the live demo and route behavior matched them.
- **F-1-27–F-1-43:** the common header/footer, focus handoff, external-link labels, preview placement, plain headings, terminology, and 44 px controls remain present at 390 px.
- **F-2-1–F-2-17:** the unbounded `safe` copy is absent; the CLI demo isolation, manifest/download, truncation, sensitive-name, packaging, local-only, open-source, touch, naming, and complete audit repairs remain in source and in the checked flows.

No earlier finding is half-fixed or regressed.

## Structure, accessibility, and identity

Live route matrix: `/`, `/demo/`, `/privacy/`, and `/terms/` each returned 200 with one H1, one main landmark, a route-specific title, description, canonical, Open Graph image, Twitter card, SVG favicon, and apple-touch icon. `/missing-review-3` returned HTTP 404 with the designed broadsheet not-found page and a home action. Internal navigation and browser Back both moved focus to the destination H1.

The crawler returned 200 for every normal internal route, terminal recording, robots, sitemap, GitHub repository, and issue-tracker URL. Normal route loads had no console errors. Header/footer links are consistent and include Privacy, Terms, Param Factory attribution, and build id.

The proof-desk/broadsheet treatment is visually distinct: warm paper, ink rules, editorial type, vermilion proof marks, and original redacted-paper art. It is not a generic SaaS card/gradient template. The source includes self-hosted assets and reduced-motion behavior. The product is local-first; an AI feature, sync, or account would not improve this bounded CLI job and would weaken its privacy model. No decorative or key-bearing AI integration exists.

## What would make this perfect

Maintain this exact evidence standard as the CLI grows: any new collector, export format, claim, or browser storage behavior should arrive with one clean-sandbox claim test and a matching plain-language sentence. The current product leaves no concrete review work outstanding.
