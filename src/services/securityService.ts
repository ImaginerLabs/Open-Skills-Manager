import { invokeIPC } from './ipcService';

export const securityService = {
  sanitizeContent: (content: string) =>
    invokeIPC<string>('security_sanitize_content', { content }),
};
