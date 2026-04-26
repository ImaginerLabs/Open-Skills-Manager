use super::library::IpcResult;

#[tauri::command]
pub fn project_list() -> IpcResult<Vec<serde_json::Value>> {
    IpcResult::success(vec![])
}

#[tauri::command]
pub fn project_add(path: String) -> IpcResult<serde_json::Value> {
    IpcResult::error("NOT_IMPLEMENTED", "Project add not yet implemented")
}

#[tauri::command]
pub fn project_remove(id: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn project_skills(project_id: String) -> IpcResult<Vec<serde_json::Value>> {
    IpcResult::success(vec![])
}

#[tauri::command]
pub fn project_refresh(project_id: Option<String>) -> IpcResult<()> {
    IpcResult::success(())
}
