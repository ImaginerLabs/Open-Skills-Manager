use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::io::Write;
use zip::ZipWriter;
use zip::write::FileOptions;

#[derive(Debug, Serialize, Deserialize)]
pub struct IpcResult<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<IpcError>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IpcError {
    pub code: String,
    pub message: String,
}

impl<T> IpcResult<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(code: &str, message: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(IpcError {
                code: code.to_string(),
                message: message.to_string(),
            }),
        }
    }
}

// ============================================================================
// Data Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LibrarySkill {
    pub id: String,
    pub name: String,
    pub folder_name: String,
    pub version: String,
    pub description: String,
    pub path: String,
    pub skill_md_path: String,
    pub category_id: Option<String>,
    pub group_id: Option<String>,
    pub imported_at: String,
    pub updated_at: Option<String>,
    pub size: u64,
    pub file_count: u32,
    pub has_resources: bool,
    pub deployments: Vec<Deployment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Deployment {
    pub id: String,
    pub skill_id: String,
    pub target_scope: String,
    pub target_path: String,
    pub project_name: Option<String>,
    pub deployed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub groups: Vec<Group>,
    pub skill_count: u32,
    pub is_custom: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Group {
    pub id: String,
    pub category_id: String,
    pub name: String,
    pub skill_count: u32,
    pub is_custom: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillMetadata {
    pub name: String,
    pub version: String,
    pub description: String,
}

// ============================================================================
// Helper Functions
// ============================================================================

fn get_library_path() -> PathBuf {
    // Default to iCloud container or local app support
    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    PathBuf::from(&home)
        .join("Library")
        .join("Mobile Documents")
        .join("com~apple~CloudDocs")
        .join("ClaudeCode")
        .join("Skills")
}

fn get_categories_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    PathBuf::from(&home)
        .join("Library")
        .join("Application Support")
        .join("claude-code-skills-manager")
        .join("categories.json")
}

fn parse_skill_md(path: &Path) -> Option<SkillMetadata> {
    let content = fs::read_to_string(path).ok()?;

    // Parse frontmatter
    if content.starts_with("---") {
        let end = content.find("\n---\n")?;
        let frontmatter = &content[4..end];

        let mut name = "Unknown".to_string();
        let mut version = "0.0.0".to_string();
        let mut description = "".to_string();

        for line in frontmatter.lines() {
            if let Some(value) = line.strip_prefix("name:") {
                name = value.trim().to_string();
            } else if let Some(value) = line.strip_prefix("version:") {
                version = value.trim().to_string();
            } else if let Some(value) = line.strip_prefix("description:") {
                description = value.trim().to_string();
            }
        }

        Some(SkillMetadata { name, version, description })
    } else {
        Some(SkillMetadata {
            name: path.parent()?.file_name()?.to_string_lossy().to_string(),
            version: "0.0.0".to_string(),
            description: "".to_string(),
        })
    }
}

fn count_files(dir: &Path) -> (u64, u32) {
    let mut total_size = 0u64;
    let mut file_count = 0u32;

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = fs::metadata(&path) {
                    total_size += metadata.len();
                    file_count += 1;
                }
            } else if path.is_dir() {
                let (sub_size, sub_count) = count_files(&path);
                total_size += sub_size;
                file_count += sub_count;
            }
        }
    }

    (total_size, file_count)
}

fn has_resources(dir: &Path) -> bool {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name_str = name.to_string_lossy();
            if name_str != "SKILL.md" && !name_str.starts_with('.') {
                return true;
            }
        }
    }
    false
}

fn generate_id() -> String {
    format!("skill-{}", uuid::Uuid::new_v4())
}

