import { useState, useCallback, useEffect } from 'react';
import { Globe, Folder, MagnifyingGlass, Check } from '@phosphor-icons/react';
import { Modal, ModalFooter } from '../../ui/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { useProjectStore, type Project } from '../../../stores/projectStore';
import { deployService } from '../../../services/deployService';
import { useUIStore } from '../../../stores/uiStore';
import type { LibrarySkill, Deployment } from '../../../stores/libraryStore';
import styles from './DeployDialog.module.scss';

export interface DeployDialogProps {
  open: boolean;
  skill: LibrarySkill | null;
  onClose: () => void;
  onDeploy: (skillId: string, deployment: Deployment) => void;
}

type DeployTarget = 'global' | { type: 'project'; project: Project };

export function DeployDialog({
  open,
  skill,
  onClose,
  onDeploy,
}: DeployDialogProps): React.ReactElement {
  const { projects } = useProjectStore();
  const { showToast } = useUIStore();

  const [selectedTarget, setSelectedTarget] = useState<DeployTarget | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentProjects = projects.slice(0, 3);

  useEffect(() => {
    if (open) {
      setSelectedTarget(null);
      setSearchQuery('');
    }
  }, [open]);

  const handleDeploy = useCallback(async () => {
    if (!skill || !selectedTarget) return;

    setIsDeploying(true);
    try {
      let result;
      let deployment: Deployment;

      if (selectedTarget === 'global') {
        result = await deployService.toGlobal(skill.id);
        deployment = {
          id: crypto.randomUUID(),
          skillId: skill.id,
          targetScope: 'global',
          targetPath: '~/.claude/skills/',
          deployedAt: new Date(),
        };
      } else {
        const project = selectedTarget.project;
        result = await deployService.toProject(skill.id, project.path);
        deployment = {
          id: crypto.randomUUID(),
          skillId: skill.id,
          targetScope: 'project',
          targetPath: project.skillsPath,
          projectName: project.name,
          deployedAt: new Date(),
        };
      }

      if (result.success) {
        onDeploy(skill.id, deployment);
        showToast('success', `Deployed "${skill.name}" successfully`);
        onClose();
      } else {
        showToast('error', result.error.message);
      }
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Deploy failed');
    } finally {
      setIsDeploying(false);
    }
  }, [skill, selectedTarget, onDeploy, showToast, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && selectedTarget && !isDeploying) {
        handleDeploy();
      }
    },
    [selectedTarget, isDeploying, handleDeploy]
  );

  if (!skill) return <></>;

  return (
    <Modal open={open} onClose={onClose} title={`Deploy "${skill.name}"`} onKeyDown={handleKeyDown}>
      <div className={styles.content}>
        <p className={styles.subtitle}>Select deployment target</p>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Global Scope</h3>
          <button
            type="button"
            className={[styles.targetCard, selectedTarget === 'global' && styles.selected]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setSelectedTarget('global')}
          >
            <Globe size={20} weight="duotone" />
            <div className={styles.targetInfo}>
              <span className={styles.targetName}>Global Skills</span>
              <span className={styles.targetPath}>~/.claude/skills/</span>
            </div>
            {selectedTarget === 'global' && <Check size={18} weight="bold" className={styles.checkIcon} />}
          </button>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Projects</h3>

          {projects.length > 3 && (
            <div className={styles.searchWrapper}>
              <MagnifyingGlass size={14} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          )}

          <div className={styles.projectList}>
            {filteredProjects.length === 0 ? (
              <div className={styles.empty}>
                <Folder size={24} weight="thin" />
                <span>No projects found</span>
              </div>
            ) : (
              filteredProjects.map((project) => {
                const isSelected =
                  selectedTarget !== 'global' &&
                  selectedTarget?.type === 'project' &&
                  selectedTarget.project.id === project.id;

                const isRecent = recentProjects.some((p) => p.id === project.id);

                return (
                  <button
                    key={project.id}
                    type="button"
                    className={[styles.targetCard, isSelected && styles.selected]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSelectedTarget({ type: 'project', project })}
                  >
                    <Folder size={20} weight="duotone" />
                    <div className={styles.targetInfo}>
                      <span className={styles.targetName}>
                        {project.name}
                        {isRecent && <span className={styles.recentBadge}>Recent</span>}
                      </span>
                      <span className={styles.targetPath}>{project.path}</span>
                    </div>
                    {isSelected && <Check size={18} weight="bold" className={styles.checkIcon} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleDeploy} disabled={!selectedTarget || isDeploying}>
          {isDeploying ? 'Deploying...' : 'Deploy'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
