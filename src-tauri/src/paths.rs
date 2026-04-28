use std::path::PathBuf;

pub const APP_NAME: &str = "OpenSkillsManager";
pub const APP_IDENTIFIER: &str = "com.alex.openskillsmanager";
pub const LEGACY_APP_NAME: &str = "claude-code-skills-manager";
pub const LEGACY_IDENTIFIER: &str = "com.alex.claude-code-skills-manager";

fn get_home_dir() -> PathBuf {
    std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string()).into()
}

// ============================================================================
// App Support Paths (Local Storage)
// ============================================================================

/// Get the main app support directory
/// ~/Library/Application Support/OpenSkillsManager/
pub fn get_app_support_path() -> PathBuf {
    get_home_dir()
        .join("Library")
        .join("Application Support")
        .join(APP_NAME)
}

/// Get the unified config file path
/// ~/Library/Application Support/OpenSkillsManager/config.json
pub fn get_config_path() -> PathBuf {
    get_app_support_path().join("config.json")
}

/// Get the legacy app support path (for migration)
/// ~/Library/Application Support/claude-code-skills-manager/
pub fn get_legacy_app_support_path() -> PathBuf {
    get_home_dir()
        .join("Library")
        .join("Application Support")
        .join(LEGACY_APP_NAME)
}

/// Get legacy groups.json path (for migration)
pub fn get_legacy_groups_path() -> PathBuf {
    get_legacy_app_support_path().join("groups.json")
}

/// Get legacy skill_metadata.json path (for migration)
pub fn get_legacy_skill_metadata_path() -> PathBuf {
    get_legacy_app_support_path().join("skill_metadata.json")
}

/// Get legacy projects.json path (for migration)
pub fn get_legacy_projects_path() -> PathBuf {
    get_legacy_app_support_path().join("projects.json")
}

// ============================================================================
// iCloud Paths
// ============================================================================

/// Get the iCloud container path
/// ~/Library/Mobile Documents/com~apple~CloudDocs/OpenSkillsManager/
pub fn get_icloud_container_path() -> PathBuf {
    get_home_dir()
        .join("Library")
        .join("Mobile Documents")
        .join("com~apple~CloudDocs")
        .join(APP_NAME)
}

/// Get the library path (skills stored in iCloud)
/// ~/Library/Mobile Documents/com~apple~CloudDocs/OpenSkillsManager/library/
pub fn get_library_path() -> PathBuf {
    get_icloud_container_path().join("library")
}

/// Get the metadata path (skill organization)
/// ~/Library/Mobile Documents/com~apple~CloudDocs/OpenSkillsManager/metadata/
pub fn get_metadata_path() -> PathBuf {
    get_icloud_container_path().join("metadata")
}

/// Get the skill organization file path
/// ~/Library/Mobile Documents/com~apple~CloudDocs/OpenSkillsManager/metadata/skill-org.json
pub fn get_skill_org_path() -> PathBuf {
    get_metadata_path().join("skill-org.json")
}

/// Get legacy iCloud library path (for migration)
/// ~/Library/Mobile Documents/com~apple~CloudDocs/ClaudeCode/Skills/
pub fn get_legacy_library_path() -> PathBuf {
    get_home_dir()
        .join("Library")
        .join("Mobile Documents")
        .join("com~apple~CloudDocs")
        .join("ClaudeCode")
        .join("Skills")
}

/// Get legacy iCloud container path (for migration)
/// ~/Library/Mobile Documents/com~apple~CloudDocs/com.alex.claude-code-skills-manager/
pub fn get_legacy_icloud_container_path() -> PathBuf {
    get_home_dir()
        .join("Library")
        .join("Mobile Documents")
        .join("com~apple~CloudDocs")
        .join(LEGACY_IDENTIFIER)
}

// ============================================================================
// Local Cache Path (Fallback)
// ============================================================================

/// Get the local cache path (fallback when iCloud unavailable)
/// ~/Library/Caches/OpenSkillsManager/
pub fn get_local_cache_path() -> PathBuf {
    get_home_dir()
        .join("Library")
        .join("Caches")
        .join(APP_NAME)
}

// ============================================================================
// IDE-Specific Paths
// ============================================================================

/// Expand tilde in path strings
pub fn expand_tilde(path: &str) -> PathBuf {
    if path.starts_with("~/") {
        get_home_dir().join(&path[2..])
    } else {
        PathBuf::from(path)
    }
}

/// Get global scope path for a specific IDE
/// Claude Code: ~/.claude/skills/
/// OpenCode: ~/.config/opencode/skills/
pub fn get_global_scope_path(global_scope_path: &str) -> PathBuf {
    expand_tilde(global_scope_path)
}

/// Get project scope path for a specific IDE
/// Claude Code: <project>/.claude/skills/
/// OpenCode: <project>/.opencode/skills/
pub fn get_project_scope_path(project_path: &PathBuf, project_scope_name: &str) -> PathBuf {
    project_path.join(project_scope_name).join("skills")
}

// ============================================================================
// Directory Creation Helpers
// ============================================================================

/// Ensure the app support directory exists
pub fn ensure_app_support_path() -> Result<(), String> {
    let path = get_app_support_path();
    std::fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create app support directory: {}", e))
}

/// Ensure the iCloud container structure exists
pub fn ensure_icloud_structure() -> Result<(), String> {
    let container = get_icloud_container_path();
    let library = get_library_path();
    let metadata = get_metadata_path();

    std::fs::create_dir_all(&container)
        .map_err(|e| format!("Failed to create iCloud container: {}", e))?;
    std::fs::create_dir_all(&library)
        .map_err(|e| format!("Failed to create library directory: {}", e))?;
    std::fs::create_dir_all(&metadata)
        .map_err(|e| format!("Failed to create metadata directory: {}", e))?;

    Ok(())
}

/// Check if iCloud is available
pub fn icloud_is_available() -> bool {
    let container = get_icloud_container_path();
    container.exists() || std::fs::create_dir_all(&container).is_ok()
}

/// Check if legacy data exists (for migration)
pub fn legacy_data_exists() -> bool {
    get_legacy_app_support_path().exists() || get_legacy_library_path().exists()
}

/// Check if new config exists
pub fn config_exists() -> bool {
    get_config_path().exists()
}
