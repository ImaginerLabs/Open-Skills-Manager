use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::io::{self, Write};
use zip::ZipWriter;
use zip::write::FileOptions;
use zip::read::ZipArchive;

use super::AppError;
use crate::parsers::SkillFrontmatter;
use crate::paths;
use crate::storage::service::get_storage;
// Re-export Group and Category from storage types for IPC commands
pub use crate::storage::{Group, Category, SkillEntry};

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
#[serde(rename_all = "camelCase")]
pub struct LibrarySkill {
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
    pub group_id: Option<String>,
    pub category_id: Option<String>,
    pub imported_at: String,
    pub updated_at: Option<String>,
    pub size: u64,
    pub file_count: u32,
    pub has_resources: bool,
    pub deployments: Vec<Deployment>,
    pub is_symlink: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Deployment {
    pub id: String,
    pub skill_id: String,
    pub target_scope: String,
    pub target_path: String,
    pub project_name: Option<String>,
    pub deployed_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillMetadata {
    pub name: String,
    pub version: String,
    pub description: String,
}

// ============================================================================
// Helper Functions
// ============================================================================

pub fn get_library_path() -> PathBuf {
    paths::get_library_path()
}

// Metadata path functions
#[allow(dead_code)]
fn get_categories_path() -> PathBuf {
    paths::get_app_support_path().join("categories.json")
}

fn get_skill_metadata_path() -> PathBuf {
    paths::get_app_support_path().join("skill_metadata.json")
}

/// Persistent metadata for each skill (survives app restart)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillMetadataEntry {
    pub id: String,
    pub folder_name: String,
    pub group_id: Option<String>,
    pub category_id: Option<String>,
    pub imported_at: String,
}

pub fn load_skill_metadata() -> std::collections::HashMap<String, SkillMetadataEntry> {
    let path = get_skill_metadata_path();
    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    } else {
        std::collections::HashMap::new()
    }
}

