use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

use super::library::{IpcResult, parse_skill_md, count_files, has_resources, count_skill_md_stats, is_symlink_dir};
use super::config::{IDEConfig, Project, load_config, update_config};
use super::AppError;
use crate::paths;

// ============================================================================
// IDE List Command
// ============================================================================

#[tauri::command]
pub fn ide_list() -> IpcResult<Vec<IDEConfig>> {
    match load_config() {
        Ok(config) => IpcResult::success(config.ide_configs),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn ide_get_active() -> IpcResult<IDEConfig> {
    match load_config() {
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
    match update_config(|config| {
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
    match load_config() {
        Ok(config) => {
            let target_ide_id = ide_id.unwrap_or(config.active_ide_id);
            let ide_config = config.ide_configs.iter()
                .find(|ide| ide.id == target_ide_id);

            if let Some(ide) = ide_config {
                let global_path = paths::get_global_scope_path(&ide.global_scope_path);

                if !global_path.exists() {
                    return IpcResult::success(vec![]);
                }

                let skills = scan_global_skills(&global_path);
                IpcResult::success(skills)
            } else {
                IpcResult::success(vec![])
            }
        }
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
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
                        let is_symlink = is_symlink_dir(&path);

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
pub fn ide_project_list(ide_id: Option<String>) -> IpcResult<Vec<Project>> {
    match load_config() {
        Ok(config) => {
            let target_ide_id = ide_id.unwrap_or(config.active_ide_id);
            let projects = config.ide_configs.iter()
                .find(|ide| ide.id == target_ide_id)
                .map(|ide| ide.projects.clone())
                .unwrap_or_default();
            IpcResult::success(projects)
        }
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn ide_project_add(ide_id: Option<String>, project_path: String) -> IpcResult<Project> {
    match load_config() {
        Ok(config) => {
            let target_ide_id = ide_id.unwrap_or(config.active_ide_id);

            // Find the IDE config to get project_scope_name
            let ide_config = config.ide_configs.iter()
                .find(|ide| ide.id == target_ide_id);

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

                let project = Project {
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

                // Update config
                match update_config(|cfg| {
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
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn ide_project_remove(ide_id: Option<String>, project_id: String) -> IpcResult<()> {
    match update_config(|config| {
        let target_ide_id = ide_id.unwrap_or(config.active_ide_id.clone());
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
pub fn ide_project_refresh(ide_id: Option<String>, project_id: String) -> IpcResult<Project> {
    match load_config() {
        Ok(config) => {
            let target_ide_id = ide_id.unwrap_or(config.active_ide_id);

            if let Some(ide) = config.ide_configs.iter().find(|ide| ide.id == target_ide_id) {
                if let Some(project) = ide.projects.iter().find(|p| p.id == project_id) {
                    let expanded_path = paths::expand_tilde(&project.path);
                    let exists = expanded_path.exists();

                    let skills_path = paths::get_project_scope_path(&expanded_path, &ide.project_scope_name);
                    let skill_count = if skills_path.exists() {
                        count_skills_in_path(&skills_path)
                    } else {
                        0
                    };

                    let updated_project = Project {
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

                    // Update config
                    match update_config(|cfg| {
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
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
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
    match load_config() {
        Ok(config) => {
            let target_ide_id = ide_id.unwrap_or(config.active_ide_id);

            if let Some(ide) = config.ide_configs.iter().find(|ide| ide.id == target_ide_id) {
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
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Get IDE Global Path
// ============================================================================

#[tauri::command]
pub fn ide_get_global_path(ide_id: Option<String>) -> IpcResult<String> {
    match load_config() {
        Ok(config) => {
            let target_ide_id = ide_id.unwrap_or(config.active_ide_id);

            if let Some(ide) = config.ide_configs.iter().find(|ide| ide.id == target_ide_id) {
                IpcResult::success(ide.global_scope_path.clone())
            } else {
                IpcResult::error(
                    AppError::E003NotFound("IDE not found".to_string()).code(),
                    "IDE not found",
                )
            }
        }
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}