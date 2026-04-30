import { useCallback } from 'react';
import { useUIStore, type SearchResult } from '@/stores/uiStore';
import type { LibrarySkill } from '@/stores/libraryStore';
import { useProjectStore } from '@/stores/projectStore';
import { libraryService } from '@/services/libraryService';
import { globalService } from '@/services/globalService';
import { configService } from '@/services/configService';
import { useSidebarData } from './useSidebarData';
import type { ExportableSkill } from '@/components/features/ExportDialog';

/**
 * 搜索处理 Hook
 *
 * 封装 SearchOverlay 的所有处理逻辑：
 * - 部署搜索结果
 * - 导出搜索结果
 * - 复制路径
 * - 在 Finder 中显示
 * - 删除搜索结果
 *
 * 从 MainLayout 提取，简化组件职责。
 */
export function useSearchHandlers() {
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();
  const { refreshLibrary, refreshGlobal } = useSidebarData();
  const { projects } = useProjectStore();

  /**
   * 部署搜索结果
   * 返回技能列表和来源信息，供 useBatchDeployFlow 使用
   */
  const handleDeploy = useCallback(
    async (
      result: SearchResult
    ): Promise<{ skills: LibrarySkill[]; sourceType: 'library' | 'global' | 'project'; projectName?: string | undefined } | null> => {
      if (result.scope === 'library') {
        const res = await libraryService.get(result.id);
        if (res.success && res.data) {
          return {
            skills: [res.data],
            sourceType: 'library',
          };
        } else {
          showToast('error', 'Failed to load skill data');
          return null;
        }
      } else {
        // Global 或 Project scope
        const projectName = result.projectId
          ? projects.find((p) => p.id === result.projectId)?.name
          : undefined;
        return {
          skills: [
            {
              id: result.id,
              name: result.name,
              description: result.description,
              path: result.path,
              size: result.size,
              fileCount: result.fileCount,
              skillMdLines: 0,
              skillMdChars: 0,
              folderName: result.id,
              version: '1.0.0',
              skillMdPath: '',
              hasResources: result.fileCount > 1,
              isSymlink: false,
              importedAt: new Date(),
              deployments: [],
            },
          ],
          sourceType: result.scope,
          projectName: projectName ?? undefined,
        };
      }
    },
    [showToast, projects]
  );

  /**
   * 导出搜索结果
   * 返回导出技能列表，供 ExportDialog 使用
   */
  const handleExport = useCallback(
    async (result: SearchResult): Promise<ExportableSkill[] | null> => {
      if (result.scope === 'library') {
        const res = await libraryService.get(result.id);
        if (res.success && res.data) {
          return [res.data];
        } else {
          showToast('error', 'Failed to load skill data');
          return null;
        }
      } else {
        return [
          {
            id: result.id,
            name: result.name,
            path: result.path,
            scope: result.scope as 'global' | 'project',
          },
        ];
      }
    },
    [showToast]
  );

  /**
   * 复制技能路径到剪贴板
   */
  const handleCopyPath = useCallback(
    async (result: SearchResult) => {
      try {
        await navigator.clipboard.writeText(result.path);
        showToast('success', `Copied path: ${result.path}`);
      } catch {
        showToast('error', 'Failed to copy path');
      }
    },
    [showToast]
  );

  /**
   * 在 Finder 中显示技能路径
   */
  const handleReveal = useCallback(
    async (result: SearchResult) => {
      try {
        await configService.revealPath(result.path);
      } catch {
        showToast('error', 'Failed to reveal in Finder');
      }
    },
    [showToast]
  );

  /**
   * 删除搜索结果
   * 根据来源调用不同的删除服务
   */
  const handleDelete = useCallback(
    async (result: SearchResult) => {
      showConfirmDialog({
        title: 'Delete Skill',
        message: `Are you sure you want to delete "${result.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: async () => {
          closeConfirmDialog();

          if (result.scope === 'library') {
            const deleteResult = await libraryService.delete(result.id);
            if (deleteResult.success) {
              showToast('success', `Deleted ${result.name}`);
              refreshLibrary();
            } else {
              showToast('error', deleteResult.error.message);
            }
          } else if (result.scope === 'global') {
            const deleteResult = await globalService.delete(result.id);
            if (deleteResult.success) {
              showToast('success', `Deleted ${result.name}`);
              refreshGlobal();
            } else {
              showToast('error', deleteResult.error.message);
            }
          }
        },
      });
    },
    [showToast, showConfirmDialog, closeConfirmDialog, refreshLibrary, refreshGlobal]
  );

  return {
    handleDeploy,
    handleExport,
    handleCopyPath,
    handleReveal,
    handleDelete,
  };
}