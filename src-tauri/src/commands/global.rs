use super::library::{IpcResult, parse_skill_md, count_files, has_resources, count_skill_md_stats, copy_dir_all, is_symlink_dir, get_library_path, load_skill_metadata, save_skill_metadata, SkillMetadataEntry, generate_id};
use std::fs;
use std::path::PathBuf;

/// Get the global skills directory path (~/.claude/skills/)
pub fn get_global_skills_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    PathBuf::from(&home)
        .join(".claude")
        .join("skills")
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

    let mut skills = Vec::new();

    if let Ok(entries) = fs::read_dir(&global_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    let folder_name = path.file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();

                    let metadata = parse_skill_md(&skill_md);
                    let (size, file_count) = count_files(&path);
                    let (skill_md_lines, skill_md_chars) = count_skill_md_stats(&skill_md);
                    let is_symlink = is_symlink_dir(&path);

                    // Get folder modification time as installed_at
                    let installed_at = fs::metadata(&path)
                        .ok()
                        .and_then(|m| m.modified().ok())
                        .map(|t| {
                            let datetime: chrono::DateTime<chrono::Utc> = t.into();
                            datetime.to_rfc3339()
                        });

                    let skill = GlobalSkill {
                        id: folder_name.clone(),
                        name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| folder_name.clone()),
                        folder_name: folder_name.clone(),
                        version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                        description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                        path: path.to_string_lossy().to_string(),
                        skill_md_path: skill_md.to_string_lossy().to_string(),
                        skill_md_content: None,
                        skill_md_lines,
                        skill_md_chars,
                        installed_at,
                        size,
                        file_count,
                        has_resources: has_resources(&path),
                        source_library_skill_id: None, // TODO: Track deployment source
                        is_symlink,
                    };
                    skills.push(skill);
                }
            }
        }
    }

    IpcResult::success(skills)
}

#[tauri::command]
pub fn global_get(id: String) -> IpcResult<GlobalSkill> {
    let global_path = get_global_skills_path();

    if let Ok(entries) = fs::read_dir(&global_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    let folder_name = path.file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();

                    // Match by folder name or path containing id
                    let is_match = folder_name == id || path.to_string_lossy().contains(&id);

                    if is_match {
                        let metadata = parse_skill_md(&skill_md);
                        let (size, file_count) = count_files(&path);
                        let skill_md_content = fs::read_to_string(&skill_md).ok();
                        let (skill_md_lines, skill_md_chars) = count_skill_md_stats(&skill_md);
                        let is_symlink = is_symlink_dir(&path);

                        // Get folder modification time as installed_at
                        let installed_at = fs::metadata(&path)
                            .ok()
                            .and_then(|m| m.modified().ok())
                            .map(|t| {
                                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                                datetime.to_rfc3339()
                            });

                        let skill = GlobalSkill {
                            id: id.clone(),
                            name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| folder_name.clone()),
                            folder_name: folder_name.clone(),
                            version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                            description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                            path: path.to_string_lossy().to_string(),
                            skill_md_path: skill_md.to_string_lossy().to_string(),
                            skill_md_content,
                            skill_md_lines,
                            skill_md_chars,
                            installed_at,
                            size,
                            file_count,
                            has_resources: has_resources(&path),
                            source_library_skill_id: None,
                            is_symlink,
                        };
                        return IpcResult::success(skill);
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
                    if let Err(e) = fs::remove_dir_all(&path) {
                        return IpcResult::error("E104", &format!("Failed to delete skill: {}", e));
                    }
                    return IpcResult::success(());
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
