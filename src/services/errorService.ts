import { invokeIPC } from './ipcService';

export interface ErrorLog {
  timestamp: string;
  level: string;
  code: string;
  message: string;
  context?: unknown;
  stackTrace?: string;
}

export const errorService = {
  getLogs: (limit?: number) => invokeIPC<ErrorLog[]>('error_get_logs', { limit }),
  report: (error: Error, context?: unknown) =>
    invokeIPC<void>('error_report', {
      message: error.message,
      stack: error.stack,
      context,
    }),
};
