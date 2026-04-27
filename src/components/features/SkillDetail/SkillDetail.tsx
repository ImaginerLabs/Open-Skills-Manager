import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X, FolderOpen, FileText, Clock, Rocket, Export } from '@phosphor-icons/react';
import type { LibrarySkill } from '../../../stores/libraryStore';
import { formatSize, formatDate } from '../../../utils/formatters';
import styles from './SkillDetail.module.scss';

export interface SkillDetailProps {
  skill: LibrarySkill | null;
  skillMdContent?: string;
  resources?: SkillResource[];
  onClose?: () => void;
  onDeploy?: (skill: LibrarySkill) => void;
  onExport?: (skillId: string) => void;
}

export interface SkillResource {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory';
}

export function SkillDetail({
  skill,
  skillMdContent = '',
  resources = [],
  onClose,
  onDeploy,
  onExport,
}: SkillDetailProps): React.ReactElement | null {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
      setIsClosing(false);
    }, 200);
  }, [onClose]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    },
    [handleClose]
  );

  useEffect(() => {
    if (skill) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [skill, handleKeyDown]);

  if (!skill) return null;

  const formattedDate = formatDate(skill.updatedAt || skill.importedAt);
  const formattedSize = formatSize(skill.size);

  return (
    <aside
      className={[styles.panel, isClosing && styles.closing].filter(Boolean).join(' ')}
      aria-label="Skill details"
    >
      <header className={styles.header}>
        <h2 className={styles.title}>{skill.name.replace(/^["']|["']$/g, '')}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close details"
        >
          <X size={20} />
        </button>
      </header>

      <div className={styles.content}>
        <section className={styles.metadata}>
          <div className={styles.metaItem}>
            <Clock size={14} />
            <span>{formattedDate}</span>
          </div>
          <div className={styles.metaItem}>
            <FileText size={14} />
            <span>{formattedSize}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.fileCount}>{skill.fileCount} files</span>
          </div>
        </section>

        {skill.deployments.length > 0 && (
          <section className={styles.deployments}>
            <h3 className={styles.sectionTitle}>
              <Rocket size={14} weight="fill" />
              <span>Deployments</span>
            </h3>
            <ul className={styles.deploymentList}>
              {skill.deployments.map((dep) => (
                <li key={dep.id} className={styles.deploymentItem}>
                  <span className={styles.deploymentTarget}>
                    {dep.targetScope === 'global' ? 'Global' : dep.projectName || 'Project'}
                  </span>
                  <span className={styles.deploymentDate}>
                    {formatDate(dep.deployedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.markdown}>
          <h3 className={styles.sectionTitle}>
            <FileText size={14} />
            <span>SKILL.md</span>
          </h3>
          <div className={styles.markdownContent}>
            {skillMdContent ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    if (isInline) {
                      return (
                        <code className={styles.inlineCode} {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className={styles.codeBlock}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    );
                  },
                }}
              >
                {skillMdContent}
              </ReactMarkdown>
            ) : (
              <p className={styles.emptyMarkdown}>No SKILL.md content available</p>
            )}
          </div>
        </section>

        {resources.length > 0 && (
          <section className={styles.resources}>
            <h3 className={styles.sectionTitle}>
              <FolderOpen size={14} />
              <span>Resources</span>
            </h3>
            <ul className={styles.resourceList}>
              {resources.map((resource) => (
                <li key={resource.path} className={styles.resourceItem}>
                  {resource.type === 'directory' ? (
                    <FolderOpen size={14} />
                  ) : (
                    <FileText size={14} />
                  )}
                  <span className={styles.resourceName}>{resource.name}</span>
                  <span className={styles.resourceSize}>{formatSize(resource.size)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.exportButton}
          onClick={() => onExport?.(skill.id)}
        >
          <Export size={16} />
          <span>Export</span>
        </button>
        <button
          type="button"
          className={styles.deployButton}
          onClick={() => onDeploy?.(skill)}
        >
          <Rocket size={16} />
          <span>Deploy</span>
        </button>
      </footer>
    </aside>
  );
}
