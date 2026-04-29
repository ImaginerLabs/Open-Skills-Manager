import type { SearchResult } from '../../../stores/uiStore';
import type { Skill, SkillScope } from '../SkillList/types';
import type { LibrarySkill } from '@/types/skill';
import type { GlobalSkill } from '@/stores/globalStore';
import type { ProjectSkill } from '@/stores/projectStore';
import { SkillCard } from '../SkillList/SkillCard';
import type { SkillCardActions } from '../SkillList/types';

export interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onClick?: ((result: SearchResult) => void) | undefined;
  onDeploy?: ((result: SearchResult) => void) | undefined;
  onExport?: ((result: SearchResult) => void) | undefined;
  onPull?: ((result: SearchResult) => void) | undefined;
  onCopyPath?: ((result: SearchResult) => void) | undefined;
  onReveal?: ((result: SearchResult) => void) | undefined;
  onDelete?: ((result: SearchResult) => void) | undefined;
}

/**
 * Creates a minimal Skill object for display purposes in search results
 */
function createSkillFromResult(result: SearchResult): Skill {
  const scope = result.scope as SkillScope;
  const now = new Date();

  const baseFields = {
    id: result.id,
    name: result.name,
    description: result.description || '',
    path: result.path,
    size: result.size,
    fileCount: result.fileCount,
    skillMdLines: 0,
    skillMdChars: 0,
    folderName: result.name,
    version: '1.0.0',
    skillMdPath: '',
    hasResources: result.fileCount > 1,
    isSymlink: false,
  };

  if (scope === 'library') {
    return {
      ...baseFields,
      ...(result.categoryId ? { groupId: result.categoryId, categoryId: result.categoryId } : {}),
      importedAt: now,
      deployments: [],
    } as LibrarySkill;
  }

  if (scope === 'global') {
    return {
      ...baseFields,
      installedAt: now.toISOString(),
    } as GlobalSkill;
  }

  return {
    ...baseFields,
    installedAt: now.toISOString(),
    projectId: result.projectId ?? '',
  } as ProjectSkill;
}

export function SearchResultCard({
  result,
  query,
  onClick,
  onDeploy,
  onExport,
  onPull,
  onCopyPath,
  onReveal,
  onDelete,
}: SearchResultCardProps): React.ReactElement {
  const skill = createSkillFromResult(result);
  const scope = result.scope as SkillScope;

  // Build actions object, only including defined callbacks
  const actions: SkillCardActions<Skill> = {};
  if (onDeploy) actions.onDeploy = () => onDeploy(result);
  if (onExport) actions.onExport = () => onExport(result);
  if (onPull) actions.onPull = () => onPull(result);
  if (onCopyPath) actions.onCopyPath = () => onCopyPath(result);
  if (onReveal) actions.onReveal = () => onReveal(result);
  if (onDelete) actions.onDelete = () => onDelete(result);

  return (
    <SkillCard
      skill={skill}
      isSelected={false}
      scope={scope}
      actions={actions}
      viewMode="list"
      onClick={onClick ? () => onClick(result) : undefined}
      searchQuery={query}
      showScopeBadge={{ show: true, scope }}
      matchedSnippet={result.matchedSnippet}
    />
  );
}
