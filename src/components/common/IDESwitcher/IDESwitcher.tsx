import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { useIDEStore, useUIStore } from '@/stores';
import { useIDEConfig } from '@/hooks/useIDEConfig';
import { useIDESwitcher } from '@/hooks/useIDESwitcher';
import { useIDEIcon } from '@/hooks/useIDEIcon';
import { AddIDEDialog } from '@/components/features/IDEDialog';
import styles from './IDESwitcher.module.scss';

export function IDESwitcher(): React.ReactElement | null {
  const { ideConfigs, activeIdeId } = useIDEConfig();
  const { handleIDESwitch } = useIDESwitcher();
  const { getIcon } = useIDEIcon();
  const { addIDE: addIDEToStore } = useIDEStore();
  const { showToast } = useUIStore();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddIDE = (newIDE: typeof ideConfigs[0]) => {
    addIDEToStore(newIDE);
    showToast('success', `Added ${newIDE.name}`);
  };

  if (ideConfigs.length === 0) {
    return null;
  }

  return (
    <>
      <div className={styles.switcher}>
        {ideConfigs.map((ide) => (
          <button
            key={ide.id}
            className={`${styles.tab} ${activeIdeId === ide.id ? styles.active : ''} ${!ide.isEnabled ? styles.disabled : ''}`}
            onClick={() => handleIDESwitch(ide.id)}
            title={ide.name}
          >
            <div className={styles.iconWrapper}>{getIcon(ide.icon || ide.id)}</div>
          </button>
        ))}
        <button
          className={styles.addTab}
          onClick={() => setShowAddDialog(true)}
          title="Add Custom IDE"
        >
          <div className={styles.iconWrapper}>
            <Plus size={14} />
          </div>
        </button>
      </div>

      <AddIDEDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddIDE}
      />
    </>
  );
}
