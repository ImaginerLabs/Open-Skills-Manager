import { useCallback, useEffect } from 'react';
import ClaudeCodeAvatar from '@lobehub/icons/es/ClaudeCode/components/Avatar';
import GeminiAvatar from '@lobehub/icons/es/Gemini/components/Avatar';
import OpenAIAvatar from '@lobehub/icons/es/OpenAI/components/Avatar';
import CursorAvatar from '@lobehub/icons/es/Cursor/components/Avatar';
import { useIDEStore, useLibraryStore, useGlobalStore, useProjectStore, useUIStore } from '@/stores';
import { ideService, configService, libraryService } from '@/services';
import styles from './IDESwitcher.module.scss';

// Default IDE configs
const DEFAULT_IDE_CONFIGS = [
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
    isEnabled: false, // Coming soon
    icon: 'cursor',
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    globalScopePath: '~/.gemini/skills',
    projectScopeName: '.gemini',
    projects: [],
    isEnabled: false, // Coming soon
    icon: 'gemini',
  },
];

export function IDESwitcher(): React.ReactElement | null {
  const { ideConfigs, activeIdeId, setActiveIDE, setIDEConfigs, setLoading } = useIDEStore();
  const { setSkills: setLibrarySkills, setGroups } = useLibraryStore();
  const { setSkills: setGlobalSkills } = useGlobalStore();
  const { setProjects } = useProjectStore();
  const { showToast } = useUIStore();

  // Use configs from store, or defaults if empty - defined early for use in callbacks
  const configsToShow = ideConfigs.length > 0 ? ideConfigs : DEFAULT_IDE_CONFIGS;

  // Load IDE configs on mount
  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true);
      try {
        const result = await configService.get();
        if (result.success && result.data) {
          const config = result.data;
          if (config.ideConfigs && config.ideConfigs.length > 0) {
            // Merge backend configs with defaults to ensure new IDEs are included
            const mergedConfigs = DEFAULT_IDE_CONFIGS.map((defaultIde) => {
              const existingConfig = config.ideConfigs.find((ide) => ide.id === defaultIde.id);
              return existingConfig || defaultIde;
            });
            setIDEConfigs(mergedConfigs);
            setActiveIDE(config.activeIdeId);
          } else {
            setIDEConfigs(DEFAULT_IDE_CONFIGS);
            setActiveIDE('claude-code');
          }
        } else {
          setIDEConfigs(DEFAULT_IDE_CONFIGS);
          setActiveIDE('claude-code');
        }
      } catch (error) {
        console.error('Failed to load IDE configs:', error);
        setIDEConfigs(DEFAULT_IDE_CONFIGS);
        setActiveIDE('claude-code');
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, [setIDEConfigs, setActiveIDE, setLoading]);

  // Refresh all app data after IDE switch
  const refreshAllData = useCallback(async (ideId: string) => {
    try {
      // 1. Refresh library skills (shared across IDEs)
      const libraryResult = await libraryService.list();
      if (libraryResult.success && libraryResult.data) {
        setLibrarySkills(libraryResult.data);
      }

      // 2. Refresh groups (shared across IDEs)
      const groupsResult = await libraryService.groups.list();
      if (groupsResult.success && groupsResult.data) {
        setGroups(groupsResult.data);
      }

      // 3. Refresh global skills for the new IDE
      const globalResult = await ideService.getGlobalSkills(ideId);
      if (globalResult.success && globalResult.data) {
        setGlobalSkills(globalResult.data);
      }

      // 4. Refresh projects for the new IDE
      const projectsResult = await ideService.getProjects(ideId);
      if (projectsResult.success && projectsResult.data) {
        setProjects(projectsResult.data);
      }

      showToast('success', `Switched to ${ideId === 'claude-code' ? 'Claude Code' : 'OpenCode'}`);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      showToast('error', 'Failed to refresh data after IDE switch');
    }
  }, [setLibrarySkills, setGroups, setGlobalSkills, setProjects, showToast]);

  const handleIDESwitch = useCallback(async (ideId: string) => {
    // Check if this IDE is disabled (coming soon)
    const ideConfig = configsToShow.find((ide) => ide.id === ideId);
    if (ideConfig && !ideConfig.isEnabled) {
      showToast('info', `${ideConfig.name} support is coming soon!`);
      return;
    }

    if (ideId === activeIdeId) return;

    setLoading(true);
    try {
      const result = await ideService.setActive(ideId);
      if (result.success) {
        setActiveIDE(ideId);
        // Refresh all data after switching
        await refreshAllData(ideId);
      }
    } catch (error) {
      console.error('Failed to switch IDE:', error);
      showToast('error', 'Failed to switch IDE');
    } finally {
      setLoading(false);
    }
  }, [activeIdeId, setActiveIDE, setLoading, refreshAllData, showToast, configsToShow]);

  const getIcon = (iconName: string) => {
    const size = 14;
    switch (iconName) {
      case 'claude-code':
        return <ClaudeCodeAvatar size={size} />;
      case 'opencode':
        return <OpenAIAvatar size={size} />;
      case 'cursor':
        return <CursorAvatar size={size} />;
      case 'gemini':
        return <GeminiAvatar size={size} />;
      default:
        return null;
    }
  };

  // Show all IDEs (including disabled ones for "coming soon" display)
  const allIDEs = configsToShow;

  if (allIDEs.length === 0) {
    return null;
  }

  return (
    <div className={styles.switcher}>
      {allIDEs.map((ide) => (
        <button
          key={ide.id}
          className={`${styles.tab} ${activeIdeId === ide.id ? styles.active : ''} ${!ide.isEnabled ? styles.disabled : ''}`}
          onClick={() => handleIDESwitch(ide.id)}
          title={ide.isEnabled ? ide.name : `${ide.name} (Coming Soon)`}
        >
          <div className={styles.iconWrapper}>{getIcon(ide.icon || ide.id)}</div>
        </button>
      ))}
    </div>
  );
}