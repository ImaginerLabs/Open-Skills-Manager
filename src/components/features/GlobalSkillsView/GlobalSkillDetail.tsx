import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X, FileText, Clock, Tag, ArrowDown } from '@phosphor-icons/react';
import type { GlobalSkill } from '../../../stores/globalStore';
import { formatSize, formatDate } from '../../../utils/formatters';
import styles from './GlobalSkillsView.module.scss';

export interface GlobalSkillDetailProps {
  skill: GlobalSkill | null;
  skillMdContent?: string;
  onClose?: () => void;
  onPull?: (skill: GlobalSkill) => void;
}

export function GlobalSkillDetail({
  skill,
  skillMdContent = '',
  onClose,
  onPull,
}: GlobalSkillDetailProps): React.ReactElement | null {
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

  const formattedDate = skill.installedAt ? formatDate(skill.installedAt) : 'Unknown';
  const formattedSize = formatSize(skill.size);

  return (
    <aside
      className={[styles.detailPanel, isClosing && styles.closing].filter(Boolean).join(' ')}
      aria-label="Global skill details"
    >
      <header className={styles.detailHeader}>
        <h2 className={styles.detailTitle}>{skill.name}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close details"
        >
          <X size={20} />
        </button>
      </header>

      <div className={styles.detailContent}>
        <section className={styles.metadata}>
          <div className={styles.metaItem}>
            <Tag size={14} />
            <span>v{skill.version}</span>
          </div>
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
      </div>

      <footer className={styles.detailFooter}>
        <button
          type="button"
          className={styles.pullButton}
          onClick={() => onPull?.(skill)}
        >
          <ArrowDown size={16} />
          <span>Pull to Library</span>
        </button>
      </footer>
    </aside>
  );
}
