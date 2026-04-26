use super::library::IpcResult;

#[tauri::command]
pub fn performance_get_startup() -> IpcResult<u64> {
    IpcResult::success(0)
}

#[tauri::command]
pub fn performance_get_memory() -> IpcResult<u64> {
    IpcResult::success(0)
}

#[tauri::command]
pub fn performance_get_operations() -> IpcResult<Vec<serde_json::Value>> {
    IpcResult::success(vec![])
}
