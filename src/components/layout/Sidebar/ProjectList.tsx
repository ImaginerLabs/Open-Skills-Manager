import { useCallback } from 'react';
import { Spinner } from '@phosphor-icons/react';
import type { Project } from '@/stores/projectStore';
import { ProjectItem } from './ProjectItem';
import { AddProjectButton } from './AddProjectButton';
import styles from './ProjectList.module.scss';

export interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | undefined;
  onSelectProject: (projectId: string) => void;
  onAddProject: () => void;
  onRemoveProject: (projectId: string) => void;
  isLoading?: boolean;
}

export function ProjectList({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
  onRemoveProject,
  isLoading = false,
}: ProjectListProps): React.ReactElement {
  const handleSelectProject = useCallback(
    (projectId: string) => {
      onSelectProject(projectId);
    },
    [onSelectProject]
  );

  const handleRemoveProject = useCallback(
    (projectId: string) => {
      onRemoveProject(projectId);
    },
    [onRemoveProject]
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Projects</span>
      </div>

      {isLoading ? (
        <div className={styles.loading} data-testid="projects-loading">
          <Spinner size={20} className="spinning" />
        </div>
      ) : (
        <>
          {projects.length === 0 ? (
            <p className={styles.emptyText}>No projects added</p>
          ) : (
            <div className={styles.list}>
              {projects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  isSelected={selectedProjectId === project.id}
                  onSelect={handleSelectProject}
                  onRemove={handleRemoveProject}
                />
              ))}
            </div>
          )}

          <AddProjectButton onClick={onAddProject} disabled={isLoading} />
        </>
      )}
    </div>
  );
}
