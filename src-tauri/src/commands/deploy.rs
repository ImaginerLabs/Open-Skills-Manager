use super::library::{IpcResult, get_library_path, load_skill_metadata};
use super::global::get_global_skills_path;
use super::config::load_config;
use crate::utils::fs::copy_dir_all;
use std::fs;
use std::path::PathBuf;

/// Deployment record
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Deployment {
    pub id: String,
    pub skill_id: String,
    pub target_scope: String,
    pub target_path: String,
    pub project_name: Option<String>,
    pub deployed_at: String,
}

fn generate_deployment_id() -> String {
    format!("deploy-{}", uuid::Uuid::new_v4())
}

/// Get global skills path for a specific IDE
fn get_global_skills_path_for_ide(ide_id: &str) -> PathBuf {
    match load_config() {
        Ok(config) => {
            if let Some(ide) = config.ide_configs.iter().find(|ide| ide.id == ide_id) {
                return crate::paths::get_global_scope_path(&ide.global_scope_path);
            }
        }
        Err(_) => {}
    }
    // Fallback to default
    get_global_skills_path()
}

/// Get project scope name for a specific IDE
fn get_project_scope_name_for_ide(ide_id: &str) -> String {
    match load_config() {
        Ok(config) => {
            if let Some(ide) = config.ide_configs.iter().find(|ide| ide.id == ide_id) {
                return ide.project_scope_name.clone();
            }
        }
        Err(_) => {}
    }
    ".claude".to_string()
}

/// Deploy a skill from the library to global scope (~/.claude/skills/)
#[tauri::command]
pub fn deploy_to_global(skill_id: String) -> IpcResult<Deployment> {
    let library_path = get_library_path();
    let global_path = get_global_skills_path();
    let persisted_metadata = load_skill_metadata();

    // Find the skill folder by ID
    let folder_name_from_id = persisted_metadata.iter()
        .find(|(_, entry)| entry.id == skill_id)
        .map(|(_, entry)| entry.folder_name.clone());

    let mut skill_folder: Option<PathBuf> = None;
    let mut folder_name = String::new();

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                if folder_name_from_id.as_ref() == Some(&name) || name == skill_id {
                    skill_folder = Some(path);
                    folder_name = name;
                    break;
                }
            }
        }
    }

    let source_path = match skill_folder {
        Some(p) => p,
        None => return IpcResult::error("E203", &format!("Skill not found in library: {}", skill_id)),
    };

    // Ensure global skills directory exists
    if let Err(e) = fs::create_dir_all(&global_path) {
        return IpcResult::error("E101", &format!("Failed to create global skills directory: {}", e));
    }

    // Check if skill already exists in global
    let dest_path = global_path.join(&folder_name);
    if dest_path.exists() {
        // For now, we'll overwrite. In the future, this should trigger a conflict dialog
        if let Err(e) = fs::remove_dir_all(&dest_path) {
            return IpcResult::error("E104", &format!("Failed to remove existing skill: {}", e));
        }
    }

    // Copy the skill folder to global
    if let Err(e) = copy_dir_all(&source_path, &dest_path) {
        return IpcResult::error("E105", &format!("Failed to copy skill to global: {}", e));
    }

    let deployment = Deployment {
        id: generate_deployment_id(),
        skill_id: skill_id.clone(),
        target_scope: "global".to_string(),
        target_path: dest_path.to_string_lossy().to_string(),
        project_name: None,
        deployed_at: chrono::Utc::now().to_rfc3339(),
    };

    IpcResult::success(deployment)
}

