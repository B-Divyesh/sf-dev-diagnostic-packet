use clap::{Parser, Subcommand};
use diagnostic_packet::{
    PacketError, Result, capture,
    manifest::{self, Collector, STARTER_MANIFEST},
    packet,
};
use serde::Serialize;
use std::{
    fs,
    io::{self, IsTerminal, Write},
    path::PathBuf,
};

#[derive(Parser, Debug)]
#[command(
    name = "diagnostic-packet",
    version,
    about = "Build a safe, inspectable reproduction packet",
    long_about = "Build a safe, inspectable reproduction packet from an opt-in project manifest.\n\nThe workflow is intentionally staged: preview the plan, capture locally, inspect every file, then export. Nothing is uploaded and commands never run without approval."
)]
struct Cli {
    /// Disable interactive prompts. Unsafe or unapproved work fails instead.
    #[arg(long, global = true)]
    ci: bool,
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Write a documented starter manifest without overwriting existing files.
    Init {
        #[arg(default_value = "diagnostic-packet.toml")]
        path: PathBuf,
    },
    /// Validate and print the collection plan. Does not collect or run commands.
    Preview {
        #[arg(short, long, default_value = "diagnostic-packet.toml")]
        manifest: PathBuf,
        #[arg(long)]
        json: bool,
    },
    /// Collect redacted evidence into a local review directory.
    Capture {
        #[arg(short, long, default_value = "diagnostic-packet.toml")]
        manifest: PathBuf,
        #[arg(short, long, default_value = ".diagnostic-packet/review")]
        output: PathBuf,
        /// Approve the exact allowlisted tool-version commands shown by preview.
        #[arg(long)]
        approve_commands: bool,
        #[arg(long)]
        json: bool,
    },
    /// List staged files, sizes, and hashes; writes the required inspection marker.
    Inspect {
        #[arg(default_value = ".diagnostic-packet/review")]
        packet: PathBuf,
        #[arg(long)]
        json: bool,
    },
    /// Export an unchanged, previously inspected review directory as a ZIP.
    Export {
        #[arg(default_value = ".diagnostic-packet/review")]
        packet: PathBuf,
        #[arg(short, long, default_value = "diagnostic-packet.zip")]
        output: PathBuf,
        #[arg(long)]
        json: bool,
    },
}

#[derive(Serialize)]
struct Preview<'a> {
    valid: bool,
    title: &'a str,
    collector_count: usize,
    requires_command_approval: bool,
    collectors: Vec<PreviewCollector<'a>>,
}

#[derive(Serialize)]
struct PreviewCollector<'a> {
    id: &'a str,
    collector_type: &'a str,
    description: String,
    runs_command: bool,
}

fn main() {
    if let Err(error) = run(Cli::parse()) {
        eprintln!("error: {error}");
        std::process::exit(error.exit_code());
    }
}

fn run(cli: Cli) -> Result<()> {
    match cli.command {
        Commands::Init { path } => init(path),
        Commands::Preview { manifest, json } => preview(manifest, json),
        Commands::Capture {
            manifest: path,
            output,
            approve_commands,
            json,
        } => {
            let (manifest, root) = manifest::load(&path)?;
            let has_commands = manifest
                .collectors
                .iter()
                .any(|item| matches!(item, Collector::ToolVersion { .. }));
            let approved = if has_commands && !approve_commands {
                if cli.ci || !io::stdin().is_terminal() {
                    false
                } else {
                    prompt_for_approval(&manifest)?
                }
            } else {
                approve_commands
            };
            let report = capture::capture(&manifest, &root, &output, approved)?;
            if json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(
                        &serde_json::json!({"status":"captured","output":output,"report":report})
                    )?
                );
            } else {
                println!(
                    "Captured {} evidence item(s) in {}.",
                    report.evidence.len(),
                    output.display()
                );
                println!(
                    "Redacted {} sensitive value(s). Next: diagnostic-packet inspect {}",
                    report.redactions.total,
                    output.display()
                );
            }
            Ok(())
        }
        Commands::Inspect {
            packet: source,
            json,
        } => {
            let inspection = packet::inspect(&source)?;
            if json {
                println!("{}", serde_json::to_string_pretty(&inspection)?);
            } else {
                println!(
                    "INSPECTED  BYTES  SHA-256                                                          FILE"
                );
                for item in &inspection.files {
                    println!(
                        "yes        {:>5}  {}  {}",
                        item.bytes, item.sha256, item.path
                    );
                }
                println!(
                    "\n{} file(s), {} bytes. Contents are now approved for export.",
                    inspection.files.len(),
                    inspection.total_bytes
                );
            }
            Ok(())
        }
        Commands::Export {
            packet: source,
            output,
            json,
        } => {
            let (files, bytes) = packet::export(&source, &output)?;
            if json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(
                        &serde_json::json!({"status":"exported","output":output,"files":files,"bytes":bytes})
                    )?
                );
            } else {
                println!(
                    "Exported {files} inspected file(s) to {} ({bytes} bytes).",
                    output.display()
                );
            }
            Ok(())
        }
    }
}

fn init(path: PathBuf) -> Result<()> {
    if path.exists() {
        return Err(PacketError::Invalid(format!(
            "`{}` already exists and was not changed",
            path.display()
        )));
    }
    if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
        fs::create_dir_all(parent)?;
    }
    fs::write(&path, STARTER_MANIFEST)?;
    println!(
        "Wrote {}. Edit the incident and collectors, then run `diagnostic-packet preview`.",
        path.display()
    );
    Ok(())
}

fn preview(path: PathBuf, json: bool) -> Result<()> {
    let (manifest, _) = manifest::load(&path)?;
    let collectors = manifest
        .collectors
        .iter()
        .map(|item| PreviewCollector {
            id: item.id(),
            collector_type: item.kind(),
            description: item.description(),
            runs_command: matches!(item, Collector::ToolVersion { .. }),
        })
        .collect::<Vec<_>>();
    let data = Preview {
        valid: true,
        title: &manifest.title,
        collector_count: collectors.len(),
        requires_command_approval: collectors.iter().any(|item| item.runs_command),
        collectors,
    };
    if json {
        println!("{}", serde_json::to_string_pretty(&data)?);
    } else {
        println!("COLLECT  TYPE          ID              PLAN");
        for item in &data.collectors {
            println!(
                "{:<8} {:<13} {:<15} {}",
                if item.runs_command { "approval" } else { "yes" },
                item.collector_type,
                item.id,
                item.description
            );
        }
        println!(
            "\nValid manifest: {} collector(s). Preview collected nothing.",
            data.collector_count
        );
        if data.requires_command_approval {
            println!("Capture will ask for approval or require --approve-commands.");
        }
    }
    Ok(())
}

fn prompt_for_approval(manifest: &manifest::Manifest) -> Result<bool> {
    eprintln!("The following allowlisted commands will run in the project directory:");
    for collector in &manifest.collectors {
        if let Collector::ToolVersion { command, .. } = collector {
            eprintln!("  {}", command.join(" "));
        }
    }
    eprint!("Run exactly these commands? [y/N] ");
    io::stderr().flush()?;
    let mut answer = String::new();
    io::stdin().read_line(&mut answer)?;
    if matches!(answer.trim().to_ascii_lowercase().as_str(), "y" | "yes") {
        Ok(true)
    } else {
        Err(PacketError::Unsafe(
            "command execution was not approved".into(),
        ))
    }
}
