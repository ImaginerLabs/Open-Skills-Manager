// StorageService - Unified storage layer
// All read/write operations go through this service

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex, RwLock};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use chrono::{DateTime, Utc};
use super::types::*;
use super::sync::SyncEngine;
use crate::paths;

// ============================================================================
// Helper functions for graceful lock handling
// ============================================================================

/// Parse RFC3339 timestamp, returns None if parsing fails
fn parse_timestamp(ts: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(ts).ok().map(|dt| dt.with_timezone(&Utc))
}

/// Compare two timestamps, handling None values
/// Returns true if a > b (a is newer than b)
fn is_newer(a_ts: Option<&String>, b_ts: Option<&String>) -> bool {
    match (a_ts, b_ts) {
        (Some(a), Some(b)) => {
            let a_dt = parse_timestamp(a);
            let b_dt = parse_timestamp(b);
            match (a_dt, b_dt) {
                (Some(a_dt), Some(b_dt)) => a_dt > b_dt,
                // Fall back to string comparison if parsing fails
                _ => a > b,
            }
        }
        (Some(_), None) => true,  // a has timestamp, b doesn't -> a is newer
        (None, Some(_)) => false, // b has timestamp, a doesn't -> b is newer
        (None, None) => false,     // Neither has timestamp -> not newer
    }
}

/// Read from a RwLock, recovering from poisoned state if necessary
fn read_lock<T>(lock: &RwLock<T>) -> std::sync::RwLockReadGuard<'_, T> {
    match lock.read() {
        Ok(guard) => guard,
        Err(poisoned) => {
            eprintln!("Warning: Recovering from poisoned RwLock read");
            poisoned.into_inner()
        }
    }
}

/// Write to a RwLock, recovering from poisoned state if necessary
fn write_lock<T>(lock: &RwLock<T>) -> std::sync::RwLockWriteGuard<'_, T> {
    match lock.write() {
        Ok(guard) => guard,
        Err(poisoned) => {
            eprintln!("Warning: Recovering from poisoned RwLock write");
            poisoned.into_inner()
        }
    }
}

/// Lock a Mutex, recovering from poisoned state if necessary
fn lock_mutex<T>(lock: &Mutex<T>) -> std::sync::MutexGuard<'_, T> {
    match lock.lock() {
        Ok(guard) => guard,
        Err(poisoned) => {
            eprintln!("Warning: Recovering from poisoned Mutex");
            poisoned.into_inner()
        }
    }
}

// ============================================================================
// StorageService - Main entry point
// ============================================================================

pub struct StorageService {
    client_id: String,

    // File paths
    config_path: PathBuf,
    library_path: PathBuf,
    sync_path: PathBuf,
    client_id_path: PathBuf,

    // iCloud paths
    icloud_config_path: PathBuf,
    icloud_library_path: PathBuf,
    icloud_sync_path: PathBuf,

    // State
    icloud_enabled: Arc<AtomicBool>,

    // Memory cache
    config_cache: Arc<RwLock<Option<AppConfig>>>,
    library_cache: Arc<RwLock<Option<LibraryData>>>,
    sync_cache: Arc<RwLock<Option<SyncState>>>,

    // Sync error tracking
    last_sync_error: Arc<RwLock<Option<String>>>,
    last_sync_time: Arc<RwLock<Option<String>>>,

    // Debounce sync
    sync_debouncer: Arc<Mutex<Option<JoinHandle<()>>>>,
    sync_debounce_ms: u64,
    sync_generation: Arc<AtomicU64>,
}

impl StorageService {
    /// Create a new StorageService instance
    pub fn new() -> Result<Self, String> {
        let app_support = paths::get_app_support_path();
        let icloud_container = paths::get_icloud_container_path();

        // Ensure directories exist
        fs::create_dir_all(&app_support)
            .map_err(|e| format!("Failed to create app support dir: {}", e))?;

        // Get or create client identity
        let client_id_path = app_support.join("client-id.json");
        let client_id = Self::get_or_create_client_id(&client_id_path)?;

        // Check iCloud availability
        let icloud_enabled = icloud_container.exists()
            || fs::create_dir_all(&icloud_container).is_ok();

        let service = Self {
            client_id,
            config_path: app_support.join("config.json"),
            library_path: app_support.join("library.json"),
            sync_path: app_support.join("sync.json"),
            client_id_path,
            icloud_config_path: icloud_container.join("config.json"),
            icloud_library_path: icloud_container.join("library.json"),
            icloud_sync_path: icloud_container.join("sync.json"),
            icloud_enabled: Arc::new(AtomicBool::new(icloud_enabled)),
            config_cache: Arc::new(RwLock::new(None)),
            library_cache: Arc::new(RwLock::new(None)),
            sync_cache: Arc::new(RwLock::new(None)),
            last_sync_error: Arc::new(RwLock::new(None)),
            last_sync_time: Arc::new(RwLock::new(None)),
            sync_debouncer: Arc::new(Mutex::new(None)),
            sync_debounce_ms: 500,
            sync_generation: Arc::new(AtomicU64::new(0)),
        };

        // Ensure default files exist on first run
        service.ensure_default_files()?;

        Ok(service)
    }