/// Deploy a skill from the library to a project
#[tauri::command]
pub fn deploy_to_project(skill_id: String, project_id: String) -> IpcResult<Deployment> {
    // For now, project_id is expected to be the project path
    // In the future, this should look up the path from project store
    let project_path = project_id;

    let library_path = get_library_path();
    let persisted_metadata = load_skill_metadata();

    // Find the skill folder by ID
    let folder_name_from_id = persisted_metadata.iter()
        .find(|(_, entry)| entry.id == skill_id)
        .map(|(_, entry)| entry.folder_name.clone());

    let mut skill_folder: Option<PathBuf> = None;
    let mut folder_name = String::new();

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                if folder_name_from_id.as_ref() == Some(&name) || name == skill_id {
                    skill_folder = Some(path);
                    folder_name = name;
                    break;
                }
            }
        }
    }

    let source_path = match skill_folder {
        Some(p) => p,
        None => return IpcResult::error("E203", &format!("Skill not found in library: {}", skill_id)),
    };

    // Construct project skills path
    let project_skills_path = PathBuf::from(&project_path).join(".claude").join("skills");

    // Ensure project skills directory exists
    if let Err(e) = fs::create_dir_all(&project_skills_path) {
        return IpcResult::error("E101", &format!("Failed to create project skills directory: {}", e));
    }

    // Check if skill already exists in project
    let dest_path = project_skills_path.join(&folder_name);
    if dest_path.exists() {
        // For now, we'll overwrite. In the future, this should trigger a conflict dialog
        if let Err(e) = fs::remove_dir_all(&dest_path) {
            return IpcResult::error("E104", &format!("Failed to remove existing skill: {}", e));
        }
    }

    // Copy the skill folder to project
    if let Err(e) = copy_dir_all(&source_path, &dest_path) {
        return IpcResult::error("E105", &format!("Failed to copy skill to project: {}", e));
    }

    // Get project name from path
    let project_name = PathBuf::from(&project_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string());

    let deployment = Deployment {
        id: generate_deployment_id(),
        skill_id: skill_id.clone(),
        target_scope: "project".to_string(),
        target_path: dest_path.to_string_lossy().to_string(),
        project_name,
        deployed_at: chrono::Utc::now().to_rfc3339(),
    };

    IpcResult::success(deployment)
}

/// Deploy a skill from global to a project
#[tauri::command]
pub fn deploy_from_global(skill_id: String, project_id: String) -> IpcResult<Deployment> {
    // For now, project_id is expected to be the project path
    let project_path = project_id;

    let global_path = get_global_skills_path();
    let source_path = global_path.join(&skill_id);

    if !source_path.exists() {
        return IpcResult::error("E203", &format!("Skill not found in global: {}", skill_id));
    }

    // Construct project skills path
    let project_skills_path = PathBuf::from(&project_path).join(".claude").join("skills");

    // Ensure project skills directory exists
    if let Err(e) = fs::create_dir_all(&project_skills_path) {
        return IpcResult::error("E101", &format!("Failed to create project skills directory: {}", e));
    }

    // Check if skill already exists in project
    let dest_path = project_skills_path.join(&skill_id);
    if dest_path.exists() {
        // For now, we'll overwrite. In the future, this should trigger a conflict dialog
        if let Err(e) = fs::remove_dir_all(&dest_path) {
            return IpcResult::error("E104", &format!("Failed to remove existing skill: {}", e));
        }
    }

    // Copy the skill folder to project
    if let Err(e) = copy_dir_all(&source_path, &dest_path) {
        return IpcResult::error("E105", &format!("Failed to copy skill to project: {}", e));
    }

    // Get project name from path
    let project_name = PathBuf::from(&project_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string());

    let deployment = Deployment {
        id: generate_deployment_id(),
        skill_id: skill_id.clone(),
        target_scope: "project".to_string(),
        target_path: dest_path.to_string_lossy().to_string(),
        project_name,
        deployed_at: chrono::Utc::now().to_rfc3339(),
    };

    IpcResult::success(deployment)
}

/// Remove a deployment record (does not delete the deployed skill)
#[tauri::command]
pub fn deployment_remove(_skill_id: String, _deployment_id: String) -> IpcResult<()> {
    // TODO: Implement deployment record persistence and removal
    IpcResult::success(())
}

/// Validate all deployments and return list of invalid ones
#[tauri::command]
pub fn library_validate_deployments() -> IpcResult<Vec<String>> {
    // TODO: Implement deployment validation
    IpcResult::success(vec![])
}

// ============================================================================
// Cross-IDE Deployment Commands
// ============================================================================

