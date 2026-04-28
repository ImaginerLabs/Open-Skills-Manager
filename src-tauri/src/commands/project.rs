use super::library::{IpcResult, parse_skill_md, count_files, has_resources, count_skill_md_stats};
use super::config::{load_config, update_config, Project};
use super::AppError;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use crate::paths;

// ============================================================================
// Data Types
// ============================================================================

// Project type is now defined in config.rs, use that directly
// This module uses config::Project for consistency

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSkill {
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
    pub size: u64,
    pub file_count: u32,
    pub has_resources: bool,
    pub project_id: String,
    pub installed_at: String,
}

// ============================================================================
// Helper Functions
// ============================================================================

fn get_projects_path() -> PathBuf {
    // Legacy path - kept for migration
    paths::get_legacy_projects_path()
}

fn get_active_ide_project_scope_name() -> String {
    if let Ok(config) = load_config() {
        if let Some(ide) = config.ide_configs.iter().find(|ide| ide.id == config.active_ide_id) {
            return ide.project_scope_name.clone();
        }
    }
    ".claude".to_string()
}

fn generate_id() -> String {
    format!("project-{}", uuid::Uuid::new_v4())
}

fn load_projects() -> Vec<Project> {
    // Load from new config system
    if let Ok(config) = load_config() {
        if let Some(ide) = config.ide_configs.iter().find(|ide| ide.id == config.active_ide_id) {
            return ide.projects.clone();
        }
    }

    // Fallback to legacy file
    let path = get_projects_path();
    if path.exists() {
        fs::read_to_string(path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    } else {
        Vec::new()
    }
}

fn save_projects(projects: &[Project]) -> Result<(), String> {
    let path = get_projects_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(projects).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

fn count_skills_in_project(project_path: &PathBuf) -> u32 {
    let scope_name = get_active_ide_project_scope_name();
    let skills_dir = project_path.join(&scope_name).join("skills");
    if !skills_dir.exists() {
        return 0;
    }

    let mut count = 0u32;
    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.flatten() {
            if entry.path().is_dir() && entry.path().join("SKILL.md").exists() {
                count += 1;
            }
        }
    }
    count
}

fn scan_project_skills(project_id: &str, project_path: &PathBuf) -> Vec<ProjectSkill> {
    let scope_name = get_active_ide_project_scope_name();
    let skills_dir = project_path.join(&scope_name).join("skills");
    let mut skills = Vec::new();

    if !skills_dir.exists() {
        return skills;
    }

    if let Ok(entries) = fs::read_dir(&skills_dir) {
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

                    // Get folder modification time as installed_at
                    let installed_at = fs::metadata(&path)
                        .ok()
                        .and_then(|m| m.modified().ok())
                        .map(|t| {
                            let datetime: chrono::DateTime<chrono::Utc> = t.into();
                            datetime.to_rfc3339()
                        })
                        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

                    let skill = ProjectSkill {
                        id: folder_name.clone(),
                        name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| folder_name.clone()),
                        folder_name,
                        version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                        description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                        path: path.to_string_lossy().to_string(),
                        skill_md_path: skill_md.to_string_lossy().to_string(),
                        skill_md_content: None,
                        skill_md_lines,
                        skill_md_chars,
                        size,
                        file_count,
                        has_resources: has_resources(&path),
                        project_id: project_id.to_string(),
                        installed_at,
                    };
                    skills.push(skill);
                }
            }
        }
    }

    skills
}

// ============================================================================
// IPC Commands
// ============================================================================

#[tauri::command]
pub fn project_list() -> IpcResult<Vec<Project>> {
    let projects = load_projects();

    // Update exists status for each project
    let updated_projects: Vec<Project> = projects.into_iter().map(|mut p| {
        let path = PathBuf::from(&p.path);
        p.exists = path.exists();
        if !p.exists {
            p.skill_count = 0;
        }
        p
    }).collect();

    // Save updated status
    if let Err(e) = save_projects(&updated_projects) {
        eprintln!("Warning: Failed to save projects status: {}", e);
    }

    IpcResult::success(updated_projects)
}

