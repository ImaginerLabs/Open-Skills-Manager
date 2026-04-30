import { useCallback, useEffect, useState } from 'react';
import { ProjectList } from './ProjectList';
import { AddProjectDialog } from '@/components/features/ProjectDialog';
import { useProjectStore, type Project } from '@/stores/projectStore';
import type { LibrarySkill } from '@/stores/libraryStore';
import { useUIStore } from '@/stores/uiStore';
import { useSelection } from '@/hooks/useSelection';
import { projectService } from '@/services/projectService';

export interface ProjectListContainerProps {
  onDeployProject?: (project: Project, skills: LibrarySkill[]) => void;
}

/**
 * Project List 容器组件
 *
 * 重构：使用 useSelection hook 处理选择逻辑
 * 移除直接操作其他 store 的代码
 */
export function ProjectListContainer({
  onDeployProject,
}: ProjectListContainerProps): React.ReactElement {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const selection = useSelection();

  const {
    projects,
    selectedProject,
    isLoading,
    setProjects,
    addProject,
    removeProject,
    setLoading,
    setError,
  } = useProjectStore();
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();

  // 加载项目列表
  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const result = await projectService.list();
        if (result.success) {
          setProjects(result.data);
        } else {
          setError(result.error.message);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, [setProjects, setLoading, setError]);

  // 使用 useSelection 处理选择逻辑
  const handleSelectProject = useCallback(
    (projectId: string) => {
      selection.handleSelectProject(projectId);
    },
    [selection]
  );

  const handleAddProject = useCallback(
    async (path: string) => {
      setLoading(true);
      try {
        const result = await projectService.add(path);

        if (result.success) {
          addProject(result.data);
          showToast('success', `Project "${result.data.name}" added`);
        } else {
          showToast('error', result.error.message);
        }
      } catch (e) {
        showToast('error', e instanceof Error ? e.message : 'Failed to add project');
      } finally {
        setLoading(false);
      }
    },
    [addProject, setLoading, showToast]
  );

  const handleOpenAddDialog = useCallback(() => {
    setShowAddDialog(true);
  }, []);

  const handleRemoveProject = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      showConfirmDialog({
        title: 'Remove Project',
        message: `Are you sure you want to remove "${project.name}"? This will not delete the project folder.`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
        onConfirm: async () => {
          closeConfirmDialog();
          setLoading(true);

          try {
            const result = await projectService.remove(projectId);
            if (result.success) {
              removeProject(projectId);
              showToast('success', `Project "${project.name}" removed`);
            } else {
              showToast('error', result.error.message);
            }
          } catch (e) {
            showToast('error', e instanceof Error ? e.message : 'Failed to remove project');
          } finally {
            setLoading(false);
          }
        },
      });
    },
    [projects, removeProject, setLoading, showToast, showConfirmDialog, closeConfirmDialog]
  );

  const handleDeployProject = useCallback(
    async (project: Project) => {
      if (!project.exists || project.skillCount === 0) {
        showToast('info', 'No skills in this project to deploy');
        return;
      }
      // Load project skills
      try {
        const result = await projectService.skills(project.id);
        if (result.success && result.data.length > 0) {
          // Convert project skills to library skill format
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
          onDeployProject?.(project, skillsToDeploy);
        } else {
          showToast('info', 'No skills in this project to deploy');
        }
      } catch {
        showToast('error', 'Failed to load project skills');
      }
    },
    [onDeployProject, showToast]
  );

  return (
    <>
      <ProjectList
        projects={projects}
        selectedProjectId={selectedProject?.id}
        onSelectProject={handleSelectProject}
        onAddProject={handleOpenAddDialog}
        onRemoveProject={handleRemoveProject}
        onDeployProject={handleDeployProject}
        isLoading={isLoading}
      />

      <AddProjectDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddProject}
      />
    </>
  );
}