import { invoke } from '@tauri-apps/api/core';
import type { InvokeArgs } from '@tauri-apps/api/core';

export interface IPCError {
  code: string;
  message: string;
  details?: unknown;
}

export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: IPCError };

// Backend returns IpcResult<T> structure, so we need to handle it
interface BackendResult<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export async function invokeIPC<T>(channel: string, args?: InvokeArgs): Promise<IpcResult<T>> {
  try {
    // Backend returns IpcResult<T> structure
    const result = await invoke<BackendResult<T>>(channel, args);

    if (result.success && result.data !== undefined) {
      return { success: true, data: result.data };
    } else if (result.error) {
      return {
        success: false,
        error: {
          code: result.error.code,
          message: result.error.message,
        },
      };
    } else {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Invalid response structure',
        },
      };
    }
  } catch (e) {
    const error: IPCError = {
      code: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error',
      details: e,
    };
    return { success: false, error };
  }
}

export function createEventSubscription<T>(
  _channel: string,
  _callback: (data: T) => void
): () => void {
  // Tauri event subscription will be implemented when needed
  // For now, return a cleanup function placeholder
  return () => {};
}
