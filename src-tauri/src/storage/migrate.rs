// MigrationService - Handles migration from old format to new format

use std::fs;
use std::io::Write;
use std::path::PathBuf;

use super::types::*;
use crate::paths;

// ============================================================================
// MigrationService
// ============================================================================

pub struct MigrationService {
    app_support: PathBuf,
    backup_dir: PathBuf,
}

impl MigrationService {
    pub fn new() -> Self {
        let app_support = paths::get_app_support_path();
        let backup_dir = app_support.join(".migration-backup");

        Self {
            app_support,
            backup_dir,
        }
    }

    /// Check if migration is needed
    pub fn needs_migration(&self) -> bool {
        // New format files don't exist but old format files do
        let new_config = self.app_support.join("config.json");
        let new_library = self.app_support.join("library.json");

        if new_config.exists() && new_library.exists() {
            // Check if it's the new format (has version field as number in library)
            if let Ok(content) = fs::read_to_string(&new_library) {
                if content.contains("\"version\":") && content.contains("\"skills\":") {
                    return false; // Already new format
                }
            }
        }

        // Check for old format files
        let old_config = self.app_support.join("config.json");
        let old_metadata = self.app_support.join("skill_metadata.json");
        let old_groups = self.app_support.join("groups.json");

        old_config.exists() || old_metadata.exists() || old_groups.exists()
    }

    /// Perform migration with backup
    pub fn migrate(&self) -> Result<MigrationResult, String> {
        let mut result = MigrationResult::default();

        // 1. Create backup directory
        fs::create_dir_all(&self.backup_dir)
            .map_err(|e| format!("Failed to create backup dir: {}", e))?;

        // 2. Backup old files
        self.backup_old_files(&mut result)?;

        // 3. Read old data
        let old_config = self.read_old_config()?;
        let old_metadata = self.read_old_metadata()?;
        let old_groups = self.read_old_groups()?;
        let old_sync_state = self.read_old_sync_state()?;

        // 4. Build new format
        let new_config = self.build_new_config(&old_config)?;
        let new_library = self.build_new_library(&old_metadata, &old_groups)?;
        let new_sync_state = self.build_new_sync_state(&old_sync_state)?;

        // 5. Validate new data
        self.validate_new_data(&new_config, &new_library)?;

        // 6. Write new files atomically
        self.write_new_files(&new_config, &new_library, &new_sync_state)?;

        // 7. Rename old files to .legacy
        self.archive_old_files(&mut result)?;

        // 8. Record migration completion
        self.record_migration_completion()?;

        result.success = true;
        Ok(result)
    }

    fn backup_old_files(&self, result: &mut MigrationResult) -> Result<(), String> {
        let files_to_backup = [
            "config.json",
            "skill_metadata.json",
            "groups.json",
            "sync-state.json",
            "client-id.json",
        ];

        for file in &files_to_backup {
            let src = self.app_support.join(file);
            if src.exists() {
                let dst = self.backup_dir.join(file);
                fs::copy(&src, &dst)
                    .map_err(|e| format!("Failed to backup {}: {}", file, e))?;
                result.backed_up_files.push(file.to_string());
            }
        }

        Ok(())
    }

    fn read_old_config(&self) -> Result<OldConfig, String> {
        let path = self.app_support.join("config.json");

        if !path.exists() {
            return Ok(OldConfig::default());
        }

        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read old config: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse old config: {}", e))
    }

    fn read_old_metadata(&self) -> Result<OldSkillMetadata, String> {
        let path = self.app_support.join("skill_metadata.json");

        if !path.exists() {
            return Ok(HashMap::new());
        }

        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read old metadata: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse old metadata: {}", e))
    }

    fn read_old_groups(&self) -> Result<Vec<Group>, String> {
        let path = self.app_support.join("groups.json");

        if !path.exists() {
            return Ok(get_default_groups());
        }

        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read old groups: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse old groups: {}", e))
    }

    fn read_old_sync_state(&self) -> Result<OldSyncState, String> {
        let path = self.app_support.join("sync-state.json");

        if !path.exists() {
            return Ok(OldSyncState::default());
        }

        let content = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read old sync state: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse old sync state: {}", e))
    }

