# Diagnostic Packet

Diagnostic Packet is a command-line tool that collects and redacts the evidence needed to report a local development failure.

The `diagnostic-packet.toml` text file in your project lists the data the tool may collect. The CLI previews the plan and captures redacted evidence locally. You inspect every file before exporting a packet ZIP with an HTML report.

It is for developers reporting CLI, editor, workspace, or environment failures to a teammate or maintainer. The CLI has no telemetry or network calls.

## Install

Install from the public source repository:

```sh
cargo install --git https://github.com/B-Divyesh/sf-dev-diagnostic-packet.git
```

## Usage

Create a starter manifest in the current project:

```sh
diagnostic-packet init
```

Try the bundled sample. It writes only to a new operating-system temporary folder:

```sh
diagnostic-packet demo
```

Review every proposed item. Preview reads only the checklist and runs no commands:

```sh
diagnostic-packet preview --manifest diagnostic-packet.toml
```

Capture into a review folder. You must approve each supported version command before capture:

```sh
diagnostic-packet capture --manifest diagnostic-packet.toml \
  --output .diagnostic-packet/review --approve-commands
```

Inspect the review folder's files, sizes, SHA-256 hashes, and redaction counts:

```sh
diagnostic-packet inspect .diagnostic-packet/review
```

Export only after inspection:

```sh
diagnostic-packet export .diagnostic-packet/review \
  --output diagnostic-packet.zip
```

Every command supports `--help`. `preview`, `capture`, `inspect`, and `export` support `--json` for scripts. For automated builds, add `--ci` to disable prompts. Capture then fails unless command execution was approved. Exit code `0` means success. Exit code `2` means invalid or unsafe input. Exit code `1` means a collection or file read/write failure.

### Manifest

```toml
format_version = 1
title = "Editor startup failure"

[incident]
summary = "Editor exits while opening this workspace"
expected = "Workspace opens"
actual = "Process exits with status 1"
steps = ["Clone the repository", "Run: code ."]

[[collectors]]
id = "system"
type = "system"

[[collectors]]
id = "node"
type = "tool-version"
command = ["node", "--version"]

[[collectors]]
id = "config"
type = "config-hash"
path = "package-lock.json"

[[collectors]]
id = "editor-log"
type = "log"
path = ".logs/editor.log"
max_bytes = 200000

[[collectors]]
id = "safe-environment"
type = "environment"
names = ["CI", "TERM", "SHELL"]
```

The tool supports only these five collection types: `system`, `tool-version`, `config-hash`, `log`, and `environment`. Paths stay inside the manifest's project directory. Tool commands are argument arrays, never shell strings. Logs stop at the declared limit and redact secrets, emails, IP addresses, and home paths. Sensitive environment names are rejected.

## Develop and verify

```sh
npm install
npm test
npm run build
```

`npm run build` creates the release binary in `dist/` and the deployable static documentation site in `dist/site/`. Run the site locally with `npm run dev`. Check the Rust package with `cargo package --locked`; registry credentials and publishing remain with the factory.

## Privacy and packet format

All work happens on the local machine. A review folder contains `report.html`, `report.json`, `inspection.json`, and redacted evidence under `evidence/`. The packet ZIP contains those same files and no executable content. Review the folder before exporting and the ZIP before sharing. The site demo uses fixed sample data in separate browser storage.

## Project

- Product site: <https://dev-diagnostic-packet.sociobot.in>
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- License: [MIT](LICENSE)
