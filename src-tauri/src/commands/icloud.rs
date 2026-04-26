use super::library::IpcResult;

#[tauri::command]
pub fn icloud_sync_status() -> IpcResult<serde_json::Value> {
    IpcResult::success(serde_json::json!({
        "isAvailable": false,
        "isSyncing": false
    }))
}

#[tauri::command]
pub fn icloud_resolve_conflict(_skill_id: String, _resolution: String) -> IpcResult<()> {
    IpcResult::success(())
}
