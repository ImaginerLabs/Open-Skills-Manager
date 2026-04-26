import type { CSSProperties } from 'react';
import type { LibrarySkill } from '../../stores/libraryStore';
import { SkillCard } from '../../components/features/SkillCard';

interface SkillCellProps {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
  filteredSkills: LibrarySkill[];
  columnCount: number;
  selectedSkillId: string | undefined;
  onSelect: (skill: LibrarySkill) => void;
  onDelete: (skillId: string) => void;
  onExport: (skillId: string) => void;
  onDeploy: (skill: LibrarySkill) => void;
}

export function SkillCell({
  columnIndex,
  rowIndex,
  style,
  filteredSkills,
  columnCount,
  selectedSkillId,
  onSelect,
  onDelete,
  onExport,
  onDeploy,
}: SkillCellProps): React.ReactElement | null {
  const index = rowIndex * columnCount + columnIndex;
  const skill = filteredSkills[index];
  if (!skill) return null;

  return (
    <div style={style}>
      <SkillCard
        skill={skill}
        isSelected={selectedSkillId === skill.id}
        onSelect={onSelect}
        onDelete={onDelete}
        onExport={onExport}
        onDeploy={onDeploy}
      />
    </div>
  );
}
