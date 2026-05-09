/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 日志来源 (后端使用大写序列化)
 */
export type LogSource = 'FRONTEND' | 'BACKEND';

/**
 * 日志条目
 */
export interface LogEntry {
  /** ISO 8601 时间戳 */
  timestamp: string;
  /** 日志级别 */
  level: LogLevel;
  /** 模块名称 */
  module: string;
  /** 错误码 */
  code: string;
  /** 日志消息 */
  message: string;
  /** 日志来源 */
  source: LogSource;
  /** 上下文数据 */
  context?: Record<string, unknown>;
  /** 堆栈跟踪 */
  stackTrace?: string;
}

/**
 * 日志过滤条件
 */
export interface LogFilter {
  /** 按级别过滤 */
  level?: LogLevel | LogLevel[];
  /** 按模块过滤 */
  module?: string | string[];
  /** 按来源过滤 */
  source?: LogSource;
  /** 按错误码过滤 */
  code?: string | string[];
  /** 起始时间 (ISO 8601) */
  startTime?: string;
  /** 结束时间 (ISO 8601) */
  endTime?: string;
  /** 搜索关键词 */
  search?: string;
}

/**
 * 日志列表查询参数
 */
export interface LogListParams {
  /** 过滤条件 */
  filter?: LogFilter;
  /** 返回数量限制 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
  /** 排序方向 */
  order?: 'asc' | 'desc';
}

/**
 * 日志统计数据
 */
export interface LogStats {
  /** 总数 */
  total: number;
  /** 按级别统计 */
  byLevel: Record<LogLevel, number>;
  /** 按模块统计 */
  byModule: Record<string, number>;
  /** 最早时间戳 */
  oldestTimestamp?: string;
  /** 最新时间戳 */
  newestTimestamp?: string;
}

/**
 * 日志列表和统计数据（组合返回，避免重复读取文件）
 */
export interface LogsAndStats {
  /** 日志列表 */
  logs: LogEntry[];
  /** 统计数据 */
  stats: LogStats;
  /** 日志文件路径 */
  path: string;
}

/**
 * 日志导出格式
 */
export type LogExportFormat = 'json' | 'csv' | 'txt';

/**
 * 模块名称常量 - 与后端实际使用的模块名称保持一致
 */
export const LOG_MODULES = {
  LIBRARY: 'LIBRARY',
  GLOBAL: 'GLOBAL',
  PROJECT: 'PROJECT',
  DEPLOY: 'DEPLOY',
  SYNC: 'SYNC',
  SYSTEM: 'SYSTEM',
  UPDATE: 'UPDATE',
} as const;

export type LogModule = (typeof LOG_MODULES)[keyof typeof LOG_MODULES];

/**
 * 错误码常量
 */
export const LOG_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  OPERATION_FAILED: 'OPERATION_FAILED',

  // Library 模块
  LIBRARY_IMPORT_FAILED: 'LIBRARY_IMPORT_FAILED',
  LIBRARY_EXPORT_FAILED: 'LIBRARY_EXPORT_FAILED',
  LIBRARY_DELETE_FAILED: 'LIBRARY_DELETE_FAILED',
  LIBRARY_MOVE_FAILED: 'LIBRARY_MOVE_FAILED',

  // Global 模块
  GLOBAL_PULL_FAILED: 'GLOBAL_PULL_FAILED',
  GLOBAL_PUSH_FAILED: 'GLOBAL_PUSH_FAILED',
  GLOBAL_INSTALL_FAILED: 'GLOBAL_INSTALL_FAILED',
  GLOBAL_UNINSTALL_FAILED: 'GLOBAL_UNINSTALL_FAILED',

  // Project 模块
  PROJECT_ADD_FAILED: 'PROJECT_ADD_FAILED',
  PROJECT_REMOVE_FAILED: 'PROJECT_REMOVE_FAILED',
  PROJECT_REFRESH_FAILED: 'PROJECT_REFRESH_FAILED',
  PROJECT_SKILL_NOT_FOUND: 'PROJECT_SKILL_NOT_FOUND',

  // Deploy 模块
  DEPLOY_TO_GLOBAL_FAILED: 'DEPLOY_TO_GLOBAL_FAILED',
  DEPLOY_TO_PROJECT_FAILED: 'DEPLOY_TO_PROJECT_FAILED',
  DEPLOY_BATCH_FAILED: 'DEPLOY_BATCH_FAILED',

  // Sync 模块
  SYNC_FAILED: 'SYNC_FAILED',
  SYNC_CONFLICT: 'SYNC_CONFLICT',
  SYNC_TIMEOUT: 'SYNC_TIMEOUT',

  // Config 模块
  CONFIG_LOAD_FAILED: 'CONFIG_LOAD_FAILED',
  CONFIG_SAVE_FAILED: 'CONFIG_SAVE_FAILED',
  CONFIG_INVALID: 'CONFIG_INVALID',

  // IDE 模块
  IDE_SWITCH_FAILED: 'IDE_SWITCH_FAILED',
  IDE_CONFIG_NOT_FOUND: 'IDE_CONFIG_NOT_FOUND',

  // Update 模块
  UPDATE_CHECK_FAILED: 'UPDATE_CHECK_FAILED',
  UPDATE_DOWNLOAD_FAILED: 'UPDATE_DOWNLOAD_FAILED',
  UPDATE_INSTALL_FAILED: 'UPDATE_INSTALL_FAILED',

  // Storage 模块
  STORAGE_READ_FAILED: 'STORAGE_READ_FAILED',
  STORAGE_WRITE_FAILED: 'STORAGE_WRITE_FAILED',
  STORAGE_DELETE_FAILED: 'STORAGE_DELETE_FAILED',

  // UI 模块
  UI_RENDER_ERROR: 'UI_RENDER_ERROR',
  UI_STATE_ERROR: 'UI_STATE_ERROR',

  // Search 模块
  SEARCH_FAILED: 'SEARCH_FAILED',

  // Sidebar 模块
  SIDEBAR_REFRESH_FAILED: 'SIDEBAR_REFRESH_FAILED',

  // Selection 模块
  SELECTION_DEBUG: 'SELECTION_DEBUG',
  SELECTION_PROJECT_NOT_FOUND: 'SELECTION_PROJECT_NOT_FOUND',

  // Perf 模块
  PERF_SLOW_OPERATION: 'PERF_SLOW_OPERATION',
  PERF_MEMORY_WARNING: 'PERF_MEMORY_WARNING',
} as const;

export type LogCode = (typeof LOG_CODES)[keyof typeof LOG_CODES];