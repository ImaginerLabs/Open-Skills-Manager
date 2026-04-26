use serde::{Deserialize, Serialize};

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppError {
    code: String,
    message: String,
    category: ErrorCategory,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ErrorCategory {
    FileSystem,
    Network,
    Validation,
    Permission,
    NotFound,
    State,
    Internal,
}

#[allow(dead_code)]
impl AppError {
    pub fn new(code: &str, message: &str, category: ErrorCategory) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            category,
        }
    }

    pub fn code(&self) -> &str {
        &self.code
    }

    pub fn message(&self) -> &str {
        &self.message
    }

    pub fn category(&self) -> &ErrorCategory {
        &self.category
    }

    pub fn log(&self, context: serde_json::Value) {
        crate::utils::logger::log_error(&self.code, &self.message, context);
    }

    pub fn to_ipc_error(&self) -> super::super::commands::library::IpcError {
        super::super::commands::library::IpcError {
            code: self.code.clone(),
            message: self.message.clone(),
        }
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}: {}", self.code, self.category_str(), self.message)
    }
}

impl std::error::Error for AppError {}

#[allow(dead_code)]
impl AppError {
    fn category_str(&self) -> &'static str {
        match self.category {
            ErrorCategory::FileSystem => "FILE_SYSTEM",
            ErrorCategory::Network => "NETWORK",
            ErrorCategory::Validation => "VALIDATION",
            ErrorCategory::Permission => "PERMISSION",
            ErrorCategory::NotFound => "NOT_FOUND",
            ErrorCategory::State => "STATE",
            ErrorCategory::Internal => "INTERNAL",
        }
    }
}

// ============================================================================
// Error Code Definitions
// ============================================================================

#[allow(dead_code)]
pub mod codes {
    // File System Errors (1000-1099)
    pub const FILE_NOT_FOUND: &str = "E1000";
    pub const FILE_READ_ERROR: &str = "E1001";
    pub const FILE_WRITE_ERROR: &str = "E1002";
    pub const FILE_DELETE_ERROR: &str = "E1003";
    pub const DIR_CREATE_ERROR: &str = "E1004";
    pub const DIR_READ_ERROR: &str = "E1005";
    pub const PATH_INVALID: &str = "E1006";
    pub const SKILL_MD_NOT_FOUND: &str = "E1007";
    pub const COPY_FAILED: &str = "E1008";
    pub const ZIP_ERROR: &str = "E1009";

    // Network Errors (1100-1199)
    pub const NETWORK_ERROR: &str = "E1100";
    pub const NETWORK_TIMEOUT: &str = "E1101";
    pub const NETWORK_UNAUTHORIZED: &str = "E1102";

    // Validation Errors (1200-1299)
    pub const VALIDATION_ERROR: &str = "E1200";
    pub const INVALID_INPUT: &str = "E1201";
    pub const INVALID_FORMAT: &str = "E1202";
    pub const INVALID_PATH: &str = "E1203";

    // Permission Errors (1300-1399)
    pub const PERMISSION_DENIED: &str = "E1300";
    pub const KEYCHAIN_ACCESS_DENIED: &str = "E1301";

    // State Errors (1400-1499)
    pub const STATE_ERROR: &str = "E1400";
    pub const STATE_CORRUPTED: &str = "E1401";
    pub const STATE_MIGRATION_FAILED: &str = "E1402";

    // Internal Errors (1500-1599)
    pub const INTERNAL_ERROR: &str = "E1500";
    pub const UNKNOWN_ERROR: &str = "E1501";
}

// ============================================================================
// Helper Functions
// ============================================================================

use crate::utils::error_codes::ErrorCategory::*;
use crate::utils::error_codes::codes::*;

#[allow(dead_code)]
pub fn file_not_found(path: &str) -> AppError {
    AppError::new(FILE_NOT_FOUND, &format!("File not found: {}", path), NotFound)
}

#[allow(dead_code)]
pub fn file_read_error(path: &str, reason: &str) -> AppError {
    AppError::new(FILE_READ_ERROR, &format!("Failed to read file '{}': {}", path, reason), FileSystem)
}

#[allow(dead_code)]
pub fn file_write_error(path: &str, reason: &str) -> AppError {
    AppError::new(FILE_WRITE_ERROR, &format!("Failed to write file '{}': {}", path, reason), FileSystem)
}

#[allow(dead_code)]
pub fn file_delete_error(path: &str, reason: &str) -> AppError {
    AppError::new(FILE_DELETE_ERROR, &format!("Failed to delete '{}': {}", path, reason), FileSystem)
}

#[allow(dead_code)]
pub fn dir_create_error(path: &str, reason: &str) -> AppError {
    AppError::new(DIR_CREATE_ERROR, &format!("Failed to create directory '{}': {}", path, reason), FileSystem)
}

#[allow(dead_code)]
pub fn skill_md_not_found(path: &str) -> AppError {
    AppError::new(SKILL_MD_NOT_FOUND, &format!("SKILL.md not found at: {}", path), NotFound)
}

#[allow(dead_code)]
pub fn copy_failed(source: &str, dest: &str, reason: &str) -> AppError {
    AppError::new(COPY_FAILED, &format!("Failed to copy '{}' to '{}': {}", source, dest, reason), FileSystem)
}

#[allow(dead_code)]
pub fn zip_error(reason: &str) -> AppError {
    AppError::new(ZIP_ERROR, &format!("Zip operation failed: {}", reason), FileSystem)
}

#[allow(dead_code)]
pub fn validation_error(message: &str) -> AppError {
    AppError::new(VALIDATION_ERROR, message, Validation)
}

#[allow(dead_code)]
pub fn internal_error(message: &str) -> AppError {
    AppError::new(INTERNAL_ERROR, message, Internal)
}