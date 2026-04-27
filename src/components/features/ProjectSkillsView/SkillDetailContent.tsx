import { type ReactElement } from 'react';
import { FolderOpen } from '@phosphor-icons/react';
import type { ProjectSkill } from '../../../stores/projectStore';
import { formatSize, formatDate } from '../../../utils/formatters';

export interface SkillDetailContentProps {
  skill: ProjectSkill;
  skillMdContent: string;
  styles: Record<string, string>;
}

export function SkillDetailContent({
  skill,
  skillMdContent,
  styles,
}: SkillDetailContentProps): ReactElement {
  const formattedDate = skill.installedAt ? formatDate(skill.installedAt) : 'Unknown';
  const formattedSize = formatSize(skill.size);

  return (
    <>
      <div className={styles.detailMetadata}>
        <div className={styles.detailMetaItem}>
          <span>{formattedDate}</span>
        </div>
        <div className={styles.detailMetaItem}>
          <span>{formattedSize}</span>
        </div>
        <div className={styles.detailMetaItem}>
          <span>{skill.fileCount} files</span>
        </div>
      </div>

      {skill.sourceLibrarySkillId && (
        <div className={styles.detailSource}>
          <h3 className={styles.detailSectionTitle}>
            <FolderOpen size={14} />
            <span>Source</span>
          </h3>
          <p className={styles.detailSourceText}>
            Imported from Library
          </p>
        </div>
      )}

      <div className={styles.detailMarkdown}>
        <pre className={styles.detailMarkdownContent}>
          {skillMdContent || 'No SKILL.md content available'}
        </pre>
      </div>
    </>
  );
}
