# Demo sandbox

- Web demo: `https://dev-diagnostic-packet.sociobot.in/demo/` or `/?demo=1`.
- CLI demo: `diagnostic-packet demo`.
- Sample: an editor-startup incident with `examples/diagnostic-packet.toml`, a small lockfile, and a log containing safe redaction fixtures.
- Isolation: web state uses only the `demo:diagnostic-packet:*` localStorage namespace. The banner offers **Reset demo** and **Start for real**. The CLI creates a fresh `diagnostic-packet-demo-*` folder below the operating system temporary directory and never reads the current project.
- Reset: use the banner button for the web demo. Delete the printed temporary folder after a CLI run when you no longer need the sample packet.
