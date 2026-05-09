// Storage IPC Commands - Unified storage layer commands

use super::library::IpcResult;
use super::AppError;
use crate::storage::{StorageService, AppConfig, LibraryData, SyncState, Group, SkillEntry, SyncStatusInfo};
use crate::utils::logger::{log, LogLevel, LogSource};

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
        Ok(config) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_READ_SUCCESS",
                "Config read successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "config",
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_READ_FAILED",
                &format!("Failed to read config: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "config",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_config_set_settings(settings: crate::storage::Settings) -> IpcResult<AppConfig> {
    let storage = get_storage();
    match storage.write_config(|config| {
        config.settings = settings.clone();
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                "Settings updated successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "config",
                    "operation": "set_settings",
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to update settings: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "config",
                    "operation": "set_settings",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_config_set_sync_enabled(enabled: bool) -> IpcResult<AppConfig> {
    let storage = get_storage();
    storage.set_icloud_enabled(enabled);
    match storage.write_config(|config| {
        config.sync_enabled = enabled;
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                &format!("Sync enabled set to: {}", enabled),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "config",
                    "operation": "set_sync_enabled",
                    "enabled": enabled,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to set sync enabled: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "config",
                    "operation": "set_sync_enabled",
                    "enabled": enabled,
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
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
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_READ_SUCCESS",
                "Active IDE retrieved successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "get_active",
                    "active_ide_id": config.active_ide_id,
                })),
                None,
            );
            IpcResult::success(active_ide)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_READ_FAILED",
                &format!("Failed to get active IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "get_active",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
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
            config.active_ide_id = ide_id.clone();
            return true; // Change made
        }
        false // IDE not found, no change
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                &format!("Active IDE set to: {}", ide_id),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "set_active",
                    "ide_id": ide_id,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to set active IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "set_active",
                    "ide_id": ide_id,
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_ide_list() -> IpcResult<Vec<crate::storage::IDEConfig>> {
    let storage = get_storage();
    match storage.read_config() {
        Ok(config) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_READ_SUCCESS",
                &format!("IDE list retrieved: {} IDEs", config.ide_configs.len()),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "list",
                    "count": config.ide_configs.len(),
                })),
                None,
            );
            IpcResult::success(config.ide_configs)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_READ_FAILED",
                &format!("Failed to list IDEs: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "list",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_ide_update(ide_id: String, ide_config: crate::storage::IDEConfig) -> IpcResult<AppConfig> {
    let storage = get_storage();
    match storage.write_config(|config| {
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == ide_id) {
            *ide = ide_config.clone();
        }
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                &format!("IDE updated: {}", ide_id),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "update",
                    "ide_id": ide_id,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to update IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "update",
                    "ide_id": ide_id,
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_ide_add(ide_config: crate::storage::IDEConfig) -> IpcResult<AppConfig> {
    let storage = get_storage();

    // Check if IDE with same ID already exists before writing
    match storage.read_config() {
        Ok(config) => {
            if config.ide_configs.iter().any(|ide| ide.id == ide_config.id) {
                log(
                    LogLevel::Error,
                    "STORAGE",
                    "STORAGE_WRITE_FAILED",
                    &format!("IDE already exists: {}", ide_config.id),
                    LogSource::Backend,
                    Some(serde_json::json!({
                        "storage_type": "ide",
                        "operation": "add",
                        "ide_id": ide_config.id,
                        "error": "IDE with this ID already exists",
                    })),
                    None,
                );
                return IpcResult::error(
                    AppError::E002InvalidInput("IDE with this ID already exists".to_string()).code(),
                    "IDE with this ID already exists",
                );
            }
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_READ_FAILED",
                &format!("Failed to check existing IDEs: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "add",
                    "error": e,
                })),
                None,
            );
            return IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            );
        }
    }

    let ide_id = ide_config.id.clone();
    match storage.write_config(|config| {
        config.ide_configs.push(ide_config);
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                &format!("IDE added: {}", ide_id),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "add",
                    "ide_id": ide_id,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to add IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "add",
                    "ide_id": ide_id,
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
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
        Ok(config) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                &format!("IDE removed: {}", ide_id),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "remove",
                    "ide_id": ide_id,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to remove IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "ide",
                    "operation": "remove",
                    "ide_id": ide_id,
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

// ============================================================================
// Library Commands
// ============================================================================

#[tauri::command]
pub fn storage_library_get() -> IpcResult<LibraryData> {
    let storage = get_storage();
    match storage.read_library() {
        Ok(library) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_READ_SUCCESS",
                "Library data retrieved successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "library",
                    "groups_count": library.groups.len(),
                    "skills_count": library.skills.len(),
                })),
                None,
            );
            IpcResult::success(library)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_READ_FAILED",
                &format!("Failed to read library: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "library",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_groups_get() -> IpcResult<Vec<Group>> {
    let storage = get_storage();
    match storage.read_library() {
        Ok(library) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_READ_SUCCESS",
                &format!("Groups retrieved: {} groups", library.groups.len()),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "groups",
                    "count": library.groups.len(),
                })),
                None,
            );
            IpcResult::success(library.groups)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_READ_FAILED",
                &format!("Failed to read groups: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "groups",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_groups_set(groups: Vec<Group>) -> IpcResult<LibraryData> {
    let groups_count = groups.len();
    let storage = get_storage();
    match storage.write_groups(|g| *g = groups) {
        Ok(_groups) => {
            // Need to return LibraryData, reconstruct it
            match storage.read_library() {
                Ok(library) => {
                    log(
                        LogLevel::Info,
                        "STORAGE",
                        "STORAGE_WRITE_SUCCESS",
                        &format!("Groups updated: {} groups", groups_count),
                        LogSource::Backend,
                        Some(serde_json::json!({
                            "storage_type": "groups",
                            "operation": "set",
                            "count": groups_count,
                        })),
                        None,
                    );
                    IpcResult::success(library)
                }
                Err(e) => {
                    log(
                        LogLevel::Error,
                        "STORAGE",
                        "STORAGE_READ_FAILED",
                        &format!("Failed to read library after groups update: {}", e),
                        LogSource::Backend,
                        Some(serde_json::json!({
                            "storage_type": "groups",
                            "operation": "set",
                            "error": e,
                        })),
                        None,
                    );
                    IpcResult::error(
                        AppError::E102WriteFailed(e.clone()).code(),
                        &e,
                    )
                }
            }
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to update groups: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "groups",
                    "operation": "set",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_skills_get() -> IpcResult<std::collections::HashMap<String, SkillEntry>> {
    let storage = get_storage();
    match storage.read_library() {
        Ok(library) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_READ_SUCCESS",
                &format!("Skills retrieved: {} skills", library.skills.len()),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "skills",
                    "count": library.skills.len(),
                })),
                None,
            );
            IpcResult::success(library.skills)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_READ_FAILED",
                &format!("Failed to read skills: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "skills",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_skill_add(entry: SkillEntry) -> IpcResult<()> {
    let storage = get_storage();
    let skill_id = entry.id.clone();
    let folder_name = entry.folder_name.clone();
    match storage.add_skill(entry) {
        Ok(()) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                &format!("Skill added: {} ({})", skill_id, folder_name),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "skill",
                    "operation": "add",
                    "skill_id": skill_id,
                    "folder_name": folder_name,
                })),
                None,
            );
            IpcResult::success(())
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to add skill: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "skill",
                    "operation": "add",
                    "skill_id": skill_id,
                    "folder_name": folder_name,
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_skill_remove(folder_name: String) -> IpcResult<()> {
    let storage = get_storage();
    match storage.remove_skill(&folder_name) {
        Ok(_) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                &format!("Skill removed: {}", folder_name),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "skill",
                    "operation": "remove",
                    "folder_name": folder_name,
                })),
                None,
            );
            IpcResult::success(())
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to remove skill: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "skill",
                    "operation": "remove",
                    "folder_name": folder_name,
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

