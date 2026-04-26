/// Application Error Codes (E001-E499)
///
/// Error code ranges:
/// - E001-E099: General errors
/// - E100-E199: File system errors
/// - E200-E299: Library management errors
/// - E300-E399: Category/Group errors
/// - E400-E499: Security errors

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AppError {
    // General errors E001-E099
    E001Unknown(String),
    E002InvalidInput(String),
    E003NotFound(String),

    // File system errors E100-E199
    E100FileNotFound(String),
    E101CreateDirFailed(String),
    E102WriteFailed(String),
    E103ReadFailed(String),
    E104DeleteFailed(String),
    E105CopyFailed(String),

    // Library management errors E200-E299
    E200LibraryNotFound(String),
    E201LibraryCreateFailed(String),
    E202LibraryLoadFailed(String),
    E203SkillNotFound(String),
    E204SkillCreateFailed(String),

    // Category/Group errors E300-E399
    E300CategoryNotFound(String),
    E301CategoryCreateFailed(String),
    E302GroupNotFound(String),
    E303GroupCreateFailed(String),

    // Security errors E400-E499
    E400SanitizationFailed(String),
    E401PermissionDenied(String),
    E402PathTraversal(String),
}

impl AppError {
    pub fn code(&self) -> &'static str {
        match self {
            AppError::E001Unknown(_) => "E001",
            AppError::E002InvalidInput(_) => "E002",
            AppError::E003NotFound(_) => "E003",
            AppError::E100FileNotFound(_) => "E100",
            AppError::E101CreateDirFailed(_) => "E101",
            AppError::E102WriteFailed(_) => "E102",
            AppError::E103ReadFailed(_) => "E103",
            AppError::E104DeleteFailed(_) => "E104",
            AppError::E105CopyFailed(_) => "E105",
            AppError::E200LibraryNotFound(_) => "E200",
            AppError::E201LibraryCreateFailed(_) => "E201",
            AppError::E202LibraryLoadFailed(_) => "E202",
            AppError::E203SkillNotFound(_) => "E203",
            AppError::E204SkillCreateFailed(_) => "E204",
            AppError::E300CategoryNotFound(_) => "E300",
            AppError::E301CategoryCreateFailed(_) => "E301",
            AppError::E302GroupNotFound(_) => "E302",
            AppError::E303GroupCreateFailed(_) => "E303",
            AppError::E400SanitizationFailed(_) => "E400",
            AppError::E401PermissionDenied(_) => "E401",
            AppError::E402PathTraversal(_) => "E402",
        }
    }

    pub fn message(&self) -> &str {
        match self {
            AppError::E001Unknown(msg) => msg,
            AppError::E002InvalidInput(msg) => msg,
            AppError::E003NotFound(msg) => msg,
            AppError::E100FileNotFound(msg) => msg,
            AppError::E101CreateDirFailed(msg) => msg,
            AppError::E102WriteFailed(msg) => msg,
            AppError::E103ReadFailed(msg) => msg,
            AppError::E104DeleteFailed(msg) => msg,
            AppError::E105CopyFailed(msg) => msg,
            AppError::E200LibraryNotFound(msg) => msg,
            AppError::E201LibraryCreateFailed(msg) => msg,
            AppError::E202LibraryLoadFailed(msg) => msg,
            AppError::E203SkillNotFound(msg) => msg,
            AppError::E204SkillCreateFailed(msg) => msg,
            AppError::E300CategoryNotFound(msg) => msg,
            AppError::E301CategoryCreateFailed(msg) => msg,
            AppError::E302GroupNotFound(msg) => msg,
            AppError::E303GroupCreateFailed(msg) => msg,
            AppError::E400SanitizationFailed(msg) => msg,
            AppError::E401PermissionDenied(msg) => msg,
            AppError::E402PathTraversal(msg) => msg,
        }
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code(), self.message())
    }
}

impl std::error::Error for AppError {}

/// Convert AppError to IpcError format
#[allow(dead_code)]
impl AppError {
    pub fn to_ipc_error(&self) -> crate::commands::IpcError {
        crate::commands::IpcError {
            code: self.code().to_string(),
            message: self.message().to_string(),
        }
    }
}
