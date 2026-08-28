# Demo sandbox

- Web demo: `https://dev-diagnostic-packet.sociobot.in/?demo=1#demo` or `/demo/`.
- CLI demo: `diagnostic-packet demo`.
- Sample: an editor-startup incident with `examples/diagnostic-packet.toml`, a small lockfile, and a log containing safe redaction fixtures.
- Recording: `/assets/diagnostic-packet-demo.cast` is a self-hosted asciinema v2 recording captured from the real bundled command. The page includes its accessible text transcript above the interactive explainer.
- Isolation: web state uses only the `demo:diagnostic-packet:*` localStorage namespace. The banner offers **Reset demo** and **Install the CLI**. The CLI creates a fresh `diagnostic-packet-demo-*` folder below the operating system temporary directory and never reads the current project.
- Reset: either banner action clears every demo key without changing non-demo browser storage. Delete the printed temporary folder after a CLI run when you no longer need the sample packet.
