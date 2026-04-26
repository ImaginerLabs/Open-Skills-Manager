import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X, FolderOpen, FileText, Clock, Tag, ArrowDown, Trash } from '@phosphor-icons/react';
import type { ProjectSkill } from '../../../stores/projectStore';
import { formatSize, formatDate } from '../../../utils/formatters';
import styles from './ProjectSkillsView.module.scss';

export interface ProjectSkillDetailProps {
  skill: ProjectSkill;
  skillMdContent?: string;
  onClose?: () => void;
  onDelete?: () => void;
  onPull?: () => void;
}

export function ProjectSkillDetail({
  skill,
  skillMdContent = '',
  onClose,
  onDelete,
  onPull,
}: ProjectSkillDetailProps): React.ReactElement | null {
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
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const formattedDate = skill.installedAt ? formatDate(skill.installedAt) : 'Unknown';
  const formattedSize = formatSize(skill.size);

  return (
    <aside
      className={[styles.detailPanel, isClosing && styles.closing].filter(Boolean).join(' ')}
      aria-label="Skill details"
    >
      <header className={styles.detailHeader}>
        <h2 className={styles.detailTitle}>{skill.name}</h2>
        <button
          type="button"
          className={styles.detailCloseButton}
          onClick={handleClose}
          aria-label="Close details"
        >
          <X size={20} />
        </button>
      </header>

      <div className={styles.detailContent}>
        <section className={styles.detailMetadata}>
          <div className={styles.detailMetaItem}>
            <Tag size={14} />
            <span>v{skill.version}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <Clock size={14} />
            <span>{formattedDate}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <FileText size={14} />
            <span>{formattedSize}</span>
          </div>
          <div className={styles.detailMetaItem}>
            <span className={styles.detailFileCount}>{skill.fileCount} files</span>
          </div>
        </section>

        {skill.sourceLibrarySkillId && (
          <section className={styles.detailSource}>
            <h3 className={styles.detailSectionTitle}>
              <FolderOpen size={14} />
              <span>Source</span>
            </h3>
            <p className={styles.detailSourceText}>
              Imported from Library
            </p>
          </section>
        )}

        <section className={styles.detailMarkdown}>
          <h3 className={styles.detailSectionTitle}>
            <FileText size={14} />
            <span>SKILL.md</span>
          </h3>
          <div className={styles.detailMarkdownContent}>
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
                        <code className={styles.detailInlineCode} {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className={styles.detailCodeBlock}
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
              <p className={styles.detailEmptyMarkdown}>No SKILL.md content available</p>
            )}
          </div>
        </section>
      </div>

      <footer className={styles.detailFooter}>
        <button
          type="button"
          className={styles.detailDeleteButton}
          onClick={onDelete}
        >
          <Trash size={16} />
          <span>Delete</span>
        </button>
        <button
          type="button"
          className={styles.detailPullButton}
          onClick={onPull}
        >
          <ArrowDown size={16} />
          <span>Pull to Library</span>
        </button>
      </footer>
    </aside>
  );
}