fn load_categories() -> Vec<Category> {
    let path = get_categories_path();
    if path.exists() {
        fs::read_to_string(path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_else(get_default_categories)
    } else {
        get_default_categories()
    }
}

fn save_categories(categories: &[Category]) -> Result<(), String> {
    let path = get_categories_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(categories).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

fn get_default_categories() -> Vec<Category> {
    vec![
        Category {
            id: "cat-development".to_string(),
            name: "Development".to_string(),
            icon: Some("code".to_string()),
            color: Some("#0A84FF".to_string()),
            groups: vec![
                Group {
                    id: "grp-dev-general".to_string(),
                    category_id: "cat-development".to_string(),
                    name: "General".to_string(),
                    skill_count: 0,
                    is_custom: false,
                    created_at: chrono::Utc::now().to_rfc3339(),
                },
            ],
            skill_count: 0,
            is_custom: false,
            created_at: chrono::Utc::now().to_rfc3339(),
        },
        Category {
            id: "cat-productivity".to_string(),
            name: "Productivity".to_string(),
            icon: Some("rocket".to_string()),
            color: Some("#30D158".to_string()),
            groups: vec![],
            skill_count: 0,
            is_custom: false,
            created_at: chrono::Utc::now().to_rfc3339(),
        },
    ]
}

// ============================================================================
// IPC Commands
// ============================================================================

#[tauri::command]
pub fn library_list() -> IpcResult<Vec<LibrarySkill>> {
    let library_path = get_library_path();

    if !library_path.exists() {
        // Create directory if it doesn't exist
        if let Err(e) = fs::create_dir_all(&library_path) {
            return IpcResult::error("CREATE_DIR_FAILED", &format!("Failed to create library directory: {}", e));
        }
        return IpcResult::success(vec![]);
    }

    let mut skills = Vec::new();

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    let metadata = parse_skill_md(&skill_md);
                    let (size, file_count) = count_files(&path);

                    let skill = LibrarySkill {
                        id: generate_id(),
                        name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| {
                            path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or("Unknown".to_string())
                        }),
                        folder_name: path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
                        version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                        description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                        path: path.to_string_lossy().to_string(),
                        skill_md_path: skill_md.to_string_lossy().to_string(),
                        category_id: None,
                        group_id: None,
                        imported_at: chrono::Utc::now().to_rfc3339(),
                        updated_at: None,
                        size,
                        file_count,
                        has_resources: has_resources(&path),
                        deployments: vec![],
                    };
                    skills.push(skill);
                }
            }
        }
    }

    IpcResult::success(skills)
}

#[tauri::command]
pub fn library_get(id: String) -> IpcResult<LibrarySkill> {
    // In a real implementation, we'd look up by ID in a database
    // For now, scan the library and find by folder name (simplified)
    let library_path = get_library_path();

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    // Simplified: match by folder name
                    let folder_name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                    if folder_name == id || path.to_string_lossy().contains(&id) {
                        let metadata = parse_skill_md(&skill_md);
                        let (size, file_count) = count_files(&path);

                        let skill = LibrarySkill {
                            id,
                            name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| folder_name.clone()),
                            folder_name: folder_name.clone(),
                            version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                            description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                            path: path.to_string_lossy().to_string(),
                            skill_md_path: skill_md.to_string_lossy().to_string(),
                            category_id: None,
                            group_id: None,
                            imported_at: chrono::Utc::now().to_rfc3339(),
                            updated_at: None,
                            size,
                            file_count,
                            has_resources: has_resources(&path),
                            deployments: vec![],
                        };
                        return IpcResult::success(skill);
                    }
                }
            }
        }
    }

    IpcResult::error("NOT_FOUND", &format!("Skill not found: {}", id))
}

#[tauri::command]
pub fn library_delete(id: String) -> IpcResult<()> {
    let library_path = get_library_path();

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let folder_name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                if folder_name == id || path.to_string_lossy().contains(&id) {
                    if let Err(e) = fs::remove_dir_all(&path) {
                        return IpcResult::error("DELETE_FAILED", &format!("Failed to delete skill: {}", e));
                    }
                    return IpcResult::success(());
                }
            }
        }
    }

    IpcResult::error("NOT_FOUND", &format!("Skill not found: {}", id))
}

