use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct IpcResult<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<IpcError>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IpcError {
    pub code: String,
    pub message: String,
}

impl<T> IpcResult<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(code: &str, message: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(IpcError {
                code: code.to_string(),
                message: message.to_string(),
            }),
        }
    }
}

#[tauri::command]
pub fn library_list() -> IpcResult<Vec<serde_json::Value>> {
    IpcResult::success(vec![])
}

#[tauri::command]
pub fn library_get(id: String) -> IpcResult<serde_json::Value> {
    IpcResult::error("NOT_FOUND", &format!("Skill not found: {}", id))
}

#[tauri::command]
pub fn library_delete(id: String) -> IpcResult<()> {
    IpcResult::success(())
}

#[tauri::command]
pub fn library_import(path: String) -> IpcResult<serde_json::Value> {
    IpcResult::error("NOT_IMPLEMENTED", "Import not yet implemented")
}

#[tauri::command]
pub fn library_export(id: String, format: String) -> IpcResult<String> {
    IpcResult::error("NOT_IMPLEMENTED", "Export not yet implemented")
}
