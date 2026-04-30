// SyncEngine - Handles iCloud synchronization

use std::fs;
use std::path::PathBuf;

use super::types::*;
use crate::paths;
use crate::utils::fs::copy_dir_all_str;

// ============================================================================
// SyncEngine
// ============================================================================

pub struct SyncEngine {
    // Local paths
    config_path: PathBuf,
    library_path: PathBuf,
    sync_path: PathBuf,

    // iCloud paths
    icloud_config_path: PathBuf,
    icloud_library_path: PathBuf,
    icloud_sync_path: PathBuf,

    client_id: String,
}

impl SyncEngine {
    pub fn new(
        config_path: PathBuf,
        library_path: PathBuf,
        sync_path: PathBuf,
        icloud_config_path: PathBuf,
        icloud_library_path: PathBuf,
        icloud_sync_path: PathBuf,
        client_id: String,
    ) -> Self {
        Self {
            config_path,
            library_path,
            sync_path,
            icloud_config_path,
            icloud_library_path,
            icloud_sync_path,
            client_id,
        }
    }

    /// Perform full sync: push local changes to iCloud
    pub fn sync(&self) -> Result<SyncResult, String> {
        let mut synced_items = 0u32;
        let mut errors = Vec::new();

        // Ensure iCloud directories exist
        if let Some(parent) = self.icloud_config_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create iCloud dir: {}", e))?;
        }

        // Sync config.json
        match self.sync_file(&self.config_path, &self.icloud_config_path) {
            Ok(synced) => if synced { synced_items += 1; },
            Err(e) => errors.push(format!("Config sync failed: {}", e)),
        }

        // Sync library.json
        match self.sync_file(&self.library_path, &self.icloud_library_path) {
            Ok(synced) => if synced { synced_items += 1; },
            Err(e) => errors.push(format!("Library sync failed: {}", e)),
        }

        // Sync sync.json
        match self.sync_file(&self.sync_path, &self.icloud_sync_path) {
            Ok(synced) => if synced { synced_items += 1; },
            Err(e) => errors.push(format!("Sync state sync failed: {}", e)),
        }

        // Sync library directory
        match self.sync_library_dir() {
            Ok(count) => synced_items += count,
            Err(e) => errors.push(format!("Library dir sync failed: {}", e)),
        }

        // Update sync state
        if errors.is_empty() {
            self.update_sync_state()?;
        }

        Ok(SyncResult {
            success: errors.is_empty(),
            synced_items,
            errors,
            timestamp: chrono::Utc::now().to_rfc3339(),
        })
    }

    /// Sync a single file to iCloud
    fn sync_file(&self, local: &PathBuf, icloud: &PathBuf) -> Result<bool, String> {
        if !local.exists() {
            return Ok(false);
        }

        let local_meta = fs::metadata(local)
            .map_err(|e| format!("Failed to read local metadata: {}", e))?;
        let local_modified = local_meta.modified()
            .map_err(|e| format!("Failed to get local mtime: {}", e))?;

        let should_push = if icloud.exists() {
            let icloud_meta = fs::metadata(icloud)
                .map_err(|e| format!("Failed to read iCloud metadata: {}", e))?;
            let icloud_modified = icloud_meta.modified()
                .map_err(|e| format!("Failed to get iCloud mtime: {}", e))?;

            local_modified > icloud_modified
        } else {
            true
        };

        if should_push {
            fs::copy(local, icloud)
                .map_err(|e| format!("Failed to copy to iCloud: {}", e))?;
            return Ok(true);
        }

        Ok(false)
    }

    /// Sync library directory to iCloud
    fn sync_library_dir(&self) -> Result<u32, String> {
        let local_lib = paths::get_local_library_path();
        let icloud_lib = paths::get_icloud_library_path();

        if !local_lib.exists() {
            return Ok(0);
        }

        fs::create_dir_all(&icloud_lib)
            .map_err(|e| format!("Failed to create iCloud library dir: {}", e))?;

        let mut synced_count = 0u32;

        // Get all local skills
        let local_skills = self.list_skills(&local_lib);
        let icloud_skills = self.list_skills(&icloud_lib);

        // Push new/updated skills to iCloud
        for (name, local_time) in &local_skills {
            let should_push = match icloud_skills.get(name) {
                Some(icloud_time) => local_time > icloud_time,
                None => true,
            };

            if should_push {
                let src = local_lib.join(name);
                let dst = icloud_lib.join(name);

                if dst.exists() {
                    fs::remove_dir_all(&dst)
                        .map_err(|e| format!("Failed to remove old iCloud skill: {}", e))?;
                }

                copy_dir_all_str(&src, &dst)?;
                synced_count += 1;
            }
        }

        // Pull new skills from iCloud (if not from this client)
        for (name, icloud_time) in &icloud_skills {
            let should_pull = match local_skills.get(name) {
                Some(local_time) => icloud_time > local_time,
                None => true,
            };

            if should_pull {
                let src = icloud_lib.join(name);
                let dst = local_lib.join(name);

                if dst.exists() {
                    fs::remove_dir_all(&dst)
                        .map_err(|e| format!("Failed to remove old local skill: {}", e))?;
                }

                copy_dir_all_str(&src, &dst)?;
                synced_count += 1;
            }
        }

        Ok(synced_count)
    }

    fn list_skills(&self, dir: &PathBuf) -> std::collections::HashMap<String, chrono::DateTime<chrono::Utc>> {
        let mut skills = std::collections::HashMap::new();

        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() && path.join("SKILL.md").exists() {
                    if let Ok(metadata) = fs::metadata(&path) {
                        if let Ok(modified) = metadata.modified() {
                            if let Ok(datetime) = modified.duration_since(std::time::SystemTime::UNIX_EPOCH) {
                                let name = path.file_name()
                                    .map(|n| n.to_string_lossy().to_string())
                                    .unwrap_or_default();
                                let time = chrono::DateTime::from_timestamp(datetime.as_secs() as i64, 0)
                                    .unwrap_or_else(|| chrono::Utc::now());
                                skills.insert(name, time);
                            }
                        }
                    }
                }
            }
        }

        skills
    }

    fn update_sync_state(&self) -> Result<(), String> {
        if !self.sync_path.exists() {
            return Ok(());
        }

        let content = fs::read_to_string(&self.sync_path)
            .map_err(|e| format!("Failed to read sync state: {}", e))?;

        let mut state: SyncState = serde_json::from_str(&content)
            .unwrap_or_default();

        state.version += 1;
        state.last_sync_time = Some(chrono::Utc::now().to_rfc3339());
        state.last_sync_by = Some(self.client_id.clone());

        // Clear all pending changes after successful sync
        state.pending_changes.clear();

        let new_content = serde_json::to_string_pretty(&state)
            .map_err(|e| format!("Failed to serialize sync state: {}", e))?;

        fs::write(&self.sync_path, new_content)
            .map_err(|e| format!("Failed to write sync state: {}", e))?;

        // Also write to iCloud
        fs::copy(&self.sync_path, &self.icloud_sync_path)
            .map_err(|e| format!("Failed to copy sync state to iCloud: {}", e))?;

        Ok(())
    }
}

// ============================================================================
// Sync Result
// ============================================================================

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub success: bool,
    pub synced_items: u32,
    pub errors: Vec<String>,
    pub timestamp: String,
}
