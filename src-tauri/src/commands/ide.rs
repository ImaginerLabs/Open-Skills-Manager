use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use super::library::{IpcResult, parse_skill_md, count_skill_md_stats};
use super::AppError;
use crate::paths;
use crate::storage::service::get_storage;
use crate::utils::fs::{count_files, has_resources, is_symlink};

// ============================================================================
// Helper: Get active IDE ID from new storage layer
// ============================================================================

fn get_active_ide_id_from_storage() -> String {
    let storage = get_storage();
    match storage.read_config() {
        Ok(config) => config.active_ide_id,
        Err(_) => "claude-code".to_string(),
    }
}

fn get_ide_config_from_storage(ide_id: &str) -> Option<crate::storage::IDEConfig> {
    let storage = get_storage();
    match storage.read_config() {
        Ok(config) => config.ide_configs.iter().find(|ide| ide.id == ide_id).cloned(),
        Err(_) => None,
    }
}

// ============================================================================
// IDE List Command
// ============================================================================

#[tauri::command]
pub fn ide_list() -> IpcResult<Vec<crate::storage::IDEConfig>> {
    let storage = get_storage();
    match storage.read_config() {
        Ok(config) => IpcResult::success(config.ide_configs),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn ide_get_active() -> IpcResult<crate::storage::IDEConfig> {
    let storage = get_storage();
    match storage.read_config() {
        Ok(config) => {
            let active_ide = config.ide_configs.iter()
                .find(|ide| ide.id == config.active_ide_id)
                .cloned()
                .unwrap_or_else(|| config.ide_configs.first().cloned().unwrap_or_default());
            IpcResult::success(active_ide)
        }
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn ide_set_active(ide_id: String) -> IpcResult<()> {
    let storage = get_storage();
    match storage.write_config(|config| {
        if config.ide_configs.iter().any(|ide| ide.id == ide_id) {
            config.active_ide_id = ide_id;
        }
    }) {
        Ok(_) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Global Skills for IDE
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalSkill {
    pub id: String,
    pub name: String,
    pub folder_name: String,
    pub version: String,
    pub description: String,
    pub path: String,
    pub skill_md_path: String,
    pub skill_md_lines: u32,
    pub skill_md_chars: u32,
    pub size: u64,
    pub file_count: u32,
    pub has_resources: bool,
    pub is_symlink: bool,
}

#[tauri::command]
pub fn ide_global_list(ide_id: Option<String>) -> IpcResult<Vec<GlobalSkill>> {
    let target_ide_id = ide_id.unwrap_or_else(|| get_active_ide_id_from_storage());

    match get_ide_config_from_storage(&target_ide_id) {
        Some(ide) => {
            let global_path = paths::get_global_scope_path(&ide.global_scope_path);

            if !global_path.exists() {
                return IpcResult::success(vec![]);
            }

            let skills = scan_global_skills(&global_path);
            IpcResult::success(skills)
        }
        None => IpcResult::success(vec![]),
    }
}

fn scan_global_skills(global_path: &PathBuf) -> Vec<GlobalSkill> {
    let mut skills = Vec::new();

    if let Ok(entries) = fs::read_dir(global_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md_path = path.join("SKILL.md");

                if skill_md_path.exists() {
                    let folder_name = path.file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("")
                        .to_string();

                    if let Some(metadata) = parse_skill_md(&skill_md_path) {
                        let (lines, chars) = count_skill_md_stats(&skill_md_path);
                        let (size, file_count) = count_files(&path);
                        let is_symlink = is_symlink(&path);

                        skills.push(GlobalSkill {
                            id: format!("global-{}", uuid::Uuid::new_v4()),
                            name: metadata.name,
                            folder_name,
                            version: metadata.version,
                            description: metadata.description,
                            path: path.to_string_lossy().to_string(),
                            skill_md_path: skill_md_path.to_string_lossy().to_string(),
                            skill_md_lines: lines,
                            skill_md_chars: chars,
                            size,
                            file_count,
                            has_resources: has_resources(&path),
                            is_symlink,
                        });
                    }
                }
            }
        }
    }

    skills
}

// ============================================================================
// Projects for IDE
// ============================================================================

#[tauri::command]
pub fn ide_project_list(ide_id: Option<String>) -> IpcResult<Vec<crate::storage::Project>> {
    let target_ide_id = ide_id.unwrap_or_else(|| get_active_ide_id_from_storage());

    let projects = get_ide_config_from_storage(&target_ide_id)
        .map(|ide| ide.projects)
        .unwrap_or_default();

    IpcResult::success(projects)
}

#[tauri::command]
pub fn ide_project_add(ide_id: Option<String>, project_path: String) -> IpcResult<crate::storage::Project> {
    let target_ide_id = ide_id.unwrap_or_else(|| get_active_ide_id_from_storage());

    // Find the IDE config to get project_scope_name
    let ide_config = get_ide_config_from_storage(&target_ide_id);

    if let Some(ide) = ide_config {
        let expanded_path = paths::expand_tilde(&project_path);
        let project_name = expanded_path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Unknown")
            .to_string();

        // Check if project already exists
        if ide.projects.iter().any(|p| p.path == project_path) {
            return IpcResult::error(
                AppError::E002InvalidInput("Project already exists".to_string()).code(),
                "Project already exists",
            );
        }

        // Check if project directory exists
        let exists = expanded_path.exists();

        // Calculate skills path
        let skills_path = paths::get_project_scope_path(&expanded_path, &ide.project_scope_name);
        let skill_count = if skills_path.exists() {
            count_skills_in_path(&skills_path)
        } else {
            0
        };

        let project = crate::storage::Project {
            id: format!("project-{}", uuid::Uuid::new_v4()),
            name: project_name,
            path: project_path.clone(),
            skills_path: Some(skills_path.to_string_lossy().to_string()),
            exists,
            skill_count,
            added_at: chrono::Utc::now().to_rfc3339(),
            last_accessed: None,
            last_scanned_at: None,
        };

        // Update config via storage service
        let storage = get_storage();
        match storage.write_config(|cfg| {
            if let Some(target_ide) = cfg.ide_configs.iter_mut().find(|i| i.id == target_ide_id) {
                target_ide.projects.push(project.clone());
            }
        }) {
            Ok(_) => IpcResult::success(project),
            Err(e) => IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            ),
        }
    } else {
        IpcResult::error(
            AppError::E003NotFound("IDE not found".to_string()).code(),
            "IDE not found",
        )
    }
}

#[tauri::command]
pub fn ide_project_remove(ide_id: Option<String>, project_id: String) -> IpcResult<()> {
    let target_ide_id = ide_id.unwrap_or_else(|| get_active_ide_id_from_storage());

    let storage = get_storage();
    match storage.write_config(|config| {
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == target_ide_id) {
            ide.projects.retain(|p| p.id != project_id);
        }
    }) {
        Ok(_) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn ide_project_refresh(ide_id: Option<String>, project_id: String) -> IpcResult<crate::storage::Project> {
    let target_ide_id = ide_id.unwrap_or_else(|| get_active_ide_id_from_storage());

    let ide_config = get_ide_config_from_storage(&target_ide_id);

    if let Some(ide) = ide_config {
        if let Some(project) = ide.projects.iter().find(|p| p.id == project_id) {
            let expanded_path = paths::expand_tilde(&project.path);
            let exists = expanded_path.exists();

            let skills_path = paths::get_project_scope_path(&expanded_path, &ide.project_scope_name);
            let skill_count = if skills_path.exists() {
                count_skills_in_path(&skills_path)
            } else {
                0
            };

            let updated_project = crate::storage::Project {
                id: project.id.clone(),
                name: project.name.clone(),
                path: project.path.clone(),
                skills_path: Some(skills_path.to_string_lossy().to_string()),
                exists,
                skill_count,
                added_at: project.added_at.clone(),
                last_accessed: project.last_accessed.clone(),
                last_scanned_at: Some(chrono::Utc::now().to_rfc3339()),
            };

            // Update config via storage service
            let storage = get_storage();
            match storage.write_config(|cfg| {
                if let Some(target_ide) = cfg.ide_configs.iter_mut().find(|i| i.id == target_ide_id) {
                    if let Some(p) = target_ide.projects.iter_mut().find(|p| p.id == project_id) {
                        *p = updated_project.clone();
                    }
                }
            }) {
                Ok(_) => IpcResult::success(updated_project),
                Err(e) => IpcResult::error(
                    AppError::E102WriteFailed(e.clone()).code(),
                    &e,
                ),
            }
        } else {
            IpcResult::error(
                AppError::E003NotFound("Project not found".to_string()).code(),
                "Project not found",
            )
        }
    } else {
        IpcResult::error(
            AppError::E003NotFound("IDE not found".to_string()).code(),
            "IDE not found",
        )
    }
}

fn count_skills_in_path(path: &PathBuf) -> u32 {
    let mut count = 0u32;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let entry_path = entry.path();
            if entry_path.is_dir() && entry_path.join("SKILL.md").exists() {
                count += 1;
            }
        }
    }
    count
}

// ============================================================================
// Project Skills for IDE
// ============================================================================

#[tauri::command]
pub fn ide_project_skills(ide_id: Option<String>, project_id: String) -> IpcResult<Vec<GlobalSkill>> {
    let target_ide_id = ide_id.unwrap_or_else(|| get_active_ide_id_from_storage());

    let ide_config = get_ide_config_from_storage(&target_ide_id);

    if let Some(ide) = ide_config {
        if let Some(project) = ide.projects.iter().find(|p| p.id == project_id) {
            let expanded_path = paths::expand_tilde(&project.path);
            let skills_path = paths::get_project_scope_path(&expanded_path, &ide.project_scope_name);

            if !skills_path.exists() {
                return IpcResult::success(vec![]);
            }

            let skills = scan_global_skills(&skills_path);
            IpcResult::success(skills)
        } else {
            IpcResult::error(
                AppError::E003NotFound("Project not found".to_string()).code(),
                "Project not found",
            )
        }
    } else {
        IpcResult::error(
            AppError::E003NotFound("IDE not found".to_string()).code(),
            "IDE not found",
        )
    }
}

// ============================================================================
// Get IDE Global Path
// ============================================================================

#[tauri::command]
pub fn ide_get_global_path(ide_id: Option<String>) -> IpcResult<String> {
    let target_ide_id = ide_id.unwrap_or_else(|| get_active_ide_id_from_storage());

    match get_ide_config_from_storage(&target_ide_id) {
        Some(ide) => IpcResult::success(ide.global_scope_path.clone()),
        None => IpcResult::error(
            AppError::E003NotFound("IDE not found".to_string()).code(),
            "IDE not found",
        ),
    }
}