#[tauri::command]
pub fn library_import(path: String, category_id: Option<String>, group_id: Option<String>) -> IpcResult<LibrarySkill> {
    let source = PathBuf::from(&path);

    if !source.exists() {
        return IpcResult::error("NOT_FOUND", &format!("Source path does not exist: {}", path));
    }

    let skill_md = if source.is_file() && source.file_name().map(|n| n.to_string_lossy() == "SKILL.md").unwrap_or(false) {
        source.clone()
    } else if source.is_dir() {
        source.join("SKILL.md")
    } else {
        return IpcResult::error("INVALID_SOURCE", "Source must be a SKILL.md file or a folder containing one");
    };

    if !skill_md.exists() {
        return IpcResult::error("SKILL_MD_NOT_FOUND", "SKILL.md not found in the specified location");
    }

    let library_path = get_library_path();
    if let Err(e) = fs::create_dir_all(&library_path) {
        return IpcResult::error("CREATE_DIR_FAILED", &format!("Failed to create library directory: {}", e));
    }

    // Determine destination folder name
    let folder_name = source.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| format!("skill-{}", chrono::Utc::now().timestamp()));

    let dest = library_path.join(&folder_name);

    // Copy files
    if source.is_dir() {
        if let Err(e) = copy_dir_all(&source, &dest) {
            return IpcResult::error("COPY_FAILED", &format!("Failed to copy skill: {}", e));
        }
    } else {
        if let Err(e) = fs::create_dir_all(&dest) {
            return IpcResult::error("CREATE_DIR_FAILED", &format!("Failed to create skill folder: {}", e));
        }
        if let Err(e) = fs::copy(&skill_md, dest.join("SKILL.md")) {
            return IpcResult::error("COPY_FAILED", &format!("Failed to copy SKILL.md: {}", e));
        }
    }

    let metadata = parse_skill_md(&dest.join("SKILL.md"));
    let (size, file_count) = count_files(&dest);

    let skill = LibrarySkill {
        id: generate_id(),
        name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or(folder_name.clone()),
        folder_name: folder_name.clone(),
        version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
        description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
        path: dest.to_string_lossy().to_string(),
        skill_md_path: dest.join("SKILL.md").to_string_lossy().to_string(),
        category_id,
        group_id,
        imported_at: chrono::Utc::now().to_rfc3339(),
        updated_at: None,
        size,
        file_count,
        has_resources: has_resources(&dest),
        deployments: vec![],
    };

    IpcResult::success(skill)
}

#[tauri::command]
pub fn library_export(id: String, format: String) -> IpcResult<String> {
    let library_path = get_library_path();

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let folder_name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                if folder_name == id || path.to_string_lossy().contains(&id) {
                    let export_path = if format == "zip" {
                        // For zip export, return the path to a temp zip file
                        let temp_dir = std::env::temp_dir();
                        let zip_path = temp_dir.join(format!("{}.zip", folder_name));
                        // In a real implementation, we'd create the zip here
                        zip_path.to_string_lossy().to_string()
                    } else {
                        path.to_string_lossy().to_string()
                    };
                    return IpcResult::success(export_path);
                }
            }
        }
    }

    IpcResult::error("NOT_FOUND", &format!("Skill not found: {}", id))
}

#[tauri::command]
pub fn library_export_batch(ids: Vec<String>, dest_path: String) -> IpcResult<String> {
    let library_path = get_library_path();
    let dest = PathBuf::from(&dest_path);

    // Create zip file
    let file = match fs::File::create(&dest) {
        Ok(f) => f,
        Err(e) => return IpcResult::error("CREATE_FILE_FAILED", &format!("Failed to create zip file: {}", e)),
    };

    let mut zip = ZipWriter::new(file);
    let options = FileOptions::<()>::default()
        .compression_method(zip::CompressionMethod::Deflated);

    let mut exported_count = 0;

    for id in &ids {
        // Find skill folder by id (folder_name or path match)
        if let Ok(entries) = fs::read_dir(&library_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let folder_name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                    if folder_name == *id || path.to_string_lossy().contains(id) {
                        // Add skill folder to zip
                        if let Err(e) = add_dir_to_zip(&mut zip, &path, &folder_name, options) {
                            return IpcResult::error("ZIP_ERROR", &format!("Failed to add skill to zip: {}", e));
                        }
                        exported_count += 1;
                        break;
                    }
                }
            }
        }
    }

    // Finalize zip
    if let Err(e) = zip.finish() {
        return IpcResult::error("ZIP_FINISH_FAILED", &format!("Failed to finalize zip: {}", e));
    }

    if exported_count == 0 {
        return IpcResult::error("NO_SKILLS_EXPORTED", "No skills were found to export");
    }

    IpcResult::success(dest_path)
}

fn add_dir_to_zip<W: std::io::Write + std::io::Seek>(
    zip: &mut ZipWriter<W>,
    dir: &Path,
    prefix: &str,
    options: FileOptions<()>,
) -> std::io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = format!("{}/{}", prefix, entry.file_name().to_string_lossy());

        if path.is_dir() {
            zip.add_directory(&name, options)?;
            add_dir_to_zip(zip, &path, &name, options)?;
        } else {
            zip.start_file(&name, options)?;
            let content = fs::read(&path)?;
            zip.write_all(&content)?;
        }
    }
    Ok(())
}