#[tauri::command]
pub fn project_add(path: String) -> IpcResult<Project> {
    let project_path = PathBuf::from(&path);

    // Validate path exists
    if !project_path.exists() {
        return IpcResult::error(
            AppError::E100FileNotFound(path.clone()).code(),
            &format!("Project path does not exist: {}", path)
        );
    }

    // Validate it's a directory
    if !project_path.is_dir() {
        return IpcResult::error(
            AppError::E002InvalidInput("Not a directory".to_string()).code(),
            "The provided path must be a directory"
        );
    }

    // Check for .claude directory
    let claude_dir = project_path.join(".claude");
    if !claude_dir.exists() {
        return IpcResult::error(
            AppError::E003NotFound(".claude directory".to_string()).code(),
            "The project does not contain a .claude directory"
        );
    }

    // Create skills directory if it doesn't exist
    let skills_dir = claude_dir.join("skills");
    if let Err(e) = fs::create_dir_all(&skills_dir) {
        return IpcResult::error(
            AppError::E101CreateDirFailed(format!("Skills directory: {}", e)).code(),
            &format!("Failed to create .claude/skills directory: {}", e)
        );
    }

    // Get project name from directory
    let name = project_path.file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Unnamed Project".to_string());

    // Check if project already exists
    let mut projects = load_projects();
    let canonical_path = project_path.canonicalize()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| path.clone());

    if let Some(existing) = projects.iter().find(|p| {
        PathBuf::from(&p.path).canonicalize()
            .map(|cp| cp.to_string_lossy().to_string() == canonical_path)
            .unwrap_or(false)
    }) {
        return IpcResult::error(
            AppError::E002InvalidInput("Project already exists".to_string()).code(),
            &format!("Project already added: {}", existing.name)
        );
    }

    let now = chrono::Utc::now().to_rfc3339();
    let skill_count = count_skills_in_project(&project_path);
    let skills_path = skills_dir.to_string_lossy().to_string();

    let project = Project {
        id: generate_id(),
        name,
        path: canonical_path,
        skills_path: Some(skills_path),
        exists: true,
        skill_count,
        added_at: now.clone(),
        last_accessed: Some(now.clone()),
        last_scanned_at: Some(now),
    };

    projects.push(project.clone());

    if let Err(e) = save_projects(&projects) {
        return IpcResult::error(
            AppError::E102WriteFailed(format!("Projects: {}", e)).code(),
            &format!("Failed to save project: {}", e)
        );
    }

    IpcResult::success(project)
}

#[tauri::command]
pub fn project_remove(id: String) -> IpcResult<()> {
    let mut projects = load_projects();
    let initial_len = projects.len();

    projects.retain(|p| p.id != id);

    if projects.len() == initial_len {
        return IpcResult::error(
            AppError::E003NotFound(format!("Project: {}", id)).code(),
            &format!("Project not found: {}", id)
        );
    }

    if let Err(e) = save_projects(&projects) {
        return IpcResult::error(
            AppError::E102WriteFailed(format!("Projects: {}", e)).code(),
            &format!("Failed to save projects after removal: {}", e)
        );
    }

    IpcResult::success(())
}

#[tauri::command]
pub fn project_skills(project_id: String) -> IpcResult<Vec<ProjectSkill>> {
    let mut projects = load_projects();

    let project = projects.iter().find(|p| p.id == project_id);
    let project = match project {
        Some(p) => p,
        None => return IpcResult::error(
            AppError::E003NotFound(format!("Project: {}", project_id)).code(),
            &format!("Project not found: {}", project_id)
        ),
    };

    let project_path = PathBuf::from(&project.path);

    if !project_path.exists() {
        return IpcResult::error(
            AppError::E100FileNotFound(project.path.clone()).code(),
            &format!("Project path no longer exists: {}", project.path)
        );
    }

    let skills = scan_project_skills(&project_id, &project_path);

    // Update last_accessed
    let now = chrono::Utc::now().to_rfc3339();
    if let Some(p) = projects.iter_mut().find(|p| p.id == project_id) {
        p.last_accessed = Some(now);
        if let Err(e) = save_projects(&projects) {
            eprintln!("Warning: Failed to update last_accessed: {}", e);
        }
    }

    IpcResult::success(skills)
}

