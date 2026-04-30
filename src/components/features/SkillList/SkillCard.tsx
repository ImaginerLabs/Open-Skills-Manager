import { useState, useCallback } from 'react';
import { DotsThree, Trash, Export, Rocket, ArrowDown, Copy, FolderOpen, Link, Folder, SquaresFour, Globe } from '@phosphor-icons/react';
import type { Skill, SkillScope, SkillCardActions, ViewMode, ScopeBadgeConfig } from './types';
import type { LibrarySkill } from '@/stores/libraryStore';
import { formatSize, formatDate } from '@/utils/formatters';
import { highlightMatch } from '@/utils/highlight';
import { ContextMenu, type ContextMenuItem } from '@/components/common/ContextMenu';
import styles from './SkillCard.module.scss';

interface ContextMenuPosition {
  x: number;
  y: number;
}

const SCOPE_COLORS: Record<SkillScope, string> = {
  library: '#0A84FF',
  global: '#30D158',
  project: '#FF9F0A',
};

const SCOPE_ICONS: Record<SkillScope, React.ComponentType<{ size?: number }>> = {
  library: SquaresFour,
  global: Globe,
  project: Folder,
};

export interface SkillCardProps<T extends Skill> {
  skill: T;
  isSelected: boolean;
  scope: SkillScope;
  actions?: SkillCardActions<T> | undefined;
  viewMode?: ViewMode | undefined;
  onClick?: (() => void) | undefined;
  /** Search query for highlighting matches */
  searchQuery?: string | undefined;
  /** Whether to show scope badge (for search results) */
  showScopeBadge?: ScopeBadgeConfig | undefined;
  /** Optional snippet to display (for search results) */
  matchedSnippet?: string | undefined;
}

function isLibrarySkill(skill: Skill): skill is LibrarySkill {
  return 'deployments' in skill;
}

function hasSourceLibrarySkillId(skill: Skill): boolean {
  return 'sourceLibrarySkillId' in skill && skill.sourceLibrarySkillId !== undefined;
}

function isSymlinkSkill(skill: Skill): boolean {
  return 'isSymlink' in skill && skill.isSymlink === true;
}

function getSourceBadge(skill: Skill, scope: SkillScope): React.ReactNode {
  if ((scope === 'global' || scope === 'project') && hasSourceLibrarySkillId(skill)) {
    return <span className={styles.sourceBadge}>From Library</span>;
  }
  return null;
}

function getSymlinkBadge(skill: Skill): React.ReactNode {
  if (isSymlinkSkill(skill)) {
    return (
      <span className={styles.symlinkBadge}>
        <Link size={10} weight="bold" />
        <span>Link</span>
      </span>
    );
  }
  return null;
}

function getScopeBadge(scope: SkillScope): React.ReactNode {
  const ScopeIcon = SCOPE_ICONS[scope];
  return (
    <span
      className={styles.scopeBadge}
      style={{ backgroundColor: `${SCOPE_COLORS[scope]}15`, color: SCOPE_COLORS[scope] }}
    >
      <ScopeIcon size={12} />
      <span>{scope}</span>
    </span>
  );
}

