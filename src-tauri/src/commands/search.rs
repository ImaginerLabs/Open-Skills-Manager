use super::library::IpcResult;

#[tauri::command]
pub fn search(query: String, scope: Option<String>) -> IpcResult<Vec<serde_json::Value>> {
    IpcResult::success(vec![])
}