// ============================================================================
// Sync Commands
// ============================================================================

#[tauri::command]
pub fn storage_sync_state() -> IpcResult<SyncState> {
    let storage = get_storage();
    match storage.read_sync_state() {
        Ok(state) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_READ_SUCCESS",
                &format!("Sync state retrieved, {} pending changes", state.pending_changes.len()),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "sync_state",
                    "pending_changes": state.pending_changes.len(),
                    "last_sync_time": state.last_sync_time,
                })),
                None,
            );
            IpcResult::success(state)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_READ_FAILED",
                &format!("Failed to read sync state: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "sync_state",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_sync_force() -> IpcResult<()> {
    let storage = get_storage();
    match storage.force_sync() {
        Ok(()) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                "Force sync triggered successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "sync",
                    "operation": "force",
                })),
                None,
            );
            IpcResult::success(())
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to force sync: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "sync",
                    "operation": "force",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
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

    log(
        LogLevel::Info,
        "STORAGE",
        "STORAGE_READ_SUCCESS",
        "Sync status retrieved",
        LogSource::Backend,
        Some(serde_json::json!({
            "storage_type": "sync_status",
            "icloud_enabled": storage.is_icloud_enabled(),
            "pending_changes": state.pending_changes.len(),
            "storage_used": storage_used,
        })),
        None,
    );

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
    let needs = migration.needs_migration();
    log(
        LogLevel::Info,
        "STORAGE",
        "STORAGE_READ_SUCCESS",
        &format!("Migration check: needs_migration={}", needs),
        LogSource::Backend,
        Some(serde_json::json!({
            "storage_type": "migration",
            "operation": "check",
            "needs_migration": needs,
        })),
        None,
    );
    IpcResult::success(needs)
}

