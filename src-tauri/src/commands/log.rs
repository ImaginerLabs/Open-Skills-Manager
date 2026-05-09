use super::library::IpcResult;
use crate::utils::logger::{
    clear_logs, export_logs, filter_logs, get_log_path, get_logs, get_logs_with_stats, get_stats,
    log, LogEntry, LogExportFormat, LogFilter, LogLevel, LogSource, LogStats, LogsAndStats,
};

// ============================================================================
// Log List Command
// ============================================================================

#[tauri::command]
pub fn log_list(
    limit: Option<usize>,
    filter: Option<LogFilter>,
) -> IpcResult<Vec<LogEntry>> {
    let has_filter = filter.is_some();
    let mut entries = match filter {
        Some(f) => filter_logs(f),
        None => {
            get_logs(limit)
                .into_iter()
                .filter_map(|v| serde_json::from_value(v).ok())
                .collect()
        }
    };

    // Apply limit when filter is present (filter_logs ignores limit)
    if has_filter {
        if let Some(l) = limit {
            entries.truncate(l);
        }
    }

    IpcResult::success(entries)
}

// ============================================================================
// Log Export Command
// ============================================================================

#[tauri::command]
pub fn log_export(
    format: String,
    filter: Option<LogFilter>,
) -> IpcResult<String> {
    let export_format = match format.to_uppercase().as_str() {
        "JSON" => LogExportFormat::Json,
        "TXT" => LogExportFormat::Txt,
        "CSV" => LogExportFormat::Csv,
        _ => return IpcResult::error("E1201", "Invalid export format. Use JSON, TXT, or CSV."),
    };

    let content = export_logs(export_format, filter);
    IpcResult::success(content)
}

// ============================================================================
// Log Clear Command
// ============================================================================

#[tauri::command]
pub fn log_clear(before: Option<String>, keep_days: Option<u32>) -> IpcResult<usize> {
    let count = clear_logs(before.as_deref(), keep_days);
    IpcResult::success(count)
}

// ============================================================================
// Log Write Command
// ============================================================================

#[tauri::command]
pub fn log_write(
    level: String,
    module: String,
    code: String,
    message: String,
    source: Option<String>,
    context: Option<serde_json::Value>,
    stack_trace: Option<String>,
) -> IpcResult<()> {
    let log_level = match LogLevel::from_str(&level) {
        Some(l) => l,
        None => return IpcResult::error("E1201", "Invalid log level. Use DEBUG, INFO, WARN, or ERROR."),
    };

    let log_source = match source {
        Some(s) => match s.to_uppercase().as_str() {
            s if s == LogSource::Frontend.as_str() => LogSource::Frontend,
            s if s == LogSource::Backend.as_str() => LogSource::Backend,
            _ => LogSource::Frontend,
        },
        None => LogSource::Frontend,
    };

    log(
        log_level,
        &module,
        &code,
        &message,
        log_source,
        context,
        stack_trace,
    );

    IpcResult::success(())
}

// ============================================================================
// Log Stats Command
// ============================================================================

#[tauri::command]
pub fn log_stats() -> IpcResult<LogStats> {
    let stats = get_stats();
    IpcResult::success(stats)
}

// ============================================================================
// Log Path Command
// ============================================================================

#[tauri::command]
pub fn log_path() -> IpcResult<String> {
    let path = get_log_path();
    IpcResult::success(path)
}

// ============================================================================
// Log List With Stats Command (Combined for single file read)
// ============================================================================

#[tauri::command]
pub fn log_list_with_stats(
    limit: Option<usize>,
    filter: Option<LogFilter>,
) -> IpcResult<LogsAndStats> {
    let result = get_logs_with_stats(filter, limit);
    IpcResult::success(result)
}
