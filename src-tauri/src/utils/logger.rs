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
