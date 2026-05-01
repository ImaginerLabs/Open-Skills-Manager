// ConflictStore - Persistence layer for conflict records

use std::fs;
use std::path::PathBuf;
use std::collections::HashMap;

use super::conflict::{ConflictRecord, ConflictStatus};

/// Store for managing conflict records
pub struct ConflictStore {
    conflicts_path: PathBuf,
}

impl ConflictStore {
    /// Create a new ConflictStore
    pub fn new() -> Self {
        let conflicts_path = crate::paths::get_app_support_path().join("conflicts.json");
        Self { conflicts_path }
    }

    /// Get all conflict records
    pub fn get_conflicts(&self) -> Result<Vec<ConflictRecord>, String> {
        if !self.conflicts_path.exists() {
            return Ok(Vec::new());
        }

        let content = fs::read_to_string(&self.conflicts_path)
            .map_err(|e| format!("Failed to read conflicts file: {}", e))?;

        let conflicts: Vec<ConflictRecord> = serde_json::from_str(&content)
            .unwrap_or_default();

        Ok(conflicts)
    }

    /// Save all conflict records
    pub fn save_conflicts(&self, conflicts: &[ConflictRecord]) -> Result<(), String> {
        // Ensure directory exists
        if let Some(parent) = self.conflicts_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        let content = serde_json::to_string_pretty(conflicts)
            .map_err(|e| format!("Failed to serialize conflicts: {}", e))?;

        fs::write(&self.conflicts_path, content)
            .map_err(|e| format!("Failed to write conflicts file: {}", e))?;

        Ok(())
    }

    /// Add a new conflict record
    pub fn add_conflict(&self, conflict: &ConflictRecord) -> Result<(), String> {
        let mut conflicts = self.get_conflicts()?;

        // Check if conflict already exists for this skill
        if let Some(existing) = conflicts.iter_mut().find(|c| c.skill_id == conflict.skill_id && c.status != ConflictStatus::Resolved) {
            // Update existing conflict
            *existing = conflict.clone();
        } else {
            // Add new conflict
            conflicts.push(conflict.clone());
        }

        self.save_conflicts(&conflicts)
    }

    /// Add multiple conflict records in a single batch (efficient for bulk operations)
    pub fn add_conflicts(&self, new_conflicts: &[ConflictRecord]) -> Result<(), String> {
        let mut conflicts = self.get_conflicts()?;

        for conflict in new_conflicts {
            if let Some(existing) = conflicts.iter_mut().find(|c| c.skill_id == conflict.skill_id && c.status != ConflictStatus::Resolved) {
                *existing = conflict.clone();
            } else {
                conflicts.push(conflict.clone());
            }
        }

        self.save_conflicts(&conflicts)
    }

    /// Resolve a conflict by skill ID
    pub fn resolve_conflict(&self, skill_id: &str, resolution: &str) -> Result<(), String> {
        let mut conflicts = self.get_conflicts()?;

        if let Some(conflict) = conflicts.iter_mut().find(|c| c.skill_id == skill_id && c.status != ConflictStatus::Resolved) {
            conflict.status = ConflictStatus::Resolved;
            conflict.resolved_at = Some(chrono::Utc::now().to_rfc3339());
            conflict.resolution = Some(resolution.to_string());
            self.save_conflicts(&conflicts)?;
            Ok(())
        } else {
            Err(format!("No active conflict found for skill: {}", skill_id))
        }
    }

    /// Get a specific conflict by skill ID
    pub fn get_conflict(&self, skill_id: &str) -> Result<Option<ConflictRecord>, String> {
        let conflicts = self.get_conflicts()?;
        Ok(conflicts.into_iter()
            .find(|c| c.skill_id == skill_id && c.status != ConflictStatus::Resolved))
    }

    /// Get all unresolved conflicts
    pub fn get_unresolved_conflicts(&self) -> Result<Vec<ConflictRecord>, String> {
        let conflicts = self.get_conflicts()?;
        Ok(conflicts.into_iter()
            .filter(|c| c.status == ConflictStatus::Detected)
            .collect())
    }

    /// Clear all conflicts (for testing)
    #[allow(dead_code)]
    pub fn clear(&self) -> Result<(), String> {
        if self.conflicts_path.exists() {
            fs::remove_file(&self.conflicts_path)
                .map_err(|e| format!("Failed to remove conflicts file: {}", e))?;
        }
        Ok(())
    }

    /// Remove resolved conflicts older than specified days
    pub fn cleanup_old_resolved(&self, days: u64) -> Result<usize, String> {
        let mut conflicts = self.get_conflicts()?;
        let now = chrono::Utc::now();
        let initial_len = conflicts.len();

        conflicts.retain(|c| {
            if c.status == ConflictStatus::Resolved {
                if let Some(resolved_at) = &c.resolved_at {
                    if let Ok(resolved_time) = chrono::DateTime::parse_from_rfc3339(resolved_at) {
                        let resolved_utc = resolved_time.with_timezone(&chrono::Utc);
                        let age = now.signed_duration_since(resolved_utc).num_days();
                        return age < days as i64;
                    }
                }
            }
            true
        });

        let removed = initial_len - conflicts.len();
        if removed > 0 {
            self.save_conflicts(&conflicts)?;
        }

        Ok(removed)
    }
}

impl Default for ConflictStore {
    fn default() -> Self {
        Self::new()
    }
}

/// Get conflicts as a map for quick lookup
pub fn get_conflicts_map() -> Result<HashMap<String, ConflictRecord>, String> {
    let store = ConflictStore::new();
    let conflicts = store.get_conflicts()?;
    Ok(conflicts.into_iter()
        .filter(|c| c.status != ConflictStatus::Resolved)
        .map(|c| (c.skill_id.clone(), c))
        .collect())
}