pub fn save_skill_metadata(metadata: &std::collections::HashMap<String, SkillMetadataEntry>) -> Result<(), String> {
    let path = get_skill_metadata_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(metadata).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

pub fn parse_skill_md(path: &Path) -> Option<SkillMetadata> {
    SkillFrontmatter::from_path_or_default(path)
        .map(|fm| SkillMetadata {
            name: fm.name,
            version: fm.version,
            description: fm.description,
        })
}

/// Count lines and characters in a SKILL.md file
pub fn count_skill_md_stats(path: &Path) -> (u32, u32) {
    if let Ok(content) = fs::read_to_string(path) {
        let lines = content.lines().count() as u32;
        let chars = content.chars().count() as u32;
        (lines, chars)
    } else {
        (0, 0)
    }
}

pub fn count_files(dir: &Path) -> (u64, u32) {
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

pub fn has_resources(dir: &Path) -> bool {
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

/// Check if a path is a symlink (does not follow the link)
pub fn is_symlink_dir(path: &Path) -> bool {
    fs::symlink_metadata(path)
        .map(|m| m.file_type().is_symlink())
        .unwrap_or(false)
}

pub fn generate_id() -> String {
    format!("skill-{}", uuid::Uuid::new_v4())
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
            return IpcResult::error(AppError::E101CreateDirFailed(
                format!("Library directory: {}", e)
            ).code(), &format!("Failed to create library directory: {}", e));
        }
        return IpcResult::success(vec![]);
    }

    // Load skill metadata from storage layer
    let library_data = match get_storage().read_library() {
        Ok(data) => data,
        Err(e) => return IpcResult::error("E001", &format!("Failed to read library data: {}", e)),
    };

    let mut skills = Vec::new();
    let now = chrono::Utc::now().to_rfc3339();

    // Scan filesystem for actual skill folders
    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    let folder_name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                    let metadata = parse_skill_md(&skill_md);
                    let (size, file_count) = count_files(&path);

                    // Get from storage layer if available, otherwise create new entry
                    let (id, category_id, group_id, imported_at) = if let Some(entry) = library_data.skills.get(&folder_name) {
                        (entry.id.clone(), entry.category_id.clone(), entry.group_id.clone(), entry.imported_at.clone())
                    } else {
                        // New skill on filesystem not in storage - create entry
                        let new_id = generate_id();
                        let new_entry = crate::storage::SkillEntry {
                            id: new_id.clone(),
                            folder_name: folder_name.clone(),
                            group_id: None,
                            category_id: None,
                            imported_at: now.clone(),
                            updated_at: None,
                        };
                        // Add to storage
                        if let Err(e) = get_storage().add_skill(new_entry) {
                            eprintln!("Warning: Failed to add skill to storage: {}", e);
                        }
                        (new_id, None, None, now.clone())
                    };

                    let (skill_md_lines, skill_md_chars) = count_skill_md_stats(&skill_md);
                    let is_symlink = is_symlink_dir(&path);

                    let skill = LibrarySkill {
                        id,
                        name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| {
                            path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or("Unknown".to_string())
                        }),
                        folder_name,
                        version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                        description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                        path: path.to_string_lossy().to_string(),
                        skill_md_path: skill_md.to_string_lossy().to_string(),
                        skill_md_content: None,
                        skill_md_lines,
                        skill_md_chars,
                        category_id,
                        group_id,
                        imported_at,
                        updated_at: None,
                        size,
                        file_count,
                        has_resources: has_resources(&path),
                        deployments: vec![],
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
pub fn library_get(id: String) -> IpcResult<LibrarySkill> {
    let library_path = get_library_path();
    let library_data = match get_storage().read_library() {
        Ok(data) => data,
        Err(e) => return IpcResult::error("E001", &format!("Failed to read library data: {}", e)),
    };

    // Find the folder_name for this ID from storage
    let folder_name_from_id = library_data.skills.iter()
        .find(|(_, entry)| entry.id == id)
        .map(|(_, entry)| entry.folder_name.clone());

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    let folder_name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();

                    // Match by ID (via storage) or folder name (fallback)
                    let is_match = folder_name_from_id.as_ref() == Some(&folder_name)
                        || folder_name == id
                        || path.to_string_lossy().contains(&id);

                    if is_match {
                        let metadata = parse_skill_md(&skill_md);
                        let (size, file_count) = count_files(&path);
                        let skill_md_content = fs::read_to_string(&skill_md).ok();
                        let (skill_md_lines, skill_md_chars) = count_skill_md_stats(&skill_md);
                        let is_symlink = is_symlink_dir(&path);

                        // Get from storage if available
                        let (skill_id, category_id, group_id, imported_at) = if let Some(entry) = library_data.skills.get(&folder_name) {
                            (entry.id.clone(), entry.category_id.clone(), entry.group_id.clone(), entry.imported_at.clone())
                        } else {
                            (id, None, None, chrono::Utc::now().to_rfc3339())
                        };

                        let skill = LibrarySkill {
                            id: skill_id,
                            name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| folder_name.clone()),
                            folder_name: folder_name.clone(),
                            version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                            description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                            path: path.to_string_lossy().to_string(),
                            skill_md_path: skill_md.to_string_lossy().to_string(),
                            skill_md_content,
                            skill_md_lines,
                            skill_md_chars,
                            category_id,
                            group_id,
                            imported_at,
                            updated_at: None,
                            size,
                            file_count,
                            has_resources: has_resources(&path),
                            deployments: vec![],
                            is_symlink,
                        };
                        return IpcResult::success(skill);
                    }
                }
            }
        }
    }

    IpcResult::error(AppError::E203SkillNotFound(
        format!("Skill not found: {}", id)
    ).code(), &format!("Skill not found: {}", id))
}

