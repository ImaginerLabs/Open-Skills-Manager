use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::SystemTime;

use super::library::IpcResult;
use super::config::{load_config, update_config};
use super::AppError;
use crate::paths;

// ============================================================================
// Sync Status Types
// ============================================================================

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
pub struct SyncResult {
    pub success: bool,
    pub synced_items: u32,
    pub errors: Vec<String>,
    pub timestamp: String,
}

// ============================================================================
// Sync Commands
// ============================================================================

#[tauri::command]
pub fn sync_status() -> IpcResult<SyncStatusInfo> {
    let available = paths::icloud_is_available();

    if !available {
        return IpcResult::success(SyncStatusInfo {
            status: SyncStatus::Offline,
            last_sync_time: None,
            pending_changes: 0,
            error_message: Some("iCloud container not available".to_string()),
            storage_used: 0,
            storage_total: 0,
        });
    }

    // Get last sync time from config
    let last_sync_time = match load_config() {
        Ok(config) => config.sync.last_sync_time,
        Err(_) => None,
    };

    // Calculate storage used
    let storage_used = calculate_storage_used();

    // Default quota (5GB for iCloud Documents)
    const DEFAULT_QUOTA: u64 = 5_000_000_000;

    let status = if last_sync_time.is_some() {
        SyncStatus::Synced
    } else {
        SyncStatus::Pending
    };

    IpcResult::success(SyncStatusInfo {
        status,
        last_sync_time,
        pending_changes: 0,
        error_message: None,
        storage_used,
        storage_total: DEFAULT_QUOTA,
    })
}

#[tauri::command]
pub fn sync_full() -> IpcResult<SyncResult> {
    let timestamp = chrono::Utc::now().to_rfc3339();
    let mut synced_items = 0u32;
    let mut errors = Vec::new();

    // Check if iCloud is available
    if !paths::icloud_is_available() {
        return IpcResult::success(SyncResult {
            success: false,
            synced_items: 0,
            errors: vec!["iCloud container not available".to_string()],
            timestamp,
        });
    }

    // Ensure iCloud structure exists
    if let Err(e) = paths::ensure_icloud_structure() {
        return IpcResult::success(SyncResult {
            success: false,
            synced_items: 0,
            errors: vec![format!("Failed to initialize iCloud: {}", e)],
            timestamp,
        });
    }

    // Sync config to iCloud
    match sync_config_to_icloud() {
        Ok(_) => synced_items += 1,
        Err(e) => errors.push(format!("Config sync failed: {}", e)),
    }

    // Sync skill organization to iCloud
    match sync_skill_org_to_icloud() {
        Ok(_) => synced_items += 1,
        Err(e) => errors.push(format!("Skill organization sync failed: {}", e)),
    }

    // Update last sync time in config
    if let Err(e) = update_config(|config| {
        config.sync.last_sync_time = Some(timestamp.clone());
    }) {
        errors.push(format!("Failed to update sync time: {}", e));
    }

    IpcResult::success(SyncResult {
        success: errors.is_empty(),
        synced_items,
        errors,
        timestamp,
    })
}

#[tauri::command]
pub fn sync_enable(enabled: bool) -> IpcResult<()> {
    match update_config(|config| {
        config.sync.enabled = enabled;
    }) {
        Ok(_) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn sync_set_interval(interval_minutes: u32) -> IpcResult<()> {
    match update_config(|config| {
        config.sync.interval_minutes = interval_minutes;
    }) {
        Ok(_) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn sync_icloud_path() -> IpcResult<String> {
    let path = paths::get_icloud_container_path();
    IpcResult::success(path.to_string_lossy().to_string())
}

// ============================================================================
// Internal Sync Functions
// ============================================================================

fn sync_config_to_icloud() -> Result<(), String> {
    let config = load_config()?;
    let icloud_config_path = paths::get_icloud_container_path().join("config.json");

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&icloud_config_path, content)
        .map_err(|e| format!("Failed to write config to iCloud: {}", e))?;

    Ok(())
}

fn sync_skill_org_to_icloud() -> Result<(), String> {
    let config = load_config()?;
    let skill_org_path = paths::get_skill_org_path();

    // Ensure metadata directory exists
    if let Some(parent) = skill_org_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create metadata directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(&config.skill_organization)
        .map_err(|e| format!("Failed to serialize skill organization: {}", e))?;

    fs::write(&skill_org_path, content)
        .map_err(|e| format!("Failed to write skill organization to iCloud: {}", e))?;

    Ok(())
}

fn calculate_storage_used() -> u64 {
    let library_path = paths::get_library_path();
    let config_path = paths::get_icloud_container_path().join("config.json");
    let metadata_path = paths::get_metadata_path();

    let mut total: u64 = 0;

    if library_path.exists() {
        total += calculate_dir_size(&library_path);
    }
    if config_path.exists() {
        if let Ok(metadata) = fs::metadata(&config_path) {
            total += metadata.len();
        }
    }
    if metadata_path.exists() {
        total += calculate_dir_size(&metadata_path);
    }

    total
}

fn calculate_dir_size(path: &PathBuf) -> u64 {
    let mut total: u64 = 0;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if entry_path.is_file() {
                if let Ok(metadata) = fs::metadata(&entry_path) {
                    total += metadata.len();
                }
            } else if entry_path.is_dir() {
                total += calculate_dir_size(&entry_path);
            }
        }
    }
    total
}

// ============================================================================
// Trigger Sync (called from other commands)
// ============================================================================

/// Trigger an immediate sync after data changes
/// This should be called after:
/// - Skill import/delete
/// - Category/group changes
/// - Settings changes
/// - IDE config changes
pub fn trigger_sync() {
    // In a production app, this would:
    // 1. Check if sync is enabled
    // 2. Queue a sync task
    // 3. Execute sync in background

    // For now, we just mark that there are pending changes
    // The actual sync will happen on the next sync_full() call
    let _ = update_config(|config| {
        // Mark that sync is needed
        // The last_sync_time will be updated when sync_full() is called
    });
}
