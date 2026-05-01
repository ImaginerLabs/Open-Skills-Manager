import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useIDEStore, useLibraryStore, useProjectStore, useUIStore } from '@/stores';
import { ideService } from '@/services';
import { useSidebarData } from '@/hooks/useSidebarData';
import { ALL_GROUP_ID } from '@/components/features/CategoryManager';
import { DEFAULT_IDE_CONFIGS } from '@/constants/ideConfigs';

export function useIDESwitcher() {
  const navigate = useNavigate();
  const { ideConfigs, activeIdeId, setActiveIDE, setLoading } = useIDEStore(
    useShallow((state) => ({
      ideConfigs: state.ideConfigs,
      activeIdeId: state.activeIdeId,
      setActiveIDE: state.setActiveIDE,
      setLoading: state.setLoading,
    }))
  );
  const { showToast } = useUIStore();
  const { refreshAll } = useSidebarData();

  const handleIDESwitch = useCallback(async (ideId: string) => {
    const configs = ideConfigs.length > 0 ? ideConfigs : DEFAULT_IDE_CONFIGS;
    const ideConfig = configs.find((ide) => ide.id === ideId);
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
        navigate('/library');
        useProjectStore.getState().selectProject(null);
        useLibraryStore.getState().selectGroup(ALL_GROUP_ID);
        await refreshAll(ideId);
        showToast('success', `Switched to ${ideConfig?.name || ideId}`);
      }
    } catch (error) {
      console.error('Failed to switch IDE:', error);
      showToast('error', 'Failed to switch IDE');
    } finally {
      setLoading(false);
    }
  }, [ideConfigs, activeIdeId, setActiveIDE, setLoading, refreshAll, showToast, navigate]);

  return {
    activeIdeId,
    handleIDESwitch,
  };
}