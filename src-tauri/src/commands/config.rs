use super::library::IpcResult;

#[tauri::command]
pub fn config_get() -> IpcResult<serde_json::Value> {
    IpcResult::success(serde_json::json!({
        "theme": "system",
        "language": "auto",
        "autoUpdateCheck": true,
        "autoRefreshInterval": 5
    }))
}

#[tauri::command]
pub fn config_set(_config: serde_json::Value) -> IpcResult<()> {
    IpcResult::success(())
}
