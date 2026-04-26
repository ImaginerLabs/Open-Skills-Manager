use super::library::IpcResult;

#[tauri::command]
pub fn deploy_to_global(skill_id: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn deploy_to_project(skill_id: String, project_id: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn deploy_from_global(skill_id: String, project_id: String) -> IpcResult<()> {
    IpcResult::success(())
}