// ============================================================================
// Category Commands
// ============================================================================

#[tauri::command]
pub fn library_categories_list() -> IpcResult<Vec<Category>> {
    IpcResult::success(load_categories())
}

#[tauri::command]
pub fn library_categories_create(name: String, icon: Option<String>, color: Option<String>) -> IpcResult<Category> {
    let mut categories = load_categories();

    let category = Category {
        id: format!("cat-{}", uuid::Uuid::new_v4()),
        name,
        icon,
        color,
        groups: vec![],
        skill_count: 0,
        is_custom: true,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    categories.push(category.clone());

    if let Err(e) = save_categories(&categories) {
        return IpcResult::error("SAVE_FAILED", &e);
    }

    IpcResult::success(category)
}

#[tauri::command]
pub fn library_categories_rename(id: String, new_name: String) -> IpcResult<Category> {
    let mut categories = load_categories();

    if let Some(category) = categories.iter_mut().find(|c| c.id == id) {
        category.name = new_name.clone();
        let updated = category.clone();

        if let Err(e) = save_categories(&categories) {
            return IpcResult::error("SAVE_FAILED", &e);
        }

        return IpcResult::success(updated);
    }

    IpcResult::error("NOT_FOUND", &format!("Category not found: {}", id))
}

#[tauri::command]
pub fn library_categories_delete(id: String) -> IpcResult<()> {
    let mut categories = load_categories();

    let initial_len = categories.len();
    categories.retain(|c| c.id != id);

    if categories.len() == initial_len {
        return IpcResult::error("NOT_FOUND", &format!("Category not found: {}", id));
    }

    if let Err(e) = save_categories(&categories) {
        return IpcResult::error("SAVE_FAILED", &e);
    }

    IpcResult::success(())
}

// ============================================================================
// Group Commands
// ============================================================================

#[tauri::command]
pub fn library_groups_create(category_id: String, name: String) -> IpcResult<Group> {
    let mut categories = load_categories();

    if let Some(category) = categories.iter_mut().find(|c| c.id == category_id) {
        let group = Group {
            id: format!("grp-{}", uuid::Uuid::new_v4()),
            category_id: category_id.clone(),
            name,
            skill_count: 0,
            is_custom: true,
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        category.groups.push(group.clone());

        if let Err(e) = save_categories(&categories) {
            return IpcResult::error("SAVE_FAILED", &e);
        }

        return IpcResult::success(group);
    }

    IpcResult::error("CATEGORY_NOT_FOUND", &format!("Category not found: {}", category_id))
}

#[tauri::command]
pub fn library_groups_rename(category_id: String, group_id: String, new_name: String) -> IpcResult<Group> {
    let mut categories = load_categories();

    if let Some(category) = categories.iter_mut().find(|c| c.id == category_id) {
        if let Some(group) = category.groups.iter_mut().find(|g| g.id == group_id) {
            group.name = new_name.clone();
            let updated = group.clone();

            if let Err(e) = save_categories(&categories) {
                return IpcResult::error("SAVE_FAILED", &e);
            }

            return IpcResult::success(updated);
        }
    }

    IpcResult::error("NOT_FOUND", "Group or category not found")
}

#[tauri::command]
pub fn library_groups_delete(category_id: String, group_id: String) -> IpcResult<()> {
    let mut categories = load_categories();

    if let Some(category) = categories.iter_mut().find(|c| c.id == category_id) {
        let initial_len = category.groups.len();
        category.groups.retain(|g| g.id != group_id);

        if category.groups.len() == initial_len {
            return IpcResult::error("NOT_FOUND", "Group not found");
        }

        if let Err(e) = save_categories(&categories) {
            return IpcResult::error("SAVE_FAILED", &e);
        }

        return IpcResult::success(());
    }

    IpcResult::error("CATEGORY_NOT_FOUND", &format!("Category not found: {}", category_id))
}

// ============================================================================
// Organize Command
// ============================================================================

#[tauri::command]
pub fn library_organize(skill_id: String, category_id: Option<String>, group_id: Option<String>) -> IpcResult<()> {
    // In a real implementation, this would update a database or metadata file
    // For now, we'll just return success
    // The frontend will handle updating the store

    IpcResult::success(())
}

// ============================================================================
// Helper: Copy directory recursively
// ============================================================================

fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if ty.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}
