import type { LibrarySkill } from '@/stores/libraryStore';
import type { GlobalSkill } from '@/stores/globalStore';
import type { ProjectSkill } from '@/stores/projectStore';

/**
 * Converts a GlobalSkill or ProjectSkill to a LibrarySkill-like format
 * for use in BatchDeployTargetDialog and other deployment contexts.
 */
export function toLibrarySkillFormat(
  skill: GlobalSkill | ProjectSkill | { id: string; name: string; path: string; size: number; fileCount: number; description?: string }
): LibrarySkill {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description || '',
    path: skill.path,
    size: skill.size,
    fileCount: skill.fileCount,
    skillMdLines: 0,
    skillMdChars: 0,
    folderName: skill.id,
    version: '1.0.0',
    skillMdPath: '',
    hasResources: skill.fileCount > 1,
    isSymlink: false,
    importedAt: new Date(),
    deployments: [],
  };
}