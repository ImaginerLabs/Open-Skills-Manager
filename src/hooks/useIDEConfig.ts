import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useIDEStore } from '@/stores';
import { configService } from '@/services';
import { DEFAULT_IDE_CONFIGS, DEFAULT_IDE_ID } from '@/constants/ideConfigs';

export function useIDEConfig() {
  const { ideConfigs, activeIdeId, setActiveIDE, setIDEConfigs, setLoading } = useIDEStore(
    useShallow((state) => ({
      ideConfigs: state.ideConfigs,
      activeIdeId: state.activeIdeId,
      setActiveIDE: state.setActiveIDE,
      setIDEConfigs: state.setIDEConfigs,
      setLoading: state.setLoading,
    }))
  );

  const hasInitialized = useRef(false);

  useEffect(() => {
    const loadConfigs = async () => {
      setLoading(true);
      try {
        const config = await configService.get();
        const mergedConfigs = config.ideConfigs?.length > 0
          ? DEFAULT_IDE_CONFIGS.map((defaultIde) => {
              const existingConfig = config.ideConfigs.find((ide) => ide.id === defaultIde.id);
              return existingConfig
                ? { ...defaultIde, ...existingConfig, isEnabled: defaultIde.isEnabled }
                : defaultIde;
            })
          : DEFAULT_IDE_CONFIGS;

        setIDEConfigs(mergedConfigs);

        if (!hasInitialized.current) {
          setActiveIDE(config.activeIdeId || DEFAULT_IDE_ID);
          hasInitialized.current = true;
        }
      } catch (error) {
        console.error('Failed to load IDE configs:', error);
        setIDEConfigs(DEFAULT_IDE_CONFIGS);
        if (!hasInitialized.current) {
          setActiveIDE(DEFAULT_IDE_ID);
          hasInitialized.current = true;
        }
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, [setIDEConfigs, setActiveIDE, setLoading]);

  return {
    ideConfigs: ideConfigs.length > 0 ? ideConfigs : DEFAULT_IDE_CONFIGS,
    activeIdeId,
    setActiveIDE,
    setIDEConfigs,
    setLoading,
  };
}