import { useCallback, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useNavigate } from 'react-router-dom';
import { ProjectList } from './ProjectList';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';
import { projectService } from '@/services/projectService';

export function ProjectListContainer(): React.ReactElement {
  const navigate = useNavigate();
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
        selectProject(project);
        navigate(`/projects/${projectId}`);
      }
    },
    [projects, selectProject, navigate]
  );

  const handleAddProject = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Project Directory',
      });

      if (selected) {
        // Tauri dialog returns string for single directory selection
        const path = typeof selected === 'string' ? selected : null;
        if (!path) return;

        setLoading(true);
        const result = await projectService.add(path);

        if (result.success) {
          addProject(result.data);
          showToast('success', `Project "${result.data.name}" added`);
        } else {
          showToast('error', result.error.message);
        }
        setLoading(false);
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to add project');
      setLoading(false);
    }
  }, [addProject, setLoading, showToast]);

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
    <ProjectList
      projects={projects}
      selectedProjectId={selectedProject?.id}
      onSelectProject={handleSelectProject}
      onAddProject={handleAddProject}
      onRemoveProject={handleRemoveProject}
      isLoading={isLoading}
    />
  );
}
