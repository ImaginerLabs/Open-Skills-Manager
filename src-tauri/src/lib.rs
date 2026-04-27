mod commands;
mod utils;

use commands::{
    library, global, project, deploy, search, config, icloud, locale, theme, update, security,
    error, performance,
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
            library::library_categories_list,
            library::library_categories_create,
            library::library_categories_rename,
            library::library_categories_delete,
            library::library_groups_create,
            library::library_groups_rename,
            library::library_groups_delete,
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
            // Config commands
            config::config_get,
            config::config_set,
            // iCloud commands
            icloud::icloud_sync_status,
            icloud::icloud_resolve_conflict,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
