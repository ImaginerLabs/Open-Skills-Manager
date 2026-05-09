import { invokeIPC } from './ipcService';
import type {
  LogLevel,
  LogEntry,
  LogListParams,
  LogStats,
  LogExportFormat,
  LogFilter,
  LogsAndStats,
} from '@/types/log';

/**
 * 日志服务 - 封装日志相关 IPC 调用
 */
export const logService = {
  /**
   * 查询日志列表
   * @param params 查询参数
   * @returns 日志条目列表
   */
  list: (params?: LogListParams) => {
    const args: Record<string, unknown> = {};
    if (params?.filter) {
      args.filter = params.filter;
    }
    if (params?.limit) {
      args.limit = params.limit;
    }
    return invokeIPC<LogEntry[]>('log_list', args);
  },

  /**
   * 导出日志
   * @param format 导出格式
   * @param filter 可选的过滤条件
   * @returns 导出文件路径
   */
  export: (format: LogExportFormat, filter?: LogFilter) =>
    invokeIPC<string>('log_export', { format, filter }),

  /**
   * 清除日志
   * @param before 清除此时间之前的日志 (ISO 8601)
   * @param keepDays 保留最近 N 天的日志
   * @returns 清除的日志数量
   */
  clear: (before?: string, keepDays?: number) =>
    invokeIPC<number>('log_clear', { before, keepDays }),

  /**
   * 写入日志条目
   * @param level 日志级别
   * @param module 模块名称
   * @param code 错误码
   * @param message 日志消息
   * @param context 上下文数据
   */
  write: (
    level: LogLevel,
    module: string,
    code: string,
    message: string,
    context?: Record<string, unknown>
  ) =>
    invokeIPC<void>('log_write', {
      level,
      module,
      code,
      message,
      context,
      source: 'FRONTEND',
    }),

  /**
   * 获取日志统计信息
   * @returns 统计数据
   */
  stats: () => invokeIPC<LogStats>('log_stats', {}),

  /**
   * 获取日志文件路径
   * @returns 日志文件路径
   */
  path: () => invokeIPC<string>('log_path', {}),

  /**
   * 获取日志列表和统计数据（单次读取，避免重复文件 I/O）
   * @param params 查询参数
   * @returns 日志列表和统计数据
   */
  listWithStats: (params?: LogListParams) => {
    const args: Record<string, unknown> = {};
    if (params?.filter) {
      args.filter = params.filter;
    }
    if (params?.limit) {
      args.limit = params.limit;
    }
    return invokeIPC<LogsAndStats>('log_list_with_stats', args);
  },

  // ============ 便捷方法 ============

  /**
   * 记录 debug 级别日志
   */
  debug: (module: string, code: string, message: string, context?: Record<string, unknown>) =>
    logService.write('debug', module, code, message, context),

  /**
   * 记录 info 级别日志
   */
  info: (module: string, code: string, message: string, context?: Record<string, unknown>) =>
    logService.write('info', module, code, message, context),

  /**
   * 记录 warn 级别日志
   */
  warn: (module: string, code: string, message: string, context?: Record<string, unknown>) =>
    logService.write('warn', module, code, message, context),

  /**
   * 记录 error 级别日志
   */
  error: (module: string, code: string, message: string, context?: Record<string, unknown>) =>
    logService.write('error', module, code, message, context),

  /**
   * 记录 Error 对象
   * @param module 模块名称
   * @param code 错误码
   * @param err Error 对象
   * @param context 额外上下文
   */
  reportError: (
    module: string,
    code: string,
    err: Error,
    context?: Record<string, unknown>
  ) =>
    logService.write('error', module, code, err.message, {
      ...context,
      stack: err.stack,
    }),
};

// 重新导出类型和常量，方便使用
export { LOG_MODULES, LOG_CODES } from '@/types/log';
export type {
  LogLevel,
  LogSource,
  LogEntry,
  LogFilter,
  LogListParams,
  LogStats,
  LogsAndStats,
  LogExportFormat,
  LogModule,
  LogCode,
} from '@/types/log';
