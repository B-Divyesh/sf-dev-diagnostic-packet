use crate::{
    PacketError, Result,
    manifest::{Collector, Incident, Manifest, resolve_project_path},
    redact::{RedactionSummary, redact},
};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    env, fs,
    io::{Read, Write},
    path::Path,
    process::{Command, Stdio},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PacketReport {
    pub format_version: u8,
    pub title: String,
    pub incident: Incident,
    pub created_unix_seconds: u64,
    pub generator: String,
    pub evidence: Vec<Evidence>,
    pub redactions: RedactionSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Evidence {
    pub id: String,
    pub collector_type: String,
    pub status: String,
    pub summary: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sha256: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bytes: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub redactions: Option<RedactionSummary>,
}

pub fn capture(
    manifest: &Manifest,
    root: &Path,
    output: &Path,
    approve_commands: bool,
) -> Result<PacketReport> {
    if output.exists() {
        return Err(PacketError::Invalid(format!(
            "output `{}` already exists; choose a new review directory",
            output.display()
        )));
    }
    let parent = output.parent().unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent)?;
    let name = output
        .file_name()
        .and_then(|v| v.to_str())
        .unwrap_or("packet");
    let staging = parent.join(format!(".{name}.capturing-{}", std::process::id()));
    if staging.exists() {
        fs::remove_dir_all(&staging)?;
    }
    fs::create_dir(&staging)?;
    fs::create_dir(staging.join("evidence"))?;

    let result = build_report(manifest, root, &staging, approve_commands);
    match result {
        Ok(report) => {
            write_report(&staging, &report)?;
            fs::rename(&staging, output)?;
            Ok(report)
        }
        Err(error) => {
            let _ = fs::remove_dir_all(&staging);
            Err(error)
        }
    }
}

fn build_report(
    manifest: &Manifest,
    root: &Path,
    staging: &Path,
    approve_commands: bool,
) -> Result<PacketReport> {
    let mut evidence = Vec::new();
    let mut totals = RedactionSummary::default();
    for collector in &manifest.collectors {
        let item = collect_one(collector, root, staging, approve_commands)?;
        if let Some(redactions) = &item.redactions {
            add_redactions(&mut totals, redactions);
        }
        evidence.push(item);
    }
    Ok(PacketReport {
        format_version: 1,
        title: manifest.title.clone(),
        incident: manifest.incident.clone(),
        created_unix_seconds: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        generator: format!("diagnostic-packet {}", env!("CARGO_PKG_VERSION")),
        evidence,
        redactions: totals,
    })
}

fn collect_one(
    collector: &Collector,
    root: &Path,
    staging: &Path,
    approve_commands: bool,
) -> Result<Evidence> {
    match collector {
        Collector::System { id } => {
            let text = format!(
                "os={}\narch={}\nfamily={}\n",
                env::consts::OS,
                env::consts::ARCH,
                env::consts::FAMILY
            );
            write_text_evidence(
                staging,
                id,
                "system",
                text,
                "Operating system and architecture captured",
                RedactionSummary::default(),
            )
        }
        Collector::ToolVersion { id, command } => {
            if !approve_commands {
                return Err(PacketError::Unsafe(format!(
                    "collector `{id}` runs `{}`; rerun with --approve-commands after previewing it",
                    command.join(" ")
                )));
            }
            let text = run_version_command(command, root)?;
            let (clean, redactions) = redact(&text);
            write_text_evidence(
                staging,
                id,
                "tool-version",
                clean,
                &format!("Ran approved command `{}`", command.join(" ")),
                redactions,
            )
        }
        Collector::ConfigHash { id, path } => {
            let source = resolve_project_path(root, path)?;
            match sha256_file(&source) {
                Ok((hash, bytes)) => Ok(Evidence {
                    id: id.clone(),
                    collector_type: "config-hash".into(),
                    status: "captured".into(),
                    summary: format!("SHA-256 recorded for {}", path.display()),
                    file: None,
                    sha256: Some(hash),
                    bytes: Some(bytes),
                    redactions: None,
                }),
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(unavailable(
                    id,
                    "config-hash",
                    format!("{} was not found", path.display()),
                )),
                Err(error) => Err(error.into()),
            }
        }
        Collector::Log {
            id,
            path,
            max_bytes,
        } => {
            let source = resolve_project_path(root, path)?;
            match read_limited(&source, *max_bytes) {
                Ok((text, truncated)) => {
                    let (clean, redactions) = redact(&text);
                    let suffix = if truncated {
                        " (truncated at declared limit)"
                    } else {
                        ""
                    };
                    write_text_evidence(
                        staging,
                        id,
                        "log",
                        clean,
                        &format!("Redacted copy of {}{suffix}", path.display()),
                        redactions,
                    )
                }
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(unavailable(
                    id,
                    "log",
                    format!("{} was not found", path.display()),
                )),
                Err(error) => Err(error.into()),
            }
        }
        Collector::Environment { id, names } => {
            let mut lines = Vec::new();
            for name in names {
                match env::var(name) {
                    Ok(value) => lines.push(format!("{name}={value}")),
                    Err(_) => lines.push(format!("{name}=[NOT SET]")),
                }
            }
            let (clean, redactions) = redact(&(lines.join("\n") + "\n"));
            write_text_evidence(
                staging,
                id,
                "environment",
                clean,
                "Explicitly named environment values captured",
                redactions,
            )
        }
    }
}

