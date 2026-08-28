# Copy audit — polish 2

Audited sources: rendered Home, Demo, Privacy, Terms, and 404 pages; dynamic demo/error/status strings in `site/src/main.ts`; `README.md`; and the catalog description. Code samples and navigation labels are excluded from sentence counts. Hyphenated words count as one word.

The first screen reads aloud in one breath: “Collect and redact bug-report evidence. For developers reporting local failures, collect the logs and setup details maintainers need, then inspect every file before sharing. Try it with sample data.” It names the job, audience, change, and first action.

## Home and dynamic demo sentences

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
| 4 | Then run diagnostic-packet demo. |
| 7 | Collect and redact evidence for local failures. |
| 10 | Demo — sample data, nothing is saved to your project. |
| 6 | Demo reset. The sample packet is ready. |

## Demo, legal, and 404 sentences

| Words | Sentence |
| ---: | --- |
| 9 | This isolated demo uses fixed sample data. |
| 8 | It does not read or save your project data. |
| 7 | The documentation site does not collect personal data. |
| 9 | The CLI has no telemetry and makes no network requests. |
| 8 | Collection starts only when you run a command. |
| 8 | Your manifest and captured evidence remain on your machine. |
| 10 | Redaction happens before log evidence is written to the review folder. |
| 10 | You decide whether and how to share the packet ZIP. |
| 9 | Review it first: automatic redaction cannot recognize every project-specific secret. |
| 11 | The documentation site has no analytics, advertising, cookies, accounts, or third-party scripts. |
| 10 | Its demo uses fixed sample data in separate browser storage. |
| 10 | A service worker may cache public files for offline use. |
| 7 | Clearing site data removes that cache. |
| 9 | Report privacy or security concerns in the project issue tracker. |
| 10 | Do not include secrets or private packet contents in an issue. |
| 9 | Diagnostic Packet is free and open-source software under the MIT License. |
| 11 | You may use, copy, modify, and distribute it under that license. |
| 9 | You control the manifest, local evidence, and packet ZIP. |
| 6 | Inspect packet contents before sharing them. |
| 13 | Get permission before collecting data from a machine or project you do not own. |
| 9 | The software and site are provided “as is,” without warranty. |
| 9 | Automatic redaction is a safety aid, not a guarantee. |
| 10 | Project-specific formats can contain sensitive information that built-in patterns do not recognize. |
| 11 | Material changes are documented in the project repository and dated on this page. |
| 9 | The address does not match a published Diagnostic Packet page. |

## README sentences

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
| 12 | Try the bundled sample. It writes only to a new operating-system temporary folder. |
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

## Results and terminology

- Longest sentence: 19 words; limit: 22.
- Banned marketing terms: none.
- Catalog: 11 words, 80 characters, starts with “Collect.”

| Concept | One term |
| --- | --- |
| Try-out | demo |
| Data destination before export | review folder |
| Export | packet ZIP |
| Manifest entry | collection item |
| Digest | SHA-256 hash |
| Project instruction file | checklist, introduced as `diagnostic-packet.toml` |
