import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ipcService
vi.mock('./ipcService', () => ({
  invokeIPC: vi.fn(),
}));

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: vi.fn(),
}));

import { invokeIPC } from './ipcService';
import { libraryService } from './libraryService';
import type { LibrarySkill, Group, Category } from '../stores/libraryStore';

const mockInvokeIPC = vi.mocked(invokeIPC);

describe('libraryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should call library_list channel', async () => {
      const mockSkills: LibrarySkill[] = [
        {
          id: 'skill-1',
          name: 'Test Skill',
          folderName: 'test-skill',
          version: '1.0.0',
          description: 'Test',
          path: '/path',
          skillMdPath: '/path/SKILL.md',
          skillMdLines: 10,
          skillMdChars: 100,
          importedAt: new Date(),
          size: 100,
          fileCount: 1,
          hasResources: false,
          deployments: [],
          isSymlink: false,
        },
      ];
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockSkills });

      const result = await libraryService.list();

      expect(mockInvokeIPC).toHaveBeenCalledWith('library_list');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockSkills);
      }
    });
  });

  describe('get', () => {
    it('should call library_get with id', async () => {
      const mockSkill: LibrarySkill = {
        id: 'skill-1',
        name: 'Test Skill',
        folderName: 'test-skill',
        version: '1.0.0',
        description: 'Test',
        path: '/path',
        skillMdPath: '/path/SKILL.md',
        skillMdLines: 10,
        skillMdChars: 100,
        importedAt: new Date(),
        size: 100,
        fileCount: 1,
        hasResources: false,
        deployments: [],
        isSymlink: false,
      };
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockSkill });

      const result = await libraryService.get('skill-1');

      expect(mockInvokeIPC).toHaveBeenCalledWith('library_get', { id: 'skill-1' });
      expect(result.success).toBe(true);
    });
  });

  describe('delete', () => {
    it('should call library_delete with id', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      const result = await libraryService.delete('skill-1');

      expect(mockInvokeIPC).toHaveBeenCalledWith('library_delete', { id: 'skill-1' });
      expect(result.success).toBe(true);
    });
  });

  describe('import', () => {
    it('should call library_import with path only', async () => {
      const mockSkill: LibrarySkill = {
        id: 'skill-1',
        name: 'Imported Skill',
        folderName: 'imported-skill',
        version: '1.0.0',
        description: 'Test',
        path: '/path/to/import',
        skillMdPath: '/path/to/import/SKILL.md',
        skillMdLines: 10,
        skillMdChars: 100,
        importedAt: new Date(),
        size: 100,
        fileCount: 1,
        hasResources: false,
        deployments: [],
        isSymlink: false,
      };
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockSkill });

      const result = await libraryService.import({ path: '/path/to/import' });

      expect(mockInvokeIPC).toHaveBeenCalledWith('library_import', {
        path: '/path/to/import',
        groupId: undefined,
        categoryId: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should call library_import with path and group', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: {} as LibrarySkill });

      await libraryService.import({
        path: '/path/to/import',
        groupId: 'group-1',
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('library_import', {
        path: '/path/to/import',
        groupId: 'group-1',
        categoryId: undefined,
      });
    });

    it('should call library_import with path, group and category', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: {} as LibrarySkill });

      await libraryService.import({
        path: '/path/to/import',
        groupId: 'group-1',
        categoryId: 'cat-1',
      });

      expect(mockInvokeIPC).toHaveBeenCalledWith('library_import', {
        path: '/path/to/import',
        groupId: 'group-1',
        categoryId: 'cat-1',
      });
    });
  });

  describe('organize', () => {
    it('should call library_organize with skillId', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      const result = await libraryService.organize('skill-1');

      expect(mockInvokeIPC).toHaveBeenCalledWith('library_organize', {
        skillId: 'skill-1',
        groupId: undefined,
        categoryId: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should call library_organize with skillId and groupId', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await libraryService.organize('skill-1', 'group-1');

      expect(mockInvokeIPC).toHaveBeenCalledWith('library_organize', {
        skillId: 'skill-1',
        groupId: 'group-1',
        categoryId: undefined,
      });
    });

    it('should call library_organize with all parameters', async () => {
      mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

      await libraryService.organize('skill-1', 'group-1', 'cat-1');

      expect(mockInvokeIPC).toHaveBeenCalledWith('library_organize', {
        skillId: 'skill-1',
        groupId: 'group-1',
        categoryId: 'cat-1',
      });
    });
  });

  describe('groups', () => {
    describe('list', () => {
      it('should call library_groups_list', async () => {
        const mockGroups: Group[] = [
          {
            id: 'group-1',
            name: 'Development',
            categories: [],
            skillCount: 5,
            isCustom: true,
            createdAt: new Date(),
          },
        ];
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockGroups });

        const result = await libraryService.groups.list();

        expect(mockInvokeIPC).toHaveBeenCalledWith('library_groups_list');
        expect(result.success).toBe(true);
      });
    });

    describe('create', () => {
      it('should call library_groups_create with name only', async () => {
        const mockGroup: Group = {
          id: 'group-1',
          name: 'New Group',
          categories: [],
          skillCount: 0,
          isCustom: true,
          createdAt: new Date(),
        };
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockGroup });

        const result = await libraryService.groups.create('New Group');

        expect(mockInvokeIPC).toHaveBeenCalledWith('library_groups_create', {
          name: 'New Group',
          icon: undefined,
          notes: undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should call library_groups_create with all parameters', async () => {
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: {} as Group });

        await libraryService.groups.create('New Group', 'code', 'Test notes');

        expect(mockInvokeIPC).toHaveBeenCalledWith('library_groups_create', {
          name: 'New Group',
          icon: 'code',
          notes: 'Test notes',
        });
      });
    });

    describe('rename', () => {
      it('should call library_groups_rename', async () => {
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: {} as Group });

        await libraryService.groups.rename('group-1', 'Renamed');

        expect(mockInvokeIPC).toHaveBeenCalledWith('library_groups_rename', {
          id: 'group-1',
          newName: 'Renamed',
        });
      });
    });

    describe('delete', () => {
      it('should call library_groups_delete', async () => {
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

        await libraryService.groups.delete('group-1');

        expect(mockInvokeIPC).toHaveBeenCalledWith('library_groups_delete', {
          id: 'group-1',
        });
      });
    });
  });

  describe('categories', () => {
    describe('create', () => {
      it('should call library_categories_create', async () => {
        const mockCategory: Category = {
          id: 'cat-1',
          groupId: 'group-1',
          name: 'New Category',
          skillCount: 0,
          isCustom: true,
          createdAt: new Date(),
        };
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: mockCategory });

        const result = await libraryService.categories.create('group-1', 'New Category');

        expect(mockInvokeIPC).toHaveBeenCalledWith('library_categories_create', {
          groupId: 'group-1',
          name: 'New Category',
          icon: undefined,
          notes: undefined,
        });
        expect(result.success).toBe(true);
      });

      it('should call library_categories_create with all parameters', async () => {
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: {} as Category });

        await libraryService.categories.create('group-1', 'New Category', 'icon', 'notes');

        expect(mockInvokeIPC).toHaveBeenCalledWith('library_categories_create', {
          groupId: 'group-1',
          name: 'New Category',
          icon: 'icon',
          notes: 'notes',
        });
      });
    });

    describe('rename', () => {
      it('should call library_categories_rename', async () => {
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: {} as Category });

        await libraryService.categories.rename('group-1', 'cat-1', 'Renamed');

        expect(mockInvokeIPC).toHaveBeenCalledWith('library_categories_rename', {
          groupId: 'group-1',
          categoryId: 'cat-1',
          newName: 'Renamed',
        });
      });
    });

    describe('delete', () => {
      it('should call library_categories_delete', async () => {
        mockInvokeIPC.mockResolvedValueOnce({ success: true, data: undefined });

        await libraryService.categories.delete('group-1', 'cat-1');

        expect(mockInvokeIPC).toHaveBeenCalledWith('library_categories_delete', {
          groupId: 'group-1',
          categoryId: 'cat-1',
        });
      });
    });
  });

  describe('error handling', () => {
    it('should propagate error from list', async () => {
      mockInvokeIPC.mockResolvedValueOnce({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Library not found' },
      });

      const result = await libraryService.list();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });

    it('should propagate error from import', async () => {
      mockInvokeIPC.mockResolvedValueOnce({
        success: false,
        error: { code: 'INVALID_PATH', message: 'Invalid path' },
      });

      const result = await libraryService.import({ path: '/invalid' });

      expect(result.success).toBe(false);
    });
  });
});