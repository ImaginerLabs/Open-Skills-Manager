import { invokeIPC } from './ipcService';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
}

export const updateService = {
  check: () => invokeIPC<UpdateInfo>('update_check'),
  download: () => invokeIPC<void>('update_download'),
  install: () => invokeIPC<void>('update_install'),
  getStatus: () => invokeIPC<UpdateInfo>('update_get_status'),
};
