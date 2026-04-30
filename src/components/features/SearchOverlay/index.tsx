import { useCallback, useEffect, useRef, useState } from 'react';
import { X, MagnifyingGlass } from '@phosphor-icons/react';
import { useUIStore, type SearchResult } from '../../../stores/uiStore';
import { useProjectStore } from '../../../stores/projectStore';
import { useSearch } from '../../../hooks/useSearch';
import { useSearchKeyboard } from '../../../hooks/useSearchKeyboard';
import { SearchInput } from './SearchInput';
import { ScopeSelector } from './ScopeSelector';
import { CategoryFilter } from './CategoryFilter';
import { SearchResultGroup } from './SearchResultGroup';
import { SkillPreviewModal, type SkillPreviewData } from '../SkillPreviewModal';
import { libraryService } from '../../../services/libraryService';
import { globalService } from '../../../services/globalService';
import { projectService } from '../../../services/projectService';
import styles from './SearchOverlay.module.scss';

export interface SearchOverlayProps {
  onDeploy?: (result: SearchResult) => void;
  onExport?: (result: SearchResult) => void;
  onCopyPath?: (result: SearchResult) => void;
  onReveal?: (result: SearchResult) => void;
  onDelete?: (result: SearchResult) => void;
  onPreviewSkill?: (result: SearchResult) => void;
}

