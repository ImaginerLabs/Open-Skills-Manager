// Storage IPC Commands - Unified storage layer commands

use super::library::IpcResult;
use super::AppError;
use crate::storage::{StorageService, AppConfig, LibraryData, SyncState, Group, SkillEntry, SyncStatusInfo};

// Get the global storage instance
fn get_storage() -> &'static StorageService {
    crate::storage::service::get_storage()
}

// ============================================================================
// Config Commands
// ============================================================================

#[tauri::command]
pub fn storage_config_get() -> IpcResult<AppConfig> {
    let storage = get_storage();
    match storage.read_config() {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_config_set_settings(settings: crate::storage::Settings) -> IpcResult<AppConfig> {
    let storage = get_storage();
    match storage.write_config(|config| {
        config.settings = settings;
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_config_set_sync_enabled(enabled: bool) -> IpcResult<AppConfig> {
    let storage = get_storage();
    storage.set_icloud_enabled(enabled);
    match storage.write_config(|config| {
        config.sync_enabled = enabled;
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// IDE Commands
// ============================================================================

#[tauri::command]
pub fn storage_ide_get_active() -> IpcResult<crate::storage::IDEConfig> {
    let storage = get_storage();
    match storage.read_config() {
        Ok(config) => {
            let active_ide = config.ide_configs.iter()
                .find(|ide| ide.id == config.active_ide_id)
                .cloned()
                .unwrap_or_else(|| config.ide_configs.first().cloned().unwrap_or_default());
            IpcResult::success(active_ide)
        }
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_ide_set_active(ide_id: String) -> IpcResult<AppConfig> {
    let storage = get_storage();

    match storage.write_config_with_change_detection(|config| {
        // Check if the IDE exists and is different from current
        if config.ide_configs.iter().any(|ide| ide.id == ide_id) {
            if config.active_ide_id == ide_id {
                return false; // No change needed
            }
            config.active_ide_id = ide_id;
            return true; // Change made
        }
        false // IDE not found, no change
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_ide_list() -> IpcResult<Vec<crate::storage::IDEConfig>> {
    let storage = get_storage();
    match storage.read_config() {
        Ok(config) => IpcResult::success(config.ide_configs),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_ide_update(ide_id: String, ide_config: crate::storage::IDEConfig) -> IpcResult<AppConfig> {
    let storage = get_storage();
    match storage.write_config(|config| {
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == ide_id) {
            *ide = ide_config;
        }
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_ide_add(ide_config: crate::storage::IDEConfig) -> IpcResult<AppConfig> {
    let storage = get_storage();

    // Check if IDE with same ID already exists before writing
    match storage.read_config() {
        Ok(config) => {
            if config.ide_configs.iter().any(|ide| ide.id == ide_config.id) {
                return IpcResult::error(
                    AppError::E002InvalidInput("IDE with this ID already exists".to_string()).code(),
                    "IDE with this ID already exists",
                );
            }
        }
        Err(e) => {
            return IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            );
        }
    }

    match storage.write_config(|config| {
        config.ide_configs.push(ide_config);
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_ide_remove(ide_id: String) -> IpcResult<AppConfig> {
    let storage = get_storage();
    match storage.write_config(|config| {
        // Don't allow removing default IDEs
        let default_ids = ["claude-code", "opencode", "cursor", "gemini"];
        if default_ids.contains(&ide_id.as_str()) {
            return;
        }
        config.ide_configs.retain(|ide| ide.id != ide_id);
        // If we removed the active IDE, switch to claude-code
        if config.active_ide_id == ide_id {
            config.active_ide_id = "claude-code".to_string();
        }
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Library Commands
// ============================================================================

#[tauri::command]
pub fn storage_library_get() -> IpcResult<LibraryData> {
    let storage = get_storage();
    match storage.read_library() {
        Ok(library) => IpcResult::success(library),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_groups_get() -> IpcResult<Vec<Group>> {
    let storage = get_storage();
    match storage.read_library() {
        Ok(library) => IpcResult::success(library.groups),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_groups_set(groups: Vec<Group>) -> IpcResult<LibraryData> {
    let storage = get_storage();
    match storage.write_groups(|g| *g = groups) {
        Ok(groups) => {
            // Need to return LibraryData, reconstruct it
            match storage.read_library() {
                Ok(library) => IpcResult::success(library),
                Err(e) => IpcResult::error(
                    AppError::E102WriteFailed(e.clone()).code(),
                    &e,
                ),
            }
        }
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_skills_get() -> IpcResult<std::collections::HashMap<String, SkillEntry>> {
    let storage = get_storage();
    match storage.read_library() {
        Ok(library) => IpcResult::success(library.skills),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_skill_add(entry: SkillEntry) -> IpcResult<()> {
    let storage = get_storage();
    match storage.add_skill(entry) {
        Ok(()) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_skill_remove(folder_name: String) -> IpcResult<()> {
    let storage = get_storage();
    match storage.remove_skill(&folder_name) {
        Ok(_) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Sync Commands
// ============================================================================

#[tauri::command]
pub fn storage_sync_state() -> IpcResult<SyncState> {
    let storage = get_storage();
    match storage.read_sync_state() {
        Ok(state) => IpcResult::success(state),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_sync_force() -> IpcResult<()> {
    let storage = get_storage();
    match storage.force_sync() {
        Ok(()) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_sync_status() -> IpcResult<SyncStatusInfo> {
    let storage = get_storage();
    let state = storage.read_sync_state().unwrap_or_default();
    let last_error = storage.last_sync_error();
    let tracked_sync_time = storage.tracked_sync_time();
    let storage_used = storage.calculate_storage_used();
    const DEFAULT_QUOTA: u64 = 5_000_000_000; // 5GB default quota

    if !storage.is_icloud_enabled() {
        return IpcResult::success(SyncStatusInfo {
            event: crate::storage::SyncEvent::OfflineMode {
                pending_changes: state.pending_changes.len() as u32,
            },
            last_sync_time: tracked_sync_time.or(state.last_sync_time),
            last_error,
            storage_used,
            storage_total: DEFAULT_QUOTA,
        });
    }

    // Check if there's a recorded error
    if let Some(ref error) = last_error {
        return IpcResult::success(SyncStatusInfo {
            event: crate::storage::SyncEvent::SyncFailed {
                error: error.clone(),
            },
            last_sync_time: tracked_sync_time.or(state.last_sync_time),
            last_error,
            storage_used,
            storage_total: DEFAULT_QUOTA,
        });
    }

    if state.pending_changes.iter().any(|c| !c.synced) {
        return IpcResult::success(SyncStatusInfo {
            event: crate::storage::SyncEvent::SyncStarted,
            last_sync_time: tracked_sync_time.or(state.last_sync_time),
            last_error,
            storage_used,
            storage_total: DEFAULT_QUOTA,
        });
    }

    IpcResult::success(SyncStatusInfo {
        event: crate::storage::SyncEvent::SyncCompleted {
            synced_items: 0,
        },
        last_sync_time: tracked_sync_time.or(state.last_sync_time),
        last_error,
        storage_used,
        storage_total: DEFAULT_QUOTA,
    })
}

// ============================================================================
// Migration Commands
// ============================================================================

#[tauri::command]
pub fn storage_needs_migration() -> IpcResult<bool> {
    let migration = crate::storage::MigrationService::new();
    IpcResult::success(migration.needs_migration())
}

#[tauri::command]
pub fn storage_migrate() -> IpcResult<()> {
    let migration = crate::storage::MigrationService::new();
    match migration.migrate() {
        Ok(_) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E002InvalidInput(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn storage_migrate_rollback() -> IpcResult<()> {
    let migration = crate::storage::MigrationService::new();
    match migration.rollback() {
        Ok(_) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E002InvalidInput(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Utility Commands
// ============================================================================

#[tauri::command]
pub fn storage_client_id() -> IpcResult<String> {
    let storage = get_storage();
    IpcResult::success(storage.client_id().to_string())
}

#[tauri::command]
pub fn storage_icloud_available() -> IpcResult<bool> {
    let storage = get_storage();
    IpcResult::success(storage.is_icloud_enabled())
}

#[tauri::command]
pub fn storage_invalidate_cache() -> IpcResult<()> {
    let storage = get_storage();
    storage.invalidate_cache();
    IpcResult::success(())
}

#[tauri::command]
pub fn storage_ensure_icloud_path() -> IpcResult<String> {
    match crate::paths::ensure_icloud_structure() {
        Ok(()) => {
            let path = crate::paths::get_icloud_container_path();
            IpcResult::success(path.to_string_lossy().to_string())
        }
        Err(e) => IpcResult::error(
            AppError::E101CreateDirFailed(e.clone()).code(),
            &e,
        ),
    }
}

/// Reset all settings to factory defaults
/// This will:
/// 1. Reset config.json to defaults
/// 2. Clear library.json (but keep skills on disk)
/// 3. Reset sync.json
/// 4. Clear iCloud synced data
#[tauri::command]
pub fn storage_reset_to_defaults() -> IpcResult<()> {
    use std::fs;
    use crate::paths;
    use crate::storage::{AppConfig, LibraryData, SyncState};

    // Reset local config.json
    let config_path = paths::get_config_path();
    let default_config = AppConfig::default();
    let content = match serde_json::to_string_pretty(&default_config) {
        Ok(c) => c,
        Err(e) => return IpcResult::error(
            AppError::E102WriteFailed(e.to_string()).code(),
            &format!("Failed to serialize config: {}", e),
        ),
    };
    if let Err(e) = fs::write(&config_path, &content) {
        return IpcResult::error(
            AppError::E102WriteFailed(e.to_string()).code(),
            &format!("Failed to write config: {}", e),
        );
    }

    // Reset local library.json (keep skills on disk, just clear metadata)
    let library_path = paths::get_app_support_path().join("library.json");
    let default_library = LibraryData::default();
    let content = match serde_json::to_string_pretty(&default_library) {
        Ok(c) => c,
        Err(e) => return IpcResult::error(
            AppError::E102WriteFailed(e.to_string()).code(),
            &format!("Failed to serialize library: {}", e),
        ),
    };
    if let Err(e) = fs::write(&library_path, &content) {
        return IpcResult::error(
            AppError::E102WriteFailed(e.to_string()).code(),
            &format!("Failed to write library: {}", e),
        );
    }

    // Reset sync.json
    let sync_path = paths::get_app_support_path().join("sync.json");
    let default_sync = SyncState::default();
    let content = match serde_json::to_string_pretty(&default_sync) {
        Ok(c) => c,
        Err(e) => return IpcResult::error(
            AppError::E102WriteFailed(e.to_string()).code(),
            &format!("Failed to serialize sync state: {}", e),
        ),
    };
    if let Err(e) = fs::write(&sync_path, &content) {
        return IpcResult::error(
            AppError::E102WriteFailed(e.to_string()).code(),
            &format!("Failed to write sync state: {}", e),
        );
    }

    // Clear local library directory (delete all skills on disk)
    let local_library = paths::get_local_library_path();
    if local_library.exists() {
        if let Err(e) = fs::remove_dir_all(&local_library) {
            return IpcResult::error(
                AppError::E102WriteFailed(e.to_string()).code(),
                &format!("Failed to clear library directory: {}", e),
            );
        }
        // Recreate empty library directory
        if let Err(e) = fs::create_dir_all(&local_library) {
            return IpcResult::error(
                AppError::E102WriteFailed(e.to_string()).code(),
                &format!("Failed to recreate library directory: {}", e),
            );
        }
    }

    // Clear iCloud synced data
    let icloud_container = paths::get_icloud_container_path();
    if icloud_container.exists() {
        // Remove config.json from iCloud
        let icloud_config = icloud_container.join("config.json");
        if icloud_config.exists() {
            let _ = fs::remove_file(&icloud_config);
        }

        // Remove library.json from iCloud
        let icloud_library = icloud_container.join("library.json");
        if icloud_library.exists() {
            let _ = fs::remove_file(&icloud_library);
        }

        // Remove sync.json from iCloud
        let icloud_sync = icloud_container.join("sync.json");
        if icloud_sync.exists() {
            let _ = fs::remove_file(&icloud_sync);
        }

        // Remove old format files from iCloud
        for old_file in &["skill_metadata.json", "groups.json", "sync-state.json"] {
            let path = icloud_container.join(old_file);
            if path.exists() {
                let _ = fs::remove_file(&path);
            }
        }

        // Remove metadata directory from iCloud
        let icloud_metadata = icloud_container.join("metadata");
        if icloud_metadata.exists() {
            let _ = fs::remove_dir_all(&icloud_metadata);
        }

        // Remove library directory from iCloud (synced skills)
        let icloud_library_dir = icloud_container.join("library");
        if icloud_library_dir.exists() {
            let _ = fs::remove_dir_all(&icloud_library_dir);
        }
    }

    // Invalidate storage cache
    let storage = get_storage();
    storage.invalidate_cache();

    IpcResult::success(())
}
