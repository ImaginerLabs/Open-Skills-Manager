import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore, type Project, type ProjectSkill } from '@/stores/projectStore';

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
  });

  const mockProject: Project = {
    id: 'proj-1',
    name: 'Test Project',
    path: '/path/to/project',
    skillsPath: '/path/to/project/.claude/skills',
    exists: true,
    skillCount: 5,
    addedAt: new Date(),
  };

  const mockSkill: ProjectSkill = {
    id: 'skill-1',
    name: 'Test Skill',
    folderName: 'test-skill',
    version: '1.0.0',
    description: 'A test skill',
    path: '/path/to/skill',
    skillMdPath: '/path/to/skill/SKILL.md',
    skillMdLines: 50,
    skillMdChars: 1200,
    projectId: 'proj-1',
    installedAt: new Date().toISOString(),
    size: 1024,
    fileCount: 5,
    hasResources: false,
    isSymlink: false,
  };

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useProjectStore.getState();

      expect(state.projects).toEqual([]);
      expect(state.selectedProject).toBeNull();
      expect(state.projectSkills.size).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.isRefreshing).toBe(false);
      expect(state.refreshingProjectId).toBeNull();
      expect(state.lastRefreshAt.size).toBe(0);
      expect(state.refreshError).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('project state management', () => {
    it('should set projects', () => {
      const { setProjects } = useProjectStore.getState();
      setProjects([mockProject]);

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0]?.name).toBe('Test Project');
    });

    it('should add a project', () => {
      const { addProject } = useProjectStore.getState();
      addProject(mockProject);

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0]?.id).toBe('proj-1');
    });

    it('should add multiple projects', () => {
      const { addProject } = useProjectStore.getState();
      addProject(mockProject);
      addProject({ ...mockProject, id: 'proj-2', name: 'Another Project' });

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(2);
    });

    it('should remove a project', () => {
      const { addProject, removeProject } = useProjectStore.getState();
      addProject(mockProject);
      removeProject('proj-1');

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(0);
    });

    it('should clear projectSkills when removing project', () => {
      const { addProject, setProjectSkills, removeProject } = useProjectStore.getState();
      addProject(mockProject);
      setProjectSkills('proj-1', [mockSkill]);
      removeProject('proj-1');

      const state = useProjectStore.getState();
      expect(state.projectSkills.has('proj-1')).toBe(false);
    });

    it('should clear lastRefreshAt when removing project', () => {
      const { addProject, setProjectSkills, removeProject } = useProjectStore.getState();
      addProject(mockProject);
      setProjectSkills('proj-1', [mockSkill]);
      removeProject('proj-1');

      const state = useProjectStore.getState();
      expect(state.lastRefreshAt.has('proj-1')).toBe(false);
    });

    it('should clear selectedProject when removing selected project', () => {
      const { addProject, selectProject, removeProject } = useProjectStore.getState();
      addProject(mockProject);
      selectProject(mockProject);
      removeProject('proj-1');

      const state = useProjectStore.getState();
      expect(state.selectedProject).toBeNull();
    });

    it('should not clear selectedProject when removing different project', () => {
      const { addProject, selectProject, removeProject } = useProjectStore.getState();
      addProject(mockProject);
      addProject({ ...mockProject, id: 'proj-2' });
      selectProject(mockProject);
      removeProject('proj-2');

      const state = useProjectStore.getState();
      expect(state.selectedProject).toEqual(mockProject);
    });

    it('should select a project', () => {
      const { selectProject } = useProjectStore.getState();
      selectProject(mockProject);

      const state = useProjectStore.getState();
      expect(state.selectedProject).toEqual(mockProject);
    });

    it('should deselect project with null', () => {
      const { selectProject } = useProjectStore.getState();
      selectProject(mockProject);
      selectProject(null);

      const state = useProjectStore.getState();
      expect(state.selectedProject).toBeNull();
    });
  });

  describe('project skills management', () => {
    it('should set project skills', () => {
      const { setProjectSkills } = useProjectStore.getState();
      setProjectSkills('proj-1', [mockSkill]);

      const state = useProjectStore.getState();
      expect(state.projectSkills.get('proj-1')).toHaveLength(1);
    });

    it('should update lastRefreshAt when setting skills', () => {
      const { setProjectSkills } = useProjectStore.getState();
      setProjectSkills('proj-1', [mockSkill]);

      const state = useProjectStore.getState();
      expect(state.lastRefreshAt.has('proj-1')).toBe(true);
    });

    it('should replace existing skills for same project', () => {
      const { setProjectSkills } = useProjectStore.getState();
      setProjectSkills('proj-1', [mockSkill]);
      setProjectSkills('proj-1', [mockSkill, { ...mockSkill, id: 'skill-2' }]);

      const state = useProjectStore.getState();
      expect(state.projectSkills.get('proj-1')).toHaveLength(2);
    });

    it('should clear project skills', () => {
      const { setProjectSkills, clearProjectSkills } = useProjectStore.getState();
      setProjectSkills('proj-1', [mockSkill]);
      clearProjectSkills('proj-1');

      const state = useProjectStore.getState();
      expect(state.projectSkills.has('proj-1')).toBe(false);
    });

    it('should not affect other projects when clearing', () => {
      const { setProjectSkills, clearProjectSkills } = useProjectStore.getState();
      setProjectSkills('proj-1', [mockSkill]);
      setProjectSkills('proj-2', [{ ...mockSkill, projectId: 'proj-2' }]);
      clearProjectSkills('proj-1');

      const state = useProjectStore.getState();
      expect(state.projectSkills.has('proj-1')).toBe(false);
      expect(state.projectSkills.get('proj-2')).toHaveLength(1);
    });
  });

  describe('loading and refreshing state', () => {
    it('should set loading state', () => {
      const { setLoading } = useProjectStore.getState();
      setLoading(true);

      expect(useProjectStore.getState().isLoading).toBe(true);
    });

    it('should set refreshing state with project id', () => {
      const { setRefreshing } = useProjectStore.getState();
      setRefreshing(true, 'proj-1');

      const state = useProjectStore.getState();
      expect(state.isRefreshing).toBe(true);
      expect(state.refreshingProjectId).toBe('proj-1');
    });

    it('should clear refreshing state', () => {
      const { setRefreshing } = useProjectStore.getState();
      setRefreshing(true, 'proj-1');
      setRefreshing(false);

      const state = useProjectStore.getState();
      expect(state.isRefreshing).toBe(false);
      expect(state.refreshingProjectId).toBeNull();
    });
  });

  describe('error state', () => {
    it('should set error state', () => {
      const { setError } = useProjectStore.getState();
      setError('Something went wrong');

      expect(useProjectStore.getState().error).toBe('Something went wrong');
    });

    it('should set refresh error', () => {
      const { setRefreshError } = useProjectStore.getState();
      setRefreshError('Refresh failed');

      expect(useProjectStore.getState().refreshError).toBe('Refresh failed');
    });

    it('should clear errors', () => {
      const { setError, setRefreshError } = useProjectStore.getState();
      setError('Error');
      setRefreshError('Refresh error');
      setError(null);
      setRefreshError(null);

      const state = useProjectStore.getState();
      expect(state.error).toBeNull();
      expect(state.refreshError).toBeNull();
    });
  });

  describe('complex scenarios', () => {
    it('should handle full workflow: add, load skills, refresh, remove', () => {
      const {
        addProject,
        setLoading,
        setProjectSkills,
        setRefreshing,
        removeProject,
      } = useProjectStore.getState();

      // Add project
      addProject(mockProject);
      expect(useProjectStore.getState().projects).toHaveLength(1);

      // Start loading skills
      setLoading(true);
      expect(useProjectStore.getState().isLoading).toBe(true);

      // Load skills
      setProjectSkills('proj-1', [mockSkill]);
      setLoading(false);
      expect(useProjectStore.getState().projectSkills.get('proj-1')).toHaveLength(1);

      // Refresh
      setRefreshing(true, 'proj-1');
      expect(useProjectStore.getState().isRefreshing).toBe(true);
      setRefreshing(false);

      // Remove project
      removeProject('proj-1');
      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(0);
      expect(state.projectSkills.size).toBe(0);
      expect(state.lastRefreshAt.size).toBe(0);
    });

    it('should handle multiple projects with independent skills', () => {
      const { setProjectSkills } = useProjectStore.getState();

      setProjectSkills('proj-1', [mockSkill]);
      setProjectSkills('proj-2', [{ ...mockSkill, id: 'skill-2', projectId: 'proj-2' }]);
      setProjectSkills('proj-3', [
        { ...mockSkill, id: 'skill-3', projectId: 'proj-3' },
        { ...mockSkill, id: 'skill-4', projectId: 'proj-3' },
      ]);

      const state = useProjectStore.getState();
      expect(state.projectSkills.size).toBe(3);
      expect(state.projectSkills.get('proj-1')).toHaveLength(1);
      expect(state.projectSkills.get('proj-2')).toHaveLength(1);
      expect(state.projectSkills.get('proj-3')).toHaveLength(2);
    });
  });
});
