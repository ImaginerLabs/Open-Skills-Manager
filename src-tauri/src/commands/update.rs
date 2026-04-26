use super::library::IpcResult;

#[tauri::command]
pub fn update_check() -> IpcResult<serde_json::Value> {
    IpcResult::success(serde_json::json!({
        "available": false,
        "currentVersion": "0.1.0"
    }))
}

#[tauri::command]
pub fn update_download() -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn update_install() -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn update_get_status() -> IpcResult<serde_json::Value> {
    IpcResult::success(serde_json::json!({
        "available": false,
        "currentVersion": "0.1.0"
    }))
}
