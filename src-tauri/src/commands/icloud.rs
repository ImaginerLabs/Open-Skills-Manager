use super::library::IpcResult;
use crate::services::icloud_bridge::{
    calculate_storage_used, ensure_icloud_structure, get_icloud_container_path,
    get_last_sync_time, get_local_cache_path, get_pending_changes, icloud_is_available,
    fallback_to_local_cache, get_conflicts, resolve_conflict,
    SyncStatus, SyncStatusInfo, QuotaInfo, PendingChange, ConflictInfo,
};
use crate::commands::AppError;

#[tauri::command]
pub fn icloud_sync_status() -> IpcResult<SyncStatusInfo> {
    let available = icloud_is_available();

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

    if let Err(_) = ensure_icloud_structure() {
        return IpcResult::success(SyncStatusInfo {
            status: SyncStatus::Error,
            last_sync_time: None,
            pending_changes: 0,
            error_message: Some("Failed to initialize iCloud container".to_string()),
            storage_used: 0,
            storage_total: 0,
        });
    }

    let last_sync = get_last_sync_time();
    let pending = get_pending_changes();
    let storage_used = calculate_storage_used();

    // Default quota assumption (5GB for iCloud Documents)
    const DEFAULT_QUOTA: u64 = 5_000_000_000;

    let status = if pending.len() > 0 {
        SyncStatus::Pending
    } else if last_sync.is_some() {
        SyncStatus::Synced
    } else {
        SyncStatus::Syncing
    };

    IpcResult::success(SyncStatusInfo {
        status,
        last_sync_time: last_sync,
        pending_changes: pending.len() as u32,
        error_message: None,
        storage_used,
        storage_total: DEFAULT_QUOTA,
    })
}

#[tauri::command]
pub fn icloud_container_path() -> IpcResult<String> {
    let available = icloud_is_available();

    if available {
        let path = get_icloud_container_path();
        IpcResult::success(path.to_string_lossy().to_string())
    } else {
        // Fallback to local cache
        let fallback = fallback_to_local_cache();
        IpcResult::success(fallback.to_string_lossy().to_string())
    }
}

#[tauri::command]
pub fn icloud_quota_check() -> IpcResult<QuotaInfo> {
    let available = icloud_is_available();

    if !available {
        return IpcResult::success(QuotaInfo {
            available: false,
            used_bytes: 0,
            total_bytes: 0,
            percent_used: 0.0,
        });
    }

    let storage_used = calculate_storage_used();
    const DEFAULT_QUOTA: u64 = 5_000_000_000;

    let percent_used = if storage_used > 0 && DEFAULT_QUOTA > 0 {
        (storage_used as f64 / DEFAULT_QUOTA as f64) * 100.0
    } else {
        0.0
    };

    IpcResult::success(QuotaInfo {
        available: true,
        used_bytes: storage_used,
        total_bytes: DEFAULT_QUOTA,
        percent_used,
    })
}

#[tauri::command]
pub fn icloud_get_pending_changes() -> IpcResult<Vec<PendingChange>> {
    let pending = get_pending_changes();
    IpcResult::success(pending)
}

#[tauri::command]
pub fn icloud_resolve_conflict(skill_id: String, resolution: String) -> IpcResult<()> {
    match resolve_conflict(&skill_id, &resolution) {
        Ok(()) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E101CreateDirFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn icloud_get_conflicts() -> IpcResult<Vec<ConflictInfo>> {
    let conflicts = get_conflicts();
    IpcResult::success(conflicts)
}

#[tauri::command]
pub fn icloud_initialize() -> IpcResult<String> {
    if let Err(e) = ensure_icloud_structure() {
        return IpcResult::error(
            AppError::E101CreateDirFailed(format!("iCloud container: {}", e)).code(),
            &format!("Failed to initialize iCloud container: {}", e),
        );
    }

    IpcResult::success(get_icloud_container_path().to_string_lossy().to_string())
}

#[tauri::command]
pub fn icloud_local_cache_path() -> IpcResult<String> {
    let cache = get_local_cache_path();
    IpcResult::success(cache.to_string_lossy().to_string())
}