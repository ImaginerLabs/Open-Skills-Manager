import { useState, useCallback } from 'react';
import { useLibraryStore } from '@/stores/libraryStore';
import { useUIStore } from '@/stores/uiStore';
import { libraryService } from '@/services/libraryService';
import { useSidebarData } from './useSidebarData';

/**
 * Sidebar 拖放处理 Hook
 *
 * 封装 Sidebar 区域的拖放逻辑：
 * - 处理技能拖放到 sidebar 空白区域（取消组织）
 * - 管理拖放视觉状态
 *
 * 与 useCategoryDragDrop 配合使用：
 * - useCategoryDragDrop: 处理拖放到具体 Group/Category
 * - useSidebarDragDrop: 处理拖放到 sidebar 空白区域
 *
 * 从 MainLayout 提取，简化组件职责。
 */
export function useSidebarDragDrop() {
  const [isDragOver, setIsDragOver] = useState(false);
  const { updateSkill, groups } = useLibraryStore();
  const { showToast } = useUIStore();
  const { refreshLibrary } = useSidebarData();

  /**
   * 处理拖放到 sidebar 空白区域
   * 将技能移除组织（不属于任何 Group/Category）
   */
  const handleOrganizeSkill = useCallback(
    async (skillId: string, groupId: string | null, categoryId?: string) => {
      try {
        const result = await libraryService.organize(
          skillId,
          groupId ?? undefined,
          categoryId
        );

        if (result.success) {
          // 更新本地状态
          const updates: Partial<{ groupId: string; categoryId: string }> = {};
          if (groupId) updates.groupId = groupId;
          if (categoryId) updates.categoryId = categoryId;
          updateSkill(skillId, updates);

          // 显示成功消息
          const group = groups.find((g) => g.id === groupId);
          const category = group?.categories.find((c) => c.id === categoryId);
          const locationName = category
            ? `${group?.name} / ${category.name}`
            : group?.name ?? 'Uncategorized';
          showToast('success', `Skill moved to ${locationName}`);

          // 刷新 sidebar 计数
          refreshLibrary();
        } else {
          showToast('error', result.error.message);
        }
      } catch (e) {
        showToast(
          'error',
          e instanceof Error ? e.message : 'Failed to organize skill'
        );
      }
    },
    [updateSkill, groups, showToast, refreshLibrary]
  );

  /**
   * Sidebar 区域 drag over 处理
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  /**
   * Sidebar 区域 drag leave 处理
   */
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  /**
   * Sidebar 区域 drop 处理
   * 拖放到空白区域时，取消技能的组织归属
   */
  const handleDrop = useCallback(
    async (e: React.DragEvent, groupId?: string, categoryId?: string) => {
      e.preventDefault();
      setIsDragOver(false);

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const { skillId } = JSON.parse(data) as { skillId: string; skillName: string };
        await handleOrganizeSkill(skillId, groupId ?? null, categoryId);
      } catch (error) {
        console.error('Failed to organize skill:', error);
      }
    },
    [handleOrganizeSkill]
  );

  return {
    // 拖放视觉状态
    isDragOver,

    // 拖放事件处理
    handleDragOver,
    handleDragLeave,
    handleDrop,

    // 组织技能方法（供 CategoryManager 使用）
    handleOrganizeSkill,
  };
}