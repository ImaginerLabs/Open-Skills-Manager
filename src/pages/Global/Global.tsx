import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ArrowClockwise } from '@phosphor-icons/react';
import { useGlobalStore, type GlobalSkill } from '../../stores/globalStore';
import { PullToLibraryDialog } from '../../components/features/GlobalSkillsView/PullToLibraryDialog';
import { SkillListLayout, SkillListHeader, SkillList } from '../../components/features/SkillList';
import { SkillPreviewModal, type SkillPreviewData } from '../../components/features/SkillPreviewModal';
import { useSkillSort } from '../../components/features/SkillList/hooks/useSkillSort';
import { globalService } from '../../services/globalService';
import { useUIStore } from '../../stores/uiStore';
import { formatDate } from '../../utils/formatters';
import styles from './Global.module.scss';

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
  const [showPullDialog, setShowPullDialog] = useState(false);
  const [pullSkill, setPullSkill] = useState<GlobalSkill | null>(null);
  const [showRefreshTooltip, setShowRefreshTooltip] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSkill, setPreviewSkill] = useState<SkillPreviewData | null>(null);
  const [skillMdContent, setSkillMdContent] = useState<string>('');
  const refreshButtonRef = useRef<HTMLButtonElement>(null);

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
        setLastRefreshAt(new Date());
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
        } else {
          setSkillMdContent('');
        }
      } catch {
        setSkillMdContent('');
      }
      const previewData: SkillPreviewData = {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        size: skill.size,
        fileCount: skill.fileCount,
        date: skill.installedAt ? skill.installedAt.toLocaleDateString() : undefined,
        sourceLibrarySkillId: skill.sourceLibrarySkillId,
      };
      setPreviewSkill(previewData);
      setPreviewModalOpen(true);
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

  const handleClosePreview = useCallback(() => {
    setPreviewModalOpen(false);
    setPreviewSkill(null);
    setSkillMdContent('');
    selectSkill(null);
  }, [selectSkill]);

  const handlePullComplete = useCallback(() => {
    setShowPullDialog(false);
    setPullSkill(null);
  }, []);

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

  const cardActions = {
    onDelete: handleDeleteSkill,
    onPull: (skillId: string) => {
      const skill = skills.find((s) => s.id === skillId);
      if (skill) handlePullToLibrary(skill);
    },
  };

  // Render refresh button with tooltip
  const renderRefreshButton = () => {
    const tooltipContent = isRefreshing
      ? 'Refreshing...'
      : lastRefreshAt
        ? `Last refreshed: ${formatDate(lastRefreshAt)}`
        : 'Refresh';

    return (
      <button
        ref={refreshButtonRef}
        type="button"
        className={[styles.refreshButton, isRefreshing && styles.refreshing].filter(Boolean).join(' ')}
        onClick={handleRefresh}
        disabled={isRefreshing}
        onMouseEnter={() => setShowRefreshTooltip(true)}
        onMouseLeave={() => setShowRefreshTooltip(false)}
        aria-label="Refresh global skills"
      >
        <ArrowClockwise size={16} className={isRefreshing ? styles.spinning : ''} />
        {showRefreshTooltip && (
          <div className={styles.refreshTooltip} role="tooltip">
            {tooltipContent}
          </div>
        )}
      </button>
    );
  };

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
        actions={renderRefreshButton()}
      />

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.gridContainer}>
        <SkillList
          skills={filteredSkills}
          selectedSkillId={selectedSkill?.id}
          onSelect={handleSelectSkill}
          onGetSkillId={(skill) => skill.id}
          scope="global"
          actions={cardActions}
          isLoading={isLoading}
          emptyTitle="No global skills installed"
          emptyText="Global skills are stored in ~/.claude/skills/ and available across all projects"
          hasSkills={hasSkills}
        />
      </div>

      <SkillPreviewModal
        isOpen={previewModalOpen}
        onClose={handleClosePreview}
        skill={previewSkill}
        skillMdContent={skillMdContent}
      />

      <PullToLibraryDialog
        isOpen={showPullDialog}
        skill={pullSkill}
        onClose={handlePullComplete}
        onComplete={handlePullComplete}
      />
    </SkillListLayout>
  );
}