export function SkillCard<T extends Skill>({
  skill,
  isSelected,
  scope,
  actions,
  viewMode = 'grid',
  onClick,
  searchQuery,
  showScopeBadge,
  matchedSnippet,
}: SkillCardProps<T>): React.ReactElement {
  const [menuPosition, setMenuPosition] = useState<ContextMenuPosition | null>(null);
  const [isBeingDragged, setIsBeingDragged] = useState(false);

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuPosition(null);
  }, []);

  const isLibrary = scope === 'library';
  const menuItems: ContextMenuItem[] = [
    // Deploy option: available for all scopes
    ...(actions?.onDeploy ? [{
      id: 'deploy',
      label: 'Deploy to...',
      icon: Rocket,
      onClick: () => actions.onDeploy!(skill),
    }] : []),
    ...(isLibrary && actions?.onExport ? [{
      id: 'export',
      label: 'Export',
      icon: Export,
      onClick: () => actions.onExport!(skill),
    }] : []),
    ...(!isLibrary && actions?.onPull ? [{
      id: 'pull',
      label: 'Pull to Library',
      icon: ArrowDown,
      onClick: () => actions.onPull!(skill.id),
    }] : []),
    ...(!isLibrary && actions?.onExport ? [{
      id: 'export',
      label: 'Export',
      icon: Export,
      onClick: () => actions.onExport!(skill),
    }] : []),
    ...(actions?.onReveal ? [{
      id: 'reveal',
      label: 'Reveal in Finder',
      icon: FolderOpen,
      onClick: () => actions.onReveal!(skill.id),
    }] : []),
    ...(actions?.onCopyPath ? [{
      id: 'copy-path',
      label: 'Copy Path',
      icon: Copy,
      onClick: () => actions.onCopyPath!(skill.id),
    }] : []),
    ...(actions?.onDelete ? [{
      id: 'delete',
      label: 'Delete',
      icon: Trash,
      variant: 'danger' as const,
      onClick: () => actions.onDelete!(skill.id),
    }] : []),
  ];

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('application/json', JSON.stringify({
        skillId: skill.id,
        skillName: skill.name,
      }));
      e.dataTransfer.effectAllowed = 'move';
      setIsBeingDragged(true);
      actions?.onDragStart?.(skill);
    },
    [skill, actions]
  );

  const handleDragEnd = useCallback(() => {
    setIsBeingDragged(false);
    actions?.onDragEnd?.(skill);
  }, [skill, actions]);

  const formattedSize = formatSize(skill.size);
  const formattedDate = 'importedAt' in skill
    ? formatDate(skill.importedAt)
    : 'installedAt' in skill && skill.installedAt
      ? formatDate(skill.installedAt)
      : 'Unknown';

  const deploymentCount = isLibrarySkill(skill) ? skill.deployments.length : 0;
  const canDrag = scope === 'library' && !searchQuery; // Disable drag in search mode
  const displayName = skill.name.replace(/^["']|["']$/g, '');

  // Determine if we should show scope badge
  const shouldShowScopeBadge = showScopeBadge?.show;
  const badgeScope = showScopeBadge?.scope ?? scope;

  // Render name with optional highlighting
  const renderName = (name: string): React.ReactNode => {
    if (searchQuery && searchQuery.length >= 2) {
      const highlighted = highlightMatch(name, searchQuery);
      // Check if highlighting produced marks
      if (Array.isArray(highlighted)) {
        return highlighted;
      }
    }
    return name;
  };

  // Render description with optional highlighting
  const renderDescription = (desc: string): React.ReactNode => {
    if (searchQuery && searchQuery.length >= 2) {
      const highlighted = highlightMatch(desc, searchQuery);
      if (Array.isArray(highlighted)) {
        return highlighted;
      }
    }
    return desc || 'No description';
  };

  return (
    <>
      <article
        className={[
          styles.card,
          isSelected && styles.selected,
          isBeingDragged && styles.dragging,
          viewMode === 'list' && styles.listMode,
          searchQuery && styles.searchMode,
        ].filter(Boolean).join(' ')}
        onContextMenu={openMenu}
        onDragStart={canDrag ? handleDragStart : undefined}
        onDragEnd={canDrag ? handleDragEnd : undefined}
        draggable={canDrag}
        tabIndex={0}
        role="button"
        aria-label={`${badgeScope === 'library' ? '' : badgeScope.charAt(0).toUpperCase() + badgeScope.slice(1) + ' '}skill: ${displayName}`}
        aria-selected={isSelected}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {viewMode === 'list' ? (
          <>
            <div className={styles.listRow}>
              <h3 className={styles.listName} title={displayName}>
                {renderName(displayName)}
              </h3>
              {getSymlinkBadge(skill)}
              {shouldShowScopeBadge && getScopeBadge(badgeScope)}
              {skill.fileCount > 0 && (
                <span className={styles.fileCountBadge}>
                  <FolderOpen size={10} weight="fill" />
                  <span>{skill.fileCount}</span>
                </span>
              )}
              {skill.skillMdLines > 0 && (
                <span className={styles.lineCountBadge} title={`${skill.skillMdChars.toLocaleString()} characters`}>
                  <span>{skill.skillMdLines} lines</span>
                </span>
              )}
              {getSourceBadge(skill, scope)}
              <span className={styles.spacer} />
              <span className={styles.size}>{formattedSize}</span>
              <span className={styles.date}>{formattedDate}</span>
              {scope === 'library' && deploymentCount > 0 && (
                <span className={styles.deploymentBadge}>
                  <Rocket size={12} weight="fill" />
                  <span>{deploymentCount}</span>
                </span>
              )}
              {menuItems.length > 0 && (
                <button
                  type="button"
                  className={styles.menuButton}
                  onClick={openMenu}
                  aria-label="Open context menu"
                >
                  <DotsThree size={16} weight="bold" />
                </button>
              )}
            </div>
            <p className={styles.listDescription} title={skill.description}>
              {renderDescription(skill.description)}
            </p>
            {matchedSnippet && (
              <div className={styles.snippet}>
                {highlightMatch(matchedSnippet, searchQuery ?? '')}
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.header}>
              <h3 className={styles.name} title={displayName}>
                {renderName(displayName)}
              </h3>
              {menuItems.length > 0 && (
                <button
                  type="button"
                  className={styles.menuButton}
                  onClick={openMenu}
                  aria-label="Open context menu"
                >
                  <DotsThree size={16} weight="bold" />
                </button>
              )}
            </div>

            <p className={styles.description} title={skill.description}>
              {renderDescription(skill.description)}
            </p>

            <div className={styles.meta}>
              {getSymlinkBadge(skill)}
              {shouldShowScopeBadge && getScopeBadge(badgeScope)}
              {skill.fileCount > 0 && (
                <span className={styles.resourceBadge}>
                  <FolderOpen size={10} weight="fill" />
                  <span>{skill.fileCount} file{skill.fileCount !== 1 ? 's' : ''}</span>
                </span>
              )}
              {skill.skillMdLines > 0 && (
                <span className={styles.docBadge} title={`${skill.skillMdChars.toLocaleString()} characters`}>
                  <span>{skill.skillMdLines} line{skill.skillMdLines !== 1 ? 's' : ''}</span>
                </span>
              )}
              {getSourceBadge(skill, scope)}
            </div>

            {matchedSnippet && (
              <div className={styles.snippet}>
                {highlightMatch(matchedSnippet, searchQuery ?? '')}
              </div>
            )}

            <div className={styles.footer}>
              <div className={styles.info}>
                <span className={styles.size}>{formattedSize}</span>
                <span className={styles.date}>{formattedDate}</span>
              </div>
              {scope === 'library' && deploymentCount > 0 && (
                <span className={styles.deploymentBadge}>
                  <Rocket size={12} weight="fill" />
                  <span>{deploymentCount}</span>
                </span>
              )}
            </div>
          </>
        )}
      </article>

      <ContextMenu
        isOpen={menuPosition !== null}
        position={menuPosition ?? { x: 0, y: 0 }}
        items={menuItems}
        onClose={closeMenu}
      />
    </>
  );
}