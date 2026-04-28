// StorageService - Unified storage layer with auto-sync
// All read/write operations go through this service

mod types;
pub mod service;
mod sync;
mod migrate;

#[cfg(test)]
mod tests;

pub use types::*;
pub use service::StorageService;
pub use sync::{SyncEngine, SyncResult};
pub use migrate::{MigrationService, MigrationResult};
