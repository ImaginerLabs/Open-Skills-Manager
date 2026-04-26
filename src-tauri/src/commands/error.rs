use super::library::IpcResult;

#[tauri::command]
pub fn error_get_logs(limit: Option<usize>) -> IpcResult<Vec<serde_json::Value>> {
    IpcResult::success(vec![])
}

#[tauri::command]
pub fn error_report(message: String, stack: Option<String>, context: Option<serde_json::Value>) -> IpcResult<()> {
    IpcResult::success(())
}
