import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * 选择来源类型
 * - library: Library 中的 Group/Category
 * - global: Global Skills
 * - project: Project
 * - none: 无选择
 */
export type SelectionSource = 'library' | 'global' | 'project' | 'none';

/**
 * 统一选择状态
 *
 * 用于管理 Sidebar 中 Library/Global/Project 的互斥选择状态。
 * 解决原有选择逻辑分散在多个组件中使用 useEffect 副作用的问题。
 */
interface SelectionState {
  // 当前选择来源
  source: SelectionSource;

  // Library 选择状态
  libraryGroupId: string | undefined;
  libraryCategoryId: string | undefined;

  // Project 选择状态
  projectId: string | null;

  // === Actions ===

  /**
   * 选择 Library Group/Category
   * 同时清除 Global 和 Project 选择
   */
  selectLibrary: (groupId?: string, categoryId?: string) => void;

  /**
   * 选择 Global Skills
   * 同时清除 Library 和 Project 选择
   */
  selectGlobal: () => void;

  /**
   * 选择 Project
   * 同时清除 Library 和 Global 选择
   */
  selectProject: (projectId: string | null) => void;

  /**
   * 清除所有选择
   */
  clearSelection: () => void;

  // === 派生状态方法 ===

  isLibrarySelected: () => boolean;
  isGlobalSelected: () => boolean;
  isProjectSelected: () => boolean;
}

export const useSelectionStore = create<SelectionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      source: 'none',
      libraryGroupId: undefined,
      libraryCategoryId: undefined,
      projectId: null,

      // Actions
      selectLibrary: (groupId, categoryId) =>
        set(
          {
            source: 'library',
            libraryGroupId: groupId,
            libraryCategoryId: categoryId,
            projectId: null,
          },
          false,
          'selectLibrary'
        ),

      selectGlobal: () =>
        set(
          {
            source: 'global',
            libraryGroupId: undefined,
            libraryCategoryId: undefined,
            projectId: null,
          },
          false,
          'selectGlobal'
        ),

      selectProject: (projectId) =>
        set(
          {
            source: projectId ? 'project' : 'none',
            libraryGroupId: undefined,
            libraryCategoryId: undefined,
            projectId,
          },
          false,
          'selectProject'
        ),

      clearSelection: () =>
        set(
          {
            source: 'none',
            libraryGroupId: undefined,
            libraryCategoryId: undefined,
            projectId: null,
          },
          false,
          'clearSelection'
        ),

      // Derived state methods
      isLibrarySelected: () => get().source === 'library',
      isGlobalSelected: () => get().source === 'global',
      isProjectSelected: () => get().source === 'project',
    }),
    { name: 'selection-store' }
  )
);