#[tauri::command]
pub fn library_delete(id: String) -> IpcResult<()> {
    let library_path = get_library_path();

    // Find skill by ID in storage layer
    let library = match crate::storage::service::get_storage().read_library() {
        Ok(lib) => lib,
        Err(e) => return IpcResult::error(AppError::E103ReadFailed(e.clone()).code(), &format!("Failed to read library: {}", e))
    };

    // Find folder_name from skill ID
    let folder_name = library.skills.values()
        .find(|entry| entry.id == id)
        .map(|entry| entry.folder_name.clone());

    let folder_name = match folder_name {
        Some(name) => name,
        None => return IpcResult::error(AppError::E203SkillNotFound(
            format!("Skill not found: {}", id)
        ).code(), &format!("Skill not found: {}", id))
    };

    // Delete filesystem directory
    let skill_dir = library_path.join(&folder_name);
    if skill_dir.exists() {
        if let Err(e) = fs::remove_dir_all(&skill_dir) {
            return IpcResult::error(AppError::E104DeleteFailed(
                format!("Skill: {}", e)
            ).code(), &format!("Failed to delete skill: {}", e));
        }
    }

    // Remove from storage layer (handles metadata removal, tombstone creation, and sync)
    if let Err(e) = crate::storage::service::get_storage().remove_skill(&folder_name) {
        eprintln!("Warning: Failed to remove skill from storage: {}", e);
    }

    IpcResult::success(())
}

#[tauri::command]
pub fn library_import(path: String, category_id: Option<String>, group_id: Option<String>) -> IpcResult<LibrarySkill> {
    let source = PathBuf::from(&path);

    if !source.exists() {
        return IpcResult::error(AppError::E100FileNotFound(
            path.clone()
        ).code(), &format!("Source path does not exist: {}", path));
    }

    // Handle zip files
    if source.extension().map(|e| e == "zip").unwrap_or(false) {
        return import_from_zip(&source, category_id, group_id);
    }

    let skill_md = if source.is_file() && source.file_name().map(|n| n.to_string_lossy() == "SKILL.md").unwrap_or(false) {
        source.clone()
    } else if source.is_dir() {
        source.join("SKILL.md")
    } else {
        return IpcResult::error(AppError::E002InvalidInput(
            "Source must be SKILL.md or folder".to_string()
        ).code(), "Source must be a SKILL.md file or a folder containing one");
    };

    if !skill_md.exists() {
        return IpcResult::error(AppError::E100FileNotFound(
            "SKILL.md".to_string()
        ).code(), "SKILL.md not found in the specified location");
    }

    let library_path = get_library_path();
    if let Err(e) = fs::create_dir_all(&library_path) {
        return IpcResult::error(AppError::E101CreateDirFailed(
            format!("Library directory: {}", e)
        ).code(), &format!("Failed to create library directory: {}", e));
    }

    // Determine destination folder name
    let folder_name = source.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| format!("skill-{}", chrono::Utc::now().timestamp()));

    let dest = library_path.join(&folder_name);

    // Copy files
    if source.is_dir() {
        if let Err(e) = copy_dir_all(&source, &dest) {
            return IpcResult::error(AppError::E105CopyFailed(
                format!("Skill directory: {}", e)
            ).code(), &format!("Failed to copy skill: {}", e));
        }
    } else {
        if let Err(e) = fs::create_dir_all(&dest) {
            return IpcResult::error(AppError::E101CreateDirFailed(
                format!("Skill folder: {}", e)
            ).code(), &format!("Failed to create skill folder: {}", e));
        }
        if let Err(e) = fs::copy(&skill_md, dest.join("SKILL.md")) {
            return IpcResult::error(AppError::E105CopyFailed(
                format!("SKILL.md: {}", e)
            ).code(), &format!("Failed to copy SKILL.md: {}", e));
        }
    }

    let metadata = parse_skill_md(&dest.join("SKILL.md"));
    let (size, file_count) = count_files(&dest);
    let (skill_md_lines, skill_md_chars) = count_skill_md_stats(&dest.join("SKILL.md"));
    let imported_at = chrono::Utc::now().to_rfc3339();
    let skill_id = generate_id();

    let skill = LibrarySkill {
        id: skill_id.clone(),
        name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or(folder_name.clone()),
        folder_name: folder_name.clone(),
        version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
        description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
        path: dest.to_string_lossy().to_string(),
        skill_md_path: dest.join("SKILL.md").to_string_lossy().to_string(),
        skill_md_content: None,
        skill_md_lines,
        skill_md_chars,
        category_id: category_id.clone(),
        group_id: group_id.clone(),
        imported_at: imported_at.clone(),
        updated_at: None,
        size,
        file_count,
        has_resources: has_resources(&dest),
        deployments: vec![],
        is_symlink: false, // Imported skills are always copies, not symlinks
    };

    // Persist skill metadata via storage layer
    if let Err(e) = get_storage().add_skill(SkillEntry {
        id: skill_id,
        folder_name: folder_name.clone(),
        category_id,
        group_id,
        imported_at,
        updated_at: None,
    }) {
        eprintln!("Warning: Failed to save skill metadata after import: {}", e);
    }

    IpcResult::success(skill)
}

