// Conflict detection types for iCloud sync

use serde::{Deserialize, Serialize};

/// Conflict type enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ConflictType {
    /// SKILL.md content differs
    ContentConflict,
    /// skill.json metadata differs
    MetadataConflict,
    /// Both content and metadata differ
    BothConflict,
    /// One side deleted, other modified
    DeleteVsModify,
}

/// Conflict status enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ConflictStatus {
    /// Just detected
    Detected,
    /// User acknowledged
    Acknowledged,
    /// Currently resolving
    Resolving,
    /// Resolved
    Resolved,
}

/// Conflict record for persistence
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictRecord {
    /// Unique ID (UUID)
    pub id: String,
    /// Skill folder name
    pub skill_id: String,
    /// Skill display name
    pub skill_name: String,
    /// Type of conflict
    pub conflict_type: ConflictType,
    /// Current status
    pub status: ConflictStatus,

    // Version information
    /// Hash of local SKILL.md
    pub local_hash: String,
    /// Hash of remote SKILL.md
    pub remote_hash: String,
    /// Local modification time (RFC3339)
    pub local_mtime: String,
    /// Remote modification time (RFC3339)
    pub remote_mtime: String,
    /// Local device name
    pub local_device: String,
    /// Remote device name
    pub remote_device: String,

    // Timestamps
    /// When conflict was detected
    pub detected_at: String,
    /// When user acknowledged
    #[serde(skip_serializing_if = "Option::is_none")]
    pub acknowledged_at: Option<String>,
    /// When conflict was resolved
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolved_at: Option<String>,
    /// Resolution method: "local", "remote", "both"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
}

impl ConflictRecord {
    /// Create a new conflict record
    pub fn new(
        skill_id: String,
        skill_name: String,
        conflict_type: ConflictType,
        local_hash: String,
        remote_hash: String,
        local_mtime: String,
        remote_mtime: String,
        local_device: String,
        remote_device: String,
    ) -> Self {
        Self {
            id: format!("conflict-{}", uuid::Uuid::new_v4()),
            skill_id,
            skill_name,
            conflict_type,
            status: ConflictStatus::Detected,
            local_hash,
            remote_hash,
            local_mtime,
            remote_mtime,
            local_device,
            remote_device,
            detected_at: chrono::Utc::now().to_rfc3339(),
            acknowledged_at: None,
            resolved_at: None,
            resolution: None,
        }
    }
}

/// Skill info with hash for conflict detection
#[derive(Debug, Clone)]
pub struct SkillInfo {
    /// Skill folder name
    pub name: String,
    /// Hash of SKILL.md content
    pub hash: String,
    /// Modification time
    pub mtime: chrono::DateTime<chrono::Utc>,
    /// Device name
    pub device: String,
    /// Whether the skill exists (for delete detection)
    pub exists: bool,
}
