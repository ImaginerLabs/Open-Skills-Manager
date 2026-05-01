use crate::paths::{
    get_icloud_container_path as paths_icloud_container_path,
    get_local_cache_path as paths_local_cache_path,
    get_library_path, get_metadata_path,
};
use crate::storage::{ConflictRecord, ConflictType, SkillInfo, ConflictStore};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, SystemTime};

// Hash cache with TTL
lazy_static! {
    static ref HASH_CACHE: Mutex<HashMap<String, (String, SystemTime)>> = Mutex::new(HashMap::new());
    static ref LAST_CONFLICT_DETECTION: Mutex<Option<SystemTime>> = Mutex::new(None);
}

const HASH_CACHE_TTL: Duration = Duration::from_secs(300); // 5 minutes
const CONFLICT_DETECTION_INTERVAL: Duration = Duration::from_secs(30); // 30 seconds

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SyncStatus {
    Synced,
    Syncing,
    Pending,
    Offline,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncStatusInfo {
    pub status: SyncStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_sync_time: Option<String>,
    pub pending_changes: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,
    pub storage_used: u64,
    pub storage_total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuotaInfo {
    pub available: bool,
    pub used_bytes: u64,
    pub total_bytes: u64,
    pub percent_used: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingChange {
    pub skill_id: String,
    pub change_type: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictVersion {
    pub modified_time: String,
    pub size: u64,
    pub device_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictInfo {
    pub skill_id: String,
    pub skill_name: String,
    pub local_version: ConflictVersion,
    pub remote_version: ConflictVersion,
}

// Use centralized paths from paths.rs
pub fn get_icloud_container_path() -> PathBuf {
    paths_icloud_container_path()
}

pub fn get_local_cache_path() -> PathBuf {
    paths_local_cache_path()
}

pub fn get_skills_path() -> PathBuf {
    get_library_path()
}

pub fn get_config_path() -> PathBuf {
    get_metadata_path()
}

pub fn get_deployments_path() -> PathBuf {
    get_icloud_container_path().join("deployments.json")
}

pub fn icloud_is_available() -> bool {
    let container = get_icloud_container_path();
    container.exists() || {
        if let Ok(_) = fs::create_dir_all(&container) {
            true
        } else {
            false
        }
    }
}

pub fn get_last_sync_time() -> Option<String> {
    let container = get_icloud_container_path();
    if let Ok(metadata) = fs::metadata(&container) {
        if let Ok(modified) = metadata.modified() {
            if let Ok(datetime) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                let secs = datetime.as_secs();
                let datetime: chrono::DateTime<chrono::Utc> = chrono::DateTime::from_timestamp(secs as i64, 0)?;
                return Some(datetime.to_rfc3339());
            }
        }
    }
    None
}

pub fn calculate_storage_used() -> u64 {
    let skills_path = get_skills_path();
    let config_path = get_config_path();
    let deployments_path = get_deployments_path();

    let mut total: u64 = 0;

    if skills_path.exists() {
        total += calculate_dir_size(&skills_path);
    }
    if config_path.exists() {
        total += calculate_dir_size(&config_path);
    }
    if deployments_path.exists() {
        if let Ok(metadata) = fs::metadata(&deployments_path) {
            total += metadata.len();
        }
    }

    total
}

fn calculate_dir_size(path: &PathBuf) -> u64 {
    let mut total: u64 = 0;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = fs::metadata(&path) {
                    total += metadata.len();
                }
            } else if path.is_dir() {
                total += calculate_dir_size(&path);
            }
        }
    }
    total
}

pub fn get_pending_changes() -> Vec<PendingChange> {
    Vec::new()
}

pub fn ensure_icloud_structure() -> Result<(), String> {
    let container = get_icloud_container_path();
    let skills = get_skills_path();
    let config = get_config_path();

    fs::create_dir_all(&container).map_err(|e| format!("Failed to create iCloud container: {}", e))?;
    fs::create_dir_all(&skills).map_err(|e| format!("Failed to create skills directory: {}", e))?;
    fs::create_dir_all(&config).map_err(|e| format!("Failed to create config directory: {}", e))?;

    Ok(())
}

pub fn ensure_local_cache() -> Result<(), String> {
    let cache = get_local_cache_path();
    fs::create_dir_all(&cache).map_err(|e| format!("Failed to create local cache: {}", e))
}

pub fn fallback_to_local_cache() -> PathBuf {
    let cache = get_local_cache_path();
    if let Err(_) = ensure_local_cache() {
        // Fallback to app support path
        return crate::paths::get_app_support_path();
    }
    cache
}

pub fn get_device_name() -> String {
    std::env::var("USER")
        .unwrap_or_else(|_| "Unknown Device".to_string())
}

pub fn resolve_conflict(skill_id: &str, resolution: &str) -> Result<(), String> {
    let skills_path = get_skills_path();
    let skill_dir = skills_path.join(skill_id);

    // Update conflict status in store
    let store = ConflictStore::new();
    store.resolve_conflict(skill_id, resolution)?;

    match resolution {
        "local" => {
            // Keep local version - push to iCloud
            let icloud_library = crate::paths::get_icloud_library_path();
            if skill_dir.exists() {
                let dst = icloud_library.join(skill_id);
                if dst.exists() {
                    fs::remove_dir_all(&dst)
                        .map_err(|e| format!("Failed to remove iCloud skill: {}", e))?;
                }
                crate::utils::fs::copy_dir_all(&skill_dir, &dst)
                    .map_err(|e| format!("Failed to copy to iCloud: {}", e))?;
            }
            Ok(())
        },
        "remote" => {
            // Keep remote version - pull from iCloud to local
            let icloud_library = crate::paths::get_icloud_library_path();
            let src = icloud_library.join(skill_id);
            if src.exists() {
                if skill_dir.exists() {
                    fs::remove_dir_all(&skill_dir)
                        .map_err(|e| format!("Failed to remove local skill: {}", e))?;
                }
                crate::utils::fs::copy_dir_all(&src, &skill_dir)
                    .map_err(|e| format!("Failed to copy from iCloud: {}", e))?;
            }
            Ok(())
        },
        "both" => {
            // Keep both - create a copy of remote version with timestamp suffix
            let icloud_library = crate::paths::get_icloud_library_path();
            let icloud_src = icloud_library.join(skill_id);

            if icloud_src.exists() {
                // Create remote version copy with timestamp
                let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
                let remote_copy = skills_path.join(format!("{}_from_icloud_{}", skill_id, timestamp));

                // Copy iCloud version to local with new name
                crate::utils::fs::copy_dir_all(&icloud_src, &remote_copy)
                    .map_err(|e| format!("Failed to create remote copy: {}", e))?;
            }
            // Local version remains unchanged
            Ok(())
        },
        _ => Err(format!("Invalid resolution: {}", resolution))
    }
}

// ============================================================================
// Hash and Conflict Detection
// ============================================================================

/// Compute SHA256 hash of SKILL.md content with mtime-based cache invalidation
pub fn compute_skill_hash(skill_dir: &PathBuf) -> Result<String, String> {
    let skill_md = skill_dir.join("SKILL.md");
    if !skill_md.exists() {
        return Ok(String::new());
    }

    let metadata = fs::metadata(&skill_md)
        .map_err(|e| format!("Failed to get metadata: {}", e))?;
    let mtime = metadata.modified()
        .map_err(|e| format!("Failed to get mtime: {}", e))?;

    let key = skill_dir.to_string_lossy().to_string();

    if let Ok(cache) = HASH_CACHE.lock() {
        if let Some((cached_hash, cached_mtime)) = cache.get(&key) {
            if *cached_mtime == mtime {
                return Ok(cached_hash.clone());
            }
        }
    }

    let content = fs::read(&skill_md)
        .map_err(|e| format!("Failed to read SKILL.md: {}", e))?;
    let mut hasher = Sha256::new();
    hasher.update(&content);
    let hash = format!("{:x}", hasher.finalize());

    if let Ok(mut cache) = HASH_CACHE.lock() {
        cache.insert(key, (hash.clone(), mtime));

        // Lazy cleanup: only clean when cache grows beyond 100 entries
        if cache.len() > 100 {
            let now = SystemTime::now();
            cache.retain(|_, (_, mtime)| {
                now.duration_since(*mtime).unwrap_or(Duration::ZERO) < HASH_CACHE_TTL
            });
        }
    }

    Ok(hash)
}

/// Get skill name from skill.json or folder name
fn get_skill_name(skill_dir: &PathBuf) -> String {
    let skill_json = skill_dir.join("skill.json");

    // Try to read name from skill.json
    fs::read_to_string(&skill_json)
        .ok()
        .and_then(|content| serde_json::from_str::<serde_json::Value>(&content).ok())
        .and_then(|json| json.get("name").and_then(|n| n.as_str()).map(|s| s.to_string()))
        .unwrap_or_else(|| {
            skill_dir
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unknown".to_string())
        })
}

/// List all skills in a directory with their hash and modification time
pub fn list_skills_with_hash(dir: &PathBuf, device_name: &str) -> Result<HashMap<String, SkillInfo>, String> {
    let mut skills = HashMap::new();

    if !dir.exists() {
        return Ok(skills);
    }

    let entries = fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() && path.join("SKILL.md").exists() {
            let name = path.file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default();

            let hash = compute_skill_hash(&path).unwrap_or_default();

            let mtime = if let Ok(metadata) = fs::metadata(&path) {
                if let Ok(modified) = metadata.modified() {
                    if let Ok(datetime) = modified.duration_since(SystemTime::UNIX_EPOCH) {
                        chrono::DateTime::from_timestamp(datetime.as_secs() as i64, 0)
                            .unwrap_or_else(|| chrono::Utc::now())
                    } else {
                        chrono::Utc::now()
                    }
                } else {
                    chrono::Utc::now()
                }
            } else {
                chrono::Utc::now()
            };

            skills.insert(name.clone(), SkillInfo {
                name,
                hash,
                mtime,
                device: device_name.to_string(),
                exists: true,
            });
        }
    }

    Ok(skills)
}