#[tauri::command]
pub fn project_refresh(project_id: Option<String>) -> IpcResult<()> {
    let mut projects = load_projects();
    let now = chrono::Utc::now().to_rfc3339();

    match project_id {
        Some(id) => {
            // Refresh specific project
            if let Some(project) = projects.iter_mut().find(|p| p.id == id) {
                let path = PathBuf::from(&project.path);
                project.exists = path.exists();

                if project.exists {
                    project.skill_count = count_skills_in_project(&path);
                    project.last_accessed = Some(now.clone());
                    project.last_scanned_at = Some(now);
                } else {
                    project.skill_count = 0;
                }
            } else {
                return IpcResult::error(
                    AppError::E003NotFound(format!("Project: {}", id)).code(),
                    &format!("Project not found: {}", id)
                );
            }
        }
        None => {
            // Refresh all projects
            for project in projects.iter_mut() {
                let path = PathBuf::from(&project.path);
                project.exists = path.exists();

                if project.exists {
                    project.skill_count = count_skills_in_project(&path);
                    project.last_accessed = Some(now.clone());
                    project.last_scanned_at = Some(now.clone());
                } else {
                    project.skill_count = 0;
                }
            }
        }
    }

    if let Err(e) = save_projects(&projects) {
        return IpcResult::error(
            AppError::E102WriteFailed(format!("Projects: {}", e)).code(),
            &format!("Failed to save projects after refresh: {}", e)
        );
    }

    IpcResult::success(())
}

// ============================================================================
// Project Skill Commands
// ============================================================================

#[tauri::command]
pub fn project_skill_get(project_id: String, skill_id: String) -> IpcResult<ProjectSkill> {
    let projects = load_projects();

    let project = projects.iter().find(|p| p.id == project_id);
    let project = match project {
        Some(p) => p,
        None => return IpcResult::error(
            AppError::E003NotFound(format!("Project: {}", project_id)).code(),
            &format!("Project not found: {}", project_id)
        ),
    };

    let project_path = PathBuf::from(&project.path);

    if !project_path.exists() {
        return IpcResult::error(
            AppError::E100FileNotFound(project.path.clone()).code(),
            &format!("Project path no longer exists: {}", project.path)
        );
    }

    let skills_dir = project_path.join(".claude").join("skills");

    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let skill_md = path.join("SKILL.md");
                if skill_md.exists() {
                    let folder_name = path.file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();

                    // Match by folder name or path containing skill_id
                    let is_match = folder_name == skill_id || path.to_string_lossy().contains(&skill_id);

                    if is_match {
                        let metadata = parse_skill_md(&skill_md);
                        let (size, file_count) = count_files(&path);
                        let skill_md_content = fs::read_to_string(&skill_md).ok();
                        let (skill_md_lines, skill_md_chars) = count_skill_md_stats(&skill_md);

                        // Get folder modification time as installed_at
                        let installed_at = fs::metadata(&path)
                            .ok()
                            .and_then(|m| m.modified().ok())
                            .map(|t| {
                                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                                datetime.to_rfc3339()
                            })
                            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

                        let skill = ProjectSkill {
                            id: skill_id.clone(),
                            name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| folder_name.clone()),
                            folder_name,
                            version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
                            description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
                            path: path.to_string_lossy().to_string(),
                            skill_md_path: skill_md.to_string_lossy().to_string(),
                            skill_md_content,
                            skill_md_lines,
                            skill_md_chars,
                            size,
                            file_count,
                            has_resources: has_resources(&path),
                            project_id,
                            installed_at,
                        };
                        return IpcResult::success(skill);
                    }
                }
            }
        }
    }

    IpcResult::error(
        AppError::E203SkillNotFound(format!("Skill: {}", skill_id)).code(),
        &format!("Skill not found in project: {}", skill_id)
    )
}

