use super::library::IpcResult;

#[tauri::command]
pub fn project_list() -> IpcResult<Vec<serde_json::Value>> {
    IpcResult::success(vec![])
}

#[tauri::command]
pub fn project_add(_path: String) -> IpcResult<serde_json::Value> {
    IpcResult::error("NOT_IMPLEMENTED", "Project add not yet implemented")
}

#[tauri::command]
pub fn project_remove(_id: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn project_skills(_project_id: String) -> IpcResult<Vec<serde_json::Value>> {
    IpcResult::success(vec![])
}

#[tauri::command]
pub fn project_refresh(_project_id: Option<String>) -> IpcResult<()> {
    IpcResult::success(())
}
