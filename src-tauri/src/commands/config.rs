use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;

use super::library::IpcResult;
use super::AppError;
use crate::paths;
use crate::storage::Group;

// ============================================================================
// Config Version
// ============================================================================

pub const CONFIG_VERSION: &str = "1.0.0";

// ============================================================================
// Data Types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub theme: String,
    pub language: String,
    pub auto_update_check: bool,
    pub auto_refresh_interval: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_import_category: Option<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            language: "auto".to_string(),
            auto_update_check: true,
            auto_refresh_interval: 5,
            default_import_category: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IDEConfig {
    pub id: String,
    pub name: String,
    pub global_scope_path: String,
    pub project_scope_name: String,
    pub projects: Vec<Project>,
    pub is_enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
}

impl Default for IDEConfig {
    fn default() -> Self {
        Self {
            id: "claude-code".to_string(),
            name: "Claude Code".to_string(),
            global_scope_path: "~/.claude/skills".to_string(),
            project_scope_name: ".claude".to_string(),
            projects: vec![],
            is_enabled: true,
            icon: Some("claude-code".to_string()),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skills_path: Option<String>,
    pub exists: bool,
    pub skill_count: u32,
    pub added_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_accessed: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_scanned_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncSettings {
    pub enabled: bool,
    pub interval_minutes: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_sync_time: Option<String>,
}

impl Default for SyncSettings {
    fn default() -> Self {
        Self {
            enabled: true,
            interval_minutes: 5,
            last_sync_time: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillOrgEntry {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<String>,
    pub imported_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenSkillsManagerConfig {
    pub version: String,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_by: Option<String>,  // client_id of last modifier
    pub settings: Settings,
    #[serde(default)]
    pub groups: Vec<Group>,
    pub ide_configs: Vec<IDEConfig>,
    pub active_ide_id: String,
    pub sync: SyncSettings,
    #[serde(default)]
    pub skill_organization: HashMap<String, SkillOrgEntry>,
}

impl Default for OpenSkillsManagerConfig {
    fn default() -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            version: CONFIG_VERSION.to_string(),
            created_at: now.clone(),
            updated_at: now,
            updated_by: None,
            settings: Settings::default(),
            groups: vec![],
            ide_configs: get_default_ide_configs(),
            active_ide_id: "claude-code".to_string(),
            sync: SyncSettings::default(),
            skill_organization: HashMap::new(),
        }
    }
}

// ============================================================================
// Default IDE Configs
// ============================================================================

pub fn get_default_ide_configs() -> Vec<IDEConfig> {
    vec![
        IDEConfig {
            id: "claude-code".to_string(),
            name: "Claude Code".to_string(),
            global_scope_path: "~/.claude/skills".to_string(),
            project_scope_name: ".claude".to_string(),
            projects: vec![],
            is_enabled: true,
            icon: Some("claude-code".to_string()),
        },
        IDEConfig {
            id: "opencode".to_string(),
            name: "OpenCode".to_string(),
            global_scope_path: "~/.config/opencode/skills".to_string(),
            project_scope_name: ".opencode".to_string(),
            projects: vec![],
            is_enabled: true,
            icon: Some("opencode".to_string()),
        },
        IDEConfig {
            id: "cursor".to_string(),
            name: "Cursor".to_string(),
            global_scope_path: "~/.cursor/skills".to_string(),
            project_scope_name: ".cursor".to_string(),
            projects: vec![],
            is_enabled: true,
            icon: Some("cursor".to_string()),
        },
        IDEConfig {
            id: "gemini".to_string(),
            name: "Gemini CLI".to_string(),
            global_scope_path: "~/.gemini/skills".to_string(),
            project_scope_name: ".gemini".to_string(),
            projects: vec![],
            is_enabled: true,
            icon: Some("gemini".to_string()),
        },
    ]
}

// ============================================================================
// Config File Operations
// ============================================================================

pub fn load_config() -> Result<OpenSkillsManagerConfig, String> {
    let config_path = paths::get_config_path();

    if !config_path.exists() {
        // Create default config
        let config = OpenSkillsManagerConfig::default();
        save_config(&config)?;
        return Ok(config);
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;

    let config: OpenSkillsManagerConfig = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse config: {}", e))?;

    Ok(config)
}

pub fn save_config(config: &OpenSkillsManagerConfig) -> Result<(), String> {
    // Ensure directory exists
    paths::ensure_app_support_path()?;

    let config_path = paths::get_config_path();
    let content = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

pub fn update_config<F>(f: F) -> Result<OpenSkillsManagerConfig, String>
where
    F: FnOnce(&mut OpenSkillsManagerConfig),
{
    let mut config = load_config()?;
    f(&mut config);
    config.updated_at = chrono::Utc::now().to_rfc3339();
    save_config(&config)?;

    // Trigger full sync in background
    super::sync::trigger_full_sync();

    Ok(config)
}

// ============================================================================
// IPC Commands
// ============================================================================

#[tauri::command]
pub fn config_get() -> IpcResult<OpenSkillsManagerConfig> {
    match load_config() {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_set(config: OpenSkillsManagerConfig) -> IpcResult<()> {
    match save_config(&config) {
        Ok(()) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_set_settings(settings: Settings) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        config.settings = settings;
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// IDE Management Commands
// ============================================================================

#[tauri::command]
pub fn config_get_active_ide() -> IpcResult<IDEConfig> {
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
pub fn config_set_active_ide(ide_id: String) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        // Verify IDE exists
        if config.ide_configs.iter().any(|ide| ide.id == ide_id) {
            config.active_ide_id = ide_id;
        }
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_add_ide(ide_config: IDEConfig) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        // Check if IDE already exists
        if !config.ide_configs.iter().any(|ide| ide.id == ide_config.id) {
            config.ide_configs.push(ide_config);
        }
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_remove_ide(ide_id: String) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        config.ide_configs.retain(|ide| ide.id != ide_id);
        // If removed IDE was active, switch to first available
        if config.active_ide_id == ide_id {
            config.active_ide_id = config.ide_configs.first()
                .map(|ide| ide.id.clone())
                .unwrap_or_default();
        }
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_update_ide(ide_id: String, ide_config: IDEConfig) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == ide_id) {
            *ide = ide_config;
        }
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Project Management Commands (IDE-specific)
// ============================================================================

#[tauri::command]
pub fn config_get_projects(ide_id: Option<String>) -> IpcResult<Vec<Project>> {
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
pub fn config_add_project(ide_id: Option<String>, project: Project) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        let target_ide_id = ide_id.unwrap_or_else(|| config.active_ide_id.clone());
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == target_ide_id) {
            // Check if project already exists
            if !ide.projects.iter().any(|p| p.path == project.path) {
                ide.projects.push(project);
            }
        }
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_remove_project(ide_id: Option<String>, project_id: String) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        let target_ide_id = ide_id.unwrap_or_else(|| config.active_ide_id.clone());
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == target_ide_id) {
            ide.projects.retain(|p| p.id != project_id);
        }
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_update_project(ide_id: Option<String>, project: Project) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        let target_ide_id = ide_id.unwrap_or_else(|| config.active_ide_id.clone());
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == target_ide_id) {
            if let Some(p) = ide.projects.iter_mut().find(|p| p.id == project.id) {
                *p = project;
            }
        }
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Groups Management Commands
// ============================================================================

#[tauri::command]
pub fn config_get_groups() -> IpcResult<Vec<Group>> {
    match load_config() {
        Ok(config) => IpcResult::success(config.groups),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_set_groups(groups: Vec<Group>) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        config.groups = groups;
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Skill Organization Commands
// ============================================================================

#[tauri::command]
pub fn config_get_skill_org() -> IpcResult<HashMap<String, SkillOrgEntry>> {
    match load_config() {
        Ok(config) => IpcResult::success(config.skill_organization),
        Err(e) => IpcResult::error(
            AppError::E103ReadFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_set_skill_org(folder_name: String, entry: SkillOrgEntry) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        config.skill_organization.insert(folder_name, entry);
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

#[tauri::command]
pub fn config_remove_skill_org(folder_name: String) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        config.skill_organization.remove(&folder_name);
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Sync Settings Commands
// ============================================================================

#[tauri::command]
pub fn config_set_sync_settings(sync: SyncSettings) -> IpcResult<OpenSkillsManagerConfig> {
    match update_config(|config| {
        config.sync = sync;
    }) {
        Ok(config) => IpcResult::success(config),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.clone()).code(),
            &e,
        ),
    }
}

// ============================================================================
// Migration Check Command
// ============================================================================

#[tauri::command]
pub fn config_needs_migration() -> IpcResult<bool> {
    // Check if new config exists
    if paths::config_exists() {
        return IpcResult::success(false);
    }

    // Check if legacy data exists
    IpcResult::success(paths::legacy_data_exists())
}

// ============================================================================
// Path Utilities Commands
// ============================================================================

/// Get the application data directory path
/// ~/Library/Application Support/OpenSkillsManager/
#[tauri::command]
pub fn config_app_data_path() -> IpcResult<String> {
    let path = paths::get_app_support_path();
    IpcResult::success(path.to_string_lossy().to_string())
}

/// Reveal a path in Finder (macOS) or default file manager
#[tauri::command]
pub fn config_reveal_path(path: String) -> IpcResult<()> {
    let path_buf = std::path::PathBuf::from(&path);

    if !path_buf.exists() {
        return IpcResult::error(
            AppError::E103ReadFailed("Path does not exist".to_string()).code(),
            &format!("Path does not exist: {}", path),
        );
    }

    match tauri_plugin_opener::reveal_item_in_dir(&path_buf) {
        Ok(()) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.to_string()).code(),
            &format!("Failed to reveal path: {}", e),
        ),
    }
}

/// Open a path directly in Finder (macOS) or default file manager
#[tauri::command]
pub fn config_open_path(path: String) -> IpcResult<()> {
    let path_buf = std::path::PathBuf::from(&path);

    if !path_buf.exists() {
        return IpcResult::error(
            AppError::E103ReadFailed("Path does not exist".to_string()).code(),
            &format!("Path does not exist: {}", path),
        );
    }

    match tauri_plugin_opener::open_path(&path_buf, None::<&str>) {
        Ok(()) => IpcResult::success(()),
        Err(e) => IpcResult::error(
            AppError::E102WriteFailed(e.to_string()).code(),
            &format!("Failed to open path: {}", e),
        ),
    }
}