#[tauri::command]
pub fn storage_migrate() -> IpcResult<()> {
    let migration = crate::storage::MigrationService::new();
    match migration.migrate() {
        Ok(_) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                "Migration completed successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "migration",
                    "operation": "migrate",
                })),
                None,
            );
            IpcResult::success(())
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Migration failed: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "migration",
                    "operation": "migrate",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E002InvalidInput(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn storage_migrate_rollback() -> IpcResult<()> {
    let migration = crate::storage::MigrationService::new();
    match migration.rollback() {
        Ok(_) => {
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                "Migration rollback completed successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "migration",
                    "operation": "rollback",
                })),
                None,
            );
            IpcResult::success(())
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Migration rollback failed: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "migration",
                    "operation": "rollback",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E002InvalidInput(e.clone()).code(),
                &e,
            )
        }
    }
}

// ============================================================================
// Utility Commands
// ============================================================================

#[tauri::command]
pub fn storage_client_id() -> IpcResult<String> {
    let storage = get_storage();
    let client_id = storage.client_id().to_string();
    log(
        LogLevel::Info,
        "STORAGE",
        "STORAGE_READ_SUCCESS",
        "Client ID retrieved",
        LogSource::Backend,
        Some(serde_json::json!({
            "storage_type": "client_id",
            "client_id": client_id,
        })),
        None,
    );
    IpcResult::success(client_id)
}

#[tauri::command]
pub fn storage_icloud_available() -> IpcResult<bool> {
    let storage = get_storage();
    let available = storage.is_icloud_enabled();
    log(
        LogLevel::Info,
        "STORAGE",
        "STORAGE_READ_SUCCESS",
        &format!("iCloud availability checked: {}", available),
        LogSource::Backend,
        Some(serde_json::json!({
            "storage_type": "icloud",
            "operation": "check_availability",
            "available": available,
        })),
        None,
    );
    IpcResult::success(available)
}

#[tauri::command]
pub fn storage_invalidate_cache() -> IpcResult<()> {
    let storage = get_storage();
    storage.invalidate_cache();
    log(
        LogLevel::Info,
        "STORAGE",
        "STORAGE_WRITE_SUCCESS",
        "Cache invalidated successfully",
        LogSource::Backend,
        Some(serde_json::json!({
            "storage_type": "cache",
            "operation": "invalidate",
        })),
        None,
    );
    IpcResult::success(())
}

