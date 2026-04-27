use super::library::{IpcResult, parse_skill_md, count_files, has_resources};
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub installed_at: Option<String>,
    pub size: u64,
    pub file_count: u32,
    pub has_resources: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_library_skill_id: Option<String>,
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
    let now = chrono::Utc::now().to_rfc3339();

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

                    let skill = GlobalSkill {
                        id: folder_name.clone(),
                        name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| folder_name.clone()),
                        folder_name: folder_name.clone(),
                        version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                        description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                        path: path.to_string_lossy().to_string(),
                        skill_md_path: skill_md.to_string_lossy().to_string(),
                        skill_md_content: None,
                        installed_at: Some(now.clone()),
                        size,
                        file_count,
                        has_resources: has_resources(&path),
                        source_library_skill_id: None, // TODO: Track deployment source
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

                        let skill = GlobalSkill {
                            id: id.clone(),
                            name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| folder_name.clone()),
                            folder_name: folder_name.clone(),
                            version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                            description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                            path: path.to_string_lossy().to_string(),
                            skill_md_path: skill_md.to_string_lossy().to_string(),
                            skill_md_content,
                            installed_at: Some(chrono::Utc::now().to_rfc3339()),
                            size,
                            file_count,
                            has_resources: has_resources(&path),
                            source_library_skill_id: None,
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
pub fn global_pull(_id: String) -> IpcResult<()> {
    // TODO: Implement pull to library
    // This would copy a skill from global to the library
    IpcResult::success(())
}
