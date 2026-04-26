use super::library::IpcResult;

#[tauri::command]
pub fn deploy_to_global(_skill_id: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn deploy_to_project(_skill_id: String, _project_id: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn deploy_from_global(_skill_id: String, _project_id: String) -> IpcResult<()> {
    IpcResult::success(())
}
