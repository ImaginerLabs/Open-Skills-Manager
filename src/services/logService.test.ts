import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logService, LOG_MODULES, LOG_CODES } from '@/services/logService';

// Mock ipcService
vi.mock('@/services/ipcService', () => ({
  invokeIPC: vi.fn(),
}));

import { invokeIPC } from '@/services/ipcService';

const mockInvokeIPC = vi.mocked(invokeIPC);

describe('logService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // list Method Tests
  // ===========================================================================
  describe('list', () => {
    it('should call log_list with no params', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: [] });

      await logService.list();

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list', {});
    });

    it('should call log_list with filter', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: [] });

      await logService.list({
        filter: { level: 'error', module: 'LIBRARY' },
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list', {
        filter: { level: 'error', module: 'LIBRARY' },
      });
    });

    it('should call log_list with limit', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: [] });

      await logService.list({ limit: 50 });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list', { limit: 50 });
    });

    it('should call log_list with filter and limit', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: [] });

      await logService.list({
        filter: { level: ['error', 'warn'] },
        limit: 100,
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list', {
        filter: { level: ['error', 'warn'] },
        limit: 100,
      });
    });

    it('should return log entries', async () => {
      const mockLogs = [
        {
          timestamp: '2025-05-09T10:00:00Z',
          level: 'error',
          module: 'LIBRARY',
          code: 'LIBRARY_IMPORT_FAILED',
          message: 'Import failed',
          source: 'BACKEND',
        },
      ];

      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockLogs });

      const result = await logService.list();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]!.code).toBe('LIBRARY_IMPORT_FAILED');
      }
    });
  });

  // ===========================================================================
  // export Method Tests
  // ===========================================================================
  describe('export', () => {
    it('should call log_export with format', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: '/path/to/export.json' });

      await logService.export('json');

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_export', {
        format: 'json',
        filter: undefined,
      });
    });

    it('should call log_export with format and filter', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: '/path/to/export.csv' });

      await logService.export('csv', { level: 'error' });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_export', {
        format: 'csv',
        filter: { level: 'error' },
      });
    });

    it('should support all export formats', async () => {
      const formats: Array<'json' | 'csv' | 'txt'> = ['json', 'csv', 'txt'];

      for (const format of formats) {
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: `/path/to/export.${format}` });

        const result = await logService.export(format);

        expect(result.success).toBe(true);
      }
    });
  });

  // ===========================================================================
  // clear Method Tests
  // ===========================================================================
  describe('clear', () => {
    it('should call log_clear with no params', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: 10 });

      await logService.clear();

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_clear', {
        before: undefined,
        keepDays: undefined,
      });
    });

    it('should call log_clear with before timestamp', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: 5 });

      await logService.clear('2025-05-01T00:00:00Z');

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_clear', {
        before: '2025-05-01T00:00:00Z',
        keepDays: undefined,
      });
    });

    it('should call log_clear with keepDays', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: 3 });

      await logService.clear(undefined, 7);

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_clear', {
        before: undefined,
        keepDays: 7,
      });
    });

    it('should call log_clear with both params', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: 8 });

      await logService.clear('2025-05-01T00:00:00Z', 30);

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_clear', {
        before: '2025-05-01T00:00:00Z',
        keepDays: 30,
      });
    });

    it('should return number of cleared logs', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: 25 });

      const result = await logService.clear();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(25);
      }
    });
  });

  // ===========================================================================
  // write Method Tests
  // ===========================================================================
  describe('write', () => {
    it('should call log_write with all params', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await logService.write('error', 'LIBRARY', 'LIBRARY_IMPORT_FAILED', 'Import failed', {
        skillId: 'skill-123',
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'error',
        module: 'LIBRARY',
        code: 'LIBRARY_IMPORT_FAILED',
        message: 'Import failed',
        context: { skillId: 'skill-123' },
        source: 'FRONTEND',
      });
    });

    it('should call log_write without context', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await logService.write('info', 'SYSTEM', 'START', 'App started');

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'info',
        module: 'SYSTEM',
        code: 'START',
        message: 'App started',
        context: undefined,
        source: 'FRONTEND',
      });
    });

    it('should always set source to FRONTEND', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await logService.write('warn', 'SYNC', 'SYNC_WARN', 'Sync delayed');

      expect(mockInvokeIPC).toHaveBeenCalledWith(
        'log_write',
        expect.objectContaining({
          source: 'FRONTEND',
        })
      );
    });

    it('should support all log levels', async () => {
      const levels: Array<'debug' | 'info' | 'warn' | 'error'> = ['debug', 'info', 'warn', 'error'];

      for (const level of levels) {
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

        await logService.write(level, 'SYSTEM', 'TEST', `Test ${level}`);

        expect(mockInvokeIPC).toHaveBeenCalledWith(
          'log_write',
          expect.objectContaining({ level })
        );
      }
    });
  });

  // ===========================================================================
  // stats Method Tests
  // ===========================================================================
  describe('stats', () => {
    it('should call log_stats', async () => {
      const mockStats = {
        total: 100,
        byLevel: { debug: 20, info: 50, warn: 20, error: 10 },
        byModule: { LIBRARY: 30, DEPLOY: 70 },
      };

      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockStats });

      await logService.stats();

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_stats', {});
    });

    it('should return stats data', async () => {
      const mockStats = {
        total: 50,
        byLevel: { debug: 10, info: 20, warn: 15, error: 5 },
        byModule: { SYSTEM: 50 },
        oldestTimestamp: '2025-05-01T00:00:00Z',
        newestTimestamp: '2025-05-09T00:00:00Z',
      };

      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockStats });

      const result = await logService.stats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(50);
        expect(result.data.byLevel.error).toBe(5);
      }
    });
  });

  // ===========================================================================
  // path Method Tests
  // ===========================================================================
  describe('path', () => {
    it('should call log_path', async () => {
      mockInvokeIPC.mockResolvedValueOnce({
        success: true,
        data: '/Users/test/Library/Logs/CSM/csm.log',
      });

      await logService.path();

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_path', {});
    });

    it('should return log file path', async () => {
      mockInvokeIPC.mockResolvedValueOnce({
        success: true,
        data: '/Users/test/Library/Logs/CSM/csm.log',
      });

      const result = await logService.path();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toContain('csm.log');
      }
    });
  });

  // ===========================================================================
  // listWithStats Method Tests
  // ===========================================================================
  describe('listWithStats', () => {
    it('should call log_list_with_stats with no params', async () => {
      mockInvokeIPC.mockResolvedValueOnce({
        success: true,
        data: {
          logs: [],
          stats: { total: 0, byLevel: {}, byModule: {}, path: '' },
          path: '/path/to/csm.log',
        },
      });

      await logService.listWithStats();

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list_with_stats', {});
    });

    it('should call log_list_with_stats with filter', async () => {
      mockInvokeIPC.mockResolvedValueOnce({
        success: true,
        data: {
          logs: [],
          stats: { total: 0, byLevel: {}, byModule: {} },
          path: '/path/to/csm.log',
        },
      });

      await logService.listWithStats({
        filter: { level: 'error' },
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list_with_stats', {
        filter: { level: 'error' },
      });
    });

    it('should call log_list_with_stats with limit', async () => {
      mockInvokeIPC.mockResolvedValueOnce({
        success: true,
        data: {
          logs: [],
          stats: { total: 0, byLevel: {}, byModule: {} },
          path: '/path/to/csm.log',
        },
      });

      await logService.listWithStats({ limit: 50 });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list_with_stats', { limit: 50 });
    });

    it('should return both logs and stats', async () => {
      const mockData = {
        logs: [
          {
            timestamp: '2025-05-09T10:00:00Z',
            level: 'error',
            module: 'LIBRARY',
            code: 'LIBRARY_IMPORT_FAILED',
            message: 'Import failed',
            source: 'BACKEND',
          },
        ],
        stats: {
          total: 1,
          byLevel: { debug: 0, info: 0, warn: 0, error: 1 },
          byModule: { LIBRARY: 1 },
          oldestTimestamp: '2025-05-09T10:00:00Z',
          newestTimestamp: '2025-05-09T10:00:00Z',
        },
        path: '/Users/test/Library/Logs/CSM/csm.log',
      };

      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockData });

      const result = await logService.listWithStats();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logs).toHaveLength(1);
        expect(result.data.stats.total).toBe(1);
        expect(result.data.path).toContain('csm.log');
      }
    });
  });

  // ===========================================================================
  // Convenience Methods Tests
  // ===========================================================================
  describe('convenience methods', () => {
    it('debug should call write with debug level', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await logService.debug('SYSTEM', 'TEST', 'Debug message', { key: 'value' });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'debug',
        module: 'SYSTEM',
        code: 'TEST',
        message: 'Debug message',
        context: { key: 'value' },
        source: 'FRONTEND',
      });
    });

    it('info should call write with info level', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await logService.info('LIBRARY', 'IMPORT_SUCCESS', 'Imported skill', {
        skillId: '123',
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'info',
        module: 'LIBRARY',
        code: 'IMPORT_SUCCESS',
        message: 'Imported skill',
        context: { skillId: '123' },
        source: 'FRONTEND',
      });
    });

    it('warn should call write with warn level', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await logService.warn('SYNC', 'SYNC_WARN', 'Sync delayed');

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'warn',
        module: 'SYNC',
        code: 'SYNC_WARN',
        message: 'Sync delayed',
        context: undefined,
        source: 'FRONTEND',
      });
    });

    it('error should call write with error level', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await logService.error('DEPLOY', 'DEPLOY_FAILED', 'Deploy failed', {
        skillId: '456',
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'error',
        module: 'DEPLOY',
        code: 'DEPLOY_FAILED',
        message: 'Deploy failed',
        context: { skillId: '456' },
        source: 'FRONTEND',
      });
    });

    it('reportError should include stack trace', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      await logService.reportError('LIBRARY', 'LIBRARY_DELETE_FAILED', error, {
        skillId: '789',
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'error',
        module: 'LIBRARY',
        code: 'LIBRARY_DELETE_FAILED',
        message: 'Test error',
        context: {
          skillId: '789',
          stack: 'Error stack trace',
        },
        source: 'FRONTEND',
      });
    });

    it('reportError should handle Error without stack', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      const error = new Error('No stack') as Error & { stack?: string };
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      error.stack = undefined!;

      await logService.reportError('SYSTEM', 'UNKNOWN_ERROR', error);

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'error',
        module: 'SYSTEM',
        code: 'UNKNOWN_ERROR',
        message: 'No stack',
        context: { stack: undefined },
        source: 'FRONTEND',
      });
    });
  });

  // ===========================================================================
  // LOG_MODULES Constants Tests
  // ===========================================================================
  describe('LOG_MODULES', () => {
    it('should have all required modules', () => {
      expect(LOG_MODULES.LIBRARY).toBe('LIBRARY');
      expect(LOG_MODULES.GLOBAL).toBe('GLOBAL');
      expect(LOG_MODULES.PROJECT).toBe('PROJECT');
      expect(LOG_MODULES.DEPLOY).toBe('DEPLOY');
      expect(LOG_MODULES.SYNC).toBe('SYNC');
      expect(LOG_MODULES.SYSTEM).toBe('SYSTEM');
      expect(LOG_MODULES.UPDATE).toBe('UPDATE');
    });

    it('should be usable in type-safe manner', () => {
      const module: 'LIBRARY' = LOG_MODULES.LIBRARY;
      expect(module).toBe('LIBRARY');
    });
  });

  // ===========================================================================
  // LOG_CODES Constants Tests
  // ===========================================================================
  describe('LOG_CODES', () => {
    it('should have common error codes', () => {
      expect(LOG_CODES.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
      expect(LOG_CODES.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(LOG_CODES.OPERATION_FAILED).toBe('OPERATION_FAILED');
    });

    it('should have Library module codes', () => {
      expect(LOG_CODES.LIBRARY_IMPORT_FAILED).toBe('LIBRARY_IMPORT_FAILED');
      expect(LOG_CODES.LIBRARY_EXPORT_FAILED).toBe('LIBRARY_EXPORT_FAILED');
      expect(LOG_CODES.LIBRARY_DELETE_FAILED).toBe('LIBRARY_DELETE_FAILED');
      expect(LOG_CODES.LIBRARY_MOVE_FAILED).toBe('LIBRARY_MOVE_FAILED');
    });

    it('should have Global module codes', () => {
      expect(LOG_CODES.GLOBAL_PULL_FAILED).toBe('GLOBAL_PULL_FAILED');
      expect(LOG_CODES.GLOBAL_PUSH_FAILED).toBe('GLOBAL_PUSH_FAILED');
      expect(LOG_CODES.GLOBAL_INSTALL_FAILED).toBe('GLOBAL_INSTALL_FAILED');
      expect(LOG_CODES.GLOBAL_UNINSTALL_FAILED).toBe('GLOBAL_UNINSTALL_FAILED');
    });

    it('should have Project module codes', () => {
      expect(LOG_CODES.PROJECT_ADD_FAILED).toBe('PROJECT_ADD_FAILED');
      expect(LOG_CODES.PROJECT_REMOVE_FAILED).toBe('PROJECT_REMOVE_FAILED');
      expect(LOG_CODES.PROJECT_REFRESH_FAILED).toBe('PROJECT_REFRESH_FAILED');
      expect(LOG_CODES.PROJECT_SKILL_NOT_FOUND).toBe('PROJECT_SKILL_NOT_FOUND');
    });

    it('should have Deploy module codes', () => {
      expect(LOG_CODES.DEPLOY_TO_GLOBAL_FAILED).toBe('DEPLOY_TO_GLOBAL_FAILED');
      expect(LOG_CODES.DEPLOY_TO_PROJECT_FAILED).toBe('DEPLOY_TO_PROJECT_FAILED');
      expect(LOG_CODES.DEPLOY_BATCH_FAILED).toBe('DEPLOY_BATCH_FAILED');
    });

    it('should have Sync module codes', () => {
      expect(LOG_CODES.SYNC_FAILED).toBe('SYNC_FAILED');
      expect(LOG_CODES.SYNC_CONFLICT).toBe('SYNC_CONFLICT');
      expect(LOG_CODES.SYNC_TIMEOUT).toBe('SYNC_TIMEOUT');
    });

    it('should have Update module codes', () => {
      expect(LOG_CODES.UPDATE_CHECK_FAILED).toBe('UPDATE_CHECK_FAILED');
      expect(LOG_CODES.UPDATE_DOWNLOAD_FAILED).toBe('UPDATE_DOWNLOAD_FAILED');
      expect(LOG_CODES.UPDATE_INSTALL_FAILED).toBe('UPDATE_INSTALL_FAILED');
    });

    it('should have Storage module codes', () => {
      expect(LOG_CODES.STORAGE_READ_FAILED).toBe('STORAGE_READ_FAILED');
      expect(LOG_CODES.STORAGE_WRITE_FAILED).toBe('STORAGE_WRITE_FAILED');
      expect(LOG_CODES.STORAGE_DELETE_FAILED).toBe('STORAGE_DELETE_FAILED');
    });
  });

  // ===========================================================================
  // Parameter Serialization Tests
  // ===========================================================================
  describe('parameter serialization', () => {
    it('should correctly serialize filter with array levels', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: [] });

      await logService.list({
        filter: {
          level: ['debug', 'info'],
          module: ['LIBRARY', 'SYSTEM'],
        },
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list', {
        filter: {
          level: ['debug', 'info'],
          module: ['LIBRARY', 'SYSTEM'],
        },
      });
    });

    it('should correctly serialize complex context', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      const complexContext = {
        skillId: '123',
        path: '/path/to/skill',
        metadata: {
          version: '1.0.0',
          tags: ['tag1', 'tag2'],
        },
        count: 42,
        enabled: true,
      };

      await logService.write('info', 'LIBRARY', 'IMPORT_SUCCESS', 'Imported', complexContext);

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'info',
        module: 'LIBRARY',
        code: 'IMPORT_SUCCESS',
        message: 'Imported',
        context: complexContext,
        source: 'FRONTEND',
      });
    });

    it('should correctly serialize search filter', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: [] });

      await logService.list({
        filter: {
          search: 'import failed',
          startTime: '2025-05-01T00:00:00Z',
          endTime: '2025-05-09T23:59:59Z',
        },
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list', {
        filter: {
          search: 'import failed',
          startTime: '2025-05-01T00:00:00Z',
          endTime: '2025-05-09T23:59:59Z',
        },
      });
    });

    it('should correctly serialize source filter', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: [] });

      await logService.list({
        filter: {
          source: 'BACKEND',
        },
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_list', {
        filter: {
          source: 'BACKEND',
        },
      });
    });
  });

  // ===========================================================================
  // Integration-like Tests (using constants)
  // ===========================================================================
  describe('integration-like tests', () => {
    it('should work with real constants pattern', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await logService.error(
        LOG_MODULES.LIBRARY,
        LOG_CODES.LIBRARY_IMPORT_FAILED,
        'Failed to import skill',
        {
          skillId: 'skill-123',
          path: '/path/to/skill',
          error: 'Permission denied',
        }
      );

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'error',
        module: 'LIBRARY',
        code: 'LIBRARY_IMPORT_FAILED',
        message: 'Failed to import skill',
        context: {
          skillId: 'skill-123',
          path: '/path/to/skill',
          error: 'Permission denied',
        },
        source: 'FRONTEND',
      });
    });

    it('should work with reportError and constants', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      const error = new Error('Network timeout');

      await logService.reportError(LOG_MODULES.DEPLOY, LOG_CODES.DEPLOY_TO_GLOBAL_FAILED, error, {
        skillId: 'skill-456',
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('log_write', {
        level: 'error',
        module: 'DEPLOY',
        code: 'DEPLOY_TO_GLOBAL_FAILED',
        message: 'Network timeout',
        context: {
          skillId: 'skill-456',
          stack: error.stack,
        },
        source: 'FRONTEND',
      });
    });
  });
});
