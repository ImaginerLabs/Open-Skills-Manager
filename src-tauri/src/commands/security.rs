use super::library::IpcResult;

#[tauri::command]
pub fn security_sanitize_content(content: String) -> IpcResult<String> {
    IpcResult::success(content)
}
