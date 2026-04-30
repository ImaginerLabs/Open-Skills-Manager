import { useState, useCallback } from 'react';
import { ALL_GROUP_ID } from '../components/features/CategoryManager/CategoryManager';

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

      // Determine if this is a forbidden drop zone (All group or Group level)
      const isForbidden = groupId === ALL_GROUP_ID || categoryId === undefined;

      // Set visual feedback via dropEffect
      e.dataTransfer.dropEffect = isForbidden ? 'none' : 'move';

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

      // Reject drops on Group or All levels - only Category can receive drops
      if (groupId === ALL_GROUP_ID || categoryId === undefined) {
        return;
      }

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