fn import_from_zip(zip_path: &Path, category_id: Option<String>, group_id: Option<String>) -> IpcResult<LibrarySkill> {
    // Open zip file
    let file = match fs::File::open(zip_path) {
        Ok(f) => f,
        Err(e) => return IpcResult::error(AppError::E100FileNotFound(
            zip_path.to_string_lossy().to_string()
        ).code(), &format!("Failed to open zip file: {}", e)),
    };

    // Create temp directory
    let temp_dir = match tempfile::tempdir() {
        Ok(d) => d,
        Err(e) => return IpcResult::error(AppError::E101CreateDirFailed(
            "Temp directory".to_string()
        ).code(), &format!("Failed to create temp directory: {}", e)),
    };

    // Extract zip
    let mut archive = match ZipArchive::new(file) {
        Ok(a) => a,
        Err(e) => return IpcResult::error(AppError::E002InvalidInput(
            "Invalid zip file".to_string()
        ).code(), &format!("Failed to read zip archive: {}", e)),
    };

    for i in 0..archive.len() {
        let mut file = match archive.by_index(i) {
            Ok(f) => f,
            Err(e) => return IpcResult::error(AppError::E002InvalidInput(
                "Corrupted zip entry".to_string()
            ).code(), &format!("Failed to read zip entry {}: {}", i, e)),
        };

        let outpath = match file.enclosed_name() {
            Some(p) => temp_dir.path().join(p),
            None => continue,
        };

        if file.name().ends_with('/') {
            if let Err(e) = fs::create_dir_all(&outpath) {
                return IpcResult::error(AppError::E101CreateDirFailed(
                    outpath.to_string_lossy().to_string()
                ).code(), &format!("Failed to create directory: {}", e));
            }
        } else {
            if let Some(p) = outpath.parent() {
                if let Err(e) = fs::create_dir_all(p) {
                    return IpcResult::error(AppError::E101CreateDirFailed(
                        p.to_string_lossy().to_string()
                    ).code(), &format!("Failed to create parent directory: {}", e));
                }
            }
            let mut outfile = match fs::File::create(&outpath) {
                Ok(f) => f,
                Err(e) => return IpcResult::error(AppError::E102WriteFailed(
                    outpath.to_string_lossy().to_string()
                ).code(), &format!("Failed to create file: {}", e)),
            };
            if let Err(e) = io::copy(&mut file, &mut outfile) {
                return IpcResult::error(AppError::E102WriteFailed(
                    outpath.to_string_lossy().to_string()
                ).code(), &format!("Failed to write file: {}", e));
            }
        }
    }

    // Find SKILL.md in extracted contents
    let skill_md_path = find_skill_md(temp_dir.path());
    let skill_md = match skill_md_path {
        Some(p) => p,
        None => return IpcResult::error(AppError::E100FileNotFound(
            "SKILL.md".to_string()
        ).code(), "No SKILL.md found in the zip file"),
    };

    // Get the skill folder (parent of SKILL.md)
    let skill_folder = skill_md.parent().unwrap_or(temp_dir.path());

    // Determine folder name
    let folder_name = skill_folder.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| format!("skill-{}", chrono::Utc::now().timestamp()));

    // Copy to library
    let library_path = get_library_path();
    if let Err(e) = fs::create_dir_all(&library_path) {
        return IpcResult::error(AppError::E101CreateDirFailed(
            format!("Library directory: {}", e)
        ).code(), &format!("Failed to create library directory: {}", e));
    }

    let dest = library_path.join(&folder_name);
    if let Err(e) = copy_dir_all(skill_folder, &dest) {
        return IpcResult::error(AppError::E105CopyFailed(
            format!("Skill directory: {}", e)
        ).code(), &format!("Failed to copy skill: {}", e));
    }

    // temp_dir is automatically cleaned up when dropped

    let metadata = parse_skill_md(&dest.join("SKILL.md"));
    let (size, file_count) = count_files(&dest);
    let (skill_md_lines, skill_md_chars) = count_skill_md_stats(&dest.join("SKILL.md"));
    let imported_at = chrono::Utc::now().to_rfc3339();
    let skill_id = generate_id();

    let skill = LibrarySkill {
        id: skill_id.clone(),
        name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or(folder_name.clone()),
        folder_name: folder_name.clone(),
        version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
        description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
        path: dest.to_string_lossy().to_string(),
        skill_md_path: dest.join("SKILL.md").to_string_lossy().to_string(),
        skill_md_content: None,
        skill_md_lines,
        skill_md_chars,
        category_id: category_id.clone(),
        group_id: group_id.clone(),
        imported_at: imported_at.clone(),
        updated_at: None,
        size,
        file_count,
        has_resources: has_resources(&dest),
        deployments: vec![],
        is_symlink: false, // Imported from zip, always a copy
    };

    // Persist skill metadata via storage layer
    if let Err(e) = get_storage().add_skill(SkillEntry {
        id: skill_id,
        folder_name: folder_name.clone(),
        category_id,
        group_id,
        imported_at,
        updated_at: None,
    }) {
        eprintln!("Warning: Failed to save skill metadata after zip import: {}", e);
    }

    IpcResult::success(skill)
}