    fn build_new_config(&self, old: &OldConfig) -> Result<AppConfig, String> {
        Ok(AppConfig {
            version: "2.0.0".to_string(),
            created_at: old.created_at.clone(),
            updated_at: old.updated_at.clone(),
            updated_by: old.updated_by.clone().unwrap_or_default(),
            settings: Settings {
                theme: old.settings.theme.clone(),
                language: old.settings.language.clone(),
                auto_update_check: old.settings.auto_update_check,
                auto_refresh_interval: old.settings.auto_refresh_interval,
                default_import_category: old.settings.default_import_category.clone(),
            },
            sync_enabled: old.sync.enabled,
            ide_configs: old.ide_configs.clone(),
            active_ide_id: old.active_ide_id.clone(),
        })
    }

    fn build_new_library(
        &self,
        old_metadata: &OldSkillMetadata,
        old_groups: &[Group],
    ) -> Result<LibraryData, String> {
        let mut skills = HashMap::new();

        for (folder_name, entry) in old_metadata {
            skills.insert(folder_name.clone(), SkillEntry {
                id: entry.id.clone(),
                folder_name: entry.folder_name.clone(),
                group_id: entry.group_id.clone(),
                category_id: entry.category_id.clone(),
                imported_at: entry.imported_at.clone(),
                updated_at: None,
            });
        }

        Ok(LibraryData {
            version: 1,
            updated_at: chrono::Utc::now().to_rfc3339(),
            updated_by: String::new(),
            groups: old_groups.to_vec(),
            skills,
            deleted_skills: HashMap::new(),
        })
    }

    fn build_new_sync_state(&self, old: &OldSyncState) -> Result<SyncState, String> {
        Ok(SyncState {
            version: 1,
            last_sync_time: old.last_sync_time.clone(),
            last_sync_by: old.last_sync_by.clone(),
            pending_changes: vec![],
            conflict_log: vec![],
        })
    }

    fn validate_new_data(&self, config: &AppConfig, library: &LibraryData) -> Result<(), String> {
        // Basic validation
        if config.version.is_empty() {
            return Err("Config version is empty".to_string());
        }

        if library.version == 0 {
            return Err("Library version is 0".to_string());
        }

        Ok(())
    }

