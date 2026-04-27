import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectList } from './ProjectList';
import { AddProjectDialog } from '@/components/features/ProjectDialog';
import { useProjectStore } from '@/stores/projectStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useUIStore } from '@/stores/uiStore';
import { projectService } from '@/services/projectService';

export function ProjectListContainer(): React.ReactElement {
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const {
    projects,
    selectedProject,
    isLoading,
    setProjects,
    addProject,
    removeProject,
    selectProject,
    setLoading,
    setError,
  } = useProjectStore();
  const { showToast, showConfirmDialog, closeConfirmDialog } = useUIStore();

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

  const handleSelectProject = useCallback(
    (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        console.log('[handleSelectProject] Selecting project:', projectId);
        selectProject(project);
        // Clear library selection when selecting a project (mutual exclusivity)
        useLibraryStore.getState().selectGroup(undefined);
        navigate(`/projects/${projectId}`);
      }
    },
    [projects, selectProject, navigate]
  );

  const handleAddProject = useCallback(async (path: string) => {
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
  }, [addProject, setLoading, showToast]);

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

  return (
    <>
      <ProjectList
        projects={projects}
        selectedProjectId={selectedProject?.id}
        onSelectProject={handleSelectProject}
        onAddProject={handleOpenAddDialog}
        onRemoveProject={handleRemoveProject}
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
