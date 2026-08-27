use regex::{Captures, Regex};
use serde::{Deserialize, Serialize};
use std::{env, sync::LazyLock};

static EMAIL: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b").unwrap());
static IPV4: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\b(?:\d{1,3}\.){3}\d{1,3}\b").unwrap());
static SECRET_ASSIGNMENT: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"(?im)[\"']?\b(token|secret|password|passwd|api[_-]?key|authorization)\b[\"']?\s*[:=]\s*[\"']?(?:bearer\s+)?[^\s,;\"']+[\"']?"#).unwrap()
});
static BEARER: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)\bbearer\s+[A-Za-z0-9._~+/=-]{8,}").unwrap());
static LONG_TOKEN: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})\b")
        .unwrap()
});
static UNIX_HOME: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)(?:/home/|/users/)[^/\s]+(?:/[^\s]*)?").unwrap());
static WINDOWS_HOME: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)[a-z]:\\users\\[^\\\s]+(?:\\[^\s]*)?").unwrap());

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RedactionSummary {
    pub total: usize,
    pub secrets: usize,
    pub emails: usize,
    pub ip_addresses: usize,
    pub home_paths: usize,
}

pub fn redact(input: &str) -> (String, RedactionSummary) {
    let mut output = input.to_string();
    let mut summary = RedactionSummary::default();
    output = replace_count(
        &SECRET_ASSIGNMENT,
        &output,
        "[REDACTED_SECRET]",
        &mut summary.secrets,
    );
    output = replace_count(
        &BEARER,
        &output,
        "Bearer [REDACTED_SECRET]",
        &mut summary.secrets,
    );
    output = replace_count(
        &LONG_TOKEN,
        &output,
        "[REDACTED_SECRET]",
        &mut summary.secrets,
    );
    output = replace_count(&EMAIL, &output, "[REDACTED_EMAIL]", &mut summary.emails);
    output = IPV4
        .replace_all(&output, |caps: &Captures<'_>| {
            let candidate = &caps[0];
            if candidate.split('.').all(|part| part.parse::<u8>().is_ok()) {
                summary.ip_addresses += 1;
                "[REDACTED_IP]".to_string()
            } else {
                candidate.to_string()
            }
        })
        .into_owned();
    if let Some(home) = env::var_os("HOME")
        .and_then(|v| v.into_string().ok())
        .filter(|v| v.len() > 1)
    {
        let count = output.matches(&home).count();
        if count > 0 {
            output = output.replace(&home, "[HOME]");
            summary.home_paths += count;
        }
    }
    if let Some(home) = env::var_os("USERPROFILE")
        .and_then(|v| v.into_string().ok())
        .filter(|v| v.len() > 3)
    {
        let count = output.matches(&home).count();
        if count > 0 {
            output = output.replace(&home, "[HOME]");
            summary.home_paths += count;
        }
    }
    output = replace_count(&UNIX_HOME, &output, "[HOME]", &mut summary.home_paths);
    output = replace_count(&WINDOWS_HOME, &output, "[HOME]", &mut summary.home_paths);
    summary.total = summary.secrets + summary.emails + summary.ip_addresses + summary.home_paths;
    (output, summary)
}

fn replace_count(regex: &Regex, input: &str, replacement: &str, count: &mut usize) -> String {
    *count += regex.find_iter(input).count();
    regex.replace_all(input, replacement).into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_common_sensitive_values() {
        let source = "email=dev@example.com ip=192.168.1.8 token=abc123456789 password: hunter2 Bearer abcdefghijklmnop path=/Users/alex/project";
        let (clean, summary) = redact(source);
        assert!(!clean.contains("dev@example.com"));
        assert!(!clean.contains("192.168.1.8"));
        assert!(!clean.contains("hunter2"));
        assert!(!clean.contains("abcdefghijklmnop"));
        assert!(!clean.contains("alex"));
        assert!(summary.total >= 5);
    }

    #[test]
    fn redacts_quoted_json_secrets() {
        let (clean, summary) = redact(r#"{"api_key":"sk-this-must-not-survive-123456789"}"#);
        assert!(!clean.contains("must-not-survive"));
        assert_eq!(summary.secrets, 1);
    }

    #[test]
    fn leaves_invalid_ipv4_like_versions_alone() {
        let (clean, summary) = redact("version 999.2.3.4");
        assert_eq!(clean, "version 999.2.3.4");
        assert_eq!(summary.ip_addresses, 0);
    }
}
