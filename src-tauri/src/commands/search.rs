use super::library::IpcResult;
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchOptions {
    query: String,
    scope: Option<String>,
    project_id: Option<String>,
    category_id: Option<String>,
}

#[tauri::command]
pub fn search(options: SearchOptions) -> IpcResult<Vec<serde_json::Value>> {
    let _query = options.query;
    let _scope = options.scope;
    let _project_id = options.project_id;
    let _category_id = options.category_id;
    IpcResult::success(vec![])
}
