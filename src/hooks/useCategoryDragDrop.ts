import { useState, useCallback } from 'react';

interface DragState {
  categoryId: string;
  groupId?: string | undefined;
  skillId: string;
  skillName: string;
}

interface UseDragDropResult {
  dragOverState: DragState | null;
  handleDragOver: (e: React.DragEvent, categoryId: string, groupId?: string) => void;
  handleDragLeave: () => void;
  handleDrop: (
    e: React.DragEvent,
    categoryId: string,
    groupId?: string
  ) => Promise<void>;
}

export function useCategoryDragDrop(
  onOrganizeSkill?: (skillId: string, categoryId: string | null, groupId?: string) => Promise<void>
): UseDragDropResult {
  const [dragOverState, setDragOverState] = useState<DragState | null>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent, categoryId: string, groupId?: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverState({ categoryId, groupId, skillId: '', skillName: '' });
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverState(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, categoryId: string, groupId?: string) => {
      e.preventDefault();
      setDragOverState(null);

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const { skillId } = JSON.parse(data) as { skillId: string; skillName: string };
        await onOrganizeSkill?.(skillId, categoryId, groupId);
      } catch (error) {
        console.error('Failed to organize skill:', error);
      }
    },
    [onOrganizeSkill]
  );

  return {
    dragOverState,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
