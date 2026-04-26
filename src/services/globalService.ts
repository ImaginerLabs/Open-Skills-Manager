import { invokeIPC } from './ipcService';
import type { GlobalSkill } from '../stores/globalStore';

export const globalService = {
  list: () => invokeIPC<GlobalSkill[]>('global_list'),
  get: (id: string) => invokeIPC<GlobalSkill>('global_get', { id }),
  delete: (id: string) => invokeIPC<void>('global_delete', { id }),
  pull: (id: string) => invokeIPC<void>('global_pull', { id }),
};
