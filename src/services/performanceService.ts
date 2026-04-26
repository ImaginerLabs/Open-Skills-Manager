import { invokeIPC } from './ipcService';

export interface PerformanceMetrics {
  startupTime: number;
  memoryUsage: number;
  operations: OperationMetric[];
}

export interface OperationMetric {
  name: string;
  duration: number;
  timestamp: string;
}

export const performanceService = {
  getStartup: () => invokeIPC<number>('performance_get_startup'),
  getMemory: () => invokeIPC<number>('performance_get_memory'),
  getOperations: () => invokeIPC<OperationMetric[]>('performance_get_operations'),
};
