import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelectionStore } from '@/stores/selectionStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useProjectStore } from '@/stores/projectStore';
import { ALL_GROUP_ID } from '@/components/features/CategoryManager';

/**
 * 统一选择逻辑 Hook
 *
 * 封装 Library/Global/Project 的选择逻辑，处理：
 * - 互斥选择（选择一个时清除其他）
 * - 导航跳转
 * - 与现有 store 的同步（向后兼容）
 *
 * 使用方式：
 * ```tsx
 * const selection = useSelection();
 *
 * // 选择 Library Group
 * selection.handleSelectLibrary('grp-xxx');
 *
 * // 选择 Library Category
 * selection.handleSelectLibrary('grp-xxx', 'cat-yyy');
 *
 * // 选择 Global
 * selection.handleSelectGlobal();
 *
 * // 选择 Project
 * selection.handleSelectProject('project-id');
 * ```
 */
export function useSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  // 统一选择状态
  const selectionStore = useSelectionStore();

  // 现有 store（向后兼容）
  const selectGroup = useLibraryStore((state) => state.selectGroup);
  const selectCategory = useLibraryStore((state) => state.selectCategory);
  const selectProject = useProjectStore((state) => state.selectProject);
  const projects = useProjectStore((state) => state.projects);

  /**
   * 选择 Library Group/Category
   * 同时更新 selectionStore 和现有 libraryStore
   */
  const handleSelectLibrary = useCallback(
    (groupId?: string, categoryId?: string) => {
      console.log('[useSelection] handleSelectLibrary:', groupId, categoryId);

      // 更新统一选择状态
      selectionStore.selectLibrary(groupId, categoryId);

      // 同步到现有 libraryStore（向后兼容）
      selectGroup(groupId);
      if (categoryId) {
        selectCategory(categoryId);
      }

      // 导航到 Library 页面
      if (!location.pathname.startsWith('/library')) {
        navigate('/library');
      }
    },
    [selectionStore, selectGroup, selectCategory, location.pathname, navigate]
  );

  /**
   * 选择 Global Skills
   * 同时更新 selectionStore 和清除现有 store 选择
   */
  const handleSelectGlobal = useCallback(
    () => {
      console.log('[useSelection] handleSelectGlobal');

      // 更新统一选择状态
      selectionStore.selectGlobal();

      // 同步清除现有 store 选择（向后兼容）
      selectGroup(undefined);
      selectProject(null);

      // 导航到 Global 页面
      navigate('/global');
    },
    [selectionStore, selectGroup, selectProject, navigate]
  );

  /**
   * 选择 Project
   * 同时更新 selectionStore 和现有 projectStore
   */
  const handleSelectProject = useCallback(
    (projectId: string | null) => {
      console.log('[useSelection] handleSelectProject:', projectId ?? 'null');

      if (!projectId) {
        // 清除选择
        selectionStore.clearSelection();
        selectProject(null);
        return;
      }

      // 查找项目
      const project = projects.find((p) => p.id === projectId);
      if (!project) {
        console.warn('[useSelection] Project not found:', projectId);
        return;
      }

      // 更新统一选择状态
      selectionStore.selectProject(projectId);

      // 同步到现有 projectStore（向后兼容）
      selectProject(project);

      // 清除 Library 选择
      selectGroup(undefined);

      // 导航到 Project 页面
      navigate(`/projects/${projectId}`);
    },
    [selectionStore, selectProject, selectGroup, projects, navigate]
  );

  /**
   * 确保默认选择
   * 在 Library 页面且无选择时，默认选择 "All" Group
   */
  const ensureDefaultSelection = useCallback(
    () => {
      if (
        selectionStore.source === 'none' &&
        location.pathname.startsWith('/library')
      ) {
        console.log('[useSelection] ensureDefaultSelection: selecting All group');
        handleSelectLibrary(ALL_GROUP_ID);
      }
    },
    [selectionStore.source, location.pathname, handleSelectLibrary]
  );

  /**
   * 清除所有选择
   * 用于导航到 Settings 等非选择页面
   */
  const handleClearSelection = useCallback(
    () => {
      console.log('[useSelection] handleClearSelection');
      selectionStore.clearSelection();
      selectGroup(undefined);
      selectProject(null);
    },
    [selectionStore, selectGroup, selectProject]
  );

  return {
    // 状态
    source: selectionStore.source,
    libraryGroupId: selectionStore.libraryGroupId,
    libraryCategoryId: selectionStore.libraryCategoryId,
    projectId: selectionStore.projectId,

    // 派生状态
    isLibrarySelected: selectionStore.isLibrarySelected,
    isGlobalSelected: selectionStore.isGlobalSelected,
    isProjectSelected: selectionStore.isProjectSelected,

    // 选择方法
    handleSelectLibrary,
    handleSelectGlobal,
    handleSelectProject,
    handleClearSelection,
    ensureDefaultSelection,
  };
}