#[tauri::command]
pub fn project_skill_delete(project_id: String, skill_id: String) -> IpcResult<()> {
    let projects = load_projects();

    let project = projects.iter().find(|p| p.id == project_id);
    let project = match project {
        Some(p) => p,
        None => return IpcResult::error(
            AppError::E003NotFound(format!("Project: {}", project_id)).code(),
            &format!("Project not found: {}", project_id)
        ),
    };

    let project_path = PathBuf::from(&project.path);

    if !project_path.exists() {
        return IpcResult::error(
            AppError::E100FileNotFound(project.path.clone()).code(),
            &format!("Project path no longer exists: {}", project.path)
        );
    }

    let skills_dir = project_path.join(".claude").join("skills");

    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let folder_name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                // Match by folder name or path containing skill_id
                let is_match = folder_name == skill_id || path.to_string_lossy().contains(&skill_id);

                if is_match {
                    if let Err(e) = fs::remove_dir_all(&path) {
                        return IpcResult::error(
                            AppError::E104DeleteFailed(format!("Skill: {}", e)).code(),
                            &format!("Failed to delete skill: {}", e)
                        );
                    }
                    return IpcResult::success(());
                }
            }
        }
    }

    IpcResult::error(
        AppError::E203SkillNotFound(format!("Skill: {}", skill_id)).code(),
        &format!("Skill not found in project: {}", skill_id)
    )
}

/// Options for pulling a project skill to the library
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PullOptions {
    pub category_id: Option<String>,
    pub group_id: Option<String>,
}

#[tauri::command]
pub fn project_skill_pull(project_id: String, skill_id: String, options: Option<PullOptions>) -> IpcResult<super::library::LibrarySkill> {
    use super::library::{LibrarySkill, get_library_path, copy_dir_all, SkillMetadataEntry, load_skill_metadata, save_skill_metadata};

    let projects = load_projects();

    let project = projects.iter().find(|p| p.id == project_id);
    let project = match project {
        Some(p) => p,
        None => return IpcResult::error(
            AppError::E003NotFound(format!("Project: {}", project_id)).code(),
            &format!("Project not found: {}", project_id)
        ),
    };

    let project_path = PathBuf::from(&project.path);

    if !project_path.exists() {
        return IpcResult::error(
            AppError::E100FileNotFound(project.path.clone()).code(),
            &format!("Project path no longer exists: {}", project.path)
        );
    }

    let skills_dir = project_path.join(".claude").join("skills");

    // Find the skill folder
    let mut skill_folder: Option<PathBuf> = None;
    let mut folder_name = String::new();

    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let name = path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();

                let is_match = name == skill_id || path.to_string_lossy().contains(&skill_id);

                if is_match {
                    skill_folder = Some(path);
                    folder_name = name;
                    break;
                }
            }
        }
    }

    let source_path = match skill_folder {
        Some(p) => p,
        None => return IpcResult::error(
            AppError::E203SkillNotFound(format!("Skill: {}", skill_id)).code(),
            &format!("Skill not found in project: {}", skill_id)
        ),
    };

    // Copy to library
    let library_path = get_library_path();
    if let Err(e) = fs::create_dir_all(&library_path) {
        return IpcResult::error(
            AppError::E101CreateDirFailed(format!("Library directory: {}", e)).code(),
            &format!("Failed to create library directory: {}", e)
        );
    }

    let dest = library_path.join(&folder_name);

    // Copy the skill folder to library
    if let Err(e) = copy_dir_all(&source_path, &dest) {
        return IpcResult::error(
            AppError::E105CopyFailed(format!("Skill directory: {}", e)).code(),
            &format!("Failed to copy skill to library: {}", e)
        );
    }

    // Create LibrarySkill result
    let skill_md = dest.join("SKILL.md");
    let metadata = parse_skill_md(&skill_md);
    let (size, file_count) = count_files(&dest);
    let (skill_md_lines, skill_md_chars) = count_skill_md_stats(&skill_md);
    let imported_at = chrono::Utc::now().to_rfc3339();
    let skill_id_new = format!("skill-{}", uuid::Uuid::new_v4());

    let (category_id, group_id) = options
        .map(|o| (o.category_id, o.group_id))
        .unwrap_or((None, None));

    let skill = LibrarySkill {
        id: skill_id_new.clone(),
        name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or_else(|| folder_name.clone()),
        folder_name: folder_name.clone(),
        version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
        description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
        path: dest.to_string_lossy().to_string(),
        skill_md_path: skill_md.to_string_lossy().to_string(),
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
        is_symlink: false, // Imported from project, always a copy
    };

    // Persist skill metadata
    let mut persisted_metadata = load_skill_metadata();
    persisted_metadata.insert(folder_name.clone(), SkillMetadataEntry {
        id: skill_id_new,
        folder_name,
        category_id,
        group_id,
        imported_at,
    });
    if let Err(e) = save_skill_metadata(&persisted_metadata) {
        eprintln!("Warning: Failed to save skill metadata after pull: {}", e);
    }

    IpcResult::success(skill)
}

