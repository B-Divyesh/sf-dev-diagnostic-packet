use crate::{PacketError, Result};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::Read,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
use zip::{CompressionMethod, ZipWriter, write::SimpleFileOptions};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Inspection {
    pub format_version: u8,
    pub inspected_unix_seconds: u64,
    pub files: Vec<InspectedFile>,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct InspectedFile {
    pub path: String,
    pub bytes: u64,
    pub sha256: String,
}

pub fn inspect(source: &Path) -> Result<Inspection> {
    validate_packet_dir(source)?;
    let files = inventory(source)?;
    let total_bytes = files.iter().map(|item| item.bytes).sum();
    let inspection = Inspection {
        format_version: 1,
        inspected_unix_seconds: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        files,
        total_bytes,
    };
    let bytes = serde_json::to_vec_pretty(&inspection)?;
    fs::write(source.join("inspection.json"), bytes)?;
    Ok(inspection)
}

pub fn export(source: &Path, output: &Path) -> Result<(usize, u64)> {
    validate_packet_dir(source)?;
    if output.exists() {
        return Err(PacketError::Invalid(format!(
            "output `{}` already exists; existing archives are never overwritten",
            output.display()
        )));
    }
    let marker_path = source.join("inspection.json");
    if !marker_path.is_file() {
        return Err(PacketError::Invalid(
            "packet has not been inspected; run `diagnostic-packet inspect <review-dir>` first"
                .into(),
        ));
    }
    let marker: Inspection = serde_json::from_slice(&fs::read(&marker_path)?)?;
    let current = inventory(source)?;
    if marker.files != current {
        return Err(PacketError::Invalid(
            "packet contents changed after inspection; inspect again before export".into(),
        ));
    }
    let mut archive_files = current;
    archive_files.push(inspect_file(source, Path::new("inspection.json"))?);
    archive_files.sort_by(|a, b| a.path.cmp(&b.path));

    let parent = output.parent().unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent)?;
    let filename = output
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("diagnostic-packet.zip");
    let temporary = parent.join(format!(".{filename}.writing-{}", std::process::id()));
    let result = write_zip(source, &temporary, &archive_files);
    match result {
        Ok(()) => {
            fs::rename(&temporary, output)?;
            Ok((archive_files.len(), fs::metadata(output)?.len()))
        }
        Err(error) => {
            let _ = fs::remove_file(&temporary);
            Err(error)
        }
    }
}

fn validate_packet_dir(source: &Path) -> Result<()> {
    if !source.is_dir() {
        return Err(PacketError::Invalid(format!(
            "packet directory `{}` does not exist",
            source.display()
        )));
    }
    for required in ["report.json", "report.html"] {
        if !source.join(required).is_file() {
            return Err(PacketError::Invalid(format!(
                "`{}` is not a staged packet: {required} is missing",
                source.display()
            )));
        }
    }
    Ok(())
}

fn inventory(source: &Path) -> Result<Vec<InspectedFile>> {
    let mut paths = Vec::new();
    collect_paths(source, source, &mut paths)?;
    let mut files = Vec::new();
    for relative in paths {
        if relative == Path::new("inspection.json") {
            continue;
        }
        files.push(inspect_file(source, &relative)?);
    }
    files.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(files)
}

fn collect_paths(root: &Path, directory: &Path, output: &mut Vec<PathBuf>) -> Result<()> {
    for entry in fs::read_dir(directory)? {
        let entry = entry?;
        let metadata = fs::symlink_metadata(entry.path())?;
        if metadata.file_type().is_symlink() {
            return Err(PacketError::Unsafe(format!(
                "staged packet contains symlink `{}`",
                entry.path().display()
            )));
        }
        if metadata.is_dir() {
            collect_paths(root, &entry.path(), output)?;
        } else if metadata.is_file() {
            let relative = entry
                .path()
                .strip_prefix(root)
                .map_err(|_| PacketError::Unsafe("packet path escaped its root".into()))?
                .to_path_buf();
            output.push(relative);
        }
    }
    Ok(())
}

fn inspect_file(root: &Path, relative: &Path) -> Result<InspectedFile> {
    let path = root.join(relative);
    let mut file = fs::File::open(&path)?;
    let mut hasher = Sha256::new();
    let mut bytes = 0_u64;
    let mut buffer = [0_u8; 16 * 1024];
    loop {
        let read = file.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        hasher.update(&buffer[..read]);
        bytes += read as u64;
    }
    let display = relative.to_string_lossy().replace('\\', "/");
    Ok(InspectedFile {
        path: display,
        bytes,
        sha256: format!("{:x}", hasher.finalize()),
    })
}

fn write_zip(root: &Path, output: &Path, files: &[InspectedFile]) -> Result<()> {
    let file = fs::File::create(output)?;
    let mut writer = ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(CompressionMethod::Deflated)
        .unix_permissions(0o644);
    for item in files {
        writer.start_file(&item.path, options)?;
        let mut source = fs::File::open(root.join(&item.path))?;
        std::io::copy(&mut source, &mut writer)?;
    }
    writer.finish()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn export_requires_inspection_and_detects_changes() {
        let dir = tempdir().unwrap();
        let packet = dir.path().join("review");
        fs::create_dir(&packet).unwrap();
        fs::write(packet.join("report.json"), "{}").unwrap();
        fs::write(packet.join("report.html"), "<html></html>").unwrap();
        let archive = dir.path().join("packet.zip");
        assert!(export(&packet, &archive).is_err());
        inspect(&packet).unwrap();
        fs::write(packet.join("report.json"), "changed").unwrap();
        assert!(export(&packet, &archive).is_err());
        inspect(&packet).unwrap();
        assert!(export(&packet, &archive).is_ok());
    }
}
