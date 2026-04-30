// Default IDE configurations
import type { IDEConfig } from '@/types/ide';

// Default IDE ID used as fallback
export const DEFAULT_IDE_ID = 'claude-code';

export const DEFAULT_IDE_CONFIGS: IDEConfig[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    globalScopePath: '~/.claude/skills',
    projectScopeName: '.claude',
    projects: [],
    isEnabled: true,
    icon: 'claude-code',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    globalScopePath: '~/.config/opencode/skills',
    projectScopeName: '.opencode',
    projects: [],
    isEnabled: true,
    icon: 'opencode',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    globalScopePath: '~/.cursor/skills',
    projectScopeName: '.cursor',
    projects: [],
    isEnabled: true,
    icon: 'cursor',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    globalScopePath: '~/.gemini/skills',
    projectScopeName: '.gemini',
    projects: [],
    isEnabled: true,
    icon: 'gemini',
  },
];

// IDE icon names for type safety
export type IDEIconName = 'claude-code' | 'claude' | 'opencode' | 'cursor' | 'gemini';