export function SearchOverlay({
  onDeploy,
  onExport,
  onCopyPath,
  onReveal,
  onDelete,
  onPreviewSkill,
}: SearchOverlayProps): React.ReactElement | null {
  const { isOpen, closeSearch } = useSearchKeyboard();
  const { search, clearResults, isSearching, results } = useSearch();
  const searchState = useUIStore((state) => state.search);
  const searchActions = useUIStore((state) => state.searchActions);
  const { projects } = useProjectStore();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [previewSkill, setPreviewSkill] = useState<SkillPreviewData | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (isOpen && searchState.searchQuery.length >= 2) {
      search(searchState.searchQuery);
    }
  }, [isOpen, searchState.searchQuery, search]);

  useEffect(() => {
    if (!isOpen) {
      clearResults();
      searchActions.resetSearch();
    }
  }, [isOpen, clearResults, searchActions]);

  const handleQueryChange = useCallback(
    (query: string) => {
      searchActions.setSearchQuery(query);
      if (query.length >= 2) {
        search(query);
      } else {
        clearResults();
      }
    },
    [search, clearResults, searchActions]
  );

  const handleScopeChange = useCallback(
    (scope: 'all' | 'library' | 'global' | 'project') => {
      searchActions.setSearchScope(scope);
      if (searchState.searchQuery.length >= 2) {
        search(searchState.searchQuery);
      }
    },
    [search, searchState.searchQuery, searchActions]
  );

  const handleProjectChange = useCallback(
    (projectId: string | null) => {
      searchActions.setSelectedProjectId(projectId);
      if (searchState.searchQuery.length >= 2) {
        search(searchState.searchQuery);
      }
    },
    [search, searchState.searchQuery, searchActions]
  );

  const handleCategoryChange = useCallback(
    (categoryId: string | null) => {
      searchActions.setSelectedCategoryId(categoryId);
      if (searchState.searchQuery.length >= 2) {
        search(searchState.searchQuery);
      }
    },
    [search, searchState.searchQuery, searchActions]
  );

  const handleToggleCollapse = useCallback(
    (groupId: string) => {
      searchActions.toggleGroupCollapse(groupId);
    },
    [searchActions]
  );

  const handleClickSkill = useCallback(
    async (result: SearchResult) => {
      if (onPreviewSkill) {
        onPreviewSkill(result);
        return;
      }

      const previewData: SkillPreviewData = {
        id: result.id,
        name: result.name,
        description: result.description,
      };
      setPreviewSkill(previewData);
      setIsPreviewOpen(true);

      try {
        let content = '';
        if (result.scope === 'library') {
          const res = await libraryService.get(result.id);
          if (res.success && res.data) {
            content = res.data.skillMdContent ?? '';
            previewData.size = res.data.size;
            previewData.fileCount = res.data.fileCount;
            previewData.date = res.data.importedAt as unknown as string;
          }
        } else if (result.scope === 'global') {
          // Search index uses "global-{folderName}" as id, but global_get expects folderName
          const realId = result.id.startsWith('global-')
            ? result.id.slice('global-'.length)
            : result.id;
          const res = await globalService.get(realId);
          if (res.success && res.data) {
            content = res.data.skillMdContent ?? '';
            previewData.size = res.data.size;
            previewData.fileCount = res.data.fileCount;
            previewData.date = res.data.installedAt as unknown as string;
            previewData.sourceLibrarySkillId = res.data.sourceLibrarySkillId;
          }
        } else if (result.scope === 'project' && result.projectId) {
          // Search index uses "pskill-{projectId}-{folderName}" as id, but project_skill_get expects folderName
          const prefix = `pskill-${result.projectId}-`;
          const realId = result.id.startsWith(prefix)
            ? result.id.slice(prefix.length)
            : result.id;
          const res = await projectService.getSkill(result.projectId, realId);
          if (res.success && res.data) {
            content = res.data.skillMdContent ?? '';
            previewData.size = res.data.size;
            previewData.fileCount = res.data.fileCount;
            previewData.date = res.data.installedAt as unknown as string;
          }
        }
        setPreviewContent(content);
        setPreviewSkill({ ...previewData });
      } catch {
        setPreviewContent('');
      }
    },
    [onPreviewSkill]
  );

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewSkill(null);
    setPreviewContent('');
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeSearch();
      }
    },
    [closeSearch]
  );

  const getTotalCount = (): number => {
    if (!results) return 0;
    return (
      results.library.length +
      results.global.length +
      Object.values(results.projects).reduce((sum, arr) => sum + arr.length, 0)
    );
  };

  const hasResults = results && getTotalCount() > 0;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} ref={overlayRef}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.controls}>
            <ScopeSelector
              value={searchState.searchScope}
              selectedProjectId={searchState.selectedProjectId}
              onScopeChange={handleScopeChange}
              onProjectChange={handleProjectChange}
            />
            <CategoryFilter value={searchState.selectedCategoryId} onChange={handleCategoryChange} />
          </div>
          <SearchInput
            value={searchState.searchQuery}
            onChange={handleQueryChange}
            isLoading={isSearching}
          />
          <button type="button" className={styles.closeButton} onClick={closeSearch} aria-label="Close search">
            <X size={20} />
          </button>
        </div>

        <div className={styles.resultsContainer}>
          {!hasResults && searchState.searchQuery.length >= 2 && !isSearching && (
            <div className={styles.empty}>
              <MagnifyingGlass size={48} weight="thin" />
              <p>No skills found for &quot;{searchState.searchQuery}&quot;</p>
            </div>
          )}

          {!hasResults && searchState.searchQuery.length < 2 && (
            <div className={styles.hint}>
              <MagnifyingGlass size={48} weight="thin" />
              <p>Type at least 2 characters to search</p>
            </div>
          )}

          {hasResults && (
            <div className={styles.results}>
              {results.library.length > 0 && (
                <SearchResultGroup
                  groupId="library"
                  title="App Library"
                  results={results.library}
                  query={searchState.searchQuery}
                  scope="library"
                  isCollapsed={searchState.collapsedGroups['library'] ?? false}
                  onToggleCollapse={handleToggleCollapse}
                  onClick={handleClickSkill}
                  onDeploy={onDeploy}
                  onExport={onExport}
                  onCopyPath={onCopyPath}
                  onReveal={onReveal}
                  onDelete={onDelete}
                />
              )}

              {results.global.length > 0 && (
                <SearchResultGroup
                  groupId="global"
                  title="Global Skills"
                  results={results.global}
                  query={searchState.searchQuery}
                  scope="global"
                  isCollapsed={searchState.collapsedGroups['global'] ?? false}
                  onToggleCollapse={handleToggleCollapse}
                  onClick={handleClickSkill}
                  onDeploy={onDeploy}
                  onExport={onExport}
                  onCopyPath={onCopyPath}
                  onReveal={onReveal}
                  onDelete={onDelete}
                />
              )}

              {Object.entries(results.projects).map(([projectId, projectResults]) => {
                const project = projects.find((p) => p.id === projectId);
                return (
                  <SearchResultGroup
                    key={projectId}
                    groupId={projectId}
                    title={project?.name ?? 'Unknown Project'}
                    results={projectResults}
                    query={searchState.searchQuery}
                    scope="project"
                    isCollapsed={searchState.collapsedGroups[projectId] ?? false}
                    onToggleCollapse={handleToggleCollapse}
                    onClick={handleClickSkill}
                    onDeploy={onDeploy}
                    onExport={onExport}
                    onCopyPath={onCopyPath}
                    onReveal={onReveal}
                    onDelete={onDelete}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.shortcuts}>
            <span className={styles.shortcut}>
              <kbd>Esc</kbd> to close
            </span>
            <span className={styles.shortcut}>
              <kbd>Cmd</kbd>+<kbd>F</kbd> to open
            </span>
          </div>
          {hasResults && <span className={styles.resultCount}>{getTotalCount()} results</span>}
        </div>
      </div>

      <SkillPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        skill={previewSkill}
        skillMdContent={previewContent}
      />
    </div>
  );
}
