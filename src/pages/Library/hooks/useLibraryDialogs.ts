import { useState, useCallback } from 'react';

interface UseLibraryDialogsResult {
  // Dialog visibility states
  showImportDialog: boolean;
  showExportDialog: boolean;
  showDeployDialog: boolean;
  showCategoryManager: boolean;
  showSkillDetail: boolean;
  showSearchOverlay: boolean;
  showExportProgress: boolean;
  showImportProgress: boolean;

  // Toggle functions
  toggleImportDialog: () => void;
  toggleExportDialog: () => void;
  toggleDeployDialog: () => void;
  toggleCategoryManager: () => void;
  toggleSkillDetail: () => void;
  toggleSearchOverlay: () => void;
  toggleExportProgress: () => void;
  toggleImportProgress: () => void;

  // Explicit set functions
  setImportDialog: (value: boolean) => void;
  setExportDialog: (value: boolean) => void;
  setDeployDialog: (value: boolean) => void;
  setCategoryManager: (value: boolean) => void;
  setSkillDetail: (value: boolean) => void;
  setSearchOverlay: (value: boolean) => void;
  setExportProgress: (value: boolean) => void;
  setImportProgress: (value: boolean) => void;

  // Utility
  closeAllDialogs: () => void;
}

export function useLibraryDialogs(): UseLibraryDialogsResult {
  const [showImportDialog, setImportDialog] = useState(false);
  const [showExportDialog, setExportDialog] = useState(false);
  const [showDeployDialog, setDeployDialog] = useState(false);
  const [showCategoryManager, setCategoryManager] = useState(false);
  const [showSkillDetail, setSkillDetail] = useState(false);
  const [showSearchOverlay, setSearchOverlay] = useState(false);
  const [showExportProgress, setExportProgress] = useState(false);
  const [showImportProgress, setImportProgress] = useState(false);

  const toggleImportDialog = useCallback(() => {
    setImportDialog((prev) => !prev);
  }, []);

  const toggleExportDialog = useCallback(() => {
    setExportDialog((prev) => !prev);
  }, []);

  const toggleDeployDialog = useCallback(() => {
    setDeployDialog((prev) => !prev);
  }, []);

  const toggleCategoryManager = useCallback(() => {
    setCategoryManager((prev) => !prev);
  }, []);

  const toggleSkillDetail = useCallback(() => {
    setSkillDetail((prev) => !prev);
  }, []);

  const toggleSearchOverlay = useCallback(() => {
    setSearchOverlay((prev) => !prev);
  }, []);

  const toggleExportProgress = useCallback(() => {
    setExportProgress((prev) => !prev);
  }, []);

  const toggleImportProgress = useCallback(() => {
    setImportProgress((prev) => !prev);
  }, []);

  const closeAllDialogs = useCallback(() => {
    setImportDialog(false);
    setExportDialog(false);
    setDeployDialog(false);
    setCategoryManager(false);
    setSkillDetail(false);
    setSearchOverlay(false);
    setExportProgress(false);
    setImportProgress(false);
  }, []);

  return {
    // States
    showImportDialog,
    showExportDialog,
    showDeployDialog,
    showCategoryManager,
    showSkillDetail,
    showSearchOverlay,
    showExportProgress,
    showImportProgress,

    // Toggle functions
    toggleImportDialog,
    toggleExportDialog,
    toggleDeployDialog,
    toggleCategoryManager,
    toggleSkillDetail,
    toggleSearchOverlay,
    toggleExportProgress,
    toggleImportProgress,

    // Set functions
    setImportDialog,
    setExportDialog,
    setDeployDialog,
    setCategoryManager,
    setSkillDetail,
    setSearchOverlay,
    setExportProgress,
    setImportProgress,

    // Utility
    closeAllDialogs,
  };
}