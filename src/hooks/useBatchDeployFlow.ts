import { useState, useCallback, useEffect } from 'react';
import { useLibraryStore, type LibrarySkill } from '@/stores/libraryStore';
import { useProjectStore, type Project } from '@/stores/projectStore';
import { useGlobalStore } from '@/stores/globalStore';
import { useUIStore } from '@/stores/uiStore';
import { libraryService } from '@/services/libraryService';
import { projectService } from '@/services/projectService';
import { useBatchDeploy, type BatchDeployOptions } from './useBatchDeploy';
import { useSidebarData } from './useSidebarData';
import { toLibrarySkillFormat } from '@/utils/skillConverters';
import { ALL_GROUP_ID } from '@/components/features/CategoryManager';
import type { DeployTarget } from '@/components/features/DeploymentTracking/BatchDeployTargetDialog';

/**
 * Batch Deploy 来源信息
 */
export interface BatchDeploySourceInfo {
  sourceType: 'library' | 'global' | 'project';
  groupId?: string | undefined;
  categoryId?: string | undefined;
  projectName?: string | undefined;
}

/**
 * Batch Deploy 流程 Hook
 *
 * 封装批量部署的完整流程：
 * - 从不同来源发起部署
 * - 管理对话框状态
 * - 执行部署逻辑
 * - 处理部署结果
 *
 * 从 MainLayout 提取，简化组件职责。
 */
