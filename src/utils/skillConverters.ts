import type { LibrarySkill } from '@/stores/libraryStore';
import type { GlobalSkill } from '@/stores/globalStore';
import type { ProjectSkill } from '@/stores/projectStore';

/**
 * Minimal skill info for conversion
 */
export interface MinimalSkillInfo {
  id: string;
  name: string;
  path: string;
  size?: number;
  fileCount?: number;
  description?: string;
}

/**
 * Converts a GlobalSkill, ProjectSkill, or minimal skill info to a LibrarySkill-like format
 * for use in BatchDeployTargetDialog and other deployment contexts.
 */
export function toLibrarySkillFormat(
  skill: GlobalSkill | ProjectSkill | MinimalSkillInfo
): LibrarySkill {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description || '',
    path: skill.path,
    size: skill.size ?? 0,
    fileCount: skill.fileCount ?? 1,
    skillMdLines: 0,
    skillMdChars: 0,
    folderName: skill.id,
    version: '1.0.0',
    skillMdPath: '',
    hasResources: (skill.fileCount ?? 1) > 1,
    isSymlink: false,
    importedAt: new Date(),
    deployments: [],
  };
}