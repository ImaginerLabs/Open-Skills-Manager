use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;

use super::library::IpcResult;

/// Global state for update tracking
static UPDATE_AVAILABLE: AtomicBool = AtomicBool::new(false);
static UPDATE_DOWNLOADING: AtomicBool = AtomicBool::new(false);
static UPDATE_READY: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub release_notes: Option<String>,
    pub download_progress: Option<u8>,
    pub status: UpdateStatus,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub enum UpdateStatus {
    Idle,
    Checking,
    Available,
    Downloading,
    Ready,
    Error,
}

impl Default for UpdateStatus {
    fn default() -> Self {
        UpdateStatus::Idle
    }
}

/// Check for available updates
#[tauri::command]
pub async fn update_check(app: AppHandle) -> IpcResult<UpdateInfo> {
    let current_version = app.config().version.clone().unwrap_or_default();

    // Get updater from app handle
    let updater = match app.updater() {
        Ok(u) => u,
        Err(e) => {
            return IpcResult::error("UPDATER_ERROR", &format!("Failed to get updater: {}", e));
        }
    };

    // Check for updates
    let update = match updater.check().await {
        Ok(Some(update)) => update,
        Ok(None) => {
            UPDATE_AVAILABLE.store(false, Ordering::SeqCst);
            return IpcResult::success(UpdateInfo {
                available: false,
                current_version,
                latest_version: None,
                release_notes: None,
                download_progress: None,
                status: UpdateStatus::Idle,
            });
        }
        Err(e) => {
            return IpcResult::error("CHECK_FAILED", &format!("Update check failed: {}", e));
        }
    };

    // Update is available
    UPDATE_AVAILABLE.store(true, Ordering::SeqCst);

    IpcResult::success(UpdateInfo {
        available: true,
        current_version,
        latest_version: Some(update.version.clone()),
        release_notes: update.body.clone(),
        download_progress: None,
        status: UpdateStatus::Available,
    })
}

/// Download and install the update
#[tauri::command]
pub async fn update_download(app: AppHandle) -> IpcResult<UpdateInfo> {
    if UPDATE_DOWNLOADING.load(Ordering::SeqCst) {
        return IpcResult::error("ALREADY_DOWNLOADING", "Update is already being downloaded");
    }

    UPDATE_DOWNLOADING.store(true, Ordering::SeqCst);

    let current_version = app.config().version.clone().unwrap_or_default();

    // Get updater
    let updater = match app.updater() {
        Ok(u) => u,
        Err(e) => {
            UPDATE_DOWNLOADING.store(false, Ordering::SeqCst);
            return IpcResult::error("UPDATER_ERROR", &format!("Failed to get updater: {}", e));
        }
    };

    // Check for update first
    let update = match updater.check().await {
        Ok(Some(update)) => update,
        Ok(None) => {
            UPDATE_DOWNLOADING.store(false, Ordering::SeqCst);
            return IpcResult::error("NO_UPDATE", "No update available to download");
        }
        Err(e) => {
            UPDATE_DOWNLOADING.store(false, Ordering::SeqCst);
            return IpcResult::error("CHECK_FAILED", &format!("Update check failed: {}", e));
        }
    };

    let latest_version = update.version.clone();
    let release_notes = update.body.clone();

    // Download and install with progress tracking
    let download_result = update.download_and_install(
        |chunk_length, total| {
            // Progress callback - we could emit events here if needed
            if let Some(t) = total {
                if t > 0 {
                    let progress = ((chunk_length as f64 / t as f64) * 100.0) as u8;
                    // Could emit progress event to frontend here
                    log::info!("Download progress: {}%", progress);
                }
            }
        },
        || {
            // Download complete callback
            log::info!("Download complete");
        }
    ).await;

    match download_result {
        Ok(_) => {
            UPDATE_DOWNLOADING.store(false, Ordering::SeqCst);
            UPDATE_READY.store(true, Ordering::SeqCst);

            IpcResult::success(UpdateInfo {
                available: true,
                current_version,
                latest_version: Some(latest_version),
                release_notes,
                download_progress: Some(100),
                status: UpdateStatus::Ready,
            })
        }
        Err(e) => {
            UPDATE_DOWNLOADING.store(false, Ordering::SeqCst);

            IpcResult::error("DOWNLOAD_FAILED", &format!("Failed to download update: {}", e))
        }
    }
}

/// Install the downloaded update and restart the app
#[tauri::command]
pub async fn update_install(app: AppHandle) -> IpcResult<()> {
    if !UPDATE_READY.load(Ordering::SeqCst) {
        // If update is ready from download, restart
        // Otherwise, try to download first
        if !UPDATE_AVAILABLE.load(Ordering::SeqCst) {
            return IpcResult::error("NO_UPDATE", "No update available to install");
        }

        // Download first
        let result = update_download(app.clone()).await;
        if !result.success {
            return IpcResult::error("DOWNLOAD_FAILED", "Failed to download update before install");
        }
    }

    // Restart the app to apply update
    app.request_restart();

    IpcResult::success(())
}

/// Get current update status
#[tauri::command]
pub fn update_get_status(app: AppHandle) -> IpcResult<UpdateInfo> {
    let current_version = app.config().version.clone().unwrap_or_default();

    let status = if UPDATE_READY.load(Ordering::SeqCst) {
        UpdateStatus::Ready
    } else if UPDATE_DOWNLOADING.load(Ordering::SeqCst) {
        UpdateStatus::Downloading
    } else if UPDATE_AVAILABLE.load(Ordering::SeqCst) {
        UpdateStatus::Available
    } else {
        UpdateStatus::Idle
    };

    IpcResult::success(UpdateInfo {
        available: UPDATE_AVAILABLE.load(Ordering::SeqCst),
        current_version,
        latest_version: None,
        release_notes: None,
        download_progress: None,
        status,
    })
}