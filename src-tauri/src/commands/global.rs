use super::library::{IpcResult, get_library_path, load_skill_metadata, save_skill_metadata, SkillMetadataEntry, generate_id};
use crate::storage::service::get_storage;
use crate::services::skill::{SkillService, ScanOptions};
use crate::utils::fs::copy_dir_all;
use std::fs;
use std::path::PathBuf;
use crate::paths;

/// Get the global skills directory path for the active IDE
pub fn get_global_skills_path() -> PathBuf {
    // Try to get from new storage layer
    let storage = get_storage();
    if let Ok(config) = storage.read_config() {
        if let Some(ide) = config.ide_configs.iter().find(|ide| ide.id == config.active_ide_id) {
            return paths::get_global_scope_path(&ide.global_scope_path);
        }
    }

    // Fallback to Claude Code default
    paths::get_global_scope_path("~/.claude/skills")
}

/// Global skill representation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalSkill {
    pub id: String,
    pub name: String,
    pub folder_name: String,
    pub version: String,
    pub description: String,
    pub path: String,
    pub skill_md_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skill_md_content: Option<String>,
    pub skill_md_lines: u32,
    pub skill_md_chars: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub installed_at: Option<String>,
    pub size: u64,
    pub file_count: u32,
    pub has_resources: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_library_skill_id: Option<String>,
    pub is_symlink: bool,
}

#[tauri::command]
pub fn global_list() -> IpcResult<Vec<GlobalSkill>> {
    let global_path = get_global_skills_path();

    if !global_path.exists() {
        // Create directory if it doesn't exist
        if let Err(e) = fs::create_dir_all(&global_path) {
            return IpcResult::error("E101", &format!("Failed to create global skills directory: {}", e));
        }
        return IpcResult::success(vec![]);
    }

    let scanned = SkillService::scan_skills_dir(&global_path, ScanOptions::default());

    let skills = scanned.into_iter().map(|s| GlobalSkill {
        id: s.id,
        name: s.name,
        folder_name: s.folder_name,
        version: s.version,
        description: s.description,
        path: s.path,
        skill_md_path: s.skill_md_path,
        skill_md_content: None,
        skill_md_lines: s.skill_md_lines,
        skill_md_chars: s.skill_md_chars,
        installed_at: s.installed_at,
        size: s.size,
        file_count: s.file_count,
        has_resources: s.has_resources,
        source_library_skill_id: None,
        is_symlink: s.is_symlink,
    }).collect();

    IpcResult::success(skills)
}

#[tauri::command]
pub fn global_get(id: String) -> IpcResult<GlobalSkill> {
    let global_path = get_global_skills_path();

    if let Ok(entries) = fs::read_dir(&global_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let folder_name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                // Match by folder name or path containing id
                let is_match = folder_name == id || path.to_string_lossy().contains(&id);

                if is_match {
                    if let Some(scanned) = SkillService::scan_skill(&path, &ScanOptions::default()) {
                        let skill_md_path = PathBuf::from(&scanned.skill_md_path);
                        let skill_md_content = SkillService::read_skill_md_content(&skill_md_path);

                        return IpcResult::success(GlobalSkill {
                            id: id.clone(),
                            name: scanned.name,
                            folder_name: scanned.folder_name,
                            version: scanned.version,
                            description: scanned.description,
                            path: scanned.path,
                            skill_md_path: scanned.skill_md_path,
                            skill_md_content,
                            skill_md_lines: scanned.skill_md_lines,
                            skill_md_chars: scanned.skill_md_chars,
                            installed_at: scanned.installed_at,
                            size: scanned.size,
                            file_count: scanned.file_count,
                            has_resources: scanned.has_resources,
                            source_library_skill_id: None,
                            is_symlink: scanned.is_symlink,
                        });
                    }
                }
            }
        }
    }

    IpcResult::error("E203", &format!("Skill not found: {}", id))
}