export function useBatchDeployFlow() {
  // 对话框状态
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [skills, setSkills] = useState<LibrarySkill[]>([]);
  const [sourceInfo, setSourceInfo] = useState<BatchDeploySourceInfo>({
    sourceType: 'library',
  });

  // Store hooks
  const { showToast } = useUIStore();
  const { skills: librarySkills } = useLibraryStore();
  const { refreshLibrary, refreshAll } = useSidebarData();

  // 底层 batch deploy hook
  const batchDeploy = useBatchDeploy();

  /**
   * 从 Category 发起部署
   * 用于 CategoryManager 的右键菜单 "Deploy All to..."
   */
  const deployFromCategory = useCallback(
    (groupId: string, categoryId?: string) => {
      // 获取该 Group/Category 下的技能
      const filteredSkills =
        groupId === ALL_GROUP_ID
          ? librarySkills
          : librarySkills.filter((skill) => {
              if (categoryId) {
                return skill.groupId === groupId && skill.categoryId === categoryId;
              }
              return skill.groupId === groupId;
            });

      if (filteredSkills.length === 0) {
        showToast('info', 'No skills in this category to deploy');
        return;
      }

      setSkills(filteredSkills);
      setSourceInfo({
        sourceType: 'library',
        groupId,
        categoryId,
      });
      setShowTargetDialog(true);
    },
    [librarySkills, showToast]
  );

  /**
   * 从 Global Skills 发起部署
   * 用于 GlobalSkillsItem 的右键菜单
   */
  const deployFromGlobal = useCallback(
    () => {
      const globalSkills = useGlobalStore.getState().skills;
      if (globalSkills.length === 0) {
        showToast('info', 'No global skills to deploy');
        return;
      }

      // 转换为 LibrarySkill 格式
      const skillsToDeploy = globalSkills.map((skill) =>
        toLibrarySkillFormat(skill)
      );

      setSkills(skillsToDeploy);
      setSourceInfo({ sourceType: 'global' });
      setShowTargetDialog(true);
    },
    [showToast]
  );

  /**
   * 从 Project 发起部署
   * 用于 ProjectListContainer 的部署按钮
   */
  const deployFromProject = useCallback(
    async (project: Project) => {
      if (!project.exists || project.skillCount === 0) {
        showToast('info', 'No skills in this project to deploy');
        return;
      }

      try {
        const result = await projectService.skills(project.id);
        if (result.success && result.data.length > 0) {
          // 转换为 LibrarySkill 格式
          const skillsToDeploy: LibrarySkill[] = result.data.map((skill) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description || '',
            path: skill.path,
            size: skill.size,
            fileCount: skill.fileCount,
            skillMdLines: 0,
            skillMdChars: 0,
            folderName: skill.id,
            version: '1.0.0',
            skillMdPath: '',
            hasResources: skill.fileCount > 1,
            isSymlink: false,
            importedAt: new Date(),
            deployments: [],
          }));

          setSkills(skillsToDeploy);
          setSourceInfo({
            sourceType: 'project',
            projectName: project.name,
          });
          setShowTargetDialog(true);
        } else {
          showToast('info', 'No skills in this project to deploy');
        }
      } catch {
        showToast('error', 'Failed to load project skills');
      }
    },
    [showToast]
  );

  /**
   * 从搜索结果发起部署
   * 用于 SearchOverlay 的部署按钮
   */
  const deployFromSearchResult = useCallback(
    async (result: { id: string; name: string; path: string; scope: 'library' | 'global' | 'project'; projectId?: string }) => {
      if (result.scope === 'library') {
        const res = await libraryService.get(result.id);
        if (res.success && res.data) {
          setSkills([res.data]);
          setSourceInfo({ sourceType: 'library' });
          setShowTargetDialog(true);
        } else {
          showToast('error', 'Failed to load skill data');
        }
      } else {
        // Global 或 Project scope
        setSkills([toLibrarySkillFormat(result)]);
        const projectName = result.projectId
          ? useProjectStore.getState().projects.find((p) => p.id === result.projectId)?.name
          : undefined;
        setSourceInfo({
          sourceType: result.scope,
          projectName: projectName ?? undefined,
        });
        setShowTargetDialog(true);
      }
    },
    [showToast]
  );

  /**
   * 执行部署到目标
   * 处理 BatchDeployTargetDialog 的 onDeploy 回调
   */
  const executeDeploy = useCallback(
    async (target: DeployTarget) => {
      setShowTargetDialog(false);

      if (target.type === 'library') {
        // 部署到 Library
        if (sourceInfo.sourceType === 'global' || sourceInfo.sourceType === 'project') {
          // 从 Global/Project 导入到 Library
          for (const skill of skills) {
            const result = await libraryService.import({
              path: skill.path,
              groupId: target.groupId,
              categoryId: target.categoryId,
            });
            if (result.success) {
              showToast('success', `Skill "${skill.name}" added to Library`);
            } else {
              showToast(
                'error',
                `Failed to add "${skill.name}" to Library: ${result.error.message}`
              );
            }
          }
          refreshLibrary();
          batchDeploy.reset();
        } else {
          // Library 内复制 - 更新技能元数据
          const updates: Array<{
            skillId: string;
            groupId?: string;
            categoryId?: string;
          }> = [];
          for (const skill of skills) {
            const result = await libraryService.organize(
              skill.id,
              target.groupId,
              target.categoryId
            );
            if (result.success) {
              const update: { skillId: string; groupId?: string; categoryId?: string } = {
                skillId: skill.id,
              };
              if (target.groupId) update.groupId = target.groupId;
              if (target.categoryId) update.categoryId = target.categoryId;
              updates.push(update);
            }
          }
          if (updates.length > 0) {
            showToast('success', `Moved ${updates.length} skills`);
            refreshLibrary();
          }
          batchDeploy.reset();
        }
      } else if (target.type === 'global') {
        // 部署到 Global
        const options: BatchDeployOptions = {
          targetScope: 'global',
        };
        if (target.ideId) options.targetIdeId = target.ideId;
        if (sourceInfo.sourceType) options.sourceScope = sourceInfo.sourceType;
        batchDeploy.startDeploy(skills, options);
      } else if (target.type === 'project') {
        // 部署到 Project
        const options: BatchDeployOptions = {
          targetScope: 'project',
        };
        if (target.ideId) options.targetIdeId = target.ideId;
        if (target.projectId) options.projectId = target.projectId;
        if (sourceInfo.sourceType) options.sourceScope = sourceInfo.sourceType;
        batchDeploy.startDeploy(skills, options);
      }
    },
    [skills, sourceInfo, batchDeploy, showToast, refreshLibrary]
  );

  /**
   * 部署完成后刷新数据
   */
  useEffect(() => {
    if (batchDeploy.status === 'completed' && batchDeploy.result) {
      refreshAll();
    }
  }, [batchDeploy.status, batchDeploy.result, refreshAll]);

  /**
   * 关闭目标选择对话框
   */
  const closeTargetDialog = useCallback(() => {
    setShowTargetDialog(false);
  }, []);

  /**
   * 关闭进度对话框
   */
  const closeProgressDialog = useCallback(() => {
    batchDeploy.reset();
  }, [batchDeploy]);

  return {
    // 目标选择对话框状态
    showTargetDialog,
    skills,
    sourceInfo,

    // 进度对话框状态
    batchDeployStatus: batchDeploy.status,
    batchDeployProgress: batchDeploy.progress,
    batchDeployTotal: batchDeploy.total,
    batchDeployCurrentSkill: batchDeploy.currentSkillName,
    batchDeployResult: batchDeploy.result,

    // 发起部署方法
    deployFromCategory,
    deployFromGlobal,
    deployFromProject,
    deployFromSearchResult,

    // 执行部署
    executeDeploy,

    // 对话框控制
    closeTargetDialog,
    closeProgressDialog,

    // 底层 batch deploy 控制
    cancelDeploy: batchDeploy.cancel,
    retryFailed: batchDeploy.retryFailed,
  };
}