fn write_text_evidence(
    staging: &Path,
    id: &str,
    kind: &str,
    text: String,
    summary: &str,
    redactions: RedactionSummary,
) -> Result<Evidence> {
    let relative = format!("evidence/{id}.txt");
    let path = staging.join(&relative);
    let mut file = fs::File::create(&path)?;
    file.write_all(text.as_bytes())?;
    let bytes = text.len() as u64;
    let hash = hex_sha256(text.as_bytes());
    Ok(Evidence {
        id: id.into(),
        collector_type: kind.into(),
        status: "captured".into(),
        summary: summary.into(),
        file: Some(relative),
        sha256: Some(hash),
        bytes: Some(bytes),
        redactions: Some(redactions),
    })
}

fn unavailable(id: &str, kind: &str, summary: String) -> Evidence {
    Evidence {
        id: id.into(),
        collector_type: kind.into(),
        status: "unavailable".into(),
        summary,
        file: None,
        sha256: None,
        bytes: None,
        redactions: None,
    }
}

fn run_version_command(command: &[String], root: &Path) -> Result<String> {
    let mut child = Command::new(&command[0])
        .args(&command[1..])
        .current_dir(root)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| {
            PacketError::Other(format!("could not start `{}`: {error}", command.join(" ")))
        })?;
    let deadline = Instant::now() + Duration::from_secs(10);
    loop {
        if child.try_wait()?.is_some() {
            break;
        }
        if Instant::now() >= deadline {
            child.kill()?;
            let _ = child.wait();
            return Err(PacketError::Other(format!(
                "`{}` exceeded the 10 second limit",
                command.join(" ")
            )));
        }
        thread::sleep(Duration::from_millis(25));
    }
    let output = child.wait_with_output()?;
    let mut bytes = output.stdout;
    bytes.extend_from_slice(&output.stderr);
    if bytes.len() > 200_000 {
        bytes.truncate(200_000);
    }
    let text = String::from_utf8_lossy(&bytes).into_owned();
    if !output.status.success() {
        return Err(PacketError::Other(format!(
            "`{}` exited with {}: {}",
            command.join(" "),
            output.status,
            text.trim()
        )));
    }
    Ok(text)
}

fn read_limited(path: &Path, max_bytes: u64) -> std::io::Result<(String, bool)> {
    let mut file = fs::File::open(path)?;
    let mut bytes = Vec::new();
    (&mut file).take(max_bytes + 1).read_to_end(&mut bytes)?;
    let truncated = bytes.len() as u64 > max_bytes;
    if truncated {
        bytes.truncate(max_bytes as usize);
    }
    Ok((String::from_utf8_lossy(&bytes).into_owned(), truncated))
}

fn sha256_file(path: &Path) -> std::io::Result<(String, u64)> {
    let mut file = fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let bytes = std::io::copy(&mut file, &mut hasher)?;
    Ok((format!("{:x}", hasher.finalize()), bytes))
}

