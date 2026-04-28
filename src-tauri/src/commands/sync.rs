use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use super::library::IpcResult;
use super::AppError;
use crate::paths;
use crate::storage::service::get_storage;

// ============================================================================
// Client Identity
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientIdentity {
    pub client_id: String,
    pub device_name: String,
    pub created_at: String,
}

/// Get or create client identity
pub fn get_or_create_client_identity() -> Result<ClientIdentity, String> {
    let client_id_path = paths::get_client_id_path();

    if client_id_path.exists() {
        let content = fs::read_to_string(&client_id_path)
            .map_err(|e| format!("Failed to read client identity: {}", e))?;
        let identity: ClientIdentity = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse client identity: {}", e))?;
        return Ok(identity);
    }

    // Create new identity
    let identity = ClientIdentity {
        client_id: format!("client-{}", uuid::Uuid::new_v4()),
        device_name: get_device_name(),
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    // Ensure directory exists
    if let Some(parent) = client_id_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(&identity)
        .map_err(|e| format!("Failed to serialize client identity: {}", e))?;
    fs::write(&client_id_path, content)
        .map_err(|e| format!("Failed to write client identity: {}", e))?;

    Ok(identity)
}

fn get_device_name() -> String {
    std::env::var("USER")
        .unwrap_or_else(|_| "Unknown Device".to_string())
}

// ============================================================================
// Sync State
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncState {
    pub last_sync_time: Option<String>,
    pub last_sync_by: Option<String>,
}

impl Default for SyncState {
    fn default() -> Self {
        Self {
            last_sync_time: None,
            last_sync_by: None,
        }
    }
}

/// Load sync state
pub fn load_sync_state() -> Result<SyncState, String> {
    let sync_state_path = paths::get_sync_state_path();

    if sync_state_path.exists() {
        let content = fs::read_to_string(&sync_state_path)
            .map_err(|e| format!("Failed to read sync state: {}", e))?;
        let state: SyncState = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse sync state: {}", e))?;
        return Ok(state);
    }

    Ok(SyncState::default())
}

/// Save sync state
pub fn save_sync_state(state: &SyncState) -> Result<(), String> {
    let sync_state_path = paths::get_sync_state_path();

    if let Some(parent) = sync_state_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let content = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Failed to serialize sync state: {}", e))?;
    fs::write(&sync_state_path, content)
        .map_err(|e| format!("Failed to write sync state: {}", e))?;

    Ok(())
}

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
    pub icloud_available: bool,
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
    let icloud_available = paths::icloud_is_available();

    if !icloud_available {
        return IpcResult::success(SyncStatusInfo {
            status: SyncStatus::Offline,
            last_sync_time: None,
            pending_changes: 0,
            error_message: Some("iCloud not available".to_string()),
            storage_used: 0,
            storage_total: 0,
            icloud_available: false,
        });
    }

    let sync_state = load_sync_state().unwrap_or_default();
    let storage_used = calculate_local_storage_used();
    const DEFAULT_QUOTA: u64 = 5_000_000_000;

    let status = if sync_state.last_sync_time.is_some() {
        SyncStatus::Synced
    } else {
        SyncStatus::Pending
    };

    IpcResult::success(SyncStatusInfo {
        status,
        last_sync_time: sync_state.last_sync_time,
        pending_changes: 0,
        error_message: None,
        storage_used,
        storage_total: DEFAULT_QUOTA,
        icloud_available: true,
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
            errors: vec!["iCloud not available".to_string()],
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

    // Get client identity
    let client_identity = match get_or_create_client_identity() {
        Ok(id) => id,
        Err(e) => {
            errors.push(format!("Failed to get client identity: {}", e));
            return IpcResult::success(SyncResult {
                success: false,
                synced_items: 0,
                errors,
                timestamp,
            });
        }
    };

    // Sync config
    match sync_config(&client_identity) {
        Ok(synced) => {
            if synced { synced_items += 1; }
        }
        Err(e) => errors.push(format!("Config sync failed: {}", e)),
    }

    // Sync library skills
    match sync_library(&client_identity) {
        Ok(count) => synced_items += count,
        Err(e) => errors.push(format!("Library sync failed: {}", e)),
    }

    // Update sync state
    let sync_state = SyncState {
        last_sync_time: Some(timestamp.clone()),
        last_sync_by: Some(client_identity.client_id.clone()),
    };
    if let Err(e) = save_sync_state(&sync_state) {
        errors.push(format!("Failed to update sync state: {}", e));
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
    let storage = get_storage();
    storage.set_icloud_enabled(enabled);
    match storage.write_config(|config| {
        config.sync_enabled = enabled;
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

#[tauri::command]
pub fn sync_local_path() -> IpcResult<String> {
    let path = paths::get_app_support_path();
    IpcResult::success(path.to_string_lossy().to_string())
}

// ============================================================================
// Internal Sync Functions
// ============================================================================

/// Sync config between local and iCloud
/// Returns true if sync happened
fn sync_config(client_identity: &ClientIdentity) -> Result<bool, String> {
    let local_path = paths::get_config_path();
    let icloud_path = paths::get_icloud_config_path();

    // Load local config using new storage layer
    let storage = get_storage();
    let local_config = storage.read_config()?;
    let local_updated_at = local_config.updated_at.clone();

    // Check iCloud config
    if icloud_path.exists() {
        let icloud_content = fs::read_to_string(&icloud_path)
            .map_err(|e| format!("Failed to read iCloud config: {}", e))?;
        let icloud_config: crate::storage::AppConfig = serde_json::from_str(&icloud_content)
            .map_err(|e| format!("Failed to parse iCloud config: {}", e))?;

        let icloud_updated_at = icloud_config.updated_at.clone();
        let icloud_updated_by = icloud_config.updated_by.clone();

        // Compare timestamps
        let local_time = chrono::DateTime::parse_from_rfc3339(&local_updated_at)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now());
        let icloud_time = chrono::DateTime::parse_from_rfc3339(&icloud_updated_at)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now());

        // If iCloud is newer and not from us, pull
        if icloud_time > local_time && icloud_updated_by != client_identity.client_id {
            // Pull from iCloud to local
            let content = serde_json::to_string_pretty(&icloud_config)
                .map_err(|e| format!("Failed to serialize config: {}", e))?;
            fs::write(&local_path, content)
                .map_err(|e| format!("Failed to write local config: {}", e))?;
            // Invalidate cache
            storage.invalidate_cache();
            return Ok(true);
        }
    }

    // Push local to iCloud (we have newer or iCloud doesn't exist)
    let config_to_push = local_config;

    let content = serde_json::to_string_pretty(&config_to_push)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    if let Some(parent) = icloud_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create iCloud directory: {}", e))?;
    }

    fs::write(&icloud_path, content)
        .map_err(|e| format!("Failed to write iCloud config: {}", e))?;

    Ok(true)
}

/// Sync library skills between local and iCloud
/// Returns count of synced items
fn sync_library(_client_identity: &ClientIdentity) -> Result<u32, String> {
    let local_library = paths::get_local_library_path();
    let icloud_library = paths::get_icloud_library_path();

    // Ensure directories exist
    fs::create_dir_all(&local_library)
        .map_err(|e| format!("Failed to create local library: {}", e))?;
    fs::create_dir_all(&icloud_library)
        .map_err(|e| format!("Failed to create iCloud library: {}", e))?;

    let mut synced_count = 0u32;

    // Get all skills from both locations
    let local_skills = list_skills(&local_library);
    let icloud_skills = list_skills(&icloud_library);

    // Sync from iCloud to local (if newer and not from us)
    for (skill_name, icloud_time) in &icloud_skills {
        let local_time = local_skills.get(skill_name);

        let should_pull = match local_time {
            Some(lt) => icloud_time > lt,
            None => true, // Doesn't exist locally
        };

        if should_pull {
            let src = icloud_library.join(skill_name);
            let dst = local_library.join(skill_name);

            // Remove existing destination
            if dst.exists() {
                fs::remove_dir_all(&dst)
                    .map_err(|e| format!("Failed to remove existing skill: {}", e))?;
            }

            // Copy from iCloud to local
            copy_dir_all(&src, &dst)
                .map_err(|e| format!("Failed to copy skill from iCloud: {}", e))?;

            synced_count += 1;
        }
    }

    // Sync from local to iCloud (if newer)
    for (skill_name, local_time) in &local_skills {
        let icloud_time = icloud_skills.get(skill_name);

        let should_push = match icloud_time {
            Some(it) => local_time > it,
            None => true, // Doesn't exist in iCloud
        };

        if should_push {
            let src = local_library.join(skill_name);
            let dst = icloud_library.join(skill_name);

            // Remove existing destination
            if dst.exists() {
                fs::remove_dir_all(&dst)
                    .map_err(|e| format!("Failed to remove existing iCloud skill: {}", e))?;
            }

            // Copy from local to iCloud
            copy_dir_all(&src, &dst)
                .map_err(|e| format!("Failed to copy skill to iCloud: {}", e))?;

            synced_count += 1;
        }
    }

    Ok(synced_count)
}

/// List skills in a directory with their modification times
fn list_skills(dir: &PathBuf) -> std::collections::HashMap<String, chrono::DateTime<chrono::Utc>> {
    let mut skills = std::collections::HashMap::new();

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() && path.join("SKILL.md").exists() {
                if let Ok(metadata) = fs::metadata(&path) {
                    if let Ok(modified) = metadata.modified() {
                        if let Ok(datetime) = modified.duration_since(std::time::SystemTime::UNIX_EPOCH) {
                            let name = path.file_name()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_default();
                            let time = chrono::DateTime::from_timestamp(datetime.as_secs() as i64, 0)
                                .unwrap_or_else(|| chrono::Utc::now());
                            skills.insert(name, time);
                        }
                    }
                }
            }
        }
    }

    skills
}

/// Copy directory recursively
fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

fn calculate_local_storage_used() -> u64 {
    let library_path = paths::get_local_library_path();
    let config_path = paths::get_config_path();

    let mut total: u64 = 0;

    if library_path.exists() {
        total += calculate_dir_size(&library_path);
    }
    if config_path.exists() {
        if let Ok(metadata) = fs::metadata(&config_path) {
            total += metadata.len();
        }
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
// Public Sync Trigger (for use by other modules)
// ============================================================================

/// Trigger a full sync in background after any data change
/// This syncs: config, library, metadata to iCloud
pub fn trigger_full_sync() {
    std::thread::spawn(|| {
        if let Err(e) = do_full_sync_background() {
            eprintln!("Background sync failed: {}", e);
        }
    });
}

/// Perform full sync (config + library + metadata) in background
fn do_full_sync_background() -> Result<(), String> {
    // Check if sync is enabled using new storage layer
    let storage = get_storage();
    let config = storage.read_config()?;
    if !config.sync_enabled {
        println!("Sync skipped: disabled in settings");
        return Ok(()); // Sync disabled, skip
    }

    // Check if iCloud is available
    if !paths::icloud_is_available() {
        println!("Sync skipped: iCloud not available");
        return Ok(()); // iCloud not available, skip
    }

    // Ensure iCloud structure exists
    paths::ensure_icloud_structure()?;

    // Get client identity
    let client_identity = get_or_create_client_identity()?;

    // Sync config
    sync_config(&client_identity)?;

    // Sync library
    sync_library(&client_identity)?;

    // Sync metadata (skill_metadata.json, groups.json, etc.)
    sync_metadata()?;

    // Update sync state
    let sync_state = SyncState {
        last_sync_time: Some(chrono::Utc::now().to_rfc3339()),
        last_sync_by: Some(client_identity.client_id),
    };
    save_sync_state(&sync_state)?;

    println!("Background sync completed successfully");
    Ok(())
}

/// Sync metadata files to iCloud
fn sync_metadata() -> Result<(), String> {
    let app_support = paths::get_app_support_path();
    let icloud_container = paths::get_icloud_container_path();

    // Files to sync (local -> iCloud, same structure)
    let files_to_sync = [
        "skill_metadata.json",
        "groups.json",
        "sync-state.json",
    ];

    for file_name in &files_to_sync {
        let local_file = app_support.join(file_name);
        let icloud_file = icloud_container.join(file_name);

        if local_file.exists() {
            sync_file_if_newer(&local_file, &icloud_file)?;
        }
    }

    // Also sync metadata directory contents
    let local_metadata = paths::get_local_metadata_path();
    let icloud_metadata = paths::get_icloud_metadata_path();

    if local_metadata.exists() {
        fs::create_dir_all(&icloud_metadata)
            .map_err(|e| format!("Failed to create iCloud metadata: {}", e))?;

        if let Ok(entries) = fs::read_dir(&local_metadata) {
            for entry in entries.flatten() {
                let local_file = entry.path();
                if local_file.is_file() {
                    let icloud_file = icloud_metadata.join(entry.file_name());
                    sync_file_if_newer(&local_file, &icloud_file)?;
                }
            }
        }
    }

    Ok(())
}

/// Sync a single file if local is newer
fn sync_file_if_newer(local_path: &PathBuf, icloud_path: &PathBuf) -> Result<(), String> {
    let local_time = fs::metadata(local_path)
        .and_then(|m| m.modified())
        .ok();

    let icloud_time = fs::metadata(icloud_path)
        .and_then(|m| m.modified())
        .ok();

    let should_push = match (local_time, icloud_time) {
        (_, None) => true,
        (Some(lt), Some(it)) => lt > it,
        _ => false,
    };

    if should_push {
        fs::copy(local_path, icloud_path)
            .map_err(|e| format!("Failed to copy file: {}", e))?;
    }

    Ok(())
}
