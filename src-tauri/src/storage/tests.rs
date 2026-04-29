// Tests for StorageService

#[cfg(test)]
mod tests {
    use crate::storage::*;
    use crate::storage::service::*;
    use std::fs;
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::sync::{Arc, Mutex, RwLock};
    use tempfile::tempdir;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();

        assert_eq!(config.version, "2.0.0");
        assert!(!config.settings.theme.is_empty());
        assert!(!config.active_ide_id.is_empty());
        assert!(config.sync_enabled);
    }

    #[test]
    fn test_default_library() {
        let library = LibraryData::default();

        assert_eq!(library.version, 1);
        assert!(!library.groups.is_empty());
        assert!(library.skills.is_empty());
    }

    #[test]
    fn test_default_sync_state() {
        let state = SyncState::default();

        assert_eq!(state.version, 1);
        assert!(state.last_sync_time.is_none());
        assert!(state.pending_changes.is_empty());
        assert!(state.conflict_log.is_empty());
    }

    #[test]
    fn test_skill_entry_serialization() {
        let entry = SkillEntry {
            id: "skill-123".to_string(),
            folder_name: "my-skill".to_string(),
            group_id: Some("grp-1".to_string()),
            category_id: None,
            imported_at: "2026-04-28T10:00:00Z".to_string(),
            updated_at: None,
        };

        let json = serde_json::to_string(&entry).expect("Failed to serialize");
        let parsed: SkillEntry = serde_json::from_str(&json).expect("Failed to deserialize");

        assert_eq!(parsed.id, entry.id);
        assert_eq!(parsed.folder_name, entry.folder_name);
        assert_eq!(parsed.group_id, entry.group_id);
    }

    #[test]
    fn test_pending_change() {
        let change = PendingChange {
            change_id: "change-123".to_string(),
            change_type: ChangeType::Update,
            target: "library".to_string(),
            timestamp: "2026-04-28T10:00:00Z".to_string(),
            synced: false,
        };

        let json = serde_json::to_string(&change).expect("Failed to serialize");
        assert!(json.contains("update"));
        assert!(json.contains("library"));
    }

    #[test]
    fn test_conflict_resolution() {
        let conflict = ConflictEntry {
            target: "library".to_string(),
            local_version: 5,
            remote_version: 7,
            detected_at: "2026-04-28T10:00:00Z".to_string(),
            resolution: ConflictResolution::Pending,
        };

        assert!(conflict.remote_version > conflict.local_version);
    }

    #[test]
    fn test_atomic_write() {
        let temp_dir = tempdir().expect("Failed to create temp dir");
        let file_path = temp_dir.path().join("test.json");

        // Write a test file atomically
        let data = AppConfig::default();
        let tmp_path = file_path.with_extension("tmp");

        let content = serde_json::to_string_pretty(&data).expect("Failed to serialize");
        fs::write(&tmp_path, &content).expect("Failed to write temp");
        fs::rename(&tmp_path, &file_path).expect("Failed to rename");

        // Verify file exists and can be read
        assert!(file_path.exists());
        let read_content = fs::read_to_string(&file_path).expect("Failed to read");
        let parsed: AppConfig = serde_json::from_str(&read_content).expect("Failed to parse");

        assert_eq!(parsed.version, data.version);
    }

    #[test]
    fn test_group_management() {
        let mut groups = get_default_groups();

        let new_group = Group {
            id: "grp-custom".to_string(),
            name: "Custom".to_string(),
            icon: Some("star".to_string()),
            color: Some("#FF0000".to_string()),
            notes: None,
            categories: vec![],
            skill_count: 0,
            is_custom: true,
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: None,
        };

        groups.push(new_group.clone());

        assert_eq!(groups.len(), 3);
        assert!(groups.iter().any(|g| g.id == "grp-custom"));
    }

    #[test]
    fn test_category_management() {
        let mut groups = get_default_groups();
        let group = groups.first_mut().expect("Should have at least one group");

        let new_category = Category {
            id: "cat-custom".to_string(),
            group_id: group.id.clone(),
            name: "Custom Category".to_string(),
            icon: Some("tag".to_string()),
            notes: None,
            skill_count: 0,
            is_custom: true,
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        group.categories.push(new_category);

        assert!(group.categories.len() > 1);
    }
}