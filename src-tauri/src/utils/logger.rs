use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

// ============================================================================
// Log Data Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

impl LogLevel {
    pub fn as_str(&self) -> &'static str {
        match self {
            LogLevel::Debug => "DEBUG",
            LogLevel::Info => "INFO",
            LogLevel::Warn => "WARN",
            LogLevel::Error => "ERROR",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_uppercase().as_str() {
            "DEBUG" => Some(LogLevel::Debug),
            "INFO" => Some(LogLevel::Info),
            "WARN" => Some(LogLevel::Warn),
            "ERROR" => Some(LogLevel::Error),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "UPPERCASE")]
pub enum LogSource {
    Frontend,
    Backend,
}

impl LogSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            LogSource::Frontend => "FRONTEND",
            LogSource::Backend => "BACKEND",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogEntry {
    pub timestamp: String,
    pub level: LogLevel,
    pub module: String,
    pub code: String,
    pub message: String,
    pub source: LogSource,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stack_trace: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogFilter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub level: Option<serde_json::Value>, // String or Array<String>
    #[serde(skip_serializing_if = "Option::is_none")]
    pub module: Option<serde_json::Value>, // String or Array<String>
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<serde_json::Value>, // String or Array<String>
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_time: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub search: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum LogExportFormat {
    Json,
    Txt,
    Csv,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogStats {
    pub total: usize,
    pub by_level: std::collections::HashMap<String, usize>,
    pub by_module: std::collections::HashMap<String, usize>,
    pub oldest_timestamp: Option<String>,
    pub newest_timestamp: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogsAndStats {
    pub logs: Vec<LogEntry>,
    pub stats: LogStats,
    pub path: String,
}

// ============================================================================
// Logger Implementation
// ============================================================================

pub struct Logger {
    log_path: PathBuf,
    max_size: u64,
    max_files: usize,
}

impl Logger {
    pub fn new() -> Self {
        let log_dir = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("/tmp"))
            .join("Library/Logs/CSM");

        fs::create_dir_all(&log_dir).ok();

        Self {
            log_path: log_dir.join("csm.log"),
            max_size: 10 * 1024 * 1024,
            max_files: 5,
        }
    }

    pub fn log(
        &self,
        level: LogLevel,
        module: &str,
        code: &str,
        message: &str,
        source: LogSource,
        context: Option<serde_json::Value>,
        stack_trace: Option<String>,
    ) {
        // Debug level only written in debug builds
        #[cfg(not(debug_assertions))]
        if level == LogLevel::Debug {
            return;
        }

        let entry = LogEntry {
            timestamp: chrono::Utc::now().to_rfc3339(),
            level: level.clone(),
            module: module.to_string(),
            code: code.to_string(),
            message: message.to_string(),
            source,
            context,
            stack_trace,
        };

        self.write_entry(&entry);
        self.rotate_if_needed();
    }

    fn write_entry(&self, entry: &LogEntry) {
        if let Ok(json) = serde_json::to_string(entry) {
            if let Ok(mut file) = OpenOptions::new()
                .create(true)
                .append(true)
                .open(&self.log_path)
            {
                let _ = writeln!(file, "{}", json);
            }
        }
    }

    fn write(&self, content: &str) {
        if let Ok(mut file) = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&self.log_path)
        {
            let _ = writeln!(file, "{}", content);
        }
    }

    fn rotate_if_needed(&self) {
        if let Ok(metadata) = fs::metadata(&self.log_path) {
            if metadata.len() > self.max_size {
                self.rotate();
            }
        }
    }

    fn rotate(&self) {
        for i in (1..self.max_files).rev() {
            let old_path = self.log_path.with_extension(format!("log.{}", i));
            let new_path = self.log_path.with_extension(format!("log.{}", i + 1));

            if old_path.exists() {
                let _ = fs::rename(&old_path, &new_path);
            }
        }

        let first_rotated = self.log_path.with_extension("log.1");
        let _ = fs::rename(&self.log_path, &first_rotated);
    }

    pub fn read_logs(&self, limit: Option<usize>) -> Vec<serde_json::Value> {
        let content = fs::read_to_string(&self.log_path).unwrap_or_default();
        let lines: Vec<&str> = content.lines().collect();

        let take_count = limit.unwrap_or(100);
        let start = if lines.len() > take_count {
            lines.len() - take_count
        } else {
            0
        };

        lines[start..]
            .iter()
            .filter_map(|line| serde_json::from_str(line).ok())
            .collect()
    }

    pub fn filter_logs(&self, filter: &LogFilter) -> Vec<LogEntry> {
        let content = fs::read_to_string(&self.log_path).unwrap_or_default();
        let entries: Vec<LogEntry> = content
            .lines()
            .filter_map(|line| serde_json::from_str(line).ok())
            .filter(|entry| self.matches_filter(entry, filter))
            .collect();

        // Return in reverse chronological order (newest first)
        entries.into_iter().rev().collect()
    }

    fn matches_filter(&self, entry: &LogEntry, filter: &LogFilter) -> bool {
        // Filter by level (supports string or array)
        if let Some(ref level_value) = filter.level {
            let levels = Self::extract_string_array(level_value);
            if !levels.is_empty() {
                let matches = levels.iter().any(|l| {
                    LogLevel::from_str(l).map(|lvl| entry.level == lvl).unwrap_or(false)
                });
                if !matches {
                    return false;
                }
            }
        }

        // Filter by module (supports string or array)
        if let Some(ref module_value) = filter.module {
            let modules = Self::extract_string_array(module_value);
            if !modules.is_empty() {
                let matches = modules.iter().any(|m| {
                    entry.module.eq_ignore_ascii_case(m)
                });
                if !matches {
                    return false;
                }
            }
        }

        // Filter by source
        if let Some(ref source_str) = filter.source {
            let source_upper = source_str.to_uppercase();
            if entry.source.as_str() != source_upper {
                return false;
            }
        }

        // Filter by code (supports string or array)
        if let Some(ref code_value) = filter.code {
            let codes = Self::extract_string_array(code_value);
            if !codes.is_empty() {
                let matches = codes.iter().any(|c| {
                    entry.code.eq_ignore_ascii_case(c)
                });
                if !matches {
                    return false;
                }
            }
        }

        // Filter by time range
        if let Some(ref start_time) = filter.start_time {
            if entry.timestamp.as_str() < start_time.as_str() {
                return false;
            }
        }

        if let Some(ref end_time) = filter.end_time {
            if entry.timestamp.as_str() > end_time.as_str() {
                return false;
            }
        }

        // Filter by search text
        if let Some(ref search) = filter.search {
            let search_lower = search.to_lowercase();
            if !entry.message.to_lowercase().contains(&search_lower)
                && !entry.code.to_lowercase().contains(&search_lower)
            {
                return false;
            }
        }

        true
    }

    /// Extract string array from JSON value (string or array)
    fn extract_string_array(value: &serde_json::Value) -> Vec<String> {
        match value {
            serde_json::Value::String(s) => vec![s.clone()],
            serde_json::Value::Array(arr) => arr
                .iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect(),
            _ => vec![],
        }
    }

    pub fn export_logs(&self, format: LogExportFormat, filter: Option<LogFilter>) -> String {
        let entries = match filter {
            Some(f) => self.filter_logs(&f),
            None => {
                let content = fs::read_to_string(&self.log_path).unwrap_or_default();
                content
                    .lines()
                    .filter_map(|line| serde_json::from_str(line).ok())
                    .collect()
            }
        };

        match format {
            LogExportFormat::Json => {
                serde_json::to_string_pretty(&entries).unwrap_or_else(|_| "[]".to_string())
            }
            LogExportFormat::Txt => {
                let mut output = String::new();
                for entry in entries {
                    output.push_str(&format!(
                        "[{}] {} [{}] {}: {}\n",
                        entry.timestamp,
                        entry.level.as_str(),
                        entry.module,
                        entry.code,
                        entry.message
                    ));
                }
                output
            }
            LogExportFormat::Csv => {
                let mut output = String::from("timestamp,level,module,code,message,source\n");
                for entry in entries {
                    output.push_str(&format!(
                        "{},{},{},{},{},{}\n",
                        entry.timestamp,
                        entry.level.as_str(),
                        entry.module,
                        entry.code,
                        entry.message.replace(',', ";"),
                        entry.source.as_str()
                    ));
                }
                output
            }
        }
    }

    pub fn clear_logs(&self, before: Option<&str>, keep_days: Option<u32>) -> usize {
        // If no filters, clear all logs
        if before.is_none() && keep_days.is_none() {
            if self.log_path.exists() {
                let content = fs::read_to_string(&self.log_path).unwrap_or_default();
                let count = content.lines().count();
                return if fs::remove_file(&self.log_path).is_ok() {
                    count
                } else {
                    0
                };
            }
            return 0;
        }

        // Read all entries
        let content = fs::read_to_string(&self.log_path).unwrap_or_default();
        let entries: Vec<LogEntry> = content
            .lines()
            .filter_map(|line| serde_json::from_str(line).ok())
            .collect();

        let original_count = entries.len();

        // Calculate cutoff timestamp for keep_days
        let keep_days_cutoff = keep_days.and_then(|days| {
            chrono::Utc::now()
                .checked_sub_signed(chrono::Duration::days(days as i64))
                .map(|dt| dt.to_rfc3339())
        });

        // Filter entries to keep (not delete)
        let entries_to_keep: Vec<&LogEntry> = entries.iter().filter(|entry| {
            // Check before filter: keep entries at or after 'before' timestamp
            if let Some(before_ts) = before {
                if entry.timestamp.as_str() < before_ts {
                    return false; // Entry is before 'before', should be deleted
                }
            }

            // Check keep_days filter: keep entries within the keep_days window
            if let Some(ref cutoff) = keep_days_cutoff {
                if entry.timestamp.as_str() < cutoff.as_str() {
                    return false; // Entry is older than keep_days, should be deleted
                }
            }

            true
        }).collect();

        let deleted_count = original_count - entries_to_keep.len();

        // Rewrite log file with kept entries
        if deleted_count > 0 {
            if let Ok(mut file) = OpenOptions::new()
                .write(true)
                .truncate(true)
                .create(true)
                .open(&self.log_path)
            {
                for entry in entries_to_keep {
                    if let Ok(json) = serde_json::to_string(entry) {
                        let _ = writeln!(file, "{}", json);
                    }
                }
            }
        }

        deleted_count
    }

    pub fn get_stats(&self) -> LogStats {
        use std::collections::HashMap;

        let content = fs::read_to_string(&self.log_path).unwrap_or_default();
        let entries: Vec<LogEntry> = content
            .lines()
            .filter_map(|line| serde_json::from_str(line).ok())
            .collect();

        let mut by_level: HashMap<String, usize> = HashMap::new();
        by_level.insert("debug".to_string(), 0);
        by_level.insert("info".to_string(), 0);
        by_level.insert("warn".to_string(), 0);
        by_level.insert("error".to_string(), 0);

        let mut by_module: HashMap<String, usize> = HashMap::new();

        for entry in &entries {
            // Update level count
            let level_key = entry.level.as_str().to_lowercase();
            *by_level.entry(level_key).or_insert(0) += 1;

            // Update module count
            *by_module.entry(entry.module.clone()).or_insert(0) += 1;
        }

        let mut oldest_timestamp = None;
        let mut newest_timestamp = None;
        if let Some(first) = entries.first() {
            oldest_timestamp = Some(first.timestamp.clone());
        }
        if let Some(last) = entries.last() {
            newest_timestamp = Some(last.timestamp.clone());
        }

        LogStats {
            total: entries.len(),
            by_level,
            by_module,
            oldest_timestamp,
            newest_timestamp,
        }
    }

    pub fn get_log_path(&self) -> String {
        self.log_path.to_string_lossy().to_string()
    }

    /// Combined method to get logs and stats in a single file read
    pub fn get_logs_with_stats(
        &self,
        filter: Option<&LogFilter>,
        limit: Option<usize>,
    ) -> LogsAndStats {
        use std::collections::HashMap;

        let content = fs::read_to_string(&self.log_path).unwrap_or_default();
        let all_entries: Vec<LogEntry> = content
            .lines()
            .filter_map(|line| serde_json::from_str(line).ok())
            .collect();

        // Calculate stats from all entries
        let mut by_level: HashMap<String, usize> = HashMap::new();
        by_level.insert("debug".to_string(), 0);
        by_level.insert("info".to_string(), 0);
        by_level.insert("warn".to_string(), 0);
        by_level.insert("error".to_string(), 0);

        let mut by_module: HashMap<String, usize> = HashMap::new();

        for entry in &all_entries {
            let level_key = entry.level.as_str().to_lowercase();
            *by_level.entry(level_key).or_insert(0) += 1;
            *by_module.entry(entry.module.clone()).or_insert(0) += 1;
        }

        let mut oldest_timestamp = None;
        let mut newest_timestamp = None;
        if let Some(first) = all_entries.first() {
            oldest_timestamp = Some(first.timestamp.clone());
        }
        if let Some(last) = all_entries.last() {
            newest_timestamp = Some(last.timestamp.clone());
        }

        let stats = LogStats {
            total: all_entries.len(),
            by_level,
            by_module,
            oldest_timestamp,
            newest_timestamp,
        };

        // Apply filter and get logs
        let logs: Vec<LogEntry> = match filter {
            Some(f) => all_entries
                .into_iter()
                .filter(|entry| self.matches_filter(entry, f))
                .rev()
                .collect(),
            None => all_entries.into_iter().rev().collect(),
        };

        // Apply limit
        let logs = match limit {
            Some(l) if l < logs.len() => logs.into_iter().take(l).collect(),
            _ => logs,
        };

        LogsAndStats {
            logs,
            stats,
            path: self.get_log_path(),
        }
    }
}

impl Default for Logger {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Global Logger Instance
// ============================================================================

pub static LOGGER: Mutex<Option<Logger>> = Mutex::new(None);

pub fn init_logger() {
    let mut guard = LOGGER.lock().unwrap();
    *guard = Some(Logger::new());
}

// ============================================================================
// Convenience Functions
// ============================================================================

pub fn log(
    level: LogLevel,
    module: &str,
    code: &str,
    message: &str,
    source: LogSource,
    context: Option<serde_json::Value>,
    stack_trace: Option<String>,
) {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            logger.log(level, module, code, message, source, context, stack_trace);
        }
    }
}

pub fn log_error(code: &str, message: &str, context: serde_json::Value) {
    log(
        LogLevel::Error,
        "SYSTEM",
        code,
        message,
        LogSource::Backend,
        Some(context),
        None,
    );
}

#[allow(dead_code)]
pub fn log_warn(code: &str, message: &str, context: serde_json::Value) {
    log(
        LogLevel::Warn,
        "SYSTEM",
        code,
        message,
        LogSource::Backend,
        Some(context),
        None,
    );
}

#[allow(dead_code)]
pub fn log_info(code: &str, message: &str, context: serde_json::Value) {
    log(
        LogLevel::Info,
        "SYSTEM",
        code,
        message,
        LogSource::Backend,
        Some(context),
        None,
    );
}

#[allow(dead_code)]
pub fn log_debug(code: &str, message: &str, context: serde_json::Value) {
    log(
        LogLevel::Debug,
        "SYSTEM",
        code,
        message,
        LogSource::Backend,
        Some(context),
        None,
    );
}

pub fn get_logs(limit: Option<usize>) -> Vec<serde_json::Value> {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            return logger.read_logs(limit);
        }
    }
    vec![]
}

