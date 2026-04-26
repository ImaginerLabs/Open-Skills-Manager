use super::library::IpcResult;

#[tauri::command]
pub fn global_list() -> IpcResult<Vec<serde_json::Value>> {
    IpcResult::success(vec![])
}

#[tauri::command]
pub fn global_get(id: String) -> IpcResult<serde_json::Value> {
    IpcResult::error("NOT_FOUND", &format!("Skill not found: {}", id))
}

#[tauri::command]
pub fn global_delete(id: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn global_pull(id: String) -> IpcResult<()> {
    IpcResult::success(())
}
