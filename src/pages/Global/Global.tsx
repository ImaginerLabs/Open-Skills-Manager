import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { FolderOpen, MagnifyingGlass, TextAa, Calendar, Database, ArrowsDownUp, ArrowClockwise } from '@phosphor-icons/react';
import { useGlobalStore, type GlobalSkill } from '../../stores/globalStore';
import { GlobalSkillCard } from '../../components/features/GlobalSkillsView/GlobalSkillCard';
import { GlobalSkillDetail } from '../../components/features/GlobalSkillsView/GlobalSkillDetail';
import { PullToLibraryDialog } from '../../components/features/GlobalSkillsView/PullToLibraryDialog';
import { SkillListSkeleton } from '../../components/common/Skeletons/SkillListSkeleton';
import { globalService } from '../../services/globalService';
import { useGlobalFilters } from '../../hooks/useGlobalFilters';
import { useUIStore } from '../../stores/uiStore';
import styles from './Global.module.scss';

const CARD_WIDTH = 280;
const CARD_HEIGHT = 160;
const GAP = 16;
const SIDEBAR_WIDTH = 420;

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

  const [skillMdContent, setSkillMdContent] = useState<string>('');
  const [containerWidth, setContainerWidth] = useState(1200);
  const [containerHeight, setContainerHeight] = useState(800);
  const [showPullDialog, setShowPullDialog] = useState(false);
  const [pullSkill, setPullSkill] = useState<GlobalSkill | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    toggleSortDirection,
    filteredSkills,
  } = useGlobalFilters(skills);

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

  useEffect(() => {
    const updateDimensions = () => {
      const el = document.querySelector(`.${styles.gridContainer}`);
      if (el) {
        setContainerWidth(el.clientWidth);
        setContainerHeight(el.clientHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const columnCount = useMemo(() => {
    return Math.max(1, Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP)));
  }, [containerWidth]);

  const rowCount = useMemo(() => {
    return Math.ceil(filteredSkills.length / columnCount);
  }, [filteredSkills.length, columnCount]);

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

  const isEmpty = filteredSkills.length === 0 && !isLoading;
  const hasSkills = skills.length > 0;
  const effectiveWidth = selectedSkill ? containerWidth - SIDEBAR_WIDTH : containerWidth;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Global Skills</h1>
          <span className={styles.count}>{skills.length} skills</span>
        </div>
        <div className={styles.actions}>
          <div className={styles.searchWrapper}>
            <MagnifyingGlass size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Filter skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button
            type="button"
            className={styles.sortButton}
            onClick={toggleSortDirection}
            title={`Sort ${sortDirection === 'asc' ? 'descending' : 'ascending'}`}
          >
            <ArrowsDownUp size={16} />
          </button>
          <button
            type="button"
            className={[styles.sortOptionButton, sortBy === 'name' && styles.active].filter(Boolean).join(' ')}
            onClick={() => setSortBy('name')}
            title="Sort by name"
          >
            <TextAa size={16} />
          </button>
          <button
            type="button"
            className={[styles.sortOptionButton, sortBy === 'date' && styles.active].filter(Boolean).join(' ')}
            onClick={() => setSortBy('date')}
            title="Sort by date"
          >
            <Calendar size={16} />
          </button>
          <button
            type="button"
            className={[styles.sortOptionButton, sortBy === 'size' && styles.active].filter(Boolean).join(' ')}
            onClick={() => setSortBy('size')}
            title="Sort by size"
          >
            <Database size={16} />
          </button>
          <button
            type="button"
            className={[styles.refreshButton, isRefreshing && styles.refreshing].filter(Boolean).join(' ')}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh global skills"
          >
            <ArrowClockwise size={16} />
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div
        ref={containerRef}
        className={[styles.gridContainer, selectedSkill && styles.withDetail].filter(Boolean).join(' ')}
      >
        {isLoading ? (
          <SkillListSkeleton count={12} />
        ) : isEmpty ? (
          <div className={styles.empty}>
            <FolderOpen size={48} weight="thin" className={styles.emptyIcon} />
            {hasSkills ? (
              <>
                <h2 className={styles.emptyTitle}>No matching skills</h2>
                <p className={styles.emptyText}>
                  Try adjusting your search or filters
                </p>
              </>
            ) : (
              <>
                <h2 className={styles.emptyTitle}>No global skills installed</h2>
                <p className={styles.emptyText}>
                  Global skills are stored in ~/.claude/skills/ and available across all projects
                </p>
              </>
            )}
          </div>
        ) : filteredSkills.length > 100 ? (
          <Grid
            columnCount={columnCount}
            columnWidth={CARD_WIDTH + GAP}
            height={containerHeight}
            rowCount={rowCount}
            rowHeight={CARD_HEIGHT + GAP}
            width={effectiveWidth}
          >
            {({ columnIndex, rowIndex, style }) => {
              const index = rowIndex * columnCount + columnIndex;
              const skill = filteredSkills[index];
              if (!skill) return null;
              return (
                <div style={style} key={skill.id}>
                  <GlobalSkillCard
                    skill={skill}
                    isSelected={selectedSkill?.id === skill.id}
                    onSelect={handleSelectSkill}
                    onDelete={handleDeleteSkill}
                    onPull={handlePullToLibrary}
                  />
                </div>
              );
            }}
          </Grid>
        ) : (
          <div className={styles.grid}>
            {filteredSkills.map((skill) => (
              <GlobalSkillCard
                key={skill.id}
                skill={skill}
                isSelected={selectedSkill?.id === skill.id}
                onSelect={handleSelectSkill}
                onDelete={handleDeleteSkill}
                onPull={handlePullToLibrary}
              />
            ))}
          </div>
        )}
      </div>

      {selectedSkill && (
        <GlobalSkillDetail
          skill={selectedSkill}
          skillMdContent={skillMdContent}
          onClose={handleCloseDetail}
          onPull={handlePullToLibrary}
        />
      )}

      <PullToLibraryDialog
        isOpen={showPullDialog}
        skill={pullSkill}
        onClose={handlePullComplete}
        onComplete={handlePullComplete}
      />
    </div>
  );
}
