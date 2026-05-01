// Global constants for E2E tests

export const TEST_PREFIX = 'e2e-test-';

export const TIMEOUTS = {
  short: 3000,
  medium: 5000,
  long: 10000,
  extraLong: 30000,
};

export const SELECTORS = {
  root: '#root',
  sidebar: '[data-testid="sidebar"]',
  mainContent: '[data-testid="main-content"]',
  searchInput: '[data-testid="search-input"]',
  toast: '[data-testid="toast"]',
  toastMessage: '[data-testid="toast-message"]',
  navItem: '[data-testid="nav-item"]',
  skillCard: '[data-testid="skill-card"]',
  modal: '[data-testid="modal"]',
  modalConfirm: '[data-testid="modal-confirm"]',
  modalCancel: '[data-testid="modal-cancel"]',

  // Library page
  library: {
    skillList: '[data-testid="skill-list"]',
    skillItem: '[data-testid="skill-item"]',
    conflictBanner: '[data-testid="conflict-banner"]',
    conflictDialog: '[data-testid="conflict-dialog"]',
    resolveLocalBtn: '[data-testid="resolve-local-btn"]',
    resolveRemoteBtn: '[data-testid="resolve-remote-btn"]',
    resolveBothBtn: '[data-testid="resolve-both-btn"]',
  },
};

export const ROUTES = {
  library: '/library',
  global: '/global',
  settings: '/settings',
};