/// Check if two skill versions conflict
pub fn is_conflict(
    local: &SkillInfo,
    remote: &SkillInfo,
    last_sync_time: &Option<String>,
    _client_id: &str,
) -> bool {
    // Condition 1: Content must be different
    if local.hash == remote.hash {
        return false;
    }

    // Condition 2: Both sides must have been modified after last sync
    // If no last sync record, it's a conflict
    if let Some(last_sync) = last_sync_time {
        if let Ok(last_sync_dt) = chrono::DateTime::parse_from_rfc3339(last_sync) {
            let last_sync_utc = last_sync_dt.with_timezone(&chrono::Utc);

            let local_modified_after = local.mtime > last_sync_utc;
            let remote_modified_after = remote.mtime > last_sync_utc;

            // Both must be modified after last sync for a conflict
            if !local_modified_after || !remote_modified_after {
                return false;
            }
        }
    }

    true
}

/// Detect conflicts between local and iCloud skills
pub fn detect_conflicts() -> Result<Vec<ConflictRecord>, String> {
    let local_library = crate::paths::get_local_library_path();
    let icloud_library = crate::paths::get_icloud_library_path();

    // Get client identity
    let client_identity = crate::commands::sync::get_or_create_client_identity()
        .unwrap_or_else(|_| crate::commands::sync::ClientIdentity {
            client_id: "unknown".to_string(),
            device_name: get_device_name(),
            created_at: chrono::Utc::now().to_rfc3339(),
        });

    // Get last sync time
    let sync_state = crate::commands::sync::load_sync_state().unwrap_or_default();
    let last_sync_time = sync_state.last_sync_time;

    // List skills from both locations
    let local_skills = list_skills_with_hash(&local_library, &client_identity.device_name)?;
    let remote_skills = list_skills_with_hash(&icloud_library, "iCloud")?;

    let mut conflicts = Vec::new();

    // Check for content conflicts (both exist with different content)
    for (skill_id, local_info) in &local_skills {
        if let Some(remote_info) = remote_skills.get(skill_id) {
            if is_conflict(local_info, remote_info, &last_sync_time, &client_identity.client_id) {
                let skill_name = get_skill_name(&local_library.join(skill_id));

                let conflict = ConflictRecord::new(
                    skill_id.clone(),
                    skill_name,
                    ConflictType::ContentConflict,
                    local_info.hash.clone(),
                    remote_info.hash.clone(),
                    local_info.mtime.to_rfc3339(),
                    remote_info.mtime.to_rfc3339(),
                    local_info.device.clone(),
                    remote_info.device.clone(),
                );

                conflicts.push(conflict);
            }
        }
    }

    // Check for delete vs modify conflicts
    // Local deleted but remote modified
    let store = ConflictStore::new();
    let library_data = crate::storage::service::get_storage().read_library();
    let tombstones = match &library_data {
        Ok(data) => data.deleted_skills.clone(),
        Err(_) => std::collections::HashMap::new(),
    };

    for (skill_id, tombstone) in &tombstones {
        if let Some(remote_info) = remote_skills.get(skill_id) {
            // Check if remote was modified after deletion
            if let Ok(deleted_at) = chrono::DateTime::parse_from_rfc3339(&tombstone.deleted_at) {
                let deleted_utc = deleted_at.with_timezone(&chrono::Utc);
                if remote_info.mtime > deleted_utc {
                    // Remote was modified after local deletion - conflict
                    let conflict = ConflictRecord::new(
                        skill_id.clone(),
                        tombstone.folder_name.clone(),
                        ConflictType::DeleteVsModify,
                        String::new(), // No local hash (deleted)
                        remote_info.hash.clone(),
                        tombstone.deleted_at.clone(),
                        remote_info.mtime.to_rfc3339(),
                        client_identity.device_name.clone(),
                        remote_info.device.clone(),
                    );

                    conflicts.push(conflict);
                }
            }
        }
    }

    // Save detected conflicts in batch
    if !conflicts.is_empty() {
        store.add_conflicts(&conflicts)?;
    }

    Ok(conflicts)
}

