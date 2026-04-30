import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invokeIPC } from '@/services/ipcService';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';

const mockInvoke = vi.mocked(invoke);

describe('ipcService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('invokeIPC', () => {
    describe('success cases', () => {
      it('should return success result with data', async () => {
        mockInvoke.mockResolvedValueOnce({
          success: true,
          data: { id: 1, name: 'test' },
        });

        const result = await invokeIPC<{ id: number; name: string }>('test_channel');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({ id: 1, name: 'test' });
        }
      });

      it('should pass args to invoke', async () => {
        mockInvoke.mockResolvedValueOnce({ success: true, data: 'ok' });

        await invokeIPC('test_channel', { path: '/test', id: 123 });

        expect(mockInvoke).toHaveBeenCalledWith('test_channel', { path: '/test', id: 123 });
      });

      it('should handle null data', async () => {
        mockInvoke.mockResolvedValueOnce({ success: true, data: null });

        const result = await invokeIPC<null>('test_channel');

        // null is valid data
        expect(result.success).toBe(true);
      });
    });

    describe('error cases', () => {
      it('should return error when success is false', async () => {
        mockInvoke.mockResolvedValueOnce({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Item not found' },
        });

        const result = await invokeIPC('test_channel');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('NOT_FOUND');
          expect(result.error.message).toBe('Item not found');
        }
      });

      it('should return error when data is undefined but success is true', async () => {
        mockInvoke.mockResolvedValueOnce({ success: true });

        const result = await invokeIPC('test_channel');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('INTERNAL_ERROR');
          expect(result.error.message).toBe('Invalid response structure');
        }
      });

      it('should handle invoke throwing an error', async () => {
        mockInvoke.mockRejectedValueOnce(new Error('Network timeout'));

        const result = await invokeIPC('test_channel');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('INTERNAL_ERROR');
          expect(result.error.message).toBe('Network timeout');
        }
      });

      it('should handle invoke throwing non-Error', async () => {
        mockInvoke.mockRejectedValueOnce('Unknown failure');

        const result = await invokeIPC('test_channel');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('INTERNAL_ERROR');
          expect(result.error.message).toBe('Unknown error');
        }
      });

      it('should include error details when invoke throws', async () => {
        const error = new Error('Connection refused');
        mockInvoke.mockRejectedValueOnce(error);

        const result = await invokeIPC('test_channel');

        if (!result.success) {
          expect(result.error.details).toBe(error);
        }
      });
    });

    describe('edge cases', () => {
      it('should handle empty object response', async () => {
        mockInvoke.mockResolvedValueOnce({});

        const result = await invokeIPC('test_channel');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('INTERNAL_ERROR');
        }
      });

      it('should handle error without code', async () => {
        mockInvoke.mockResolvedValueOnce({
          success: false,
          error: { message: 'Something went wrong' },
        });

        const result = await invokeIPC('test_channel');

        expect(result.success).toBe(false);
      });

      it('should handle array data', async () => {
        mockInvoke.mockResolvedValueOnce({
          success: true,
          data: [{ id: 1 }, { id: 2 }],
        });

        const result = await invokeIPC<{ id: number }[]>('test_channel');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveLength(2);
        }
      });

      it('should handle string data', async () => {
        mockInvoke.mockResolvedValueOnce({ success: true, data: 'result string' });

        const result = await invokeIPC<string>('test_channel');

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe('result string');
        }
      });
    });
  });
});
