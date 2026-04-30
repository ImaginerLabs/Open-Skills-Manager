import { useMemo } from 'react';
import ClaudeCodeAvatar from '@lobehub/icons/es/ClaudeCode/components/Avatar';
import GeminiAvatar from '@lobehub/icons/es/Gemini/components/Avatar';
import OpenCodeAvatar from '@lobehub/icons/es/OpenCode/components/Avatar';
import CursorAvatar from '@lobehub/icons/es/Cursor/components/Avatar';
import { getIconByName, isIDEIcon } from '@/components/ui/IconPicker';
import styles from '@/components/common/IDESwitcher/IDESwitcher.module.scss';

export function useIDEIcon() {
  const getIcon = (iconName: string, size: number = 14) => {
    switch (iconName) {
      case 'claude-code':
      case 'claude':
        return <ClaudeCodeAvatar size={size} />;
      case 'opencode':
        return <OpenCodeAvatar size={size} />;
      case 'cursor':
        return <CursorAvatar size={size} />;
      case 'gemini':
        return <GeminiAvatar size={size} />;
    }
    const icon = getIconByName(iconName, size);
    if (!icon) return null;
    if (isIDEIcon(iconName)) {
      return icon;
    }
    return <span className={styles.customIcon}>{icon}</span>;
  };

  return useMemo(() => ({ getIcon }), []);
}