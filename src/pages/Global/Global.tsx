import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowClockwise, DotsThree, Trash, ArrowDown, FolderOpen } from '@phosphor-icons/react';
import { useGlobalStore, type GlobalSkill } from '../../stores/globalStore';
import { PullToLibraryDialog } from '../../components/features/GlobalSkillsView/PullToLibraryDialog';
import { SkillListLayout, SkillListHeader, SkillList, SkillDetailPanel } from '../../components/features/SkillList';
import { useSkillSort } from '../../components/features/SkillList/hooks/useSkillSort';
import { globalService } from '../../services/globalService';
import { useUIStore } from '../../stores/uiStore';
import { formatSize, formatDate } from '../../utils/formatters';
import styles from './Global.module.scss';

interface ContextMenuPosition {
  x: number;
  y: number;
}

export function Global(): React.ReactElement {
  const {
    skills = [],
    selectedSkill,
    isLoading,
    isRefreshing,
    error,
    setSkills,
    selectSkill,
    removeSkill,
    setLoading,
    setRefreshing,
    setError,
  } = useGlobalStore();

  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [skillMdContent, setSkillMdContent] = useState<string>('');
  const [showPullDialog, setShowPullDialog] = useState(false);
  const [pullSkill, setPullSkill] = useState<GlobalSkill | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [contextSkill, setContextSkill] = useState<GlobalSkill | null>(null);

  const { sortedSkills, sortBy, setSortBy, sortDirection, toggleSortDirection } = useSkillSort(skills);

  useEffect(() => {
    const loadSkills = async () => {
      setLoading(true);
      try {
        const result = await globalService.list();
        if (result.success) {
          setSkills(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load skills');
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [setSkills, setLoading, setError]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const result = await globalService.list();
      if (result.success) {
        setSkills(result.data);
        showToast('success', 'Global skills refreshed');
      } else {
        setError(result.error.message);
        showToast('error', `Failed to refresh: ${result.error.message}`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      showToast('error', `Failed to refresh: ${message}`);
    } finally {
      setRefreshing(false);
    }
  }, [setSkills, setRefreshing, setError, showToast]);

  const handleSelectSkill = useCallback(
    async (skill: GlobalSkill) => {
      selectSkill(skill);
      try {
        const result = await globalService.get(skill.id);
        if (result.success && result.data) {
          setSkillMdContent(result.data.skillMdContent || '');
        }
      } catch {
        setSkillMdContent('');
      }
    },
    [selectSkill]
  );

  const handleDeleteSkill = useCallback(
    async (skillId: string) => {
      const skill = skills.find((s) => s.id === skillId);
      showConfirmDialog({
        title: 'Delete Global Skill',
        message: `Are you sure you want to delete "${skill?.name ?? 'this skill'}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          closeConfirmDialog();
          setLoading(true);
          try {
            const result = await globalService.delete(skillId);
            if (result.success) {
              removeSkill(skillId);
              if (selectedSkill?.id === skillId) {
                selectSkill(null);
              }
              showToast('success', 'Global skill deleted');
            } else {
              setError(result.error.message);
              showToast('error', `Failed to delete: ${result.error.message}`);
            }
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            setError(message);
            showToast('error', `Failed to delete: ${message}`);
          } finally {
            setLoading(false);
          }
        },
      });
    },
    [skills, selectedSkill, removeSkill, selectSkill, setLoading, setError, showToast, showConfirmDialog, closeConfirmDialog]
  );

  const handlePullToLibrary = useCallback((skill: GlobalSkill) => {
    setPullSkill(skill);
    setShowPullDialog(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    selectSkill(null);
    setSkillMdContent('');
  }, [selectSkill]);

  const handlePullComplete = useCallback(() => {
    setShowPullDialog(false);
    setPullSkill(null);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, skill: GlobalSkill) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setContextSkill(skill);
    setShowContextMenu(true);
  }, []);

  const handleContextMenuDelete = useCallback(() => {
    setShowContextMenu(false);
    if (contextSkill) {
      handleDeleteSkill(contextSkill.id);
    }
    setContextSkill(null);
  }, [contextSkill, handleDeleteSkill]);

  const handleContextMenuPull = useCallback(() => {
    setShowContextMenu(false);
    if (contextSkill) {
      handlePullToLibrary(contextSkill);
    }
    setContextSkill(null);
  }, [contextSkill, handlePullToLibrary]);

  // Filter skills by search query
  const filteredSkills = useMemo(() => {
    if (!searchQuery) return sortedSkills;
    const lowerQuery = searchQuery.toLowerCase();
    return sortedSkills.filter(
      (skill) =>
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery) ||
        skill.folderName.toLowerCase().includes(lowerQuery)
    );
  }, [sortedSkills, searchQuery]);

  const hasSkills = skills.length > 0;

  // Render card for SkillList
  const renderCard = useCallback(
    (skill: GlobalSkill, isSelected: boolean): React.ReactNode => (
      <article
        className={[styles.card, isSelected && styles.selected].filter(Boolean).join(' ')}
        onContextMenu={(e) => handleContextMenu(e, skill)}
        tabIndex={0}
        role="button"
        aria-label={`Global skill: ${skill.name}`}
        aria-selected={isSelected}
      >
        <div className={styles.cardHeader}>
          <h3 className={styles.cardName} title={skill.name}>
            {skill.name}
          </h3>
          <button
            type="button"
            className={styles.cardMenuButton}
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, skill);
            }}
            aria-label="Open context menu"
          >
            <DotsThree size={16} weight="bold" />
          </button>
        </div>

        <p className={styles.cardDescription} title={skill.description}>
          {skill.description || 'No description'}
        </p>

        <div className={styles.cardMeta}>
          {skill.version && skill.version !== '0.0.0' && (
            <span className={styles.cardVersion}>v{skill.version}</span>
          )}
          {skill.sourceLibrarySkillId && (
            <span className={styles.cardSourceBadge}>From Library</span>
          )}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.cardInfo}>
            <span className={styles.cardSize}>{formatSize(skill.size)}</span>
            <span className={styles.cardDate}>
              {skill.installedAt ? formatDate(skill.installedAt) : 'Unknown'}
            </span>
          </div>
        </div>
      </article>
    ),
    [handleContextMenu]
  );

  // Render detail panel content
  const renderDetailContent = useCallback(() => {
    if (!selectedSkill) return null;

    const formattedDate = selectedSkill.installedAt ? formatDate(selectedSkill.installedAt) : 'Unknown';
    const formattedSize = formatSize(selectedSkill.size);

    return (
      <>
        <div className={styles.detailMetadata}>
          <div className={styles.detailMetaItem}>
            <span>v{selectedSkill.version}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span>{formattedDate}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span>{formattedSize}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span>{selectedSkill.fileCount} files</span>
          </div>
        </div>

        <div className={styles.detailMarkdown}>
          <pre className={styles.detailMarkdownContent}>
            {skillMdContent || 'No SKILL.md content available'}
          </pre>
        </div>
      </>
    );
  }, [selectedSkill, skillMdContent]);

  return (
    <SkillListLayout className={styles.page}>
      <SkillListHeader
        title="Global Skills"
        count={skills.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortDirection={sortDirection}
        onToggleSortDirection={toggleSortDirection}
        actions={
          <button
            type="button"
            className={[styles.refreshButton, isRefreshing && styles.refreshing].filter(Boolean).join(' ')}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh global skills"
          >
            <ArrowClockwise size={16} className={isRefreshing ? styles.spinning : ''} />
          </button>
        }
      />

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div className={[styles.gridContainer, selectedSkill && styles.withDetail].filter(Boolean).join(' ')}>
        <SkillList
          skills={filteredSkills}
          selectedSkillId={selectedSkill?.id}
          onSelect={handleSelectSkill}
          onGetSkillId={(skill) => skill.id}
          renderCard={renderCard}
          isLoading={isLoading}
          emptyTitle="No global skills installed"
          emptyText="Global skills are stored in ~/.claude/skills/ and available across all projects"
          hasSkills={hasSkills}
        />
      </div>

      <SkillDetailPanel
        isOpen={selectedSkill !== null}
        onClose={handleCloseDetail}
      >
        {selectedSkill && (
          <>
            <div className={styles.detailHeader}>
              <h2 className={styles.detailTitle}>{selectedSkill.name}</h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={handleCloseDetail}
                aria-label="Close details"
              >
                <FolderOpen size={20} />
              </button>
            </div>
            <div className={styles.detailContent}>
              {renderDetailContent()}
            </div>
            <div className={styles.detailFooter}>
              <button
                type="button"
                className={styles.pullButton}
                onClick={() => handlePullToLibrary(selectedSkill)}
              >
                <ArrowDown size={16} />
                <span>Pull to Library</span>
              </button>
            </div>
          </>
        )}
      </SkillDetailPanel>

      {showContextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          role="menu"
        >
          <button
            type="button"
            className={styles.menuItem}
            onClick={handleContextMenuPull}
            role="menuitem"
          >
            <ArrowDown size={16} />
            <span>Pull to Library</span>
          </button>
          <button
            type="button"
            className={[styles.menuItem, styles.danger].filter(Boolean).join(' ')}
            onClick={handleContextMenuDelete}
            role="menuitem"
          >
            <Trash size={16} />
            <span>Delete</span>
          </button>
        </div>
      )}

      <PullToLibraryDialog
        isOpen={showPullDialog}
        skill={pullSkill}
        onClose={handlePullComplete}
        onComplete={handlePullComplete}
      />
    </SkillListLayout>
  );
}
