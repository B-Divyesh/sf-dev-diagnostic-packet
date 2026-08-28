use std::{fs, process::Command};
use tempfile::tempdir;

fn binary() -> &'static str {
    env!("CARGO_BIN_EXE_diagnostic-packet")
}

#[test]
fn documented_workflow_builds_an_inspected_archive() {
    let dir = tempdir().unwrap();
    let manifest = dir.path().join("diagnostic-packet.toml");
    let review = dir.path().join("review");
    let archive = dir.path().join("packet.zip");

    assert!(
        Command::new(binary())
            .arg("init")
            .arg(&manifest)
            .status()
            .unwrap()
            .success()
    );
    let preview = Command::new(binary())
        .arg("preview")
        .arg("--manifest")
        .arg(&manifest)
        .arg("--json")
        .output()
        .unwrap();
    assert!(preview.status.success());
    assert!(String::from_utf8_lossy(&preview.stdout).contains("requires_command_approval"));

    let unapproved = Command::new(binary())
        .args(["--ci", "capture", "--manifest"])
        .arg(&manifest)
        .arg("--output")
        .arg(&review)
        .output()
        .unwrap();
    assert_eq!(unapproved.status.code(), Some(2));
    assert!(!review.exists());

    assert!(
        Command::new(binary())
            .arg("capture")
            .arg("--manifest")
            .arg(&manifest)
            .arg("--output")
            .arg(&review)
            .arg("--approve-commands")
            .status()
            .unwrap()
            .success()
    );
    assert!(
        Command::new(binary())
            .arg("inspect")
            .arg(&review)
            .status()
            .unwrap()
            .success()
    );
    assert!(
        Command::new(binary())
            .arg("export")
            .arg(&review)
            .arg("--output")
            .arg(&archive)
            .status()
            .unwrap()
            .success()
    );
    assert!(archive.metadata().unwrap().len() > 100);
    assert!(
        fs::read_to_string(review.join("report.html"))
            .unwrap()
            .contains("Describe this incident")
    );
}

#[test]
fn default_command_sequence_builds_an_inspected_archive() {
    let dir = tempdir().unwrap();
    let run = |args: &[&str]| {
        Command::new(binary())
            .current_dir(dir.path())
            .args(args)
            .output()
            .unwrap()
    };

    let init = run(&["init"]);
    assert!(
        init.status.success(),
        "{}",
        String::from_utf8_lossy(&init.stderr)
    );
    assert!(dir.path().join("diagnostic-packet.toml").is_file());

    let preview = run(&["preview", "--json"]);
    assert!(
        preview.status.success(),
        "{}",
        String::from_utf8_lossy(&preview.stderr)
    );
    assert!(String::from_utf8_lossy(&preview.stdout).contains("requires_command_approval"));

    let capture = run(&["--ci", "capture", "--approve-commands"]);
    assert!(
        capture.status.success(),
        "{}",
        String::from_utf8_lossy(&capture.stderr)
    );
    assert!(
        dir.path()
            .join(".diagnostic-packet/review/report.json")
            .is_file()
    );

    let inspect = run(&["inspect"]);
    assert!(
        inspect.status.success(),
        "{}",
        String::from_utf8_lossy(&inspect.stderr)
    );

    let export = run(&["export"]);
    assert!(
        export.status.success(),
        "{}",
        String::from_utf8_lossy(&export.stderr)
    );
    assert!(dir.path().join("diagnostic-packet.zip").is_file());
}

#[test]
fn init_never_overwrites_a_manifest() {
    let dir = tempdir().unwrap();
    let manifest = dir.path().join("diagnostic-packet.toml");
    fs::write(&manifest, "keep me").unwrap();
    let result = Command::new(binary())
        .arg("init")
        .arg(&manifest)
        .output()
        .unwrap();
    assert_eq!(result.status.code(), Some(2));
    assert_eq!(fs::read_to_string(manifest).unwrap(), "keep me");
}