    /// Ensure default config and library files exist
    fn ensure_default_files(&self) -> Result<(), String> {
        // Create default config.json if not exists
        if !self.config_path.exists() {
            let default_config = AppConfig::default();
            self.write_config_file_atomic(&default_config)?;
            println!("Created default config.json");
        }

        // Create default library.json if not exists
        if !self.library_path.exists() {
            let default_library = LibraryData::default();
            self.write_library_file_atomic(&default_library)?;
            println!("Created default library.json");
        }

        // Create default sync.json if not exists
        if !self.sync_path.exists() {
            let default_sync = SyncState::default();
            self.write_sync_file_atomic(&default_sync)?;
            println!("Created default sync.json");
        }

        Ok(())
    }

    /// Get or create client ID
    fn get_or_create_client_id(path: &PathBuf) -> Result<String, String> {
        if path.exists() {
            let content = fs::read_to_string(path)
                .map_err(|e| format!("Failed to read client ID: {}", e))?;
            let identity: ClientIdentity = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse client ID: {}", e))?;
            return Ok(identity.client_id);
        }

        let identity = ClientIdentity::default();
        let content = serde_json::to_string_pretty(&identity)
            .map_err(|e| format!("Failed to serialize client ID: {}", e))?;

        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create parent dir: {}", e))?;
        }

        fs::write(path, content)
            .map_err(|e| format!("Failed to write client ID: {}", e))?;

