use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use super::library::{IpcResult, Group};
use super::config::{OpenSkillsManagerConfig, Settings, Project, SyncSettings, get_default_ide_configs};
use super::AppError;
use crate::paths;

// ============================================================================
// Migration Status Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationStatus {
    pub needs_migration: bool,
    pub legacy_data_found: bool,
    pub legacy_groups_found: bool,
    pub legacy_skill_metadata_found: bool,
    pub legacy_projects_found: bool,
    pub legacy_library_found: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationResult {
    pub success: bool,
    pub groups_migrated: u32,
    pub skills_migrated: u32,
    pub projects_migrated: u32,
    pub errors: Vec<String>,
}

// ============================================================================
// Legacy Data Types (for parsing old files)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacySkillMetadataEntry {
    id: String,
    folder_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    group_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    category_id: Option<String>,
    imported_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyProject {
    id: String,
    name: String,
    path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    skills_path: Option<String>,
    exists: bool,
    skill_count: u32,
    added_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    last_accessed: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    last_scanned_at: Option<String>,
}

// ============================================================================
// Migration Commands
// ============================================================================

#[tauri::command]
pub fn migration_check() -> IpcResult<MigrationStatus> {
    // Check if new config already exists
    if paths::config_exists() {
        return IpcResult::success(MigrationStatus {
            needs_migration: false,
            legacy_data_found: false,
            legacy_groups_found: false,
            legacy_skill_metadata_found: false,
            legacy_projects_found: false,
            legacy_library_found: false,
        });
    }

    let legacy_groups_path = paths::get_legacy_groups_path();
    let legacy_skill_metadata_path = paths::get_legacy_skill_metadata_path();
    let legacy_projects_path = paths::get_legacy_projects_path();
    let legacy_library_path = paths::get_legacy_library_path();

    let legacy_groups_found = legacy_groups_path.exists();
    let legacy_skill_metadata_found = legacy_skill_metadata_path.exists();
    let legacy_projects_found = legacy_projects_path.exists();
    let legacy_library_found = legacy_library_path.exists();

    let legacy_data_found = legacy_groups_found
        || legacy_skill_metadata_found
        || legacy_projects_found
        || legacy_library_found;

    IpcResult::success(MigrationStatus {
        needs_migration: legacy_data_found,
        legacy_data_found,
        legacy_groups_found,
        legacy_skill_metadata_found,
        legacy_projects_found,
        legacy_library_found,
    })
}

#[tauri::command]
pub fn migration_execute() -> IpcResult<MigrationResult> {
    let mut result = MigrationResult {
        success: true,
        groups_migrated: 0,
        skills_migrated: 0,
        projects_migrated: 0,
        errors: Vec::new(),
    };

    // Ensure new directory structure exists
    if let Err(e) = paths::ensure_app_support_path() {
        result.errors.push(format!("Failed to create app support directory: {}", e));
        result.success = false;
        return IpcResult::success(result);
    }

    if let Err(e) = paths::ensure_icloud_structure() {
        result.errors.push(format!("Failed to create iCloud structure: {}", e));
        result.success = false;
        return IpcResult::success(result);
    }

    // Load legacy data
    let groups = match load_legacy_groups() {
        Ok(g) => {
            result.groups_migrated = g.len() as u32;
            g
        }
        Err(e) => {
            result.errors.push(format!("Failed to load legacy groups: {}", e));
            Vec::new()
        }
    };

    let skill_metadata: std::collections::HashMap<String, LegacySkillMetadataEntry> =
        match load_legacy_skill_metadata() {
            Ok(m) => {
                result.skills_migrated = m.len() as u32;
                m
            }
            Err(e) => {
                result.errors.push(format!("Failed to load legacy skill metadata: {}", e));
                std::collections::HashMap::new()
            }
        };

    let projects = match load_legacy_projects() {
        Ok(p) => {
            result.projects_migrated = p.len() as u32;
            p
        }
        Err(e) => {
            result.errors.push(format!("Failed to load legacy projects: {}", e));
            Vec::new()
        }
    };

    // Convert skill metadata to new format
    let skill_organization = skill_metadata.into_iter()
        .map(|(_, entry)| {
            (entry.folder_name, super::config::SkillOrgEntry {
                group_id: entry.group_id,
                category_id: entry.category_id,
                imported_at: entry.imported_at,
            })
        })
        .collect();

    // Create new unified config
    let now = chrono::Utc::now().to_rfc3339();
    let mut ide_configs = get_default_ide_configs();

    // Add legacy projects to Claude Code IDE config (first one)
    if !projects.is_empty() && !ide_configs.is_empty() {
        ide_configs[0].projects = projects;
    }

    let config = OpenSkillsManagerConfig {
        version: super::config::CONFIG_VERSION.to_string(),
        created_at: now.clone(),
        updated_at: now,
        updated_by: None,
        settings: Settings::default(),
        groups,
        ide_configs,
        active_ide_id: "claude-code".to_string(),
        sync: SyncSettings::default(),
        skill_organization,
    };

    // Save new config
    let config_path = paths::get_config_path();
    match serde_json::to_string_pretty(&config) {
        Ok(content) => {
            if let Err(e) = fs::write(&config_path, content) {
                result.errors.push(format!("Failed to write new config: {}", e));
                result.success = false;
            }
        }
        Err(e) => {
            result.errors.push(format!("Failed to serialize config: {}", e));
            result.success = false;
        }
    }

    // Migrate library skills (copy from old iCloud path to new)
    let legacy_library_path = paths::get_legacy_library_path();
    let new_library_path = paths::get_library_path();

    if legacy_library_path.exists() {
        if let Err(e) = migrate_library(&legacy_library_path, &new_library_path) {
            result.errors.push(format!("Failed to migrate library: {}", e));
        }
    }

    // Create backup of legacy data
    if let Err(e) = create_legacy_backup() {
        result.errors.push(format!("Failed to create backup: {}", e));
    }

    IpcResult::success(result)
}

