use super::library::IpcResult;

#[tauri::command]
pub fn locale_get() -> IpcResult<String> {
    IpcResult::success("auto".to_string())
}

#[tauri::command]
pub fn locale_set(locale: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn locale_detect_system() -> IpcResult<String> {
    IpcResult::success("en".to_string())
}
