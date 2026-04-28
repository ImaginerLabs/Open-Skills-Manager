use crate::paths::{
    get_icloud_container_path as paths_icloud_container_path,
    get_local_cache_path as paths_local_cache_path,
    get_library_path, get_metadata_path,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SyncStatus {
    Synced,
    Syncing,
    Pending,
    Offline,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatusInfo {
    pub status: SyncStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_sync_time: Option<String>,
    pub pending_changes: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub storage_used: u64,
    pub storage_total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaInfo {
    pub available: bool,
    pub used_bytes: u64,
    pub total_bytes: u64,
    pub percent_used: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingChange {
    pub skill_id: String,
    pub change_type: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictVersion {
    pub modified_time: String,
    pub size: u64,
    pub device_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictInfo {
    pub skill_id: String,
    pub skill_name: String,
    pub local_version: ConflictVersion,
    pub remote_version: ConflictVersion,
}

// Use centralized paths from paths.rs
pub fn get_icloud_container_path() -> PathBuf {
    paths_icloud_container_path()
}

pub fn get_local_cache_path() -> PathBuf {
    paths_local_cache_path()
}

pub fn get_skills_path() -> PathBuf {
    get_library_path()
}

pub fn get_config_path() -> PathBuf {
    get_metadata_path()
}

pub fn get_deployments_path() -> PathBuf {
    get_icloud_container_path().join("deployments.json")
}

pub fn icloud_is_available() -> bool {
    let container = get_icloud_container_path();
    container.exists() || {
        if let Ok(_) = fs::create_dir_all(&container) {
            true
        } else {
            false
        }
    }
}

pub fn get_last_sync_time() -> Option<String> {
    let container = get_icloud_container_path();
    if let Ok(metadata) = fs::metadata(&container) {
        if let Ok(modified) = metadata.modified() {
            if let Ok(datetime) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                let secs = datetime.as_secs();
                let datetime: chrono::DateTime<chrono::Utc> = chrono::DateTime::from_timestamp(secs as i64, 0)?;
                return Some(datetime.to_rfc3339());
            }
        }
    }
    None
}

pub fn calculate_storage_used() -> u64 {
    let skills_path = get_skills_path();
    let config_path = get_config_path();
    let deployments_path = get_deployments_path();

    let mut total: u64 = 0;

    if skills_path.exists() {
        total += calculate_dir_size(&skills_path);
    }
    if config_path.exists() {
        total += calculate_dir_size(&config_path);
    }
    if deployments_path.exists() {
        if let Ok(metadata) = fs::metadata(&deployments_path) {
            total += metadata.len();
        }
    }

    total
}

fn calculate_dir_size(path: &PathBuf) -> u64 {
    let mut total: u64 = 0;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = fs::metadata(&path) {
                    total += metadata.len();
                }
            } else if path.is_dir() {
                total += calculate_dir_size(&path);
            }
        }
    }
    total
}

pub fn get_pending_changes() -> Vec<PendingChange> {
    Vec::new()
}

pub fn ensure_icloud_structure() -> Result<(), String> {
    let container = get_icloud_container_path();
    let skills = get_skills_path();
    let config = get_config_path();

    fs::create_dir_all(&container).map_err(|e| format!("Failed to create iCloud container: {}", e))?;
    fs::create_dir_all(&skills).map_err(|e| format!("Failed to create skills directory: {}", e))?;
    fs::create_dir_all(&config).map_err(|e| format!("Failed to create config directory: {}", e))?;

    Ok(())
}

pub fn ensure_local_cache() -> Result<(), String> {
    let cache = get_local_cache_path();
    fs::create_dir_all(&cache).map_err(|e| format!("Failed to create local cache: {}", e))
}

pub fn fallback_to_local_cache() -> PathBuf {
    let cache = get_local_cache_path();
    if let Err(_) = ensure_local_cache() {
        // Fallback to app support path
        return crate::paths::get_app_support_path();
    }
    cache
}

pub fn get_device_name() -> String {
    std::env::var("USER")
        .unwrap_or_else(|_| "Unknown Device".to_string())
}

pub fn get_conflicts() -> Vec<ConflictInfo> {
    // Placeholder - returns empty list for MVP
    // In production, this would check for actual sync conflicts
    Vec::new()
}

pub fn resolve_conflict(skill_id: &str, resolution: &str) -> Result<(), String> {
    let skills_path = get_skills_path();
    let skill_dir = skills_path.join(skill_id);

    match resolution {
        "local" => {
            // Keep local version - ensure it's preserved
            Ok(())
        },
        "remote" => {
            // Keep remote version - would need to fetch from iCloud
            // For MVP, just acknowledge the resolution
            Ok(())
        },
        "both" => {
            // Keep both - rename remote version
            let device_name = get_device_name();
            let renamed_dir = skills_path.join(format!("{} (from {})", skill_id, device_name));
            if skill_dir.exists() && !renamed_dir.exists() {
                fs::rename(&skill_dir, &renamed_dir).map_err(|e| format!("Failed to rename: {}", e))?;
            }
            Ok(())
        },
        _ => Err(format!("Invalid resolution: {}", resolution))
    }
}
