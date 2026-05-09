use super::library::IpcResult;
use crate::utils::logger::{log, LogLevel, LogSource};

#[tauri::command]
pub fn error_get_logs(limit: Option<usize>) -> IpcResult<Vec<serde_json::Value>> {
    let logs = crate::utils::logger::get_logs(limit);
    IpcResult::success(logs)
}

#[tauri::command]
pub fn error_report(
    message: String,
    stack: Option<String>,
    context: Option<serde_json::Value>,
) -> IpcResult<()> {
    let ctx = context.unwrap_or_else(|| serde_json::json!({}));

    // Use log_write internally
    log(
        LogLevel::Error,
        "SYSTEM",
        "FE0001",
        &message,
        LogSource::Frontend,
        Some(ctx),
        stack,
    );

    IpcResult::success(())
}
