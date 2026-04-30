import { describe, it, expect, beforeEach } from 'vitest';
import { useGlobalStore, type GlobalSkill } from '@/stores/globalStore';

describe('globalStore', () => {
  beforeEach(() => {
    useGlobalStore.getState().reset();
  });

  const mockSkill: GlobalSkill = {
    id: 'skill-1',
    name: 'Test Skill',
    folderName: 'test-skill',
    version: '1.0.0',
    description: 'A test skill',
    path: '/path/to/skill',
    skillMdPath: '/path/to/skill/SKILL.md',
    skillMdLines: 50,
    skillMdChars: 1200,
    size: 1024,
    fileCount: 5,
    hasResources: false,
    isSymlink: false,
  };

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useGlobalStore.getState();

      expect(state.skills).toEqual([]);
      expect(state.selectedSkill).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('skill state management', () => {
    it('should set skills', () => {
      const { setSkills } = useGlobalStore.getState();
      setSkills([mockSkill]);

      const state = useGlobalStore.getState();
      expect(state.skills).toHaveLength(1);
      expect(state.skills[0]?.name).toBe('Test Skill');
    });

    it('should add a skill', () => {
      const { addSkill } = useGlobalStore.getState();
      addSkill(mockSkill);

      const state = useGlobalStore.getState();
      expect(state.skills).toHaveLength(1);
      expect(state.skills[0]?.id).toBe('skill-1');
    });

    it('should add multiple skills', () => {
      const { addSkill } = useGlobalStore.getState();
      addSkill(mockSkill);
      addSkill({ ...mockSkill, id: 'skill-2', name: 'Another Skill' });

      const state = useGlobalStore.getState();
      expect(state.skills).toHaveLength(2);
    });

    it('should remove a skill', () => {
      const { addSkill, removeSkill } = useGlobalStore.getState();
      addSkill(mockSkill);
      removeSkill('skill-1');

      const state = useGlobalStore.getState();
      expect(state.skills).toHaveLength(0);
    });

    it('should not affect other skills when removing', () => {
      const { addSkill, removeSkill } = useGlobalStore.getState();
      addSkill(mockSkill);
      addSkill({ ...mockSkill, id: 'skill-2' });
      removeSkill('skill-1');

      const state = useGlobalStore.getState();
      expect(state.skills).toHaveLength(1);
      expect(state.skills[0]?.id).toBe('skill-2');
    });

    it('should clear selectedSkill when removing selected skill', () => {
      const { addSkill, selectSkill, removeSkill } = useGlobalStore.getState();
      addSkill(mockSkill);
      selectSkill(mockSkill);
      removeSkill('skill-1');

      const state = useGlobalStore.getState();
      expect(state.selectedSkill).toBeNull();
    });

    it('should not clear selectedSkill when removing different skill', () => {
      const { addSkill, selectSkill, removeSkill } = useGlobalStore.getState();
      addSkill(mockSkill);
      addSkill({ ...mockSkill, id: 'skill-2' });
      selectSkill(mockSkill);
      removeSkill('skill-2');

      const state = useGlobalStore.getState();
      expect(state.selectedSkill).toEqual(mockSkill);
    });

    it('should select a skill', () => {
      const { selectSkill } = useGlobalStore.getState();
      selectSkill(mockSkill);

      const state = useGlobalStore.getState();
      expect(state.selectedSkill).toEqual(mockSkill);
    });

    it('should deselect skill with null', () => {
      const { selectSkill } = useGlobalStore.getState();
      selectSkill(mockSkill);
      selectSkill(null);

      const state = useGlobalStore.getState();
      expect(state.selectedSkill).toBeNull();
    });
  });

  describe('loading and refreshing state', () => {
    it('should set loading state', () => {
      const { setLoading } = useGlobalStore.getState();
      setLoading(true);

      expect(useGlobalStore.getState().isLoading).toBe(true);
    });

    it('should clear loading state', () => {
      const { setLoading } = useGlobalStore.getState();
      setLoading(true);
      setLoading(false);

      expect(useGlobalStore.getState().isLoading).toBe(false);
    });

    it('should set refreshing state', () => {
      const { setRefreshing } = useGlobalStore.getState();
      setRefreshing(true);

      expect(useGlobalStore.getState().isRefreshing).toBe(true);
    });

    it('should clear refreshing state', () => {
      const { setRefreshing } = useGlobalStore.getState();
      setRefreshing(true);
      setRefreshing(false);

      expect(useGlobalStore.getState().isRefreshing).toBe(false);
    });
  });

  describe('error state', () => {
    it('should set error state', () => {
      const { setError } = useGlobalStore.getState();
      setError('Something went wrong');

      expect(useGlobalStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error', () => {
      const { setError } = useGlobalStore.getState();
      setError('Error');
      setError(null);

      expect(useGlobalStore.getState().error).toBeNull();
    });
  });

  describe('complex scenarios', () => {
    it('should handle full workflow: load, add, select, remove', () => {
      const { setLoading, setSkills, selectSkill, removeSkill } = useGlobalStore.getState();

      // Start loading
      setLoading(true);
      expect(useGlobalStore.getState().isLoading).toBe(true);

      // Load skills
      setSkills([mockSkill, { ...mockSkill, id: 'skill-2' }]);
      setLoading(false);
      expect(useGlobalStore.getState().skills).toHaveLength(2);
      expect(useGlobalStore.getState().isLoading).toBe(false);

      // Select a skill
      selectSkill(mockSkill);
      expect(useGlobalStore.getState().selectedSkill).toEqual(mockSkill);

      // Remove selected skill
      removeSkill('skill-1');
      expect(useGlobalStore.getState().skills).toHaveLength(1);
      expect(useGlobalStore.getState().selectedSkill).toBeNull();
    });

    it('should handle replacing all skills', () => {
      const { setSkills } = useGlobalStore.getState();

      setSkills([mockSkill]);
      expect(useGlobalStore.getState().skills).toHaveLength(1);

      setSkills([mockSkill, { ...mockSkill, id: 'skill-2' }, { ...mockSkill, id: 'skill-3' }]);
      expect(useGlobalStore.getState().skills).toHaveLength(3);
    });
  });
});
