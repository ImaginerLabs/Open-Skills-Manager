use super::library::IpcResult;
use super::AppError;
use crate::commands::config::{load_config, save_config};

/// Get the current theme setting from config
#[tauri::command]
pub fn theme_get() -> IpcResult<String> {
    match load_config() {
        Ok(config) => IpcResult::success(config.settings.theme),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

/// Set the theme in config
#[tauri::command]
pub fn theme_set(theme: String) -> IpcResult<()> {
    // Validate theme value
    if !matches!(theme.as_str(), "light" | "dark" | "system") {
        return IpcResult::error(
            AppError::E002InvalidInput("Invalid theme value".to_string()).code(),
            "Invalid theme value. Must be 'light', 'dark', or 'system'",
        );
    }

    match load_config() {
        Ok(mut config) => {
            config.settings.theme = theme;
            config.updated_at = chrono::Utc::now().to_rfc3339();
            match save_config(&config) {
                Ok(()) => IpcResult::success(()),
                Err(e) => IpcResult::error(
                    AppError::E102WriteFailed(e.clone()).code(),
                    &e,
                ),
            }
        }
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

/// Detect the system's current color scheme preference
#[tauri::command]
pub fn theme_detect_system() -> IpcResult<String> {
    // Use cocoa API to detect macOS appearance
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        // Try to detect via defaults command
        let output = Command::new("defaults")
            .args(["read", "-g", "AppleInterfaceStyle"])
            .output();

        match output {
            Ok(output) => {
                // If the command succeeds and output contains "Dark", system is in dark mode
                let stdout = String::from_utf8_lossy(&output.stdout);
                if stdout.contains("Dark") {
                    return IpcResult::success("dark".to_string());
                }
            }
            Err(_) => {}
        }

        // If AppleInterfaceStyle is not set, system is in light mode (default)
        // Note: The command fails when the key doesn't exist, which means light mode
        IpcResult::success("light".to_string())
    }

    #[cfg(not(target_os = "macos"))]
    {
        // For non-macOS platforms, default to dark
        IpcResult::success("dark".to_string())
    }
}