fn hex_sha256(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

fn add_redactions(total: &mut RedactionSummary, item: &RedactionSummary) {
    total.total += item.total;
    total.secrets += item.secrets;
    total.emails += item.emails;
    total.ip_addresses += item.ip_addresses;
    total.home_paths += item.home_paths;
}

fn write_report(staging: &Path, report: &PacketReport) -> Result<()> {
    fs::write(
        staging.join("report.json"),
        serde_json::to_vec_pretty(report)?,
    )?;
    fs::write(staging.join("report.html"), render_html(report))?;
    Ok(())
}

fn render_html(report: &PacketReport) -> String {
    let steps = report
        .incident
        .steps
        .iter()
        .map(|s| format!("<li>{}</li>", escape(s)))
        .collect::<String>();
    let rows = report
        .evidence
        .iter()
        .map(|item| {
            format!(
                "<tr><td><strong>{}</strong><small>{}</small></td><td>{}</td><td>{}</td></tr>",
                escape(&item.id),
                escape(&item.collector_type),
                escape(&item.status),
                escape(&item.summary)
            )
        })
        .collect::<String>();
    format!(
        r#"<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} — Diagnostic Packet</title><style>:root{{color-scheme:light;--paper:#f2efe6;--ink:#141412;--muted:#5c5a53;--signal:#9d2a1e}}*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);font:17px/1.55 system-ui,sans-serif}}main{{max-width:960px;margin:auto;padding:48px 24px}}header{{border-block:4px double var(--ink);padding:18px 0}}h1{{font:700 clamp(2.5rem,8vw,5.5rem)/.9 Georgia,serif;margin:.2em 0}}h2{{font:700 2rem Georgia,serif;border-bottom:1px solid;padding-bottom:8px;margin-top:48px}}.deck{{max-width:64ch;color:var(--muted)}}dl{{display:grid;grid-template-columns:9rem 1fr;gap:8px 16px}}dt{{font-weight:700}}dd{{margin:0}}table{{width:100%;border-collapse:collapse}}th,td{{padding:12px 8px;text-align:left;border-bottom:1px solid #aaa;vertical-align:top}}small{{display:block;color:var(--muted)}}.redactions{{color:var(--signal);font-weight:700}}@media(max-width:600px){{main{{padding:24px 16px}}dl{{display:block}}dt{{margin-top:12px}}table,tbody,tr,td{{display:block}}thead{{position:absolute;clip:rect(0,0,0,0)}}td{{border:0;padding:4px 0}}tr{{border-bottom:1px solid;padding:12px 0}}}}</style></head><body><main><header><small>SELF-CONTAINED INCIDENT EDITION · FORMAT 1</small><h1>{title}</h1><p class="deck">Generated locally by {generator}. Review every evidence file before sharing this packet.</p></header><section><h2>Incident</h2><dl><dt>Summary</dt><dd>{summary}</dd><dt>Expected</dt><dd>{expected}</dd><dt>Actual</dt><dd>{actual}</dd></dl><h3>Reproduction steps</h3><ol>{steps}</ol></section><section><h2>Evidence ledger</h2><p class="redactions">{redactions} sensitive value(s) redacted.</p><table><thead><tr><th>Collector</th><th>Status</th><th>What was recorded</th></tr></thead><tbody>{rows}</tbody></table></section></main></body></html>"#,
        title = escape(&report.title),
        generator = escape(&report.generator),
        summary = escape(&report.incident.summary),
        expected = escape(&report.incident.expected),
        actual = escape(&report.incident.actual),
        steps = steps,
        redactions = report.redactions.total,
        rows = rows
    )
}

fn escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::manifest::{Collector, Incident, Manifest};
    use tempfile::tempdir;

    #[test]
    fn capture_redacts_log_and_hashes_config() {
        let root = tempdir().unwrap();
        fs::write(
            root.path().join("app.log"),
            "user=dev@example.com ip=10.0.0.1 token=supersecretvalue",
        )
        .unwrap();
        fs::write(root.path().join("config.json"), "{}").unwrap();
        let manifest = Manifest {
            format_version: 1,
            title: "Test".into(),
            incident: Incident {
                summary: "Fails".into(),
                expected: "Works".into(),
                actual: "Stops".into(),
                steps: vec!["Run it".into()],
            },
            collectors: vec![
                Collector::Log {
                    id: "log".into(),
                    path: "app.log".into(),
                    max_bytes: 1000,
                },
                Collector::ConfigHash {
                    id: "config".into(),
                    path: "config.json".into(),
                },
            ],
        };
        let output = root.path().join("review");
        let report = capture(&manifest, root.path(), &output, false).unwrap();
        let log = fs::read_to_string(output.join("evidence/log.txt")).unwrap();
        assert!(log.contains("[REDACTED_EMAIL]"));
        assert!(log.contains("[REDACTED_IP]"));
        assert!(!log.contains("supersecretvalue"));
        assert_eq!(report.evidence.len(), 2);
    }
}
