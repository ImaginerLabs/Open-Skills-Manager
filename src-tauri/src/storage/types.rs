// Data types for unified storage

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// AppConfig - Stored in config.json (low frequency changes)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub version: String,
    pub created_at: String,
    pub updated_at: String,
    pub updated_by: String,

    // User settings
    pub settings: Settings,
    pub sync_enabled: bool,

    // IDE configuration
    pub ide_configs: Vec<IDEConfig>,
    pub active_ide_id: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            version: "2.0.0".to_string(),
            created_at: now.clone(),
            updated_at: now,
            updated_by: String::new(),
            settings: Settings::default(),
            sync_enabled: true,
            ide_configs: get_default_ide_configs(),
            active_ide_id: "claude-code".to_string(),
        }
    }
}

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
            is_enabled: false,
            icon: Some("cursor".to_string()),
        },
        IDEConfig {
            id: "gemini".to_string(),
            name: "Gemini CLI".to_string(),
            global_scope_path: "~/.gemini/skills".to_string(),
            project_scope_name: ".gemini".to_string(),
            projects: vec![],
            is_enabled: false,
            icon: Some("gemini".to_string()),
        },
    ]
}

// ============================================================================
// LibraryData - Stored in library.json (high frequency changes)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryData {
    pub version: u64,  // Optimistic lock version
    pub updated_at: String,
    pub updated_by: String,
    pub groups: Vec<Group>,
    pub skills: HashMap<String, SkillEntry>,  // folder_name -> entry
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub deleted_skills: HashMap<String, DeletedRecord>,  // tombstones for deleted skills
}

/// Tombstone record for tracking deleted skills across devices
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeletedRecord {
    pub folder_name: String,
    pub deleted_at: String,
    pub deleted_by: String,
}

impl Default for LibraryData {
    fn default() -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            version: 1,
            updated_at: now,
            updated_by: String::new(),
            groups: get_default_groups(),
            skills: HashMap::new(),
            deleted_skills: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Group {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub notes: Option<String>,
    pub categories: Vec<Category>,
    pub skill_count: u32,
    pub is_custom: bool,
    pub created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: String,
    pub group_id: String,
    pub name: String,
    pub icon: Option<String>,
    pub notes: Option<String>,
    pub skill_count: u32,
    pub is_custom: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillEntry {
    pub id: String,
    pub folder_name: String,
    pub group_id: Option<String>,
    pub category_id: Option<String>,
    pub imported_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

pub fn get_default_groups() -> Vec<Group> {
    let now = chrono::Utc::now().to_rfc3339();
    vec![
        Group {
            id: "grp-development".to_string(),
            name: "Development".to_string(),
            icon: Some("code".to_string()),
            color: Some("#0A84FF".to_string()),
            notes: None,
            categories: vec![
                Category {
                    id: "cat-dev-general".to_string(),
                    group_id: "grp-development".to_string(),
                    name: "General".to_string(),
                    icon: None,
                    notes: None,
                    skill_count: 0,
                    is_custom: false,
                    created_at: now.clone(),
                },
            ],
            skill_count: 0,
            is_custom: false,
            created_at: now.clone(),
            updated_at: None,
        },
        Group {
            id: "grp-productivity".to_string(),
            name: "Productivity".to_string(),
            icon: Some("rocket".to_string()),
            color: Some("#30D158".to_string()),
            notes: None,
            categories: vec![],
            skill_count: 0,
            is_custom: false,
            created_at: now.clone(),
            updated_at: None,
        },
    ]
}

// ============================================================================
// SyncState - Stored in sync.json
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncState {
    pub version: u64,
    pub last_sync_time: Option<String>,
    pub last_sync_by: Option<String>,
    pub pending_changes: Vec<PendingChange>,
    pub conflict_log: Vec<ConflictEntry>,
}

impl Default for SyncState {
    fn default() -> Self {
        Self {
            version: 1,
            last_sync_time: None,
            last_sync_by: None,
            pending_changes: vec![],
            conflict_log: vec![],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingChange {
    pub change_id: String,
    pub change_type: ChangeType,
    pub target: String,
    pub timestamp: String,
    pub synced: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ChangeType {
    Create,
    Update,
    Delete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictEntry {
    pub target: String,
    pub local_version: u64,
    pub remote_version: u64,
    pub detected_at: String,
    pub resolution: ConflictResolution,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ConflictResolution {
    Pending,
    LocalWins,
    RemoteWins,
    Merged,
}

// ============================================================================
// Sync Event (for frontend notification)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum SyncEvent {
    SyncStarted,
    SyncCompleted { synced_items: u32 },
    SyncFailed { error: String },
    ConflictDetected { target: String, local_version: u64, remote_version: u64 },
    OfflineMode { pending_changes: u32 },
}

// ============================================================================
// Sync Status Info (for frontend)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatusInfo {
    pub event: SyncEvent,
    pub last_sync_time: Option<String>,
    pub last_error: Option<String>,
}

// ============================================================================
// Client Identity
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientIdentity {
    pub client_id: String,
    pub device_name: String,
    pub created_at: String,
}

impl Default for ClientIdentity {
    fn default() -> Self {
        Self {
            client_id: format!("client-{}", uuid::Uuid::new_v4()),
            device_name: std::env::var("USER").unwrap_or_else(|_| "Unknown".to_string()),
            created_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}
