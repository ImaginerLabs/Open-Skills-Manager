use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;

use super::library::IpcResult;
use super::AppError;
use crate::paths;
use crate::storage::Group;
use crate::utils::logger::{log, LogLevel, LogSource};

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
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0001",
                "Config loaded successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "version": config.version,
                    "active_ide": config.active_ide_id,
                })),
                None,
            );
            IpcResult::success(config)
        },
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0001",
                &format!("Failed to load config: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_set(config: OpenSkillsManagerConfig) -> IpcResult<()> {
    let version = config.version.clone();
    let active_ide = config.active_ide_id.clone();

    match save_config(&config) {
        Ok(()) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0002",
                "Config saved successfully",
                LogSource::Backend,
                Some(serde_json::json!({
                    "version": version,
                    "active_ide": active_ide,
                })),
                None,
            );
            IpcResult::success(())
        },
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0002",
                &format!("Failed to save config: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_set_settings(settings: Settings) -> IpcResult<OpenSkillsManagerConfig> {
    let settings_summary = serde_json::json!({
        "theme": &settings.theme,
        "language": &settings.language,
        "auto_update_check": settings.auto_update_check,
        "auto_refresh_interval": settings.auto_refresh_interval,
    });

    match update_config(|config| {
        config.settings = settings;
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0003",
                "Settings updated successfully",
                LogSource::Backend,
                Some(settings_summary),
                None,
            );
            IpcResult::success(config)
        },
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0003",
                &format!("Failed to update settings: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
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

            log(
                LogLevel::Info,
                "CONFIG",
                "I0004",
                "Active IDE retrieved",
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": &active_ide.id,
                    "ide_name": &active_ide.name,
                })),
                None,
            );
            IpcResult::success(active_ide)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0004",
                &format!("Failed to get active IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_set_active_ide(ide_id: String) -> IpcResult<OpenSkillsManagerConfig> {
    let ide_id_clone = ide_id.clone();

    match update_config(|config| {
        // Verify IDE exists
        if config.ide_configs.iter().any(|ide| ide.id == ide_id) {
            config.active_ide_id = ide_id;
        }
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0005",
                "Active IDE changed",
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": ide_id_clone,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0005",
                &format!("Failed to set active IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": ide_id_clone,
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_add_ide(ide_config: IDEConfig) -> IpcResult<OpenSkillsManagerConfig> {
    let ide_id = ide_config.id.clone();
    let ide_name = ide_config.name.clone();

    match update_config(|config| {
        // Check if IDE already exists
        if !config.ide_configs.iter().any(|ide| ide.id == ide_config.id) {
            config.ide_configs.push(ide_config);
        }
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0006",
                "IDE added",
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": ide_id,
                    "ide_name": ide_name,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0006",
                &format!("Failed to add IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": ide_id,
                    "ide_name": ide_name,
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_remove_ide(ide_id: String) -> IpcResult<OpenSkillsManagerConfig> {
    let ide_id_clone = ide_id.clone();

    match update_config(|config| {
        config.ide_configs.retain(|ide| ide.id != ide_id);
        // If removed IDE was active, switch to first available
        if config.active_ide_id == ide_id {
            config.active_ide_id = config.ide_configs.first()
                .map(|ide| ide.id.clone())
                .unwrap_or_default();
        }
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0007",
                "IDE removed",
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": ide_id_clone,
                    "new_active_ide": &config.active_ide_id,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0007",
                &format!("Failed to remove IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": ide_id_clone,
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_update_ide(ide_id: String, ide_config: IDEConfig) -> IpcResult<OpenSkillsManagerConfig> {
    let ide_id_clone = ide_id.clone();
    let ide_name = ide_config.name.clone();

    match update_config(|config| {
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == ide_id) {
            *ide = ide_config;
        }
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0008",
                "IDE updated",
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": ide_id_clone,
                    "ide_name": ide_name,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0008",
                &format!("Failed to update IDE: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": ide_id_clone,
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

// ============================================================================
// Project Management Commands (IDE-specific)
// ============================================================================

#[tauri::command]
pub fn config_get_projects(ide_id: Option<String>) -> IpcResult<Vec<Project>> {
    match load_config() {
        Ok(config) => {
            let target_ide_id = ide_id.unwrap_or(config.active_ide_id.clone());
            let projects = config.ide_configs.iter()
                .find(|ide| ide.id == target_ide_id)
                .map(|ide| ide.projects.clone())
                .unwrap_or_default();

            log(
                LogLevel::Info,
                "CONFIG",
                "I0009",
                "Projects retrieved",
                LogSource::Backend,
                Some(serde_json::json!({
                    "ide_id": target_ide_id,
                    "project_count": projects.len(),
                })),
                None,
            );
            IpcResult::success(projects)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0009",
                &format!("Failed to get projects: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_add_project(ide_id: Option<String>, project: Project) -> IpcResult<OpenSkillsManagerConfig> {
    let project_id = project.id.clone();
    let project_name = project.name.clone();
    let project_path = project.path.clone();

    match update_config(|config| {
        let target_ide_id = ide_id.unwrap_or_else(|| config.active_ide_id.clone());
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == target_ide_id) {
            // Check if project already exists
            if !ide.projects.iter().any(|p| p.path == project.path) {
                ide.projects.push(project);
            }
        }
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0010",
                "Project added",
                LogSource::Backend,
                Some(serde_json::json!({
                    "project_id": project_id,
                    "project_name": project_name,
                    "project_path": project_path,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0010",
                &format!("Failed to add project: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "project_id": project_id,
                    "project_name": project_name,
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_remove_project(ide_id: Option<String>, project_id: String) -> IpcResult<OpenSkillsManagerConfig> {
    let project_id_clone = project_id.clone();

    match update_config(|config| {
        let target_ide_id = ide_id.unwrap_or_else(|| config.active_ide_id.clone());
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == target_ide_id) {
            ide.projects.retain(|p| p.id != project_id);
        }
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0011",
                "Project removed",
                LogSource::Backend,
                Some(serde_json::json!({
                    "project_id": project_id_clone,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0011",
                &format!("Failed to remove project: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "project_id": project_id_clone,
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_update_project(ide_id: Option<String>, project: Project) -> IpcResult<OpenSkillsManagerConfig> {
    let project_id = project.id.clone();
    let project_name = project.name.clone();

    match update_config(|config| {
        let target_ide_id = ide_id.unwrap_or_else(|| config.active_ide_id.clone());
        if let Some(ide) = config.ide_configs.iter_mut().find(|ide| ide.id == target_ide_id) {
            if let Some(p) = ide.projects.iter_mut().find(|p| p.id == project.id) {
                *p = project;
            }
        }
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0012",
                "Project updated",
                LogSource::Backend,
                Some(serde_json::json!({
                    "project_id": project_id,
                    "project_name": project_name,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0012",
                &format!("Failed to update project: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "project_id": project_id,
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

// ============================================================================
// Groups Management Commands
// ============================================================================

#[tauri::command]
pub fn config_get_groups() -> IpcResult<Vec<Group>> {
    match load_config() {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0013",
                "Groups retrieved",
                LogSource::Backend,
                Some(serde_json::json!({
                    "group_count": config.groups.len(),
                })),
                None,
            );
            IpcResult::success(config.groups)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0013",
                &format!("Failed to get groups: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_set_groups(groups: Vec<Group>) -> IpcResult<OpenSkillsManagerConfig> {
    let group_count = groups.len();

    match update_config(|config| {
        config.groups = groups;
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0014",
                "Groups updated",
                LogSource::Backend,
                Some(serde_json::json!({
                    "group_count": group_count,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0014",
                &format!("Failed to set groups: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

// ============================================================================
// Skill Organization Commands
// ============================================================================

#[tauri::command]
pub fn config_get_skill_org() -> IpcResult<HashMap<String, SkillOrgEntry>> {
    match load_config() {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0015",
                "Skill organization retrieved",
                LogSource::Backend,
                Some(serde_json::json!({
                    "entry_count": config.skill_organization.len(),
                })),
                None,
            );
            IpcResult::success(config.skill_organization)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0015",
                &format!("Failed to get skill organization: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E103ReadFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_set_skill_org(folder_name: String, entry: SkillOrgEntry) -> IpcResult<OpenSkillsManagerConfig> {
    let folder_name_clone = folder_name.clone();

    match update_config(|config| {
        config.skill_organization.insert(folder_name, entry);
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0016",
                "Skill organization entry set",
                LogSource::Backend,
                Some(serde_json::json!({
                    "folder_name": folder_name_clone,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0016",
                &format!("Failed to set skill organization entry: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "folder_name": folder_name_clone,
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

#[tauri::command]
pub fn config_remove_skill_org(folder_name: String) -> IpcResult<OpenSkillsManagerConfig> {
    let folder_name_clone = folder_name.clone();

    match update_config(|config| {
        config.skill_organization.remove(&folder_name);
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0017",
                "Skill organization entry removed",
                LogSource::Backend,
                Some(serde_json::json!({
                    "folder_name": folder_name_clone,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0017",
                &format!("Failed to remove skill organization entry: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "folder_name": folder_name_clone,
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

// ============================================================================
// Sync Settings Commands
// ============================================================================

#[tauri::command]
pub fn config_set_sync_settings(sync: SyncSettings) -> IpcResult<OpenSkillsManagerConfig> {
    let sync_enabled = sync.enabled;
    let sync_interval = sync.interval_minutes;

    match update_config(|config| {
        config.sync = sync;
    }) {
        Ok(config) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0018",
                "Sync settings updated",
                LogSource::Backend,
                Some(serde_json::json!({
                    "enabled": sync_enabled,
                    "interval_minutes": sync_interval,
                })),
                None,
            );
            IpcResult::success(config)
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0018",
                &format!("Failed to update sync settings: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "error": e.clone(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.clone()).code(),
                &e,
            )
        }
    }
}

// ============================================================================
// Migration Check Command
// ============================================================================

#[tauri::command]
pub fn config_needs_migration() -> IpcResult<bool> {
    // Check if new config exists
    if paths::config_exists() {
        log(
            LogLevel::Info,
            "CONFIG",
            "I0019",
            "Migration check completed - no migration needed",
            LogSource::Backend,
            Some(serde_json::json!({
                "needs_migration": false,
            })),
            None,
        );
        return IpcResult::success(false);
    }

    // Check if legacy data exists
    let needs_migration = paths::legacy_data_exists();
    log(
        LogLevel::Info,
        "CONFIG",
        "I0020",
        "Migration check completed",
        LogSource::Backend,
        Some(serde_json::json!({
            "needs_migration": needs_migration,
        })),
        None,
    );
    IpcResult::success(needs_migration)
}

// ============================================================================
// Path Utilities Commands
// ============================================================================

/// Get the application data directory path
/// ~/Library/Application Support/OpenSkillsManager/
#[tauri::command]
pub fn config_app_data_path() -> IpcResult<String> {
    let path = paths::get_app_support_path();
    let path_str = path.to_string_lossy().to_string();

    log(
        LogLevel::Info,
        "CONFIG",
        "I0021",
        "App data path retrieved",
        LogSource::Backend,
        Some(serde_json::json!({
            "path": &path_str,
        })),
        None,
    );

    IpcResult::success(path_str)
}

/// Reveal a path in Finder (macOS) or default file manager
#[tauri::command]
pub fn config_reveal_path(path: String) -> IpcResult<()> {
    let path_buf = std::path::PathBuf::from(&path);

    if !path_buf.exists() {
        log(
            LogLevel::Error,
            "CONFIG",
            "E0019",
            "Path does not exist for reveal",
            LogSource::Backend,
            Some(serde_json::json!({
                "path": &path,
            })),
            None,
        );
        return IpcResult::error(
            AppError::E103ReadFailed("Path does not exist".to_string()).code(),
            &format!("Path does not exist: {}", path),
        );
    }

    match tauri_plugin_opener::reveal_item_in_dir(&path_buf) {
        Ok(()) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0022",
                "Path revealed in file manager",
                LogSource::Backend,
                Some(serde_json::json!({
                    "path": &path,
                })),
                None,
            );
            IpcResult::success(())
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0020",
                &format!("Failed to reveal path: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "path": &path,
                    "error": e.to_string(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.to_string()).code(),
                &format!("Failed to reveal path: {}", e),
            )
        }
    }
}

/// Open a path directly in Finder (macOS) or default file manager
#[tauri::command]
pub fn config_open_path(path: String) -> IpcResult<()> {
    let path_buf = std::path::PathBuf::from(&path);

    if !path_buf.exists() {
        log(
            LogLevel::Error,
            "CONFIG",
            "E0021",
            "Path does not exist for open",
            LogSource::Backend,
            Some(serde_json::json!({
                "path": &path,
            })),
            None,
        );
        return IpcResult::error(
            AppError::E103ReadFailed("Path does not exist".to_string()).code(),
            &format!("Path does not exist: {}", path),
        );
    }

    match tauri_plugin_opener::open_path(&path_buf, None::<&str>) {
        Ok(()) => {
            log(
                LogLevel::Info,
                "CONFIG",
                "I0023",
                "Path opened in file manager",
                LogSource::Backend,
                Some(serde_json::json!({
                    "path": &path,
                })),
                None,
            );
            IpcResult::success(())
        }
        Err(e) => {
            log(
                LogLevel::Error,
                "CONFIG",
                "E0022",
                &format!("Failed to open path: {}", e),
                LogSource::Backend,
                Some(serde_json::json!({
                    "path": &path,
                    "error": e.to_string(),
                })),
                None,
            );
            IpcResult::error(
                AppError::E102WriteFailed(e.to_string()).code(),
                &format!("Failed to open path: {}", e),
            )
        }
    }
}
