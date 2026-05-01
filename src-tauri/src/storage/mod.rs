// StorageService - Unified storage layer with auto-sync
// All read/write operations go through this service

mod types;
pub mod service;
mod sync;
pub mod migrate;
pub mod conflict;
pub mod conflict_store;

#[cfg(test)]
mod tests;

pub use types::*;
pub use service::StorageService;
pub use conflict::{ConflictRecord, ConflictType, ConflictStatus, SkillInfo};
pub use conflict_store::ConflictStore;
pub use migrate::MigrationService;