fn find_skill_md(dir: &Path) -> Option<PathBuf> {
    if dir.join("SKILL.md").exists() {
        return Some(dir.join("SKILL.md"));
    }

    for entry in fs::read_dir(dir).ok()? {
        let entry = entry.ok()?;
        let path = entry.path();
        if path.is_dir() {
            if let Some(found) = find_skill_md(&path) {
                return Some(found);
            }
        }
    }

    None
}

#[tauri::command]
pub fn library_export(id: String, format: String, dest_path: Option<String>) -> IpcResult<String> {
    let library_path = get_library_path();
    let storage = get_storage();
    let library_data = storage.read_library()
        .unwrap_or_else(|_| crate::storage::LibraryData::default());

    // Find folder_name from storage by ID
    let folder_name_from_id = library_data.skills.iter()
        .find(|(_, entry)| entry.id == id)
        .map(|(_, entry)| entry.folder_name.clone());

    // Find skill folder by id (via persisted metadata) or folder name
    let mut skill_folder: Option<PathBuf> = None;
    let mut folder_name = String::new();

    if let Ok(entries) = fs::read_dir(&library_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                if folder_name_from_id.as_ref() == Some(&name) || name == id || path.to_string_lossy().contains(&id) {
                    skill_folder = Some(path);
                    folder_name = name;
                    break;
                }
            }
        }
    }

    let skill_path = match skill_folder {
        Some(p) => p,
        None => return IpcResult::error(
            AppError::E203SkillNotFound(format!("Skill not found: {}", id)).code(),
            &format!("Skill not found: {}", id)
        ),
    };

    if format == "zip" {
        let dest = match dest_path {
            Some(p) => p,
            None => return IpcResult::error(
                "E002",
                "Destination path required for zip export"
            ),
        };

        let dest_buf = PathBuf::from(&dest);

        // Create zip file
        let file = match fs::File::create(&dest_buf) {
            Ok(f) => f,
            Err(e) => return IpcResult::error(
                AppError::E102WriteFailed(format!("Zip file: {}", e)).code(),
                &format!("Failed to create zip file: {}", e)
            ),
        };

        let mut zip = ZipWriter::new(file);
        let options = FileOptions::<()>::default()
            .compression_method(zip::CompressionMethod::Deflated);

        // Add skill folder contents to zip
        if let Err(e) = add_dir_to_zip(&mut zip, &skill_path, &folder_name, options) {
            return IpcResult::error(
                AppError::E102WriteFailed(format!("Zip archive: {}", e)).code(),
                &format!("Failed to add skill to zip: {}", e)
            );
        }

        // Finalize zip
        if let Err(e) = zip.finish() {
            return IpcResult::error(
                AppError::E102WriteFailed(format!("Zip finalization: {}", e)).code(),
                &format!("Failed to finalize zip: {}", e)
            );
        }

        IpcResult::success(dest)
    } else {
        // Folder format - return the path to the skill folder
        IpcResult::success(skill_path.to_string_lossy().to_string())
    }
}

