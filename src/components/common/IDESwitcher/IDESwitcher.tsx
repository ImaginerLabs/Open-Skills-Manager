import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import ClaudeCodeAvatar from '@lobehub/icons/es/ClaudeCode/components/Avatar';
import GeminiAvatar from '@lobehub/icons/es/Gemini/components/Avatar';
import OpenCodeAvatar from '@lobehub/icons/es/OpenCode/components/Avatar';
import CursorAvatar from '@lobehub/icons/es/Cursor/components/Avatar';
import { useIDEStore, useLibraryStore, useGlobalStore, useProjectStore, useUIStore } from '@/stores';
import { ideService, configService, libraryService } from '@/services';
import { ALL_GROUP_ID } from '@/components/features/CategoryManager';
import { AddIDEDialog } from '@/components/features/IDEDialog';
import { getIconByName, isIDEIcon } from '@/components/ui/IconPicker';
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

export function IDESwitcher(): React.ReactElement | null {
  const { ideConfigs, activeIdeId, setActiveIDE, setIDEConfigs, setLoading, addIDE: addIDEToStore } = useIDEStore();
  const { setSkills: setLibrarySkills, setGroups } = useLibraryStore();
  const { setSkills: setGlobalSkills } = useGlobalStore();
  const { setProjects } = useProjectStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Use configs from store, or defaults if empty - defined early for use in callbacks
  const configsToShow = ideConfigs.length > 0 ? ideConfigs : DEFAULT_IDE_CONFIGS;

  // Track if we've already initialized to prevent repeated setActiveIDE calls
  const hasInitialized = useRef(false);

  // Load IDE configs on mount
  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true);
      try {
        const config = await configService.get();
        if (config.ideConfigs && config.ideConfigs.length > 0) {
          // Merge backend configs with defaults — isEnabled always from defaults
          const mergedConfigs = DEFAULT_IDE_CONFIGS.map((defaultIde) => {
            const existingConfig = config.ideConfigs.find((ide) => ide.id === defaultIde.id);
            if (existingConfig) {
              // Merge: defaultIde provides fallback for missing fields (like icon)
              return { ...defaultIde, ...existingConfig, isEnabled: defaultIde.isEnabled };
            }
            return defaultIde;
          });
          setIDEConfigs(mergedConfigs);
          // Only set active IDE on first initialization
          if (!hasInitialized.current) {
            setActiveIDE(config.activeIdeId);
            hasInitialized.current = true;
          }
        } else {
          setIDEConfigs(DEFAULT_IDE_CONFIGS);
          // Only set active IDE on first initialization
          if (!hasInitialized.current) {
            setActiveIDE('claude-code');
            hasInitialized.current = true;
          }
        }
      } catch (error) {
        console.error('Failed to load IDE configs:', error);
        setIDEConfigs(DEFAULT_IDE_CONFIGS);
        // Only set active IDE on first initialization
        if (!hasInitialized.current) {
          setActiveIDE('claude-code');
          hasInitialized.current = true;
        }
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

      const ideName = configsToShow.find((ide) => ide.id === ideId)?.name || ideId;
      showToast('success', `Switched to ${ideName}`);
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
        // Navigate to library and reset sidebar to "All" — avoid showing stale
        // project/group selections from the previous IDE
        navigate('/library');
        useProjectStore.getState().selectProject(null);
        useLibraryStore.getState().selectGroup(ALL_GROUP_ID);
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
    // Built-in IDE icons (lobehub icons with custom colors)
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
    // Try to get icon from IconPicker (IDE avatars or Phosphor icons)
    const icon = getIconByName(iconName, size);
    if (!icon) return null;
    // IDE avatars have their own colors, Phosphor icons need white wrapper
    if (isIDEIcon(iconName)) {
      return icon;
    }
    return <span className={styles.customIcon}>{icon}</span>;
  };

  const handleAddIDE = useCallback((newIDE: typeof ideConfigs[0]) => {
    addIDEToStore(newIDE);
    showToast('success', `Added ${newIDE.name}`);
  }, [addIDEToStore, showToast]);

  // Show all IDEs (including disabled ones for "coming soon" display)
  const allIDEs = configsToShow;

  if (allIDEs.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.switcher}>
        {allIDEs.map((ide) => (
          <button
            key={ide.id}
            className={`${styles.tab} ${activeIdeId === ide.id ? styles.active : ''} ${!ide.isEnabled ? styles.disabled : ''}`}
            onClick={() => handleIDESwitch(ide.id)}
            title={ide.name}
          >
            <div className={styles.iconWrapper}>{getIcon(ide.icon || ide.id)}</div>
          </button>
        ))}
        <button
          className={styles.addTab}
          onClick={() => setShowAddDialog(true)}
          title="Add Custom IDE"
        >
          <div className={styles.iconWrapper}>
            <Plus size={14} />
          </div>
        </button>
      </div>

      <AddIDEDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddIDE}
      />
    </>
  );
}