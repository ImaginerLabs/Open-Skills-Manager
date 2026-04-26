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

export async function invokeIPC<T>(channel: string, args?: InvokeArgs): Promise<IpcResult<T>> {
  try {
    const result = await invoke<T>(channel, args);
    return { success: true, data: result };
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
