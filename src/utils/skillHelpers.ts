import type { Skill } from '../components/features/SkillList/types';

/**
 * Extract the most relevant date from a skill object.
 * Different skill types have different date fields:
 * - LibrarySkill: importedAt, updatedAt
 * - GlobalSkill: installedAt
 * - ProjectSkill: installedAt
 */
export function getSkillDate(skill: Skill): string {
  if ('importedAt' in skill && typeof skill.importedAt === 'string') return skill.importedAt;
  if ('installedAt' in skill && typeof skill.installedAt === 'string') return skill.installedAt;
  if ('updatedAt' in skill && typeof skill.updatedAt === 'string') return skill.updatedAt;
  return new Date().toISOString();
}