#[tauri::command]
pub fn global_delete(id: String) -> IpcResult<()> {
    let global_path = get_global_skills_path();

    if let Ok(entries) = fs::read_dir(&global_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let folder_name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                // Match by folder name or path containing id
                let is_match = folder_name == id || path.to_string_lossy().contains(&id);

                if is_match {
                    match SkillService::delete_skill(&path) {
                        Ok(()) => return IpcResult::success(()),
                        Err(e) => return IpcResult::error("E104", &format!("Failed to delete skill: {}", e)),
                    }
                }
            }
        }
    }

    IpcResult::error("E203", &format!("Skill not found: {}", id))
}

#[tauri::command]
pub fn global_pull(id: String) -> IpcResult<()> {
    let global_path = get_global_skills_path();
    let library_path = get_library_path();

    // Find the skill in global
    let source_path = global_path.join(&id);
    if !source_path.exists() {
        // Try to find by folder name
        let mut found_path: Option<PathBuf> = None;
        if let Ok(entries) = fs::read_dir(&global_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let folder_name = path.file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();
                    if folder_name == id || path.to_string_lossy().contains(&id) {
                        found_path = Some(path);
                        break;
                    }
                }
            }
        }

        let source = match found_path {
            Some(p) => p,
            None => return IpcResult::error("E203", &format!("Skill not found in global: {}", id)),
        };

        let folder_name = source.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| id.clone());

        // Ensure library directory exists
        if let Err(e) = fs::create_dir_all(&library_path) {
            return IpcResult::error("E101", &format!("Failed to create library directory: {}", e));
        }

        let dest_path = library_path.join(&folder_name);

        // Remove existing if present
        if dest_path.exists() {
            if let Err(e) = fs::remove_dir_all(&dest_path) {
                return IpcResult::error("E104", &format!("Failed to remove existing skill: {}", e));
            }
        }

        // Copy to library (handles symlinks properly)
        if let Err(e) = copy_dir_all(&source, &dest_path) {
            return IpcResult::error("E105", &format!("Failed to copy skill to library: {}", e));
        }

        // Update skill metadata
        let skill_id = generate_id();
        let imported_at = chrono::Utc::now().to_rfc3339();
        let mut persisted_metadata = load_skill_metadata();
        persisted_metadata.insert(folder_name.clone(), SkillMetadataEntry {
            id: skill_id,
            folder_name,
            group_id: None,
            category_id: None,
            imported_at,
        });
        if let Err(e) = save_skill_metadata(&persisted_metadata) {
            eprintln!("Warning: Failed to save skill metadata after pull: {}", e);
        }

        return IpcResult::success(());
    }

    // Source exists directly
    let folder_name = source_path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| id.clone());

    // Ensure library directory exists
    if let Err(e) = fs::create_dir_all(&library_path) {
        return IpcResult::error("E101", &format!("Failed to create library directory: {}", e));
    }

    let dest_path = library_path.join(&folder_name);

    // Remove existing if present
    if dest_path.exists() {
        if let Err(e) = fs::remove_dir_all(&dest_path) {
            return IpcResult::error("E104", &format!("Failed to remove existing skill: {}", e));
        }
    }

    // Copy to library (handles symlinks properly)
    if let Err(e) = copy_dir_all(&source_path, &dest_path) {
        return IpcResult::error("E105", &format!("Failed to copy skill to library: {}", e));
    }

    // Update skill metadata
    let skill_id = generate_id();
    let imported_at = chrono::Utc::now().to_rfc3339();
    let mut persisted_metadata = load_skill_metadata();
    persisted_metadata.insert(folder_name.clone(), SkillMetadataEntry {
        id: skill_id,
        folder_name,
        group_id: None,
        category_id: None,
        imported_at,
    });
    if let Err(e) = save_skill_metadata(&persisted_metadata) {
        eprintln!("Warning: Failed to save skill metadata after pull: {}", e);
    }

    IpcResult::success(())
}
