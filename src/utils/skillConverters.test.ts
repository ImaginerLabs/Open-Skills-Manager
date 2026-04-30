import { describe, it, expect } from 'vitest';
import { toLibrarySkillFormat } from '@/utils/skillConverters';
import type { GlobalSkill } from '@/stores/globalStore';
import type { ProjectSkill } from '@/stores/projectStore';

describe('skillConverters', () => {
  describe('toLibrarySkillFormat', () => {
    const globalSkill: GlobalSkill = {
      id: 'skill-1',
      name: 'Global Skill',
      folderName: 'global-skill',
      version: '1.0.0',
      description: 'A global skill',
      path: '/path/to/global/skill',
      skillMdPath: '/path/to/global/skill/SKILL.md',
      skillMdLines: 100,
      skillMdChars: 2500,
      size: 2048,
      fileCount: 3,
      hasResources: true,
      isSymlink: false,
    };

    const projectSkill: ProjectSkill = {
      id: 'skill-2',
      name: 'Project Skill',
      folderName: 'project-skill',
      version: '2.0.0',
      description: 'A project skill',
      path: '/path/to/project/skill',
      skillMdPath: '/path/to/project/skill/SKILL.md',
      skillMdLines: 50,
      skillMdChars: 1200,
      projectId: 'proj-1',
      installedAt: '2024-01-15',
      size: 1024,
      fileCount: 2,
      hasResources: false,
      isSymlink: true,
    };

    const minimalSkill = {
      id: 'skill-3',
      name: 'Minimal Skill',
      path: '/path/to/minimal',
    };

    describe('from GlobalSkill', () => {
      it('should convert id', () => {
        const result = toLibrarySkillFormat(globalSkill);
        expect(result.id).toBe('skill-1');
      });

      it('should convert name', () => {
        const result = toLibrarySkillFormat(globalSkill);
        expect(result.name).toBe('Global Skill');
      });

      it('should convert description', () => {
        const result = toLibrarySkillFormat(globalSkill);
        expect(result.description).toBe('A global skill');
      });

      it('should convert path', () => {
        const result = toLibrarySkillFormat(globalSkill);
        expect(result.path).toBe('/path/to/global/skill');
      });

      it('should convert size', () => {
        const result = toLibrarySkillFormat(globalSkill);
        expect(result.size).toBe(2048);
      });

      it('should convert fileCount', () => {
        const result = toLibrarySkillFormat(globalSkill);
        expect(result.fileCount).toBe(3);
      });

      it('should set hasResources based on fileCount', () => {
        const result = toLibrarySkillFormat(globalSkill);
        expect(result.hasResources).toBe(true);
      });

      it('should set default values for missing fields', () => {
        const result = toLibrarySkillFormat(globalSkill);
        expect(result.skillMdLines).toBe(0);
        expect(result.skillMdChars).toBe(0);
        expect(result.folderName).toBe('skill-1');
        expect(result.version).toBe('1.0.0');
        expect(result.skillMdPath).toBe('');
        expect(result.isSymlink).toBe(false);
        expect(result.deployments).toEqual([]);
      });

      it('should set importedAt to current date', () => {
        const result = toLibrarySkillFormat(globalSkill);
        expect(result.importedAt).toBeInstanceOf(Date);
      });
    });

    describe('from ProjectSkill', () => {
      it('should convert id', () => {
        const result = toLibrarySkillFormat(projectSkill);
        expect(result.id).toBe('skill-2');
      });

      it('should convert name', () => {
        const result = toLibrarySkillFormat(projectSkill);
        expect(result.name).toBe('Project Skill');
      });

      it('should convert description', () => {
        const result = toLibrarySkillFormat(projectSkill);
        expect(result.description).toBe('A project skill');
      });

      it('should convert size', () => {
        const result = toLibrarySkillFormat(projectSkill);
        expect(result.size).toBe(1024);
      });

      it('should convert fileCount', () => {
        const result = toLibrarySkillFormat(projectSkill);
        expect(result.fileCount).toBe(2);
      });

      it('should set hasResources based on fileCount', () => {
        const result = toLibrarySkillFormat(projectSkill);
        expect(result.hasResources).toBe(true); // fileCount > 1
      });
    });

    describe('from MinimalSkillInfo', () => {
      it('should convert minimal skill with only required fields', () => {
        const result = toLibrarySkillFormat(minimalSkill);
        expect(result.id).toBe('skill-3');
        expect(result.name).toBe('Minimal Skill');
        expect(result.path).toBe('/path/to/minimal');
      });

      it('should use default values for optional fields', () => {
        const result = toLibrarySkillFormat(minimalSkill);
        expect(result.size).toBe(0);
        expect(result.fileCount).toBe(1);
        expect(result.description).toBe('');
      });

      it('should set hasResources to false for single file', () => {
        const result = toLibrarySkillFormat(minimalSkill);
        expect(result.hasResources).toBe(false);
      });

      it('should use provided optional values', () => {
        const skillWithOptional = {
          ...minimalSkill,
          size: 500,
          fileCount: 5,
          description: 'With optional fields',
        };
        const result = toLibrarySkillFormat(skillWithOptional);
        expect(result.size).toBe(500);
        expect(result.fileCount).toBe(5);
        expect(result.description).toBe('With optional fields');
        expect(result.hasResources).toBe(true); // fileCount > 1
      });
    });

    describe('edge cases', () => {
      it('should handle empty description', () => {
        const skill = { ...globalSkill, description: '' };
        const result = toLibrarySkillFormat(skill);
        expect(result.description).toBe('');
      });

      it('should handle undefined description', () => {
        const skill = { ...minimalSkill };
        const result = toLibrarySkillFormat(skill);
        expect(result.description).toBe('');
      });

      it('should handle zero size', () => {
        const skill = { ...minimalSkill, size: 0 };
        const result = toLibrarySkillFormat(skill);
        expect(result.size).toBe(0);
      });

      it('should handle zero fileCount', () => {
        const skill = { ...minimalSkill, fileCount: 0 };
        const result = toLibrarySkillFormat(skill);
        expect(result.fileCount).toBe(0);
        expect(result.hasResources).toBe(false);
      });

      it('should handle large fileCount', () => {
        const skill = { ...minimalSkill, fileCount: 100 };
        const result = toLibrarySkillFormat(skill);
        expect(result.fileCount).toBe(100);
        expect(result.hasResources).toBe(true);
      });
    });
  });
});