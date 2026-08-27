use crate::{PacketError, Result};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    fs,
    path::{Component, Path, PathBuf},
};

pub const ALLOWED_TOOLS: &[&str] = &[
    "node", "npm", "npx", "git", "code", "python", "python3", "rustc", "cargo", "go", "java",
    "docker", "deno", "bun", "pnpm", "yarn",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Manifest {
    pub format_version: u8,
    pub title: String,
    pub incident: Incident,
    #[serde(default)]
    pub collectors: Vec<Collector>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Incident {
    pub summary: String,
    pub expected: String,
    pub actual: String,
    #[serde(default)]
    pub steps: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case", deny_unknown_fields)]
pub enum Collector {
    System {
        id: String,
    },
    ToolVersion {
        id: String,
        command: Vec<String>,
    },
    ConfigHash {
        id: String,
        path: PathBuf,
    },
    Log {
        id: String,
        path: PathBuf,
        #[serde(default = "default_max_bytes")]
        max_bytes: u64,
    },
    Environment {
        id: String,
        names: Vec<String>,
    },
}

fn default_max_bytes() -> u64 {
    200_000
}

impl Collector {
    pub fn id(&self) -> &str {
        match self {
            Self::System { id }
            | Self::ToolVersion { id, .. }
            | Self::ConfigHash { id, .. }
            | Self::Log { id, .. }
            | Self::Environment { id, .. } => id,
        }
    }

    pub fn kind(&self) -> &'static str {
        match self {
            Self::System { .. } => "system",
            Self::ToolVersion { .. } => "tool-version",
            Self::ConfigHash { .. } => "config-hash",
            Self::Log { .. } => "log",
            Self::Environment { .. } => "environment",
        }
    }

    pub fn description(&self) -> String {
        match self {
            Self::System { .. } => "OS family, architecture, and CLI version".into(),
            Self::ToolVersion { command, .. } => {
                format!("run `{}` after approval", command.join(" "))
            }
            Self::ConfigHash { path, .. } => format!("SHA-256 only for `{}`", path.display()),
            Self::Log {
                path, max_bytes, ..
            } => format!(
                "redacted text from `{}` (max {max_bytes} bytes)",
                path.display()
            ),
            Self::Environment { names, .. } => {
                format!("explicit environment names: {}", names.join(", "))
            }
        }
    }
}

pub fn load(path: &Path) -> Result<(Manifest, PathBuf)> {
    let text = fs::read_to_string(path)?;
    let manifest: Manifest = toml::from_str(&text)
        .map_err(|error| PacketError::Invalid(format!("{}: {error}", path.display())))?;
    let root = path
        .parent()
        .unwrap_or_else(|| Path::new("."))
        .canonicalize()?;
    validate(&manifest)?;
    Ok((manifest, root))
}

pub fn validate(manifest: &Manifest) -> Result<()> {
    if manifest.format_version != 1 {
        return Err(PacketError::Invalid(format!(
            "unsupported format_version {}; expected 1",
            manifest.format_version
        )));
    }
    if manifest.title.trim().is_empty() || manifest.incident.summary.trim().is_empty() {
        return Err(PacketError::Invalid(
            "title and incident.summary must not be empty".into(),
        ));
    }
    if manifest.collectors.is_empty() {
        return Err(PacketError::Invalid(
            "manifest has no collectors; add at least one allowlisted collector".into(),
        ));
    }
    let mut ids = HashSet::new();
    for collector in &manifest.collectors {
        let id = collector.id();
        if id.is_empty()
            || !id
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
        {
            return Err(PacketError::Invalid(format!(
                "collector id `{id}` must use letters, numbers, - or _"
            )));
        }
        if !ids.insert(id) {
            return Err(PacketError::Invalid(format!(
                "collector id `{id}` is duplicated"
            )));
        }
        match collector {
            Collector::ToolVersion { command, .. } => validate_command(command)?,
            Collector::ConfigHash { path, .. } | Collector::Log { path, .. } => {
                validate_relative_path(path)?
            }
            Collector::Environment { names, .. } => {
                if names.is_empty() {
                    return Err(PacketError::Invalid(format!(
                        "environment collector `{id}` has no names"
                    )));
                }
                for name in names {
                    validate_env_name(name)?;
                }
            }
            Collector::System { .. } => {}
        }
        if let Collector::Log { max_bytes, .. } = collector {
            if *max_bytes == 0 || *max_bytes > 5_000_000 {
                return Err(PacketError::Invalid(format!(
                    "collector `{id}` max_bytes must be between 1 and 5000000"
                )));
            }
        }
    }
    Ok(())
}

fn validate_command(command: &[String]) -> Result<()> {
    if command.is_empty() {
        return Err(PacketError::Invalid(
            "tool-version command cannot be empty".into(),
        ));
    }
    let executable = Path::new(&command[0])
        .file_name()
        .and_then(|v| v.to_str())
        .unwrap_or("");
    if !ALLOWED_TOOLS.contains(&executable) {
        return Err(PacketError::Unsafe(format!(
            "tool `{executable}` is not in the version-tool allowlist"
        )));
    }
    let flag = command.get(1).map(String::as_str).unwrap_or("");
    let valid_flag = command.len() == 2
        && match executable {
            "python" | "python3" | "java" => matches!(flag, "--version" | "-V" | "-version"),
            "rustc" | "cargo" => matches!(flag, "--version" | "-V"),
            _ => matches!(flag, "--version" | "-v" | "-V"),
        };
    if !valid_flag {
        return Err(PacketError::Unsafe(format!(
            "tool-version collector for `{executable}` may only use a supported version flag"
        )));
    }
    if command
        .iter()
        .any(|arg| arg.contains('\0') || arg.contains('\n') || arg.contains('\r'))
    {
        return Err(PacketError::Unsafe(
            "command arguments cannot contain control characters".into(),
        ));
    }
    Ok(())
}

pub fn validate_relative_path(path: &Path) -> Result<()> {
    if path.as_os_str().is_empty() || path.is_absolute() {
        return Err(PacketError::Unsafe(format!(
            "path `{}` must be relative to the manifest",
            path.display()
        )));
    }
    if path.components().any(|part| {
        matches!(
            part,
            Component::ParentDir | Component::RootDir | Component::Prefix(_)
        )
    }) {
        return Err(PacketError::Unsafe(format!(
            "path `{}` cannot leave the project directory",
            path.display()
        )));
    }
    Ok(())
}

fn validate_env_name(name: &str) -> Result<()> {
    if name.is_empty()
        || !name
            .chars()
            .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit() || c == '_')
    {
        return Err(PacketError::Invalid(format!(
            "environment name `{name}` must use A-Z, 0-9, and _"
        )));
    }
    let upper = name.to_ascii_uppercase();
    let forbidden = [
        "TOKEN",
        "SECRET",
        "PASSWORD",
        "PASSWD",
        "AUTH",
        "COOKIE",
        "SESSION",
        "PRIVATE",
        "CREDENTIAL",
        "API_KEY",
        "ACCESS_KEY",
    ];
    if forbidden.iter().any(|word| upper.contains(word)) {
        return Err(PacketError::Unsafe(format!(
            "environment name `{name}` looks sensitive and cannot be collected"
        )));
    }
    Ok(())
}

pub fn resolve_project_path(root: &Path, relative: &Path) -> Result<PathBuf> {
    validate_relative_path(relative)?;
    let joined = root.join(relative);
    if joined.exists() {
        let canonical = joined.canonicalize()?;
        if !canonical.starts_with(root) {
            return Err(PacketError::Unsafe(format!(
                "path `{}` resolves outside the project directory",
                relative.display()
            )));
        }
        Ok(canonical)
    } else {
        Ok(joined)
    }
}

pub const STARTER_MANIFEST: &str = r#"format_version = 1
title = "Describe this incident"

[incident]
summary = "What failed?"
expected = "What should have happened?"
actual = "What happened instead?"
steps = ["Add the exact reproduction steps"]

[[collectors]]
id = "system"
type = "system"

[[collectors]]
id = "git"
type = "tool-version"
command = ["git", "--version"]

[[collectors]]
id = "lockfile"
type = "config-hash"
path = "package-lock.json"
"#;

#[cfg(test)]
mod tests {
    use super::*;

    fn base(collector: Collector) -> Manifest {
        Manifest {
            format_version: 1,
            title: "Incident".into(),
            incident: Incident {
                summary: "Failure".into(),
                expected: "Works".into(),
                actual: "Stops".into(),
                steps: vec![],
            },
            collectors: vec![collector],
        }
    }

    #[test]
    fn rejects_path_escape_and_sensitive_environment() {
        assert!(
            validate(&base(Collector::Log {
                id: "log".into(),
                path: "../secret".into(),
                max_bytes: 100
            }))
            .is_err()
        );
        assert!(
            validate(&base(Collector::Environment {
                id: "env".into(),
                names: vec!["API_TOKEN".into()]
            }))
            .is_err()
        );
    }

    #[test]
    fn tool_version_accepts_only_version_invocations() {
        assert!(
            validate(&base(Collector::ToolVersion {
                id: "git".into(),
                command: vec!["git".into(), "--version".into()]
            }))
            .is_ok()
        );
        assert!(
            validate(&base(Collector::ToolVersion {
                id: "git".into(),
                command: vec!["git".into(), "status".into()]
            }))
            .is_err()
        );
    }
}
