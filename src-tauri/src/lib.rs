mod commands;
mod parsers;
mod paths;
mod services;
mod storage;
mod utils;

use commands::{
    library, global, project, deploy, search, config, ide, sync, migration, icloud, locale, theme, update, security,
    error, performance,
    storage as storage_commands,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    utils::logger::init_logger();

    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init());

    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(tauri_plugin_webdriver_automation::init());
    }

    builder
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Library commands
            library::library_list,
            library::library_get,
            library::library_delete,
            library::library_import,
            library::library_export,
            library::library_export_batch,
            library::library_groups_list,
            library::library_groups_create,
            library::library_groups_rename,
            library::library_groups_delete,
            library::library_categories_create,
            library::library_categories_rename,
            library::library_categories_delete,
            library::library_organize,
            // Global commands
            global::global_list,
            global::global_get,
            global::global_delete,
            global::global_pull,
            // Project commands
            project::project_list,
            project::project_add,
            project::project_remove,
            project::project_skills,
            project::project_refresh,
            project::project_skill_get,
            project::project_skill_delete,
            project::project_skill_pull,
            // Deploy commands
            deploy::deploy_to_global,
            deploy::deploy_to_project,
            deploy::deploy_from_global,
            // Search commands
            search::search,
            search::search_with_snippets,
            // Config commands
            config::config_get,
            config::config_set,
            config::config_set_settings,
            config::config_get_active_ide,
            config::config_set_active_ide,
            config::config_add_ide,
            config::config_remove_ide,
            config::config_update_ide,
            config::config_get_projects,
            config::config_add_project,
            config::config_remove_project,
            config::config_update_project,
            config::config_get_groups,
            config::config_set_groups,
            config::config_get_skill_org,
            config::config_set_skill_org,
            config::config_remove_skill_org,
            config::config_set_sync_settings,
            config::config_needs_migration,
            config::config_app_data_path,
            config::config_reveal_path,
            config::config_open_path,
            // IDE commands
            ide::ide_list,
            ide::ide_get_active,
            ide::ide_set_active,
            ide::ide_global_list,
            ide::ide_project_list,
            ide::ide_project_add,
            ide::ide_project_remove,
            ide::ide_project_refresh,
            ide::ide_project_skills,
            ide::ide_get_global_path,
            // Sync commands
            sync::sync_status,
            sync::sync_full,
            sync::sync_enable,
            sync::sync_icloud_path,
            sync::sync_local_path,
            // Migration commands
            migration::migration_check,
            migration::migration_execute,
            migration::migration_skip,
            // iCloud commands
            icloud::icloud_sync_status,
            icloud::icloud_resolve_conflict,
            icloud::icloud_get_conflicts,
            icloud::icloud_container_path,
            icloud::icloud_quota_check,
            icloud::icloud_get_pending_changes,
            icloud::icloud_initialize,
            icloud::icloud_local_cache_path,
            // Locale commands
            locale::locale_get,
            locale::locale_set,
            locale::locale_detect_system,
            // Theme commands
            theme::theme_get,
            theme::theme_set,
            theme::theme_detect_system,
            // Update commands
            update::update_check,
            update::update_download,
            update::update_install,
            update::update_get_status,
            // Security commands
            security::security_sanitize_content,
            // Error commands
            error::error_get_logs,
            error::error_report,
            // Performance commands
            performance::performance_get_startup,
            performance::performance_get_memory,
            performance::performance_get_operations,
            // Storage commands (new unified layer)
            storage_commands::storage_config_get,
            storage_commands::storage_config_set_settings,
            storage_commands::storage_config_set_sync_enabled,
            storage_commands::storage_ide_get_active,
            storage_commands::storage_ide_set_active,
            storage_commands::storage_ide_list,
            storage_commands::storage_ide_update,
            storage_commands::storage_library_get,
            storage_commands::storage_groups_get,
            storage_commands::storage_groups_set,
            storage_commands::storage_skills_get,
            storage_commands::storage_skill_add,
            storage_commands::storage_skill_remove,
            storage_commands::storage_sync_state,
            storage_commands::storage_sync_force,
            storage_commands::storage_sync_status,
            storage_commands::storage_needs_migration,
            storage_commands::storage_migrate,
            storage_commands::storage_migrate_rollback,
            storage_commands::storage_client_id,
            storage_commands::storage_icloud_available,
            storage_commands::storage_invalidate_cache,
            storage_commands::storage_ensure_icloud_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
