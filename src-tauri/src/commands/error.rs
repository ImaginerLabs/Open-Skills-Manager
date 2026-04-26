use super::library::IpcResult;
use crate::utils::logger;

#[tauri::command]
pub fn error_get_logs(limit: Option<usize>) -> IpcResult<Vec<serde_json::Value>> {
    let logs = logger::get_logs(limit);
    IpcResult::success(logs)
}

#[tauri::command]
pub fn error_report(message: String, stack: Option<String>, context: Option<serde_json::Value>) -> IpcResult<()> {
    let ctx = context.unwrap_or_else(|| serde_json::json!({
        "stack": stack,
        "source": "frontend",
    }));

    logger::log_error("FE0001", &message, ctx);
    IpcResult::success(())
}
