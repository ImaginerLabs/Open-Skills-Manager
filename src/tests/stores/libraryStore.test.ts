import { describe, it, expect, beforeEach } from 'vitest';
import { useLibraryStore } from '@/stores/libraryStore';
import type { Group, Category, LibrarySkill } from '@/stores/libraryStore';

describe('libraryStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useLibraryStore.setState({
      skills: [],
      groups: [],
      selectedSkill: null,
      isLoading: false,
      error: null,
      importProgress: {
        current: 0,
        total: 0,
        currentSkillName: '',
        status: 'idle',
        successful: 0,
        failed: 0,
        skipped: 0,
        failedItems: [],
      },
      exportProgress: {
        current: 0,
        total: 0,
        currentSkillName: '',
        status: 'idle',
      },
    });
  });

  describe('import progress actions', () => {
    it('should start import with correct initial state', () => {
      const { startImport } = useLibraryStore.getState();
      startImport(5);

      const state = useLibraryStore.getState();
      expect(state.importProgress.total).toBe(5);
      expect(state.importProgress.current).toBe(0);
      expect(state.importProgress.status).toBe('importing');
      expect(state.importProgress.successful).toBe(0);
    });

    it('should update import progress correctly', () => {
      const { startImport, updateImportProgress } = useLibraryStore.getState();
      startImport(3);
      updateImportProgress(1, 'Skill One');

      const state = useLibraryStore.getState();
      expect(state.importProgress.current).toBe(1);
      expect(state.importProgress.currentSkillName).toBe('Skill One');
    });

    it('should complete import with correct counts', () => {
      const { startImport, completeImport } = useLibraryStore.getState();
      startImport(5);
      completeImport(3, 1, 1, [{ name: 'Failed Skill', error: 'Test error', code: 'E001' }]);

      const state = useLibraryStore.getState();
      expect(state.importProgress.status).toBe('completed');
      expect(state.importProgress.successful).toBe(3);
      expect(state.importProgress.failed).toBe(1);
      expect(state.importProgress.skipped).toBe(1);
      expect(state.importProgress.failedItems).toHaveLength(1);
    });

    it('should cancel import', () => {
      const { startImport, cancelImport } = useLibraryStore.getState();
      startImport(5);
      cancelImport();

      const state = useLibraryStore.getState();
      expect(state.importProgress.status).toBe('cancelled');
    });

    it('should set import error', () => {
      const { setImportError } = useLibraryStore.getState();
      setImportError('Import failed: Permission denied');

      const state = useLibraryStore.getState();
      expect(state.importProgress.status).toBe('error');
      expect(state.importProgress.failedItems[0]?.error).toBe('Import failed: Permission denied');
      expect(state.importProgress.failedItems[0]?.code).toBe('IMPORT_ERROR');
    });

    it('should reset import to initial state', () => {
      const { startImport, updateImportProgress, resetImport } = useLibraryStore.getState();
      startImport(5);
      updateImportProgress(3, 'Test Skill');
      resetImport();

      const state = useLibraryStore.getState();
      expect(state.importProgress.status).toBe('idle');
      expect(state.importProgress.current).toBe(0);
      expect(state.importProgress.total).toBe(0);
    });
  });

  describe('export progress actions', () => {
    it('should start export with correct initial state', () => {
      const { startExport } = useLibraryStore.getState();
      startExport(3);

      const state = useLibraryStore.getState();
      expect(state.exportProgress.total).toBe(3);
      expect(state.exportProgress.current).toBe(0);
      expect(state.exportProgress.status).toBe('exporting');
    });

    it('should update export progress correctly', () => {
      const { startExport, updateExportProgress } = useLibraryStore.getState();
      startExport(3);
      updateExportProgress(2, 'Exporting Skill Two');

      const state = useLibraryStore.getState();
      expect(state.exportProgress.current).toBe(2);
      expect(state.exportProgress.currentSkillName).toBe('Exporting Skill Two');
    });

    it('should complete export', () => {
      const { startExport, completeExport } = useLibraryStore.getState();
      startExport(3);
      completeExport();

      const state = useLibraryStore.getState();
      expect(state.exportProgress.status).toBe('completed');
    });

    it('should cancel export', () => {
      const { startExport, cancelExport } = useLibraryStore.getState();
      startExport(3);
      cancelExport();

      const state = useLibraryStore.getState();
      expect(state.exportProgress.status).toBe('cancelled');
    });

    it('should set export error', () => {
      const { setExportError } = useLibraryStore.getState();
      setExportError('Export failed: Disk full');

      const state = useLibraryStore.getState();
      expect(state.exportProgress.status).toBe('error');
      expect(state.error).toBe('Export failed: Disk full');
    });

    it('should reset export to initial state', () => {
      const { startExport, updateExportProgress, resetExport } = useLibraryStore.getState();
      startExport(3);
      updateExportProgress(2, 'Test');
      resetExport();

      const state = useLibraryStore.getState();
      expect(state.exportProgress.status).toBe('idle');
      expect(state.exportProgress.current).toBe(0);
    });
  });

  describe('group state management', () => {
    const mockGroup: Group = {
      id: 'grp-1',
      name: 'Development',
      icon: 'code',
      color: '#4A90D9',
      categories: [],
      skillCount: 0,
      isCustom: true,
      createdAt: new Date(),
    };

    it('should set groups', () => {
      const { setGroups } = useLibraryStore.getState();
      setGroups([mockGroup]);

      const state = useLibraryStore.getState();
      expect(state.groups).toHaveLength(1);
      expect(state.groups[0]?.name).toBe('Development');
    });

    it('should add a group', () => {
      const { addGroup } = useLibraryStore.getState();
      addGroup(mockGroup);

      const state = useLibraryStore.getState();
      expect(state.groups).toHaveLength(1);
      expect(state.groups[0]?.id).toBe('grp-1');
    });

    it('should update a group', () => {
      const { addGroup, updateGroup } = useLibraryStore.getState();
      addGroup(mockGroup);
      updateGroup('grp-1', { name: 'Dev Tools', color: '#FF5733' });

      const state = useLibraryStore.getState();
      expect(state.groups[0]?.name).toBe('Dev Tools');
      expect(state.groups[0]?.color).toBe('#FF5733');
      expect(state.groups[0]?.icon).toBe('code');
    });

    it('should remove a group', () => {
      const { addGroup, removeGroup } = useLibraryStore.getState();
      addGroup(mockGroup);
      removeGroup('grp-1');

      const state = useLibraryStore.getState();
      expect(state.groups).toHaveLength(0);
    });
  });

  describe('category state management', () => {
    const mockCategory: Category = {
      id: 'cat-1',
      groupId: 'grp-1',
      name: 'Frontend',
      skillCount: 0,
      isCustom: true,
      createdAt: new Date(),
    };

    const mockGroup: Group = {
      id: 'grp-1',
      name: 'Development',
      categories: [],
      skillCount: 0,
      isCustom: true,
      createdAt: new Date(),
    };

    it('should add a category to group', () => {
      const { setGroups, addCategory } = useLibraryStore.getState();
      setGroups([mockGroup]);
      addCategory('grp-1', mockCategory);

      const state = useLibraryStore.getState();
      expect(state.groups[0]?.categories).toHaveLength(1);
      expect(state.groups[0]?.categories[0]?.name).toBe('Frontend');
    });

    it('should update a category', () => {
      const { setGroups, addCategory, updateCategory } = useLibraryStore.getState();
      setGroups([mockGroup]);
      addCategory('grp-1', mockCategory);
      updateCategory('grp-1', 'cat-1', { name: 'Backend' });

      const state = useLibraryStore.getState();
      expect(state.groups[0]?.categories[0]?.name).toBe('Backend');
    });

    it('should remove a category', () => {
      const { setGroups, addCategory, removeCategory } = useLibraryStore.getState();
      setGroups([mockGroup]);
      addCategory('grp-1', mockCategory);
      removeCategory('grp-1', 'cat-1');

      const state = useLibraryStore.getState();
      expect(state.groups[0]?.categories).toHaveLength(0);
    });
  });

  describe('skill state management', () => {
    const mockSkill: LibrarySkill = {
      id: 'skill-1',
      name: 'Test Skill',
      folderName: 'test-skill',
      version: '1.0.0',
      description: 'A test skill',
      path: '/path/to/skill',
      skillMdPath: '/path/to/skill/SKILL.md',
      skillMdLines: 50,
      skillMdChars: 1200,
      importedAt: new Date(),
      size: 1024,
      fileCount: 5,
      hasResources: false,
      deployments: [],
      isSymlink: false,
    };

    it('should set skills', () => {
      const { setSkills } = useLibraryStore.getState();
      setSkills([mockSkill]);

      const state = useLibraryStore.getState();
      expect(state.skills).toHaveLength(1);
    });

    it('should add a skill', () => {
      const { addSkill } = useLibraryStore.getState();
      addSkill(mockSkill);

      const state = useLibraryStore.getState();
      expect(state.skills).toHaveLength(1);
      expect(state.skills[0]?.name).toBe('Test Skill');
    });

    it('should remove a skill', () => {
      const { addSkill, removeSkill } = useLibraryStore.getState();
      addSkill(mockSkill);
      removeSkill('skill-1');

      const state = useLibraryStore.getState();
      expect(state.skills).toHaveLength(0);
    });

    it('should update a skill', () => {
      const { addSkill, updateSkill } = useLibraryStore.getState();
      addSkill(mockSkill);
      updateSkill('skill-1', { name: 'Updated Skill', version: '2.0.0' });

      const state = useLibraryStore.getState();
      expect(state.skills[0]?.name).toBe('Updated Skill');
      expect(state.skills[0]?.version).toBe('2.0.0');
    });

    it('should select a skill', () => {
      const { selectSkill } = useLibraryStore.getState();
      selectSkill(mockSkill);

      const state = useLibraryStore.getState();
      expect(state.selectedSkill).toEqual(mockSkill);
    });
  });

  describe('loading and error state', () => {
    it('should set loading state', () => {
      const { setLoading } = useLibraryStore.getState();
      setLoading(true);

      expect(useLibraryStore.getState().isLoading).toBe(true);
    });

    it('should set error state', () => {
      const { setError } = useLibraryStore.getState();
      setError('Something went wrong');

      expect(useLibraryStore.getState().error).toBe('Something went wrong');
    });

    it('should clear error', () => {
      const { setError } = useLibraryStore.getState();
      setError('Error');
      setError(null);

      expect(useLibraryStore.getState().error).toBeNull();
    });
  });
});