// ============================================================================
// Test Support
// ============================================================================

#[cfg(test)]
use std::cell::RefCell;

#[cfg(test)]
thread_local! {
    static TEST_PROJECTS_PATH: RefCell<Option<PathBuf>> = const { RefCell::new(None) };
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    struct TestContext {
        _temp_dir: TempDir,
    }

    impl TestContext {
        fn new() -> Self {
            let temp_dir = TempDir::new().expect("Failed to create temp dir");
            let projects_path = temp_dir.path().join("projects.json");

            // Set the test path
            TEST_PROJECTS_PATH.with(|p| *p.borrow_mut() = Some(projects_path));

            TestContext { _temp_dir: temp_dir }
        }

        fn create_valid_project(&self, name: &str) -> PathBuf {
            let project_path = self._temp_dir.path().join(name);
            let claude_dir = project_path.join(".claude");
            let skills_dir = claude_dir.join("skills");

            fs::create_dir_all(&skills_dir).expect("Failed to create project structure");
            project_path
        }

        fn create_skill(&self, project_path: &PathBuf, skill_name: &str) {
            let skill_dir = project_path
                .join(".claude")
                .join("skills")
                .join(skill_name);
            fs::create_dir_all(&skill_dir).expect("Failed to create skill dir");

            let skill_md = skill_dir.join("SKILL.md");
            fs::write(
                &skill_md,
                format!(
                    "---\nname: {}\nversion: 1.0.0\ndescription: Test skill\n---\n",
                    skill_name
                ),
            )
            .expect("Failed to write SKILL.md");
        }
    }

    impl Drop for TestContext {
        fn drop(&mut self) {
            // Clear the test path
            TEST_PROJECTS_PATH.with(|p| *p.borrow_mut() = None);
        }
    }

    // ===========================================================================
    // project_add tests
    // ===========================================================================

    #[test]
    fn test_project_add_valid_path() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("my-project");

        let result = project_add(project_path.to_string_lossy().to_string());

        assert!(result.success);
        assert!(result.data.is_some());

        let project = result.data.unwrap();
        assert!(project.id.starts_with("project-"));
        assert_eq!(project.name, "my-project");
        assert_eq!(project.exists, true);
        assert_eq!(project.skill_count, 0);
    }

    #[test]
    fn test_project_add_scans_skills() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("skilled-project");
        ctx.create_skill(&project_path, "skill-one");
        ctx.create_skill(&project_path, "skill-two");

        let result = project_add(project_path.to_string_lossy().to_string());

        assert!(result.success);
        let project = result.data.unwrap();
        assert_eq!(project.skill_count, 2);
    }

    #[test]
    fn test_project_add_rejects_nonexistent_path() {
        let _ctx = TestContext::new();

        let result = project_add("/nonexistent/path".to_string());

        assert!(!result.success);
        assert!(result.error.is_some());
        assert_eq!(result.error.unwrap().code, "E100");
    }

    #[test]
    fn test_project_add_rejects_file_path() {
        let ctx = TestContext::new();
        let file_path = ctx._temp_dir.path().join("file.txt");
        fs::write(&file_path, "content").expect("Failed to write file");

        let result = project_add(file_path.to_string_lossy().to_string());

        assert!(!result.success);
        assert_eq!(result.error.unwrap().code, "E002");
    }

    #[test]
    fn test_project_add_rejects_missing_claude_dir() {
        let ctx = TestContext::new();
        let project_path = ctx._temp_dir.path().join("no-claude-project");
        fs::create_dir_all(&project_path).expect("Failed to create dir");

        let result = project_add(project_path.to_string_lossy().to_string());

        assert!(!result.success);
        assert_eq!(result.error.unwrap().code, "E003");
    }

    #[test]
    fn test_project_add_rejects_duplicate_path() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("duplicate-project");

        let first = project_add(project_path.to_string_lossy().to_string());
        assert!(first.success);

        let second = project_add(project_path.to_string_lossy().to_string());
        assert!(!second.success);
        assert_eq!(second.error.unwrap().code, "E002");
    }

    // ===========================================================================
    // project_list tests
    // ===========================================================================

    #[test]
    fn test_project_list_empty() {
        let _ctx = TestContext::new();

        let result = project_list();

        assert!(result.success);
        assert!(result.data.unwrap().is_empty());
    }

    #[test]
    fn test_project_list_returns_projects() {
        let ctx = TestContext::new();
        let path1 = ctx.create_valid_project("project-1");
        let path2 = ctx.create_valid_project("project-2");

        project_add(path1.to_string_lossy().to_string());
        project_add(path2.to_string_lossy().to_string());

        let result = project_list();

        assert!(result.success);
        let projects = result.data.unwrap();
        assert_eq!(projects.len(), 2);
    }

    #[test]
    fn test_project_list_marks_exists_status() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("existing-project");

        project_add(project_path.to_string_lossy().to_string());

        let result = project_list();
        let projects = result.data.unwrap();

        assert_eq!(projects[0].exists, true);
    }

    #[test]
    fn test_project_list_marks_nonexistent_status() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("deleted-project");

        project_add(project_path.to_string_lossy().to_string());

        // Delete the project directory
        fs::remove_dir_all(&project_path).expect("Failed to remove dir");

        let result = project_list();
        let projects = result.data.unwrap();

        assert_eq!(projects[0].exists, false);
        assert_eq!(projects[0].skill_count, 0);
    }

    // ===========================================================================
    // project_remove tests
    // ===========================================================================

    #[test]
    fn test_project_remove_existing() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("to-remove");

        let added = project_add(project_path.to_string_lossy().to_string());
        let project_id = added.data.unwrap().id;

        let result = project_remove(project_id);

        assert!(result.success);

        // Verify removal
        let list = project_list();
        assert!(list.data.unwrap().is_empty());
    }

    #[test]
    fn test_project_remove_nonexistent_id() {
        let _ctx = TestContext::new();

        let result = project_remove("project-nonexistent-id".to_string());

        assert!(!result.success);
        assert_eq!(result.error.unwrap().code, "E003");
    }

    #[test]
    fn test_project_remove_only_targets_specific_id() {
        let ctx = TestContext::new();
        let path1 = ctx.create_valid_project("keep-project");
        let path2 = ctx.create_valid_project("remove-project");

        let _added1 = project_add(path1.to_string_lossy().to_string());
        let added2 = project_add(path2.to_string_lossy().to_string());

        let result = project_remove(added2.data.unwrap().id);

        assert!(result.success);

        let list = project_list();
        let remaining = list.data.unwrap();
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].name, "keep-project");
    }

    // ===========================================================================
    // project_skills tests
    // ===========================================================================

    #[test]
    fn test_project_skills_returns_list() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("skills-project");
        ctx.create_skill(&project_path, "test-skill");

        let added = project_add(project_path.to_string_lossy().to_string());
        let project_id = added.data.unwrap().id;

        let result = project_skills(project_id);

        assert!(result.success);
        let skills = result.data.unwrap();
        assert_eq!(skills.len(), 1);
        assert_eq!(skills[0].name, "test-skill");
        assert_eq!(skills[0].version, "1.0.0");
    }

    #[test]
    fn test_project_skills_empty_for_no_skills() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("empty-project");

        let added = project_add(project_path.to_string_lossy().to_string());
        let project_id = added.data.unwrap().id;

        let result = project_skills(project_id);

        assert!(result.success);
        assert!(result.data.unwrap().is_empty());
    }

    #[test]
    fn test_project_skills_nonexistent_project() {
        let _ctx = TestContext::new();

        let result = project_skills("project-nonexistent".to_string());

        assert!(!result.success);
        assert_eq!(result.error.unwrap().code, "E003");
    }

    #[test]
    fn test_project_skills_deleted_project_path() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("deleted-path-project");

        let added = project_add(project_path.to_string_lossy().to_string());
        let project_id = added.data.unwrap().id;

        // Delete the project directory
        fs::remove_dir_all(&project_path).expect("Failed to remove dir");

        let result = project_skills(project_id);

        assert!(!result.success);
        assert_eq!(result.error.unwrap().code, "E100");
    }

    #[test]
    fn test_project_skill_has_correct_fields() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("field-test-project");
        ctx.create_skill(&project_path, "complete-skill");

        let added = project_add(project_path.to_string_lossy().to_string());
        let project_id = added.data.unwrap().id;

        let result = project_skills(project_id.clone());
        let skill = &result.data.unwrap()[0];

        assert_eq!(skill.id, "complete-skill");
        assert_eq!(skill.folder_name, "complete-skill");
        assert_eq!(skill.version, "1.0.0");
        assert_eq!(skill.description, "Test skill");
        assert!(skill.path.ends_with("complete-skill"));
        assert!(skill.skill_md_path.ends_with("SKILL.md"));
        assert_eq!(skill.project_id, project_id);
        assert_eq!(skill.has_resources, false);
    }

    // ===========================================================================
    // project_refresh tests
    // ===========================================================================

    #[test]
    fn test_project_refresh_specific_project() {
        let ctx = TestContext::new();
        let project_path = ctx.create_valid_project("refresh-project");

        // Add project before creating skill
        let added = project_add(project_path.to_string_lossy().to_string());
        let project_id = added.data.unwrap().id;

        // Initial skill count is 0
        let before = project_list();
        let before_project = &before.data.unwrap()[0];
        assert_eq!(before_project.skill_count, 0);

        // Create skill after project is added
        ctx.create_skill(&project_path, "new-skill");

        // Refresh
        let result = project_refresh(Some(project_id.clone()));
        assert!(result.success);

        // After refresh, skill count should be 1
        let after = project_list();
        let after_project = &after.data.unwrap()[0];
        assert_eq!(after_project.skill_count, 1);
    }

    #[test]
    fn test_project_refresh_all_projects() {
        let ctx = TestContext::new();
        let path1 = ctx.create_valid_project("refresh-all-1");
        let path2 = ctx.create_valid_project("refresh-all-2");

        ctx.create_skill(&path1, "skill-a");

        let id1 = project_add(path1.to_string_lossy().to_string()).data.unwrap().id;
        let _id2 = project_add(path2.to_string_lossy().to_string()).data.unwrap().id;

        // Refresh all
        let result = project_refresh(None);
        assert!(result.success);

        let list = project_list();
        let projects = list.data.unwrap();

        let p1 = projects.iter().find(|p| p.id == id1).unwrap();
        assert_eq!(p1.skill_count, 1);
    }

    #[test]
    fn test_project_refresh_nonexistent_project() {
        let _ctx = TestContext::new();

        let result = project_refresh(Some("project-nonexistent".to_string()));

        assert!(!result.success);
        assert_eq!(result.error.unwrap().code, "E003");
    }
}