        Ok(identity.client_id)
    }

    // ========================================================================
    // Read Operations - Auto-check iCloud for updates
    // ========================================================================

    /// Read config with auto-pull from iCloud if newer
    pub fn read_config(&self) -> Result<AppConfig, String> {
        // Check if iCloud has newer version
        if self.should_pull_from_icloud("config")? {
            self.pull_from_icloud("config")?;
        }

        // Return cached or load from file
        if let Some(cached) = read_lock(&self.config_cache).as_ref() {
            return Ok(cached.clone());
        }

        let config = self.read_config_file()?;
        *write_lock(&self.config_cache) = Some(config.clone());
        Ok(config)
    }

    /// Read library with auto-pull from iCloud if newer
    pub fn read_library(&self) -> Result<LibraryData, String> {
        if self.should_pull_from_icloud("library")? {
            self.pull_from_icloud("library")?;
        }

        if let Some(cached) = read_lock(&self.library_cache).as_ref() {
            return Ok(cached.clone());
        }

        let library = self.read_library_file()?;
        *write_lock(&self.library_cache) = Some(library.clone());
        Ok(library)
    }

    /// Read sync state
    pub fn read_sync_state(&self) -> Result<SyncState, String> {
        if let Some(cached) = read_lock(&self.sync_cache).as_ref() {
            return Ok(cached.clone());
        }

        let state = self.read_sync_file()?;
        *write_lock(&self.sync_cache) = Some(state.clone());
        Ok(state)
    }

    // ========================================================================
    // Write Operations - Atomic write + debounced sync
    // ========================================================================

    /// Write config with atomic write + auto-sync
    pub fn write_config<F>(&self, f: F) -> Result<AppConfig, String>
    where
        F: FnOnce(&mut AppConfig),
    {
        self.write_config_with_change_detection(|config| {
            f(config);
            true // Always report changed for backward compatibility
        })
    }

    /// Write config with change detection - returns None if no actual change
    pub fn write_config_with_change_detection<F>(&self, f: F) -> Result<AppConfig, String>
    where
        F: FnOnce(&mut AppConfig) -> bool, // Returns false if no actual change
    {
        let mut config = self.read_config()?;
        let changed = f(&mut config);

        if !changed {
            return Ok(config); // No change, skip write
        }

        // Update metadata
        config.updated_at = chrono::Utc::now().to_rfc3339();
        config.updated_by = self.client_id.clone();

        // Atomic write
        self.write_config_file_atomic(&config)?;

        // Update cache
        *write_lock(&self.config_cache) = Some(config.clone());

        // Record pending change
        self.record_pending_change(ChangeType::Update, "config")?;

        // Debounced sync trigger
        self.trigger_sync_debounced();

        Ok(config)
    }

    /// Write library with optimistic lock + auto-sync
    pub fn write_library<F>(&self, f: F) -> Result<LibraryData, String>
    where
        F: FnOnce(&mut LibraryData),
    {
        let mut library = self.read_library()?;

        // Apply changes
        f(&mut library);

        // Clean up tombstones for skills that were re-added
        let skill_folders: Vec<String> = library.skills.keys().cloned().collect();
        for folder in skill_folders {
            library.deleted_skills.remove(&folder);
        }

        // Increment version (optimistic lock)
        library.version += 1;
        library.updated_at = chrono::Utc::now().to_rfc3339();
        library.updated_by = self.client_id.clone();

        // Atomic write
        self.write_library_file_atomic(&library)?;

        // Update cache
        *write_lock(&self.library_cache) = Some(library.clone());

        // Record pending change
        self.record_pending_change(ChangeType::Update, "library")?;

        // Debounced sync trigger
        self.trigger_sync_debounced();

        Ok(library)
    }

    /// Add a new skill entry
    pub fn add_skill(&self, entry: SkillEntry) -> Result<(), String> {
        let folder_name = entry.folder_name.clone();
        self.write_library(|library| {
            library.skills.insert(folder_name, entry);
        })?;
        Ok(())
    }

    /// Update an existing skill entry
    pub fn update_skill<F>(&self, folder_name: &str, f: F) -> Result<(), String>
    where
        F: FnOnce(&mut SkillEntry),
    {
        self.write_library(|library| {
            if let Some(entry) = library.skills.get_mut(folder_name) {
                f(entry);
                entry.updated_at = Some(chrono::Utc::now().to_rfc3339());
            }
        })?;
        Ok(())
    }

    /// Remove a skill entry (creates tombstone for sync)
    pub fn remove_skill(&self, folder_name: &str) -> Result<Option<SkillEntry>, String> {
        let mut removed = None;
        self.write_library(|library| {
            removed = library.skills.remove(folder_name);

            // Create tombstone if skill existed
            if removed.is_some() {
                library.deleted_skills.insert(
                    folder_name.to_string(),
                    DeletedRecord {
                        folder_name: folder_name.to_string(),
                        deleted_at: chrono::Utc::now().to_rfc3339(),
                        deleted_by: library.updated_by.clone(),
                    },
                );
            }
        })?;
        Ok(removed)
    }

    /// Update groups
    pub fn write_groups<F>(&self, f: F) -> Result<Vec<Group>, String>
    where
        F: FnOnce(&mut Vec<Group>),
    {
        let library = self.write_library(|library| {
            f(&mut library.groups);
        })?;
        Ok(library.groups)
    }

    // ========================================================================
    // Atomic File Operations
    // ========================================================================

    fn read_config_file(&self) -> Result<AppConfig, String> {
        if !self.config_path.exists() {
            return Ok(AppConfig::default());
        }

        let content = fs::read_to_string(&self.config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;

        // Try to parse as new format, fallback to defaults for missing fields
        let mut config: AppConfig = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config: {}", e))?;

        // Ensure active_ide_id has a valid default if missing or empty
        if config.active_ide_id.is_empty() {
            config.active_ide_id = "claude-code".to_string();
        }

        // Ensure ide_configs is not empty
        if config.ide_configs.is_empty() {
            config.ide_configs = get_default_ide_configs();
        }

        Ok(config)
    }

    fn read_library_file(&self) -> Result<LibraryData, String> {
        if !self.library_path.exists() {
            return Ok(LibraryData::default());
        }

        let content = fs::read_to_string(&self.library_path)
            .map_err(|e| format!("Failed to read library: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse library: {}", e))
    }

    fn read_sync_file(&self) -> Result<SyncState, String> {
        if !self.sync_path.exists() {
            return Ok(SyncState::default());
        }

        let content = fs::read_to_string(&self.sync_path)
            .map_err(|e| format!("Failed to read sync state: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse sync state: {}", e))
    }

    /// Atomic write: write to .tmp, fsync, rename
    fn write_config_file_atomic(&self, config: &AppConfig) -> Result<(), String> {
        self.write_file_atomic(&self.config_path, config)
    }

    fn write_library_file_atomic(&self, library: &LibraryData) -> Result<(), String> {
        self.write_file_atomic(&self.library_path, library)
    }

    fn write_sync_file_atomic(&self, state: &SyncState) -> Result<(), String> {
        self.write_file_atomic(&self.sync_path, state)
    }

    fn write_file_atomic<T: serde::Serialize>(&self, path: &PathBuf, data: &T) -> Result<(), String> {
        let tmp_path = path.with_extension("tmp");

        // 1. Write to temp file
        let content = serde_json::to_string_pretty(data)
            .map_err(|e| format!("Failed to serialize: {}", e))?;

        fs::write(&tmp_path, content)
            .map_err(|e| format!("Failed to write temp file: {}", e))?;

        // 2. fsync to ensure data is on disk
        let file = fs::File::open(&tmp_path)
            .map_err(|e| format!("Failed to open temp file: {}", e))?;
        file.sync_all()
            .map_err(|e| format!("Failed to fsync: {}", e))?;

        // 3. Atomic rename
        fs::rename(&tmp_path, path)
            .map_err(|e| format!("Failed to rename: {}", e))?;

        Ok(())
    }

    // ========================================================================
    // Debounced Sync
    // ========================================================================

    fn trigger_sync_debounced(&self) {
        // Increment generation to invalidate any pending threads
        let gen = self.sync_generation.fetch_add(1, Ordering::SeqCst) + 1;

        let mut debouncer = lock_mutex(&self.sync_debouncer);

        // Cancel previous timer
        if let Some(handle) = debouncer.take() {
            // Note: We can't actually abort a running thread, but we use
            // generation counter to ensure old threads don't execute sync
            let _ = handle;
        }

        // Set new timer
        let icloud_enabled = self.icloud_enabled.clone();
        let config_path = self.config_path.clone();
        let library_path = self.library_path.clone();
        let sync_path = self.sync_path.clone();
        let icloud_config_path = self.icloud_config_path.clone();
        let icloud_library_path = self.icloud_library_path.clone();
        let icloud_sync_path = self.icloud_sync_path.clone();
        let client_id = self.client_id.clone();
        let debounce_ms = self.sync_debounce_ms;
        let sync_generation = self.sync_generation.clone();
        let last_sync_error = self.last_sync_error.clone();
        let last_sync_time = self.last_sync_time.clone();
        let sync_cache = self.sync_cache.clone();

        let handle = thread::spawn(move || {
            thread::sleep(Duration::from_millis(debounce_ms));

            // Only sync if we're still the latest generation
            if sync_generation.load(Ordering::SeqCst) != gen {
                return;
            }

            if !icloud_enabled.load(Ordering::Relaxed) {
                return;
            }

            // Perform sync
            let sync_engine = SyncEngine::new(
                config_path,
                library_path,
                sync_path,
                icloud_config_path,
                icloud_library_path,
                icloud_sync_path,
                client_id,
            );

            if let Err(e) = sync_engine.sync() {
                *write_lock(&last_sync_error) = Some(e.clone());
                eprintln!("Background sync failed: {}", e);
            } else {
                *write_lock(&last_sync_error) = None;
                *write_lock(&last_sync_time) = Some(chrono::Utc::now().to_rfc3339());
                // Clear sync cache so next read gets fresh state
                *write_lock(&sync_cache) = None;
            }
        });

        *debouncer = Some(handle);
    }

    // ========================================================================
    // iCloud Sync Helpers
    // ========================================================================

    fn should_pull_from_icloud(&self, target: &str) -> Result<bool, String> {
        if !self.icloud_enabled.load(Ordering::Relaxed) {
            return Ok(false);
        }

        let (icloud_path, local_path) = match target {
            "config" => (&self.icloud_config_path, &self.config_path),
            "library" => (&self.icloud_library_path, &self.library_path),
            _ => return Ok(false),
        };

        if !icloud_path.exists() {
            return Ok(false);
        }

        // Compare modification times
        let icloud_meta = fs::metadata(icloud_path)
            .map_err(|e| format!("Failed to read iCloud metadata: {}", e))?;
        let icloud_modified = icloud_meta.modified()
            .map_err(|e| format!("Failed to get iCloud mtime: {}", e))?;

        let local_modified = if local_path.exists() {
            let local_meta = fs::metadata(local_path)
                .map_err(|e| format!("Failed to read local metadata: {}", e))?;
            local_meta.modified()
                .map_err(|e| format!("Failed to get local mtime: {}", e))?
        } else {
            return Ok(true); // No local file, pull from iCloud
        };

        // Pull if iCloud is newer
        Ok(icloud_modified > local_modified)
    }

    fn pull_from_icloud(&self, target: &str) -> Result<(), String> {
        let (icloud_path, local_path) = match target {
            "config" => (&self.icloud_config_path, &self.config_path),
            "library" => (&self.icloud_library_path, &self.library_path),
            _ => return Ok(()),
        };

        if !icloud_path.exists() {
            return Ok(());
        }

        // For library, we need to merge (not just copy)
        if target == "library" {
            self.merge_library_from_icloud()?;
        } else {
            // For config, just copy
            fs::copy(icloud_path, local_path)
                .map_err(|e| format!("Failed to pull from iCloud: {}", e))?;

            // Invalidate cache
            *write_lock(&self.config_cache) = None;
        }

        Ok(())
    }

    fn merge_library_from_icloud(&self) -> Result<(), String> {
        if !self.icloud_library_path.exists() {
            return Ok(());
        }

        // Read local directly from file to avoid infinite recursion
        let local = self.read_library_file()?;

        let icloud_content = fs::read_to_string(&self.icloud_library_path)
            .map_err(|e| format!("Failed to read iCloud library: {}", e))?;
        let remote: LibraryData = serde_json::from_str(&icloud_content)
            .map_err(|e| format!("Failed to parse iCloud library: {}", e))?;

        // Skip if remote is from us
        if remote.updated_by == self.client_id {
            return Ok(());
        }

        // Auto-merge
        let merged = self.auto_merge_library(&local, &remote)?;

        // Write merged result
        self.write_library_file_atomic(&merged)?;

        // Invalidate cache
        *write_lock(&self.library_cache) = None;

        Ok(())
    }

    fn auto_merge_library(&self, local: &LibraryData, remote: &LibraryData) -> Result<LibraryData, String> {
        let mut merged = local.clone();
        merged.version = remote.version.max(local.version) + 1;
        merged.updated_at = chrono::Utc::now().to_rfc3339();
        merged.updated_by = self.client_id.clone();

        // Merge tombstones first - combine from both sides
        for (folder, remote_tombstone) in &remote.deleted_skills {
            if let Some(local_tombstone) = merged.deleted_skills.get(folder) {
                // Keep the tombstone with the newer deletion time
                if is_newer(Some(&remote_tombstone.deleted_at), Some(&local_tombstone.deleted_at)) {
                    merged.deleted_skills.insert(folder.clone(), remote_tombstone.clone());
                }
            } else {
                merged.deleted_skills.insert(folder.clone(), remote_tombstone.clone());
            }
        }

        // Merge groups - use updated_at (fallback to created_at for backward compat)
        for remote_group in &remote.groups {
            if let Some(local_group) = merged.groups.iter_mut().find(|g| g.id == remote_group.id) {
                // Compare updated_at, fallback to created_at for backward compat
                let remote_time = remote_group.updated_at.as_ref().unwrap_or(&remote_group.created_at);
                let local_time = local_group.updated_at.as_ref().unwrap_or(&local_group.created_at);

                if is_newer(Some(remote_time), Some(local_time)) {
                    *local_group = remote_group.clone();
                }
            } else {
                merged.groups.push(remote_group.clone());
            }
        }

        // Merge skills - skip if tombstoned
        for (folder, remote_entry) in &remote.skills {
            // Check if this skill was deleted (tombstoned) locally or remotely
            let local_tombstone = merged.deleted_skills.get(folder);
            let remote_tombstone = remote.deleted_skills.get(folder);

            // If there's a tombstone, check if the skill was deleted after the remote update
            let skill_update_time = remote_entry.updated_at.as_ref()
                .unwrap_or(&remote_entry.imported_at);

            let is_deleted_after_update = local_tombstone
                .map(|t| is_newer(Some(&t.deleted_at), Some(skill_update_time)))
                .unwrap_or(false);

            let remote_deleted_after_update = remote_tombstone
                .map(|t| is_newer(Some(&t.deleted_at), Some(skill_update_time)))
                .unwrap_or(false);

            // Skip this skill if it was deleted after the update
            if is_deleted_after_update || remote_deleted_after_update {
                continue;
            }

            if let Some(local_entry) = merged.skills.get(folder) {
                let remote_time = remote_entry.updated_at.as_ref()
                    .or(Some(&remote_entry.imported_at));
                let local_time = local_entry.updated_at.as_ref()
                    .or(Some(&local_entry.imported_at));

                if is_newer(remote_time, local_time) {
                    merged.skills.insert(folder.clone(), remote_entry.clone());
                }
            } else {
                merged.skills.insert(folder.clone(), remote_entry.clone());
            }
        }

        Ok(merged)
    }

    fn record_pending_change(&self, change_type: ChangeType, target: &str) -> Result<(), String> {
        let mut state = self.read_sync_state()?;

        state.pending_changes.push(PendingChange {
            change_id: format!("change-{}", uuid::Uuid::new_v4()),
            change_type,
            target: target.to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            synced: false,
        });

        self.write_sync_file_atomic(&state)?;
        *write_lock(&self.sync_cache) = Some(state);

        Ok(())
    }

    // ========================================================================
    // Utility Methods
    // ========================================================================

    /// Get client ID
    pub fn client_id(&self) -> &str {
        &self.client_id
    }

    /// Check if iCloud is enabled
    pub fn is_icloud_enabled(&self) -> bool {
        self.icloud_enabled.load(Ordering::Relaxed)
    }

    /// Set iCloud enabled status
    pub fn set_icloud_enabled(&self, enabled: bool) {
        self.icloud_enabled.store(enabled, Ordering::Relaxed);
    }

    /// Get last sync error
    pub fn last_sync_error(&self) -> Option<String> {
        read_lock(&self.last_sync_error).clone()
    }

    /// Get last sync time (from error tracking, not from SyncState)
    pub fn tracked_sync_time(&self) -> Option<String> {
        read_lock(&self.last_sync_time).clone()
    }

    /// Get local library path
    pub fn library_dir(&self) -> PathBuf {
        paths::get_local_library_path()
    }

    /// Invalidate all caches
    pub fn invalidate_cache(&self) {
        *write_lock(&self.config_cache) = None;
        *write_lock(&self.library_cache) = None;
        *write_lock(&self.sync_cache) = None;
    }

    /// Force immediate sync (bypass debounce)
    pub fn force_sync(&self) -> Result<(), String> {
        if !self.icloud_enabled.load(Ordering::Relaxed) {
            return Ok(());
        }

        let sync_engine = SyncEngine::new(
            self.config_path.clone(),
            self.library_path.clone(),
            self.sync_path.clone(),
            self.icloud_config_path.clone(),
            self.icloud_library_path.clone(),
            self.icloud_sync_path.clone(),
            self.client_id.clone(),
        );

        match sync_engine.sync() {
            Ok(_) => {
                *write_lock(&self.last_sync_error) = None;
                *write_lock(&self.last_sync_time) = Some(chrono::Utc::now().to_rfc3339());
                // Clear sync cache so next read gets fresh state
                *write_lock(&self.sync_cache) = None;
                Ok(())
            }
            Err(e) => {
                *write_lock(&self.last_sync_error) = Some(e.clone());
                Err(e)
            }
        }
    }

    /// Calculate total storage used by the app (local library + config files)
    pub fn calculate_storage_used(&self) -> u64 {
        let mut total: u64 = 0;

        // Local library directory
        let library_dir = paths::get_local_library_path();
        if library_dir.exists() {
            total += self.calculate_dir_size(&library_dir);
        }

        // Config files
        for path in [&self.config_path, &self.library_path, &self.sync_path] {
            if path.exists() {
                if let Ok(metadata) = fs::metadata(path) {
                    total += metadata.len();
                }
            }
        }

        total
    }

    fn calculate_dir_size(&self, path: &PathBuf) -> u64 {
        let mut total: u64 = 0;
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                let entry_path = entry.path();
                if entry_path.is_file() {
                    if let Ok(metadata) = fs::metadata(&entry_path) {
                        total += metadata.len();
                    }
                } else if entry_path.is_dir() {
                    total += self.calculate_dir_size(&entry_path);
                }
            }
        }
        total
    }
}

impl Default for StorageService {
    fn default() -> Self {
        Self::new().expect("Failed to create StorageService")
    }
}

// Global instance (lazy static)
use std::sync::OnceLock;

static STORAGE: OnceLock<StorageService> = OnceLock::new();

/// Get the global StorageService instance
pub fn get_storage() -> &'static StorageService {
    STORAGE.get_or_init(|| StorageService::new().expect("Failed to initialize StorageService"))
}