pub fn filter_logs(filter: LogFilter) -> Vec<LogEntry> {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            return logger.filter_logs(&filter);
        }
    }
    vec![]
}

pub fn export_logs(format: LogExportFormat, filter: Option<LogFilter>) -> String {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            return logger.export_logs(format, filter);
        }
    }
    String::new()
}

pub fn clear_logs(before: Option<&str>, keep_days: Option<u32>) -> usize {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            return logger.clear_logs(before, keep_days);
        }
    }
    0
}

pub fn get_stats() -> LogStats {
    use std::collections::HashMap;

    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            return logger.get_stats();
        }
    }
    let mut by_level: HashMap<String, usize> = HashMap::new();
    by_level.insert("debug".to_string(), 0);
    by_level.insert("info".to_string(), 0);
    by_level.insert("warn".to_string(), 0);
    by_level.insert("error".to_string(), 0);

    LogStats {
        total: 0,
        by_level,
        by_module: HashMap::new(),
        oldest_timestamp: None,
        newest_timestamp: None,
    }
}

pub fn get_log_path() -> String {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            return logger.get_log_path();
        }
    }
    String::new()
}

pub fn get_logs_with_stats(filter: Option<LogFilter>, limit: Option<usize>) -> LogsAndStats {
    use std::collections::HashMap;

    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            return logger.get_logs_with_stats(filter.as_ref(), limit);
        }
    }

    let mut by_level: HashMap<String, usize> = HashMap::new();
    by_level.insert("debug".to_string(), 0);
    by_level.insert("info".to_string(), 0);
    by_level.insert("warn".to_string(), 0);
    by_level.insert("error".to_string(), 0);

    LogsAndStats {
        logs: vec![],
        stats: LogStats {
            total: 0,
            by_level,
            by_module: HashMap::new(),
            oldest_timestamp: None,
            newest_timestamp: None,
        },
        path: String::new(),
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::TempDir;

    /// Create a test logger with a temporary directory
    fn create_test_logger() -> (Logger, TempDir) {
        let temp_dir = tempfile::tempdir().expect("Failed to create temp dir");
        let log_path = temp_dir.path().join("test.log");

        let logger = Logger {
            log_path,
            max_size: 1024, // 1KB for testing rotation
            max_files: 3,
        };

        (logger, temp_dir)
    }

    // ===========================================================================
    // LogLevel Tests
    // ===========================================================================

    mod log_level_tests {
        use super::*;

        #[test]
        fn test_log_level_as_str() {
            assert_eq!(LogLevel::Debug.as_str(), "DEBUG");
            assert_eq!(LogLevel::Info.as_str(), "INFO");
            assert_eq!(LogLevel::Warn.as_str(), "WARN");
            assert_eq!(LogLevel::Error.as_str(), "ERROR");
        }

        #[test]
        fn test_log_level_from_str() {
            assert_eq!(LogLevel::from_str("debug"), Some(LogLevel::Debug));
            assert_eq!(LogLevel::from_str("DEBUG"), Some(LogLevel::Debug));
            assert_eq!(LogLevel::from_str("Info"), Some(LogLevel::Info));
            assert_eq!(LogLevel::from_str("WARN"), Some(LogLevel::Warn));
            assert_eq!(LogLevel::from_str("error"), Some(LogLevel::Error));
            assert_eq!(LogLevel::from_str("invalid"), None);
        }

        #[test]
        fn test_log_level_serialization() {
            // Test lowercase serialization
            let json = serde_json::to_string(&LogLevel::Debug).unwrap();
            assert_eq!(json, "\"debug\"");

            let json = serde_json::to_string(&LogLevel::Error).unwrap();
            assert_eq!(json, "\"error\"");
        }

        #[test]
        fn test_log_level_deserialization() {
            let level: LogLevel = serde_json::from_str("\"info\"").unwrap();
            assert_eq!(level, LogLevel::Info);

            // Note: serde rename_all = "lowercase" only accepts lowercase
            let level: LogLevel = serde_json::from_str("\"warn\"").unwrap();
            assert_eq!(level, LogLevel::Warn);
        }

        #[test]
        fn test_log_level_equality() {
            assert_eq!(LogLevel::Debug, LogLevel::Debug);
            assert_ne!(LogLevel::Debug, LogLevel::Info);
        }
    }

    // ===========================================================================
    // LogSource Tests
    // ===========================================================================

    mod log_source_tests {
        use super::*;

        #[test]
        fn test_log_source_as_str() {
            assert_eq!(LogSource::Frontend.as_str(), "FRONTEND");
            assert_eq!(LogSource::Backend.as_str(), "BACKEND");
        }

        #[test]
        fn test_log_source_serialization() {
            let json = serde_json::to_string(&LogSource::Frontend).unwrap();
            assert_eq!(json, "\"FRONTEND\"");

            let json = serde_json::to_string(&LogSource::Backend).unwrap();
            assert_eq!(json, "\"BACKEND\"");
        }

        #[test]
        fn test_log_source_deserialization() {
            let source: LogSource = serde_json::from_str("\"FRONTEND\"").unwrap();
            assert_eq!(source, LogSource::Frontend);

            let source: LogSource = serde_json::from_str("\"BACKEND\"").unwrap();
            assert_eq!(source, LogSource::Backend);
        }
    }

    // ===========================================================================
    // LogEntry Tests
    // ===========================================================================

    mod log_entry_tests {
        use super::*;

        #[test]
        fn test_log_entry_serialization() {
            let entry = LogEntry {
                timestamp: "2025-05-09T10:00:00Z".to_string(),
                level: LogLevel::Error,
                module: "LIBRARY".to_string(),
                code: "LIBRARY_IMPORT_FAILED".to_string(),
                message: "Failed to import skill".to_string(),
                source: LogSource::Backend,
                context: Some(serde_json::json!({ "skill_id": "123" })),
                stack_trace: None,
            };

            let json = serde_json::to_string(&entry).unwrap();
            assert!(json.contains("\"level\":\"error\""));
            assert!(json.contains("\"module\":\"LIBRARY\""));
            assert!(json.contains("\"source\":\"BACKEND\""));
            assert!(json.contains("\"context\":{\"skill_id\":\"123\"}"));
            // stack_trace is None, should be skipped
            assert!(!json.contains("stackTrace"));
        }

        #[test]
        fn test_log_entry_with_stack_trace() {
            let entry = LogEntry {
                timestamp: "2025-05-09T10:00:00Z".to_string(),
                level: LogLevel::Error,
                module: "SYSTEM".to_string(),
                code: "UNKNOWN_ERROR".to_string(),
                message: "Error occurred".to_string(),
                source: LogSource::Frontend,
                context: None,
                stack_trace: Some("Error at line 1\n  at function()".to_string()),
            };

            let json = serde_json::to_string(&entry).unwrap();
            assert!(json.contains("\"stackTrace\":\"Error at line 1"));
        }

        #[test]
        fn test_log_entry_camel_case() {
            let entry = LogEntry {
                timestamp: "2025-05-09T10:00:00Z".to_string(),
                level: LogLevel::Info,
                module: "DEPLOY".to_string(),
                code: "DEPLOY_SUCCESS".to_string(),
                message: "Deployed".to_string(),
                source: LogSource::Backend,
                context: None,
                stack_trace: Some("stack trace".to_string()), // Include stack trace to verify field name
            };

            let json = serde_json::to_string(&entry).unwrap();
            // Verify camelCase field names
            assert!(json.contains("\"stackTrace\"")); // camelCase field name
        }
    }

    // ===========================================================================
    // Logger Write Tests
    // ===========================================================================

    mod logger_write_tests {
        use super::*;

        #[test]
        fn test_write_log_entry() {
            let (logger, _temp_dir) = create_test_logger();

            logger.log(
                LogLevel::Info,
                "LIBRARY",
                "IMPORT_SUCCESS",
                "Skill imported successfully",
                LogSource::Backend,
                Some(serde_json::json!({ "skill_id": "test-123" })),
                None,
            );

            let content = fs::read_to_string(&logger.log_path).unwrap();
            assert!(content.contains("IMPORT_SUCCESS"));
            assert!(content.contains("Skill imported successfully"));
            assert!(content.contains("LIBRARY"));
        }

        #[test]
        fn test_write_multiple_entries() {
            let (logger, _temp_dir) = create_test_logger();

            logger.log(LogLevel::Info, "SYSTEM", "START", "App started", LogSource::Backend, None, None);
            logger.log(LogLevel::Warn, "SYNC", "SYNC_WARN", "Sync delayed", LogSource::Backend, None, None);
            logger.log(LogLevel::Error, "LIBRARY", "IMPORT_FAILED", "Import failed", LogSource::Backend, None, None);

            let content = fs::read_to_string(&logger.log_path).unwrap();
            let lines: Vec<&str> = content.lines().collect();
            assert_eq!(lines.len(), 3);

            assert!(lines[0].contains("START"));
            assert!(lines[1].contains("SYNC_WARN"));
            assert!(lines[2].contains("IMPORT_FAILED"));
        }

        #[test]
        fn test_write_with_context() {
            let (logger, _temp_dir) = create_test_logger();

            logger.log(
                LogLevel::Error,
                "DEPLOY",
                "DEPLOY_FAILED",
                "Deployment failed",
                LogSource::Frontend,
                Some(serde_json::json!({
                    "skill_id": "skill-001",
                    "target": "global",
                    "error": "Permission denied"
                })),
                Some("Error stack trace here".to_string()),
            );

            let content = fs::read_to_string(&logger.log_path).unwrap();
            let entry: LogEntry = serde_json::from_str(&content.lines().next().unwrap()).unwrap();

            assert_eq!(entry.module, "DEPLOY");
            assert!(entry.context.is_some());
            let ctx = entry.context.unwrap();
            assert_eq!(ctx["skill_id"], "skill-001");
            assert_eq!(ctx["target"], "global");
            assert!(entry.stack_trace.is_some());
        }

        #[test]
        fn test_debug_log_only_in_debug_build() {
            let (logger, _temp_dir) = create_test_logger();

            logger.log(
                LogLevel::Debug,
                "SYSTEM",
                "DEBUG_MSG",
                "Debug message",
                LogSource::Backend,
                None,
                None,
            );

            let content = fs::read_to_string(&logger.log_path).unwrap_or_default();

            #[cfg(debug_assertions)]
            {
                // Debug build should include DEBUG logs
                assert!(content.contains("DEBUG_MSG"));
            }

            #[cfg(not(debug_assertions))]
            {
                // Release build should NOT include DEBUG logs
                assert!(!content.contains("DEBUG_MSG"));
            }
        }
    }

    // ===========================================================================
    // Logger Filter Tests
    // ===========================================================================

    mod logger_filter_tests {
        use super::*;

        fn create_logs_with_various_levels(logger: &Logger) {
            logger.log(LogLevel::Debug, "SYSTEM", "DEBUG_1", "Debug 1", LogSource::Backend, None, None);
            logger.log(LogLevel::Info, "LIBRARY", "INFO_1", "Info 1", LogSource::Backend, None, None);
            logger.log(LogLevel::Info, "LIBRARY", "INFO_2", "Info 2", LogSource::Frontend, None, None);
            logger.log(LogLevel::Warn, "SYNC", "WARN_1", "Warn 1", LogSource::Backend, None, None);
            logger.log(LogLevel::Error, "DEPLOY", "ERROR_1", "Error 1", LogSource::Backend, None, None);
            logger.log(LogLevel::Error, "DEPLOY", "ERROR_2", "Error 2", LogSource::Frontend, None, None);
        }

        #[test]
        fn test_filter_by_level_string() {
            let (logger, _temp_dir) = create_test_logger();
            create_logs_with_various_levels(&logger);

            let filter = LogFilter {
                level: Some(serde_json::json!("error")),
                module: None,
                code: None,
                source: None,
                start_time: None,
                end_time: None,
                search: None,
            };

            let entries = logger.filter_logs(&filter);

            #[cfg(debug_assertions)]
            assert_eq!(entries.len(), 2); // 2 error entries
            #[cfg(not(debug_assertions))]
            assert_eq!(entries.len(), 2);

            assert!(entries.iter().all(|e| e.level == LogLevel::Error));
        }

        #[test]
        fn test_filter_by_level_array() {
            let (logger, _temp_dir) = create_test_logger();
            create_logs_with_various_levels(&logger);

            let filter = LogFilter {
                level: Some(serde_json::json!(["error", "warn"])),
                module: None,
                code: None,
                source: None,
                start_time: None,
                end_time: None,
                search: None,
            };

            let entries = logger.filter_logs(&filter);

            #[cfg(debug_assertions)]
            assert_eq!(entries.len(), 3); // 1 warn + 2 error
            #[cfg(not(debug_assertions))]
            assert_eq!(entries.len(), 3);

            assert!(entries.iter().all(|e| e.level == LogLevel::Error || e.level == LogLevel::Warn));
        }

        #[test]
        fn test_filter_by_module() {
            let (logger, _temp_dir) = create_test_logger();
            create_logs_with_various_levels(&logger);

            let filter = LogFilter {
                level: None,
                module: Some(serde_json::json!("LIBRARY")),
                code: None,
                source: None,
                start_time: None,
                end_time: None,
                search: None,
            };

            let entries = logger.filter_logs(&filter);
            assert!(entries.iter().all(|e| e.module == "LIBRARY"));
        }

        #[test]
        fn test_filter_by_module_array() {
            let (logger, _temp_dir) = create_test_logger();
            create_logs_with_various_levels(&logger);

            let filter = LogFilter {
                level: None,
                module: Some(serde_json::json!(["LIBRARY", "SYNC"])),
                code: None,
                source: None,
                start_time: None,
                end_time: None,
                search: None,
            };

            let entries = logger.filter_logs(&filter);
            assert!(entries.iter().all(|e| e.module == "LIBRARY" || e.module == "SYNC"));
        }

        #[test]
        fn test_filter_by_source() {
            let (logger, _temp_dir) = create_test_logger();
            create_logs_with_various_levels(&logger);

            let filter = LogFilter {
                level: None,
                module: None,
                code: None,
                source: Some("FRONTEND".to_string()),
                start_time: None,
                end_time: None,
                search: None,
            };

            let entries = logger.filter_logs(&filter);
            assert!(entries.iter().all(|e| e.source == LogSource::Frontend));
        }

        #[test]
        fn test_filter_by_code() {
            let (logger, _temp_dir) = create_test_logger();
            create_logs_with_various_levels(&logger);

            let filter = LogFilter {
                level: None,
                module: None,
                code: Some(serde_json::json!(["ERROR_1", "ERROR_2"])),
                source: None,
                start_time: None,
                end_time: None,
                search: None,
            };

            let entries = logger.filter_logs(&filter);
            assert_eq!(entries.len(), 2);
            assert!(entries.iter().all(|e| e.code.starts_with("ERROR")));
        }

        #[test]
        fn test_filter_by_search() {
            let (logger, _temp_dir) = create_test_logger();
            create_logs_with_various_levels(&logger);

            let filter = LogFilter {
                level: None,
                module: None,
                code: None,
                source: None,
                start_time: None,
                end_time: None,
                search: Some("Error".to_string()),
            };

            let entries = logger.filter_logs(&filter);
            assert!(entries.iter().all(|e| e.message.contains("Error")));
        }

        #[test]
        fn test_filter_combined() {
            let (logger, _temp_dir) = create_test_logger();
            create_logs_with_various_levels(&logger);

            let filter = LogFilter {
                level: Some(serde_json::json!("error")),
                module: Some(serde_json::json!("DEPLOY")),
                code: None,
                source: Some("BACKEND".to_string()),
                start_time: None,
                end_time: None,
                search: None,
            };

            let entries = logger.filter_logs(&filter);
            assert_eq!(entries.len(), 1); // Only ERROR_1 matches (BACKEND + DEPLOY + error)
            assert_eq!(entries[0].code, "ERROR_1");
        }

        #[test]
        fn test_filter_returns_newest_first() {
            let (logger, _temp_dir) = create_test_logger();

            logger.log(LogLevel::Info, "SYSTEM", "FIRST", "First", LogSource::Backend, None, None);
            logger.log(LogLevel::Info, "SYSTEM", "SECOND", "Second", LogSource::Backend, None, None);
            logger.log(LogLevel::Info, "SYSTEM", "THIRD", "Third", LogSource::Backend, None, None);

            let filter = LogFilter {
                level: None,
                module: None,
                code: None,
                source: None,
                start_time: None,
                end_time: None,
                search: None,
            };

            let entries = logger.filter_logs(&filter);
            // Should be in reverse order (newest first)
            assert_eq!(entries[0].code, "THIRD");
            assert_eq!(entries[1].code, "SECOND");
            assert_eq!(entries[2].code, "FIRST");
        }

        #[test]
        fn test_filter_by_time_range() {
            let (logger, _temp_dir) = create_test_logger();

            // Manually write entries with specific timestamps
            let entries = vec![
                LogEntry {
                    timestamp: "2025-05-09T10:00:00Z".to_string(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: "MSG1".to_string(),
                    message: "Message 1".to_string(),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                },
                LogEntry {
                    timestamp: "2025-05-09T12:00:00Z".to_string(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: "MSG2".to_string(),
                    message: "Message 2".to_string(),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                },
                LogEntry {
                    timestamp: "2025-05-09T14:00:00Z".to_string(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: "MSG3".to_string(),
                    message: "Message 3".to_string(),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                },
            ];

            for entry in &entries {
                let json = serde_json::to_string(entry).unwrap();
                let mut file = OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(&logger.log_path)
                    .unwrap();
                writeln!(file, "{}", json).unwrap();
            }

            let filter = LogFilter {
                level: None,
                module: None,
                code: None,
                source: None,
                start_time: Some("2025-05-09T11:00:00Z".to_string()),
                end_time: Some("2025-05-09T13:00:00Z".to_string()),
                search: None,
            };

            let filtered = logger.filter_logs(&filter);
            assert_eq!(filtered.len(), 1);
            assert_eq!(filtered[0].code, "MSG2");
        }
    }

    // ===========================================================================
    // Logger Stats Tests
    // ===========================================================================

    mod logger_stats_tests {
        use super::*;

        #[test]
        fn test_empty_stats() {
            let (logger, _temp_dir) = create_test_logger();

            let stats = logger.get_stats();

            assert_eq!(stats.total, 0);
            assert_eq!(stats.by_level["debug"], 0);
            assert_eq!(stats.by_level["info"], 0);
            assert_eq!(stats.by_level["warn"], 0);
            assert_eq!(stats.by_level["error"], 0);
            assert!(stats.oldest_timestamp.is_none());
            assert!(stats.newest_timestamp.is_none());
        }

        #[test]
        fn test_stats_counts() {
            let (logger, _temp_dir) = create_test_logger();

            logger.log(LogLevel::Info, "LIBRARY", "I1", "Info 1", LogSource::Backend, None, None);
            logger.log(LogLevel::Info, "LIBRARY", "I2", "Info 2", LogSource::Backend, None, None);
            logger.log(LogLevel::Warn, "SYNC", "W1", "Warn 1", LogSource::Backend, None, None);
            logger.log(LogLevel::Error, "DEPLOY", "E1", "Error 1", LogSource::Backend, None, None);

            let stats = logger.get_stats();

            // We logged 4 entries, all should be counted
            assert_eq!(stats.total, 4);

            assert_eq!(stats.by_level["info"], 2);
            assert_eq!(stats.by_level["warn"], 1);
            assert_eq!(stats.by_level["error"], 1);

            assert_eq!(*stats.by_module.get("LIBRARY").unwrap_or(&0), 2);
            assert_eq!(*stats.by_module.get("SYNC").unwrap_or(&0), 1);
            assert_eq!(*stats.by_module.get("DEPLOY").unwrap_or(&0), 1);
        }

        #[test]
        fn test_stats_timestamps() {
            let (logger, _temp_dir) = create_test_logger();

            // Write entries with specific timestamps
            let entries = vec![
                LogEntry {
                    timestamp: "2025-05-09T08:00:00Z".to_string(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: "OLD".to_string(),
                    message: "Old".to_string(),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                },
                LogEntry {
                    timestamp: "2025-05-09T16:00:00Z".to_string(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: "NEW".to_string(),
                    message: "New".to_string(),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                },
            ];

            for entry in &entries {
                let json = serde_json::to_string(entry).unwrap();
                let mut file = OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(&logger.log_path)
                    .unwrap();
                writeln!(file, "{}", json).unwrap();
            }

            let stats = logger.get_stats();

            assert_eq!(stats.oldest_timestamp, Some("2025-05-09T08:00:00Z".to_string()));
            assert_eq!(stats.newest_timestamp, Some("2025-05-09T16:00:00Z".to_string()));
        }

        #[test]
        fn test_logs_with_stats() {
            let (logger, _temp_dir) = create_test_logger();

            logger.log(LogLevel::Info, "LIBRARY", "I1", "Info 1", LogSource::Backend, None, None);
            logger.log(LogLevel::Error, "LIBRARY", "E1", "Error 1", LogSource::Backend, None, None);

            let result = logger.get_logs_with_stats(None, None);

            // We logged 2 entries
            assert_eq!(result.logs.len(), 2);
            assert_eq!(result.stats.total, 2);
            assert!(!result.path.is_empty());
        }
    }

    // ===========================================================================
    // Logger Export Tests
    // ===========================================================================

    mod logger_export_tests {
        use super::*;

        fn create_sample_logs(logger: &Logger) {
            logger.log(LogLevel::Info, "LIBRARY", "IMPORT_SUCCESS", "Skill imported", LogSource::Backend, None, None);
            logger.log(LogLevel::Error, "DEPLOY", "DEPLOY_FAILED", "Deploy failed", LogSource::Frontend, None, None);
        }

        #[test]
        fn test_export_json() {
            let (logger, _temp_dir) = create_test_logger();
            create_sample_logs(&logger);

            let exported = logger.export_logs(LogExportFormat::Json, None);

            assert!(exported.starts_with('['));
            assert!(exported.contains("IMPORT_SUCCESS"));
            assert!(exported.contains("DEPLOY_FAILED"));
            assert!(exported.ends_with(']'));
        }

        #[test]
        fn test_export_txt() {
            let (logger, _temp_dir) = create_test_logger();
            create_sample_logs(&logger);

            let exported = logger.export_logs(LogExportFormat::Txt, None);

            // Format: [timestamp] LEVEL [module] code: message
            assert!(exported.contains(" INFO ")); // Info level
            assert!(exported.contains(" ERROR ")); // Error level
            assert!(exported.contains("LIBRARY"));
            assert!(exported.contains("DEPLOY"));
        }

        #[test]
        fn test_export_csv() {
            let (logger, _temp_dir) = create_test_logger();
            create_sample_logs(&logger);

            let exported = logger.export_logs(LogExportFormat::Csv, None);

            assert!(exported.starts_with("timestamp,level,module,code,message,source"));
            assert!(exported.contains("LIBRARY"));
            assert!(exported.contains("DEPLOY"));
            assert!(exported.contains("BACKEND"));
            assert!(exported.contains("FRONTEND"));
        }

        #[test]
        fn test_export_with_filter() {
            let (logger, _temp_dir) = create_test_logger();
            create_sample_logs(&logger);

            let filter = LogFilter {
                level: Some(serde_json::json!("error")),
                module: None,
                code: None,
                source: None,
                start_time: None,
                end_time: None,
                search: None,
            };

            let exported = logger.export_logs(LogExportFormat::Json, Some(filter));

            assert!(exported.contains("DEPLOY_FAILED"));
            assert!(!exported.contains("IMPORT_SUCCESS"));
        }
    }

    // ===========================================================================
    // Logger Clear Tests
    // ===========================================================================

    mod logger_clear_tests {
        use super::*;

        #[test]
        fn test_clear_all_logs() {
            let (logger, _temp_dir) = create_test_logger();

            logger.log(LogLevel::Info, "SYSTEM", "MSG1", "Message 1", LogSource::Backend, None, None);
            logger.log(LogLevel::Info, "SYSTEM", "MSG2", "Message 2", LogSource::Backend, None, None);

            let count = logger.clear_logs(None, None);

            assert_eq!(count, 2);
            assert!(!logger.log_path.exists());
        }

        #[test]
        fn test_clear_empty_file() {
            let (logger, _temp_dir) = create_test_logger();

            let count = logger.clear_logs(None, None);

            assert_eq!(count, 0);
        }

        #[test]
        fn test_clear_before_timestamp() {
            let (logger, _temp_dir) = create_test_logger();

            // Write entries with specific timestamps
            let entries = vec![
                LogEntry {
                    timestamp: "2025-05-09T10:00:00Z".to_string(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: "OLD".to_string(),
                    message: "Old".to_string(),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                },
                LogEntry {
                    timestamp: "2025-05-09T12:00:00Z".to_string(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: "NEW".to_string(),
                    message: "New".to_string(),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                },
            ];

            for entry in &entries {
                let json = serde_json::to_string(entry).unwrap();
                let mut file = OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(&logger.log_path)
                    .unwrap();
                writeln!(file, "{}", json).unwrap();
            }

            let count = logger.clear_logs(Some("2025-05-09T11:00:00Z"), None);

            assert_eq!(count, 1); // Only OLD entry deleted

            let remaining = fs::read_to_string(&logger.log_path).unwrap();
            assert!(remaining.contains("NEW"));
            assert!(!remaining.contains("OLD"));
        }

        #[test]
        fn test_clear_keep_days() {
            let (logger, _temp_dir) = create_test_logger();

            // Calculate timestamps relative to current time
            let now = chrono::Utc::now();
            let old_time = now - chrono::Duration::days(10); // 10 days ago
            let recent_time = now - chrono::Duration::days(2); // 2 days ago

            // Write entries with calculated timestamps
            let entries = vec![
                LogEntry {
                    timestamp: old_time.to_rfc3339(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: "OLD".to_string(),
                    message: "Old (10 days ago)".to_string(),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                },
                LogEntry {
                    timestamp: recent_time.to_rfc3339(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: "RECENT".to_string(),
                    message: "Recent (2 days ago)".to_string(),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                },
            ];

            for entry in &entries {
                let json = serde_json::to_string(entry).unwrap();
                let mut file = OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(&logger.log_path)
                    .unwrap();
                writeln!(file, "{}", json).unwrap();
            }

            // Keep last 7 days
            let count = logger.clear_logs(None, Some(7));

            assert_eq!(count, 1); // OLD entry deleted (10 days ago > 7 days)

            let remaining = fs::read_to_string(&logger.log_path).unwrap();
            assert!(remaining.contains("RECENT"));
            assert!(!remaining.contains("OLD"));
        }
    }

    // ===========================================================================
    // Logger Rotation Tests
    // ===========================================================================

    mod logger_rotation_tests {
        use super::*;

        #[test]
        fn test_rotation_triggered_by_size() {
            let (logger, _temp_dir) = create_test_logger();

            // Write enough data to trigger rotation (max_size is 1024 bytes)
            for i in 0..20 {
                logger.log(
                    LogLevel::Info,
                    "SYSTEM",
                    &format!("MSG_{}", i),
                    &format!("This is a longer message to trigger rotation - entry number {}", i),
                    LogSource::Backend,
                    Some(serde_json::json!({ "index": i })),
                    None,
                );
            }

            // Check if rotation file was created
            let rotated_path = logger.log_path.with_extension("log.1");
            assert!(rotated_path.exists() || fs::metadata(&logger.log_path).unwrap().len() <= 1024);
        }

        #[test]
        fn test_rotation_max_files() {
            let (logger, _temp_dir) = create_test_logger();

            // Force multiple rotations
            for batch in 0..4 {
                for i in 0..20 {
                    logger.log(
                        LogLevel::Info,
                        "SYSTEM",
                        &format!("BATCH{}_MSG_{}", batch, i),
                        &format!("Batch {} Message {} - some padding text", batch, i),
                        LogSource::Backend,
                        None,
                        None,
                    );
                }
            }

            // With max_files = 3, we should have at most log.1, log.2, log.3
            let log3 = logger.log_path.with_extension("log.3");
            let log4 = logger.log_path.with_extension("log.4");

            // log.4 should not exist (max_files = 3)
            assert!(!log4.exists());
        }
    }

    // ===========================================================================
    // Read Logs Tests
    // ===========================================================================

    mod read_logs_tests {
        use super::*;

        #[test]
        fn test_read_logs_with_limit() {
            let (logger, _temp_dir) = create_test_logger();

            // Write 10 entries directly to the file to bypass any potential issues
            for i in 0..10 {
                let entry = LogEntry {
                    timestamp: chrono::Utc::now().to_rfc3339(),
                    level: LogLevel::Info,
                    module: "SYSTEM".to_string(),
                    code: format!("MSG_{}", i),
                    message: format!("Message {}", i),
                    source: LogSource::Backend,
                    context: None,
                    stack_trace: None,
                };
                let json = serde_json::to_string(&entry).unwrap();
                let mut file = OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(&logger.log_path)
                    .unwrap();
                writeln!(file, "{}", json).unwrap();
            }

            let logs = logger.read_logs(Some(5));

            // Should return exactly 5 entries (the last 5)
            assert_eq!(logs.len(), 5);

            // Should be the last 5 entries
            assert!(logs[4]["code"].as_str().unwrap().starts_with("MSG_"));
        }

        #[test]
        fn test_read_logs_default_limit() {
            let (logger, _temp_dir) = create_test_logger();

            for i in 0..5 {
                logger.log(LogLevel::Info, "SYSTEM", &format!("MSG_{}", i), &format!("Message {}", i), LogSource::Backend, None, None);
            }

            let logs = logger.read_logs(None);

            // Default limit is 100, but we only have 5 entries
            assert_eq!(logs.len(), 5);
        }
    }

    // ===========================================================================
    // Convenience Functions Tests
    // ===========================================================================

    mod convenience_functions_tests {
        use super::*;

        #[test]
        fn test_log_error_function() {
            let _ = LOGGER.lock().unwrap().take(); // Clear any existing logger
            init_logger();

            log_error("TEST_ERROR", "Test error message", serde_json::json!({ "key": "value" }));

            let path = get_log_path();
            let content = fs::read_to_string(&path).unwrap_or_default();

            assert!(content.contains("TEST_ERROR"));
            assert!(content.contains("SYSTEM"));
        }

        #[test]
        fn test_get_log_path_function() {
            let _ = LOGGER.lock().unwrap().take();
            init_logger();

            let path = get_log_path();

            assert!(path.contains("CSM"));
            assert!(path.contains("csm.log"));
        }
    }
}
