use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

#[allow(dead_code)]
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
            log_path: log_dir.join("errors.log"),
            max_size: 10 * 1024 * 1024,
            max_files: 5,
        }
    }

    pub fn error(&self, code: &str, message: &str, context: serde_json::Value) {
        let entry = serde_json::json!({
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "level": "ERROR",
            "code": code,
            "message": message,
            "context": context,
        });

        self.write(&entry.to_string());
        self.rotate_if_needed();
    }

    pub fn warn(&self, code: &str, message: &str, context: serde_json::Value) {
        let entry = serde_json::json!({
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "level": "WARN",
            "code": code,
            "message": message,
            "context": context,
        });

        self.write(&entry.to_string());
    }

    pub fn info(&self, code: &str, message: &str, context: serde_json::Value) {
        let entry = serde_json::json!({
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "level": "INFO",
            "code": code,
            "message": message,
            "context": context,
        });

        self.write(&entry.to_string());
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
}

impl Default for Logger {
    fn default() -> Self {
        Self::new()
    }
}

pub static LOGGER: Mutex<Option<Logger>> = Mutex::new(None);

pub fn init_logger() {
    let mut guard = LOGGER.lock().unwrap();
    *guard = Some(Logger::new());
}

pub fn log_error(code: &str, message: &str, context: serde_json::Value) {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            logger.error(code, message, context);
        }
    }
}

#[allow(dead_code)]
pub fn log_warn(code: &str, message: &str, context: serde_json::Value) {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            logger.warn(code, message, context);
        }
    }
}

#[allow(dead_code)]
pub fn log_info(code: &str, message: &str, context: serde_json::Value) {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            logger.info(code, message, context);
        }
    }
}

pub fn get_logs(limit: Option<usize>) -> Vec<serde_json::Value> {
    if let Ok(guard) = LOGGER.lock() {
        if let Some(ref logger) = *guard {
            return logger.read_logs(limit);
        }
    }
    vec![]
}
