use super::library::IpcResult;

#[tauri::command]
pub fn theme_get() -> IpcResult<String> {
    IpcResult::success("system".to_string())
}

#[tauri::command]
pub fn theme_set(theme: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn theme_detect_system() -> IpcResult<String> {
    IpcResult::success("dark".to_string())
}