    fn write_new_files(
        &self,
        config: &AppConfig,
        library: &LibraryData,
        sync_state: &SyncState,
    ) -> Result<(), String> {
        // Write config.json atomically
        let config_path = self.app_support.join("config.json");
        let config_content = serde_json::to_string_pretty(config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;
        self.write_file_atomic(&config_path, &config_content)?;

        // Write library.json atomically
        let library_path = self.app_support.join("library.json");
        let library_content = serde_json::to_string_pretty(library)
            .map_err(|e| format!("Failed to serialize library: {}", e))?;
        self.write_file_atomic(&library_path, &library_content)?;

        // Write sync.json atomically
        let sync_path = self.app_support.join("sync.json");
        let sync_content = serde_json::to_string_pretty(sync_state)
            .map_err(|e| format!("Failed to serialize sync state: {}", e))?;
        self.write_file_atomic(&sync_path, &sync_content)?;

        Ok(())
    }

    fn archive_old_files(&self, result: &mut MigrationResult) -> Result<(), String> {
        let files_to_archive = [
            "skill_metadata.json",
            "groups.json",
            "sync-state.json",
        ];

        for file in &files_to_archive {
            let src = self.app_support.join(file);
            if src.exists() {
                let dst = self.app_support.join(format!("{}.legacy", file));
                fs::rename(&src, &dst)
                    .map_err(|e| format!("Failed to archive {}: {}", file, e))?;
                result.archived_files.push(file.to_string());
            }
        }

        Ok(())
    }

    /// Atomic write: write to .tmp, fsync, rename
    fn write_file_atomic(&self, path: &PathBuf, content: &str) -> Result<(), String> {
        let tmp_path = path.with_extension("tmp");

        // 1. Write to temp file
        let mut file = fs::File::create(&tmp_path)
            .map_err(|e| format!("Failed to create temp file: {}", e))?;
        file.write_all(content.as_bytes())
            .map_err(|e| format!("Failed to write temp file: {}", e))?;

        // 2. fsync to ensure data is on disk
        file.sync_all()
            .map_err(|e| format!("Failed to fsync: {}", e))?;

        // 3. Atomic rename
        fs::rename(&tmp_path, path)
            .map_err(|e| format!("Failed to rename file: {}", e))?;

        Ok(())
    }

    fn record_migration_completion(&self) -> Result<(), String> {
        let completion_file = self.backup_dir.join("migration_completed_at");
        let timestamp = chrono::Utc::now().to_rfc3339();
        self.write_file_atomic(&completion_file, &timestamp)?;

        Ok(())
    }

    /// Rollback migration (restore from backup)
    pub fn rollback(&self) -> Result<(), String> {
        if !self.backup_dir.exists() {
            return Err("No backup directory found".to_string());
        }

        // Restore backed up files
        for entry in fs::read_dir(&self.backup_dir)
            .map_err(|e| format!("Failed to read backup dir: {}", e))?
        {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let file_name = entry.file_name().to_string_lossy().to_string();

            if file_name == "migration_completed_at" {
                continue;
            }

            let src = entry.path();
            let dst = self.app_support.join(&file_name);

            // Remove new file if exists
            if dst.exists() {
                fs::remove_file(&dst)
                    .map_err(|e| format!("Failed to remove new file: {}", e))?;
            }

            // Restore from backup
            fs::copy(&src, &dst)
                .map_err(|e| format!("Failed to restore {}: {}", file_name, e))?;
        }

        // Remove .legacy files
        for entry in fs::read_dir(&self.app_support)
            .map_err(|e| format!("Failed to read app support dir: {}", e))?
        {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let file_name = entry.file_name().to_string_lossy().to_string();

            if file_name.ends_with(".legacy") {
                fs::remove_file(entry.path())
                    .map_err(|e| format!("Failed to remove legacy file: {}", e))?;
            }
        }

        // Remove new format files
        let new_files = ["library.json", "sync.json"];
        for file in &new_files {
            let path = self.app_support.join(file);
            if path.exists() {
                fs::remove_file(&path)
                    .map_err(|e| format!("Failed to remove {}: {}", file, e))?;
            }
        }

        Ok(())
    }
}

impl Default for MigrationService {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Migration Result
// ============================================================================

#[derive(Debug, Clone, Default)]
pub struct MigrationResult {
    pub success: bool,
    pub backed_up_files: Vec<String>,
    pub archived_files: Vec<String>,
}

// ============================================================================
// Old Format Types (for deserialization)
// ============================================================================

use std::collections::HashMap;

#[derive(Debug, Clone, serde::Deserialize, Default)]
struct OldConfig {
    #[serde(default)]
    version: String,
    #[serde(default)]
    created_at: String,
    #[serde(default)]
    updated_at: String,
    #[serde(default)]
    updated_by: Option<String>,
    #[serde(default)]
    settings: OldSettings,
    #[serde(default)]
    sync: OldSyncSettings,
    #[serde(default)]
    ide_configs: Vec<IDEConfig>,
    #[serde(default)]
    active_ide_id: String,
}

#[derive(Debug, Clone, serde::Deserialize, Default)]
struct OldSettings {
    #[serde(default = "default_theme")]
    theme: String,
    #[serde(default = "default_language")]
    language: String,
    #[serde(default = "default_true")]
    auto_update_check: bool,
    #[serde(default = "default_refresh_interval")]
    auto_refresh_interval: u32,
    #[serde(default)]
    default_import_category: Option<String>,
}

fn default_theme() -> String { "system".to_string() }
fn default_language() -> String { "auto".to_string() }
fn default_true() -> bool { true }
fn default_refresh_interval() -> u32 { 5 }

#[derive(Debug, Clone, serde::Deserialize, Default)]
struct OldSyncSettings {
    #[serde(default = "default_true")]
    enabled: bool,
    #[serde(default)]
    interval_minutes: u32,
    #[serde(default)]
    last_sync_time: Option<String>,
}

type OldSkillMetadata = HashMap<String, OldMetadataEntry>;

#[derive(Debug, Clone, serde::Deserialize)]
struct OldMetadataEntry {
    #[serde(default)]
    id: String,
    #[serde(default)]
    folder_name: String,
    #[serde(default)]
    group_id: Option<String>,
    #[serde(default)]
    category_id: Option<String>,
    #[serde(default)]
    imported_at: String,
}

#[derive(Debug, Clone, serde::Deserialize, Default)]
struct OldSyncState {
    #[serde(default)]
    last_sync_time: Option<String>,
    #[serde(default)]
    last_sync_by: Option<String>,
}