#[tauri::command]
pub fn library_export_batch(ids: Vec<String>, dest_path: String) -> IpcResult<String> {
    let library_path = get_library_path();
    let dest = PathBuf::from(&dest_path);
    let storage = get_storage();
    let library_data = storage.read_library()
        .unwrap_or_else(|_| crate::storage::LibraryData::default());

    // Build ID -> folder_name mapping from storage
    let id_to_folder: std::collections::HashMap<String, String> = library_data.skills
        .iter()
        .map(|(_, entry)| (entry.id.clone(), entry.folder_name.clone()))
        .collect();

    // Create zip file
    let file = match fs::File::create(&dest) {
        Ok(f) => f,
        Err(e) => return IpcResult::error(AppError::E102WriteFailed(
            format!("Zip file: {}", e)
        ).code(), &format!("Failed to create zip file: {}", e)),
    };

    let mut zip = ZipWriter::new(file);
    let options = FileOptions::<()>::default()
        .compression_method(zip::CompressionMethod::Deflated);

    let mut exported_count = 0;

    for id in &ids {
        // Find folder_name from persisted ID
        let folder_name_from_id = id_to_folder.get(id).cloned();

        // Find skill folder by id (via persisted metadata) or folder name
        if let Ok(entries) = fs::read_dir(&library_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let folder_name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                    if folder_name_from_id.as_ref() == Some(&folder_name) || folder_name == *id || path.to_string_lossy().contains(id) {
                        // Add skill folder to zip
                        if let Err(e) = add_dir_to_zip(&mut zip, &path, &folder_name, options) {
                            return IpcResult::error(AppError::E102WriteFailed(
                                format!("Zip archive: {}", e)
                            ).code(), &format!("Failed to add skill to zip: {}", e));
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
        return IpcResult::error(AppError::E102WriteFailed(
            format!("Zip finalization: {}", e)
        ).code(), &format!("Failed to finalize zip: {}", e));
    }

    if exported_count == 0 {
        return IpcResult::error(AppError::E203SkillNotFound(
            "No skills found".to_string()
        ).code(), "No skills were found to export");
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
// Group Commands
// ============================================================================

#[tauri::command]
pub fn library_groups_list() -> IpcResult<Vec<Group>> {
    let storage = get_storage();
    let library_data = storage.read_library()
        .unwrap_or_else(|_| crate::storage::LibraryData::default());
    let groups = library_data.groups.clone();
    let skills = &library_data.skills;

    // Count skills for each group and category
    let mut group_counts: std::collections::HashMap<String, u32> = std::collections::HashMap::new();
    let mut category_counts: std::collections::HashMap<String, u32> = std::collections::HashMap::new();

    for (_, entry) in skills.iter() {
        if let Some(grp_id) = &entry.group_id {
            *group_counts.entry(grp_id.clone()).or_insert(0) += 1;
        }
        if let Some(cat_id) = &entry.category_id {
            *category_counts.entry(cat_id.clone()).or_insert(0) += 1;
        }
    }

    // Update groups with actual counts
    let updated_groups = groups.into_iter().map(|grp| {
        let grp_count = group_counts.get(&grp.id).copied().unwrap_or(0);
        let updated_categories = grp.categories.into_iter().map(|cat| {
            let cat_count = category_counts.get(&cat.id).copied().unwrap_or(0);
            Category {
                skill_count: cat_count,
                ..cat
            }
        }).collect();

        Group {
            skill_count: grp_count,
            categories: updated_categories,
            ..grp
        }
    }).collect();

    IpcResult::success(updated_groups)
}

#[tauri::command]
pub fn library_groups_create(name: String, icon: Option<String>, notes: Option<String>) -> IpcResult<Group> {
    let storage = get_storage();
    let now = chrono::Utc::now().to_rfc3339();

    let group = Group {
        id: format!("grp-{}", uuid::Uuid::new_v4()),
        name,
        icon,
        color: None,
        notes,
        categories: vec![],
        skill_count: 0,
        is_custom: true,
        created_at: now,
        updated_at: None,
    };

    let result = storage.write_groups(|groups| {
        groups.push(group.clone());
    });

    match result {
        Ok(_) => IpcResult::success(group),
        Err(e) => IpcResult::error(AppError::E102WriteFailed(
            format!("Groups: {}", e)
        ).code(), &e),
    }
}

#[tauri::command]
pub fn library_groups_rename(id: String, new_name: String) -> IpcResult<Group> {
    let storage = get_storage();
    let now = chrono::Utc::now().to_rfc3339();

    let result = storage.write_groups(|groups| {
        if let Some(group) = groups.iter_mut().find(|g| g.id == id) {
            group.name = new_name.clone();
            group.updated_at = Some(now);
        }
    });

    match result {
        Ok(updated_groups) => {
            if let Some(updated) = updated_groups.into_iter().find(|g| g.id == id) {
                IpcResult::success(updated)
            } else {
                IpcResult::error(AppError::E302GroupNotFound(
                    format!("Group: {}", id)
                ).code(), &format!("Group not found: {}", id))
            }
        }
        Err(e) => IpcResult::error(AppError::E102WriteFailed(
            format!("Groups: {}", e)
        ).code(), &e),
    }
}

#[tauri::command]
pub fn library_groups_delete(id: String) -> IpcResult<()> {
    let storage = get_storage();

    let result = storage.write_groups(|groups| {
        groups.retain(|g| g.id != id);
    });

    match result {
        Ok(updated_groups) => {
            // Check if the group was actually deleted by checking if it still exists
            if updated_groups.iter().any(|g| g.id == id) {
                IpcResult::error(AppError::E302GroupNotFound(
                    format!("Group: {}", id)
                ).code(), &format!("Group not found: {}", id))
            } else {
                IpcResult::success(())
            }
        }
        Err(e) => IpcResult::error(AppError::E102WriteFailed(
            format!("Groups: {}", e)
        ).code(), &e),
    }
}

// ============================================================================
// Category Commands
// ============================================================================

#[tauri::command]
pub fn library_categories_create(group_id: String, name: String, icon: Option<String>, notes: Option<String>) -> IpcResult<Category> {
    let storage = get_storage();
    let now = chrono::Utc::now().to_rfc3339();

    let category = Category {
        id: format!("cat-{}", uuid::Uuid::new_v4()),
        group_id: group_id.clone(),
        name,
        icon,
        notes,
        skill_count: 0,
        is_custom: true,
        created_at: now,
    };

    let result = storage.write_groups(|groups| {
        if let Some(group) = groups.iter_mut().find(|g| g.id == group_id) {
            group.categories.push(category.clone());
        }
    });

    match result {
        Ok(_) => IpcResult::success(category),
        Err(e) => IpcResult::error(AppError::E102WriteFailed(
            format!("Groups: {}", e)
        ).code(), &e),
    }
}

#[tauri::command]
pub fn library_categories_rename(group_id: String, category_id: String, new_name: String) -> IpcResult<Category> {
    let storage = get_storage();

    let result = storage.write_groups(|groups| {
        if let Some(group) = groups.iter_mut().find(|g| g.id == group_id) {
            if let Some(category) = group.categories.iter_mut().find(|c| c.id == category_id) {
                category.name = new_name.clone();
            }
        }
    });

    match result {
        Ok(updated_groups) => {
            // Find the updated category
            for group in &updated_groups {
                if group.id == group_id {
                    if let Some(category) = group.categories.iter().find(|c| c.id == category_id) {
                        return IpcResult::success(category.clone());
                    }
                }
            }
            IpcResult::error(AppError::E300CategoryNotFound(
                "Category or group not found".to_string()
            ).code(), "Category or group not found")
        }
        Err(e) => IpcResult::error(AppError::E102WriteFailed(
            format!("Groups: {}", e)
        ).code(), &e),
    }
}

#[tauri::command]
pub fn library_categories_delete(group_id: String, category_id: String) -> IpcResult<()> {
    let storage = get_storage();

    let result = storage.write_groups(|groups| {
        if let Some(group) = groups.iter_mut().find(|g| g.id == group_id) {
            group.categories.retain(|c| c.id != category_id);
        }
    });

    match result {
        Ok(_) => IpcResult::success(()),
        Err(e) => IpcResult::error(AppError::E102WriteFailed(
            format!("Groups: {}", e)
        ).code(), &e),
    }
}

// ============================================================================
// Organize Command
// ============================================================================

#[tauri::command]
pub fn library_organize(skill_id: String, group_id: Option<String>, category_id: Option<String>) -> IpcResult<()> {
    let storage = get_storage();

    // Find the folder_name for this skill_id from storage layer
    let library_data = match storage.read_library() {
        Ok(data) => data,
        Err(e) => return IpcResult::error("E001", &format!("Failed to read library data: {}", e)),
    };

    let folder_name = library_data.skills.iter()
        .find(|(_, entry)| entry.id == skill_id)
        .map(|(_, entry)| entry.folder_name.clone());

    let folder = match folder_name {
        Some(f) => f,
        None => return IpcResult::error(AppError::E203SkillNotFound(
            format!("Skill not found: {}", skill_id)
        ).code(), &format!("Skill not found: {}", skill_id)),
    };

    // Update skill organization via storage layer (handles metadata update and sync)
    if let Err(e) = storage.update_skill(&folder, |skill| {
        skill.group_id = group_id;
        skill.category_id = category_id;
    }) {
        return IpcResult::error(AppError::E102WriteFailed(
            format!("Skill organization: {}", e)
        ).code(), &format!("Failed to save skill organization: {}", e));
    }

    IpcResult::success(())
}

// ============================================================================
// Helper: Copy directory recursively
// ============================================================================

pub fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        // Use symlink_metadata to not follow symlinks
        let metadata = fs::symlink_metadata(&src_path)?;
        let file_type = metadata.file_type();

        if file_type.is_symlink() {
            // Read the symlink target
            let target = fs::read_link(&src_path)?;
            // Create the same symlink at destination
            #[cfg(unix)]
            std::os::unix::fs::symlink(&target, &dst_path)?;
            #[cfg(windows)]
            std::os::windows::fs::symlink_file(&target, &dst_path)?;
        } else if file_type.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

// ============================================================================
// Sync Trigger
// ============================================================================

/// Trigger a full sync after library changes
fn trigger_library_sync() {
    super::sync::trigger_full_sync();
}
