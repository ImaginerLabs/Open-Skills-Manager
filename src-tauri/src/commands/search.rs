use super::library::IpcResult;
use crate::services::{SearchIndex, SearchOptions, SearchResult, SearchResultWithSnippet};
use serde::Deserialize;
use std::sync::{LazyLock, Mutex};

/// Global search index (lazy-initialized)
static SEARCH_INDEX: LazyLock<Mutex<SearchIndex>> = LazyLock::new(|| Mutex::new(SearchIndex::new()));

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchOptionsInput {
    query: String,
    scope: Option<String>,
    project_id: Option<String>,
    category_id: Option<String>,
}

impl From<SearchOptionsInput> for SearchOptions {
    fn from(input: SearchOptionsInput) -> Self {
        SearchOptions {
            query: input.query,
            scope: input.scope,
            project_id: input.project_id,
            category_id: input.category_id,
        }
    }
}

/// Search across all skill scopes
#[tauri::command]
pub fn search(options: SearchOptionsInput) -> IpcResult<Vec<SearchResult>> {
    let search_options: SearchOptions = options.into();

    if search_options.query.trim().is_empty() {
        return IpcResult::success(vec![]);
    }

    // Build or rebuild index
    if let Ok(mut index) = SEARCH_INDEX.lock() {
        index.build();
        let results = index.search(&search_options);
        IpcResult::success(results)
    } else {
        IpcResult::error("E500", "Failed to acquire search index lock")
    }
}

/// Search with matched snippets
#[tauri::command]
pub fn search_with_snippets(options: SearchOptionsInput) -> IpcResult<Vec<SearchResultWithSnippet>> {
    let search_options: SearchOptions = options.into();

    if search_options.query.trim().is_empty() {
        return IpcResult::success(vec![]);
    }

    // Build or rebuild index
    if let Ok(mut index) = SEARCH_INDEX.lock() {
        index.build();
        let results = index.search_with_snippets(&search_options);
        IpcResult::success(results)
    } else {
        IpcResult::error("E500", "Failed to acquire search index lock")
    }
}
