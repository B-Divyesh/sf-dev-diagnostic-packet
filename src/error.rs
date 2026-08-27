use std::{fmt, io};

#[derive(Debug)]
pub enum PacketError {
    Unsafe(String),
    Invalid(String),
    Io(io::Error),
    Other(String),
}

impl PacketError {
    pub fn exit_code(&self) -> i32 {
        match self {
            Self::Unsafe(_) | Self::Invalid(_) => 2,
            Self::Io(_) | Self::Other(_) => 1,
        }
    }
}

impl fmt::Display for PacketError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Unsafe(message) => write!(f, "unsafe input: {message}"),
            Self::Invalid(message) => write!(f, "invalid input: {message}"),
            Self::Io(error) => write!(f, "I/O error: {error}"),
            Self::Other(message) => write!(f, "{message}"),
        }
    }
}

impl std::error::Error for PacketError {}

impl From<io::Error> for PacketError {
    fn from(value: io::Error) -> Self {
        Self::Io(value)
    }
}

impl From<serde_json::Error> for PacketError {
    fn from(value: serde_json::Error) -> Self {
        Self::Other(format!("JSON error: {value}"))
    }
}

impl From<zip::result::ZipError> for PacketError {
    fn from(value: zip::result::ZipError) -> Self {
        Self::Other(format!("archive error: {value}"))
    }
}

pub type Result<T> = std::result::Result<T, PacketError>;
