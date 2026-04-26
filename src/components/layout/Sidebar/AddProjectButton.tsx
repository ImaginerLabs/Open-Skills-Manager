import { Plus } from '@phosphor-icons/react';
import styles from './AddProjectButton.module.scss';

export interface AddProjectButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AddProjectButton({
  onClick,
  disabled = false,
}: AddProjectButtonProps): React.ReactElement {
  return (
    <button
      className={styles.addButton}
      onClick={onClick}
      disabled={disabled}
      aria-label="Add project"
    >
      <Plus size={16} />
      <span>Add project</span>
    </button>
  );
}
