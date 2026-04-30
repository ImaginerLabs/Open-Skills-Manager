import { describe, it, expect, beforeEach } from 'vitest';
import { useIDEStore } from '@/stores/ideStore';
import type { IDEConfig } from '@/types/ide';

describe('ideStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useIDEStore.getState().reset();
  });

  const mockIDE: IDEConfig = {
    id: 'vscode',
    name: 'Visual Studio Code',
    globalScopePath: '/Users/test/.claude',
    projectScopeName: 'claude-code',
    projects: [],
    isEnabled: true,
    icon: 'vscode',
  };

  const mockIDE2: IDEConfig = {
    id: 'cursor',
    name: 'Cursor',
    globalScopePath: '/Users/test/.cursor',
    projectScopeName: 'cursor',
    projects: [],
    isEnabled: true,
    icon: 'cursor',
  };

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useIDEStore.getState();

      expect(state.ideConfigs).toEqual([]);
      expect(state.activeIdeId).toBe('claude-code');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('IDE config management', () => {
    it('should set IDE configs', () => {
      const { setIDEConfigs } = useIDEStore.getState();
      setIDEConfigs([mockIDE]);

      const state = useIDEStore.getState();
      expect(state.ideConfigs).toHaveLength(1);
      expect(state.ideConfigs[0]?.id).toBe('vscode');
    });

    it('should add an IDE', () => {
      const { addIDE } = useIDEStore.getState();
      addIDE(mockIDE);

      const state = useIDEStore.getState();
      expect(state.ideConfigs).toHaveLength(1);
      expect(state.ideConfigs[0]?.name).toBe('Visual Studio Code');
    });

    it('should add multiple IDEs', () => {
      const { addIDE } = useIDEStore.getState();
      addIDE(mockIDE);
      addIDE(mockIDE2);

      const state = useIDEStore.getState();
      expect(state.ideConfigs).toHaveLength(2);
    });

    it('should remove an IDE', () => {
      const { addIDE, removeIDE } = useIDEStore.getState();
      addIDE(mockIDE);
      removeIDE('vscode');

      const state = useIDEStore.getState();
      expect(state.ideConfigs).toHaveLength(0);
    });

    it('should reset active IDE to claude-code when removing active IDE', () => {
      const { addIDE, setActiveIDE, removeIDE } = useIDEStore.getState();
      addIDE(mockIDE);
      setActiveIDE('vscode');
      removeIDE('vscode');

      const state = useIDEStore.getState();
      expect(state.activeIdeId).toBe('claude-code');
    });

    it('should not change active IDE when removing different IDE', () => {
      const { addIDE, setActiveIDE, removeIDE } = useIDEStore.getState();
      addIDE(mockIDE);
      addIDE(mockIDE2);
      setActiveIDE('vscode');
      removeIDE('cursor');

      const state = useIDEStore.getState();
      expect(state.activeIdeId).toBe('vscode');
    });

    it('should update an IDE', () => {
      const { addIDE, updateIDE } = useIDEStore.getState();
      addIDE(mockIDE);
      updateIDE('vscode', { name: 'VS Code Updated' });

      const state = useIDEStore.getState();
      expect(state.ideConfigs[0]?.name).toBe('VS Code Updated');
    });

    it('should update multiple fields of an IDE', () => {
      const { addIDE, updateIDE } = useIDEStore.getState();
      addIDE(mockIDE);
      updateIDE('vscode', {
        name: 'Updated',
        isEnabled: false,
        globalScopePath: '/new/path',
      });

      const state = useIDEStore.getState();
      expect(state.ideConfigs[0]?.name).toBe('Updated');
      expect(state.ideConfigs[0]?.isEnabled).toBe(false);
      expect(state.ideConfigs[0]?.globalScopePath).toBe('/new/path');
    });

    it('should not affect other IDEs when updating', () => {
      const { addIDE, updateIDE } = useIDEStore.getState();
      addIDE(mockIDE);
      addIDE(mockIDE2);
      updateIDE('vscode', { name: 'Updated' });

      const state = useIDEStore.getState();
      expect(state.ideConfigs[0]?.name).toBe('Updated');
      expect(state.ideConfigs[1]?.name).toBe('Cursor');
    });
  });

  describe('active IDE management', () => {
    it('should set active IDE', () => {
      const { setActiveIDE } = useIDEStore.getState();
      setActiveIDE('vscode');

      expect(useIDEStore.getState().activeIdeId).toBe('vscode');
    });

    it('should get active IDE config', () => {
      const { addIDE, setActiveIDE, getActiveIDE } = useIDEStore.getState();
      addIDE(mockIDE);
      setActiveIDE('vscode');

      const activeIDE = getActiveIDE();
      expect(activeIDE).toEqual(mockIDE);
    });

    it('should return undefined for non-existent active IDE', () => {
      const { getActiveIDE } = useIDEStore.getState();
      const activeIDE = getActiveIDE();
      expect(activeIDE).toBeUndefined();
    });

    it('should get correct active IDE after switching', () => {
      const { addIDE, setActiveIDE, getActiveIDE } = useIDEStore.getState();
      addIDE(mockIDE);
      addIDE(mockIDE2);
      setActiveIDE('cursor');

      const activeIDE = getActiveIDE();
      expect(activeIDE?.id).toBe('cursor');
    });
  });

  describe('loading and error state', () => {
    it('should set loading state', () => {
      const { setLoading } = useIDEStore.getState();
      setLoading(true);

      expect(useIDEStore.getState().isLoading).toBe(true);
    });

    it('should clear loading state', () => {
      const { setLoading } = useIDEStore.getState();
      setLoading(true);
      setLoading(false);

      expect(useIDEStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useIDEStore.getState();
      setError('Failed to load IDE configs');

      expect(useIDEStore.getState().error).toBe('Failed to load IDE configs');
    });

    it('should clear error', () => {
      const { setError } = useIDEStore.getState();
      setError('Error');
      setError(null);

      expect(useIDEStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { addIDE, setActiveIDE, setLoading, setError, reset } = useIDEStore.getState();
      addIDE(mockIDE);
      setActiveIDE('vscode');
      setLoading(true);
      setError('Error');
      reset();

      const state = useIDEStore.getState();
      expect(state.ideConfigs).toEqual([]);
      expect(state.activeIdeId).toBe('claude-code');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('complex scenarios', () => {
    it('should handle full IDE workflow', () => {
      const {
        setIDEConfigs,
        setActiveIDE,
        getActiveIDE,
        updateIDE,
        removeIDE,
      } = useIDEStore.getState();

      // Load IDE configs
      setIDEConfigs([mockIDE, mockIDE2]);
      expect(useIDEStore.getState().ideConfigs).toHaveLength(2);

      // Set active IDE
      setActiveIDE('cursor');
      expect(getActiveIDE()?.name).toBe('Cursor');

      // Update IDE
      updateIDE('cursor', { name: 'Cursor Updated' });
      expect(getActiveIDE()?.name).toBe('Cursor Updated');

      // Remove active IDE
      removeIDE('cursor');
      expect(useIDEStore.getState().activeIdeId).toBe('claude-code');
    });
  });
});