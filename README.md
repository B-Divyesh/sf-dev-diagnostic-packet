# Diagnostic Packet

Diagnostic Packet is a local-first CLI for turning a hard-to-reproduce development failure into a safe, inspectable handoff. A checked-in TOML manifest declares exactly what may be collected. The CLI previews that plan, captures redacted evidence into a local directory, lets you inspect every file, and only then exports a self-contained ZIP with readable HTML.

It is for developers reporting CLI, editor, workspace, or environment failures to a teammate or maintainer. It has no telemetry, network calls, background process, or remote-support access.

## Install

Download the single binary for your platform from the project releases, or build it with Rust 1.85+:

```sh
cargo install --path .
```

## Usage

Create a starter manifest in the current project:

```sh
diagnostic-packet init
```

Review every proposed collector. Preview never collects data or runs commands:

```sh
diagnostic-packet preview --manifest diagnostic-packet.toml
```

Capture into a review directory. Allowlisted tool-version commands require an explicit approval flag:

```sh
diagnostic-packet capture --manifest diagnostic-packet.toml \
  --output .diagnostic-packet/review --approve-commands
```

Inspect the exact staged files, sizes, hashes, and redaction counts:

```sh
diagnostic-packet inspect .diagnostic-packet/review
```

Export only after inspection:

```sh
diagnostic-packet export .diagnostic-packet/review \
  --output diagnostic-packet.zip
```

Every command supports `--help`. `preview`, `capture`, `inspect`, and `export` support `--json` for scripts. Add `--ci` to disable prompts; capture then fails unless command execution was explicitly approved. Exit code `0` means success, `2` means invalid or unsafe input, and `1` means collection or I/O failure.

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

Collector types are a closed allowlist: `system`, `tool-version`, `config-hash`, `log`, and `environment`. Paths must stay inside the manifest's project directory. Tool commands are argument arrays—never shell strings—and the executable must be in Diagnostic Packet's built-in version-tool allowlist. Logs are truncated to the declared limit and redacted for secrets, emails, IP addresses, and home-directory paths. Sensitive environment names are rejected.

## Develop and verify

```sh
npm install
npm test
npm run build
```

`npm run build` creates the release binary in `dist/` and the deployable static documentation site in `dist/site/`. Run the site locally with `npm run dev`. Create the ready-to-publish crate with `cargo package --allow-dirty`; registry credentials and publishing remain with the factory.

## Privacy and packet format

All work happens on the local machine. A staged packet contains `report.html`, `report.json`, `inspection.json`, and redacted evidence under `evidence/`. The ZIP contains those same files and no executable content. Review the directory before exporting and the ZIP before sharing. The site demo uses fixed sample data and stores nothing.

## Project

- Product site: <https://dev-diagnostic-packet.sociobot.in>
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- License: [MIT](LICENSE)