/// Get all unresolved conflicts (with cached detection)
pub fn get_conflicts() -> Vec<ConflictInfo> {
    // Only re-detect conflicts if enough time has passed since last detection
    let should_detect = {
        if let Ok(last_detection) = LAST_CONFLICT_DETECTION.lock() {
            match *last_detection {
                None => true,
                Some(last_time) => {
                    SystemTime::now()
                        .duration_since(last_time)
                        .unwrap_or(Duration::ZERO)
                        > CONFLICT_DETECTION_INTERVAL
                }
            }
        } else {
            true
        }
    };

    if should_detect {
        if let Err(e) = detect_conflicts() {
            println!("Warning: Failed to detect conflicts: {}", e);
        }
        if let Ok(mut last_detection) = LAST_CONFLICT_DETECTION.lock() {
            *last_detection = Some(SystemTime::now());
        }
    }

    // Return unresolved conflicts
    let store = ConflictStore::new();
    match store.get_unresolved_conflicts() {
        Ok(conflicts) => conflicts
            .iter()
            .map(|c| ConflictInfo {
                skill_id: c.skill_id.clone(),
                skill_name: c.skill_name.clone(),
                local_version: ConflictVersion {
                    modified_time: c.local_mtime.clone(),
                    size: 0,
                    device_name: c.local_device.clone(),
                },
                remote_version: ConflictVersion {
                    modified_time: c.remote_mtime.clone(),
                    size: 0,
                    device_name: c.remote_device.clone(),
                },
            })
            .collect(),
        Err(_) => Vec::new(),
    }
}
