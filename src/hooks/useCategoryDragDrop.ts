import { useState, useCallback } from 'react';

interface DragState {
  groupId: string;
  categoryId?: string | undefined;
  skillId: string;
  skillName: string;
}

interface UseDragDropResult {
  dragOverState: DragState | null;
  handleDragOver: (e: React.DragEvent, groupId: string, categoryId?: string) => void;
  handleDragLeave: () => void;
  handleDrop: (
    e: React.DragEvent,
    groupId: string,
    categoryId?: string
  ) => Promise<void>;
}

export function useCategoryDragDrop(
  onOrganizeSkill?: (skillId: string, groupId: string | null, categoryId?: string) => Promise<void>
): UseDragDropResult {
  const [dragOverState, setDragOverState] = useState<DragState | null>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent, groupId: string, categoryId?: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverState({ groupId, categoryId, skillId: '', skillName: '' });
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverState(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, groupId: string, categoryId?: string) => {
      e.preventDefault();
      setDragOverState(null);

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const { skillId } = JSON.parse(data) as { skillId: string; skillName: string };
        await onOrganizeSkill?.(skillId, groupId, categoryId);
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