/// Deploy a skill from the library to a specific IDE's global scope
#[tauri::command]
pub fn deploy_to_global_for_ide(skill_id: String, target_ide_id: String) -> IpcResult<Deployment> {
    let library_path = get_library_path();
    let global_path = get_global_skills_path_for_ide(&target_ide_id);
    let persisted_metadata = load_skill_metadata();

    // Find the skill folder by ID
    let folder_name_from_id = persisted_metadata.iter()
        .find(|(_, entry)| entry.id == skill_id)
        .map(|(_, entry)| entry.folder_name.clone());

    let mut skill_folder: Option<PathBuf> = None;
    let mut folder_name = String::new();

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                if folder_name_from_id.as_ref() == Some(&name) || name == skill_id {
                    skill_folder = Some(path);
                    folder_name = name;
                    break;
                }
            }
        }
    }

    let source_path = match skill_folder {
        Some(p) => p,
        None => return IpcResult::error("E203", &format!("Skill not found in library: {}", skill_id)),
    };

    // Ensure global skills directory exists
    if let Err(e) = fs::create_dir_all(&global_path) {
        return IpcResult::error("E101", &format!("Failed to create global skills directory: {}", e));
    }

    // Check if skill already exists in global
    let dest_path = global_path.join(&folder_name);
    if dest_path.exists() {
        // For now, we'll overwrite. In the future, this should trigger a conflict dialog
        if let Err(e) = fs::remove_dir_all(&dest_path) {
            return IpcResult::error("E104", &format!("Failed to remove existing skill: {}", e));
        }
    }

    // Copy the skill folder to global
    if let Err(e) = copy_dir_all(&source_path, &dest_path) {
        return IpcResult::error("E105", &format!("Failed to copy skill to global: {}", e));
    }

    let deployment = Deployment {
        id: generate_deployment_id(),
        skill_id: skill_id.clone(),
        target_scope: format!("global:{}", target_ide_id),
        target_path: dest_path.to_string_lossy().to_string(),
        project_name: None,
        deployed_at: chrono::Utc::now().to_rfc3339(),
    };

    IpcResult::success(deployment)
}

/// Deploy a skill from the library to a project in a specific IDE
#[tauri::command]
pub fn deploy_to_project_for_ide(skill_id: String, project_id: String, target_ide_id: String) -> IpcResult<Deployment> {
    // project_id is expected to be the project path
    let project_path = project_id;
    let project_scope_name = get_project_scope_name_for_ide(&target_ide_id);

    let library_path = get_library_path();
    let persisted_metadata = load_skill_metadata();

    // Find the skill folder by ID
    let folder_name_from_id = persisted_metadata.iter()
        .find(|(_, entry)| entry.id == skill_id)
        .map(|(_, entry)| entry.folder_name.clone());

    let mut skill_folder: Option<PathBuf> = None;
    let mut folder_name = String::new();

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                if folder_name_from_id.as_ref() == Some(&name) || name == skill_id {
                    skill_folder = Some(path);
                    folder_name = name;
                    break;
                }
            }
        }
    }

    let source_path = match skill_folder {
        Some(p) => p,
        None => return IpcResult::error("E203", &format!("Skill not found in library: {}", skill_id)),
    };

    // Construct project skills path using the target IDE's scope name
    let project_skills_path = PathBuf::from(&project_path).join(&project_scope_name).join("skills");

    // Ensure project skills directory exists
    if let Err(e) = fs::create_dir_all(&project_skills_path) {
        return IpcResult::error("E101", &format!("Failed to create project skills directory: {}", e));
    }

    // Check if skill already exists in project
    let dest_path = project_skills_path.join(&folder_name);
    if dest_path.exists() {
        // For now, we'll overwrite. In the future, this should trigger a conflict dialog
        if let Err(e) = fs::remove_dir_all(&dest_path) {
            return IpcResult::error("E104", &format!("Failed to remove existing skill: {}", e));
        }
    }

    // Copy the skill folder to project
    if let Err(e) = copy_dir_all(&source_path, &dest_path) {
        return IpcResult::error("E105", &format!("Failed to copy skill to project: {}", e));
    }

    // Get project name from path
    let project_name = PathBuf::from(&project_path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string());

    let deployment = Deployment {
        id: generate_deployment_id(),
        skill_id: skill_id.clone(),
        target_scope: format!("project:{}", target_ide_id),
        target_path: dest_path.to_string_lossy().to_string(),
        project_name,
        deployed_at: chrono::Utc::now().to_rfc3339(),
    };

    IpcResult::success(deployment)
}