#[tauri::command]
pub fn storage_ensure_icloud_path() -> IpcResult<String> {
    match crate::paths::ensure_icloud_structure() {
        Ok(()) => {
            let path = crate::paths::get_icloud_container_path();
            let path_str = path.to_string_lossy().to_string();
            log(
                LogLevel::Info,
                "STORAGE",
                "STORAGE_WRITE_SUCCESS",
                "iCloud path ensured successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "icloud",
                    "operation": "ensure_path",
                    "path": path_str,
                })),
                None,
            );
            IpcResult::success(path_str)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to ensure iCloud path: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "icloud",
                    "operation": "ensure_path",
                    "error": e,
                })),
                None,
            );
            IpcResult::error(
                AppError::E101CreateDirFailed(e.clone()).code(),
                &e,
            )
        }
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

    log(
        LogLevel::Info,
        "STORAGE",
        "STORAGE_WRITE_SUCCESS",
        "Starting reset to factory defaults",
        LogSource::Backend,
        Some(serde_json::json!({
            "storage_type": "reset",
            "operation": "reset_to_defaults",
        })),
        None,
    );

    // Reset local config.json
    let config_path = paths::get_config_path();
    let default_config = AppConfig::default();
    let content = match serde_json::to_string_pretty(&default_config) {
        Ok(c) => c,
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to serialize config during reset: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "reset",
                    "operation": "reset_to_defaults",
                    "step": "serialize_config",
                    "error": e.to_string(),
                })),
                None,
            );
            return IpcResult::error(
                AppError::E102WriteFailed(e.to_string()).code(),
                &format!("Failed to serialize config: {}", e),
            );
        }
    };
    if let Err(e) = fs::write(&config_path, &content) {
        log(
            LogLevel::Error,
            "STORAGE",
            "STORAGE_WRITE_FAILED",
            &format!("Failed to write config during reset: {}", e),
            LogSource::Backend,
            Some(serde_json::json!({
                "storage_type": "reset",
                "operation": "reset_to_defaults",
                "step": "write_config",
                "error": e.to_string(),
            })),
            None,
        );
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
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to serialize library during reset: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "reset",
                    "operation": "reset_to_defaults",
                    "step": "serialize_library",
                    "error": e.to_string(),
                })),
                None,
            );
            return IpcResult::error(
                AppError::E102WriteFailed(e.to_string()).code(),
                &format!("Failed to serialize library: {}", e),
            );
        }
    };
    if let Err(e) = fs::write(&library_path, &content) {
        log(
            LogLevel::Error,
            "STORAGE",
            "STORAGE_WRITE_FAILED",
            &format!("Failed to write library during reset: {}", e),
            LogSource::Backend,
            Some(serde_json::json!({
                "storage_type": "reset",
                "operation": "reset_to_defaults",
                "step": "write_library",
                "error": e.to_string(),
            })),
            None,
        );
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
        Err(e) => {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to serialize sync state during reset: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "reset",
                    "operation": "reset_to_defaults",
                    "step": "serialize_sync",
                    "error": e.to_string(),
                })),
                None,
            );
            return IpcResult::error(
                AppError::E102WriteFailed(e.to_string()).code(),
                &format!("Failed to serialize sync state: {}", e),
            );
        }
    };
    if let Err(e) = fs::write(&sync_path, &content) {
        log(
            LogLevel::Error,
            "STORAGE",
            "STORAGE_WRITE_FAILED",
            &format!("Failed to write sync state during reset: {}", e),
            LogSource::Backend,
            Some(serde_json::json!({
                "storage_type": "reset",
                "operation": "reset_to_defaults",
                "step": "write_sync",
                "error": e.to_string(),
            })),
            None,
        );
        return IpcResult::error(
            AppError::E102WriteFailed(e.to_string()).code(),
            &format!("Failed to write sync state: {}", e),
        );
    }

    // Clear local library directory (delete all skills on disk)
    let local_library = paths::get_local_library_path();
    if local_library.exists() {
        if let Err(e) = fs::remove_dir_all(&local_library) {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to clear library directory during reset: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "reset",
                    "operation": "reset_to_defaults",
                    "step": "clear_library_dir",
                    "error": e.to_string(),
                })),
                None,
            );
            return IpcResult::error(
                AppError::E102WriteFailed(e.to_string()).code(),
                &format!("Failed to clear library directory: {}", e),
            );
        }
        // Recreate empty library directory
        if let Err(e) = fs::create_dir_all(&local_library) {
            log(
                LogLevel::Error,
                "STORAGE",
                "STORAGE_WRITE_FAILED",
                &format!("Failed to recreate library directory during reset: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "storage_type": "reset",
                    "operation": "reset_to_defaults",
                    "step": "recreate_library_dir",
                    "error": e.to_string(),
                })),
                None,
            );
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

    log(
        LogLevel::Info,
        "STORAGE",
        "STORAGE_WRITE_SUCCESS",
        "Reset to factory defaults completed successfully",
        LogSource::Backend,
        Some(serde_json::json!({
            "storage_type": "reset",
            "operation": "reset_to_defaults",
            "result": "success",
        })),
        None,
    );

    IpcResult::success(())
}