#[tauri::command]
pub fn migration_skip() -> IpcResult<()> {
    // Create an empty default config to mark that migration was skipped
    let config = OpenSkillsManagerConfig::default();

    let config_path = paths::get_config_path();
    match serde_json::to_string_pretty(&config) {
        Ok(content) => {
            if let Err(e) = fs::write(&config_path, content) {
                return IpcResult::error(
                    AppError::E102WriteFailed(e.to_string()).code(),
                    &e.to_string(),
                );
            }
        }
        Err(e) => {
            return IpcResult::error(
                AppError::E102WriteFailed(e.to_string()).code(),
                &e.to_string(),
            );
        }
    }

    IpcResult::success(())
}

// ============================================================================
// Internal Migration Functions
// ============================================================================

fn load_legacy_groups() -> Result<Vec<Group>, String> {
    let path = paths::get_legacy_groups_path();
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read groups.json: {}", e))?;

    let groups: Vec<Group> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse groups.json: {}", e))?;

    Ok(groups)
}

fn load_legacy_skill_metadata() -> Result<std::collections::HashMap<String, LegacySkillMetadataEntry>, String> {
    let path = paths::get_legacy_skill_metadata_path();
    if !path.exists() {
        return Ok(std::collections::HashMap::new());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read skill_metadata.json: {}", e))?;

    let metadata: std::collections::HashMap<String, LegacySkillMetadataEntry> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse skill_metadata.json: {}", e))?;

    Ok(metadata)
}

fn load_legacy_projects() -> Result<Vec<Project>, String> {
    let path = paths::get_legacy_projects_path();
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read projects.json: {}", e))?;

    let projects: Vec<LegacyProject> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse projects.json: {}", e))?;

    // Convert to new Project type
    let new_projects: Vec<Project> = projects.into_iter().map(|p| Project {
        id: p.id,
        name: p.name,
        path: p.path,
        skills_path: p.skills_path,
        exists: p.exists,
        skill_count: p.skill_count,
        added_at: p.added_at,
        last_accessed: p.last_accessed,
        last_scanned_at: p.last_scanned_at,
    }).collect();

    Ok(new_projects)
}

fn migrate_library(from: &PathBuf, to: &PathBuf) -> Result<(), String> {
    if !from.exists() {
        return Ok(());
    }

    // Ensure destination exists
    fs::create_dir_all(to)
        .map_err(|e| format!("Failed to create library directory: {}", e))?;

    // Copy all skill folders
    if let Ok(entries) = fs::read_dir(from) {
        for entry in entries.flatten() {
            let src_path = entry.path();
            if src_path.is_dir() {
                let dest_path = to.join(entry.file_name());
                copy_dir_all(&src_path, &dest_path)?;
            }
        }
    }

    Ok(())
}

fn copy_dir_all(src: &PathBuf, dst: &PathBuf) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("Failed to create directory: {}", e))?;

    if let Ok(entries) = fs::read_dir(src) {
        for entry in entries.flatten() {
            let src_path = entry.path();
            let dst_path = dst.join(entry.file_name());

            if src_path.is_symlink() {
                // Handle symlinks
                if let Ok(target) = fs::read_link(&src_path) {
                    #[cfg(unix)]
                    {
                        std::os::unix::fs::symlink(&target, &dst_path)
                            .map_err(|e| format!("Failed to create symlink: {}", e))?;
                    }
                    #[cfg(not(unix))]
                    {
                        // Fallback: copy the target instead
                        if target.is_dir() {
                            copy_dir_all(&target, &dst_path)?;
                        } else {
                            fs::copy(&target, &dst_path)
                                .map_err(|e| format!("Failed to copy file: {}", e))?;
                        }
                    }
                }
            } else if src_path.is_dir() {
                copy_dir_all(&src_path, &dst_path)?;
            } else {
                fs::copy(&src_path, &dst_path)
                    .map_err(|e| format!("Failed to copy file: {}", e))?;
            }
        }
    }

    Ok(())
}

fn create_legacy_backup() -> Result<(), String> {
    let legacy_path = paths::get_legacy_app_support_path();
    if !legacy_path.exists() {
        return Ok(());
    }

    let backup_path = legacy_path.with_extension("backup");
    if backup_path.exists() {
        // Remove old backup
        fs::remove_dir_all(&backup_path)
            .map_err(|e| format!("Failed to remove old backup: {}", e))?;
    }

    // Rename legacy folder to backup
    fs::rename(&legacy_path, &backup_path)
        .map_err(|e| format!("Failed to create backup: {}", e))?;

    Ok(())
}
