import { TIMEOUTS } from '../../config/constants.mjs';
import * as wait from '../../helpers/wait.helper.mjs';

const SELECTORS = {
  importDialog: '[data-testid="import-dialog"]',
  exportDialog: '[data-testid="export-dialog"]',
  deployTargetDialog: '[data-testid="deploy-target-dialog"]',
  duplicateHandlerDialog: '[data-testid="duplicate-handler-dialog"]',
  confirmButton: '[data-testid="confirm-button"]',
  cancelButton: '[data-testid="confirm-cancel-button"]',
  importConfirmButton: '[data-testid="import-confirm-button"]',
  importCancelButton: '[data-testid="import-cancel-button"]',
  exportConfirmButton: '[data-testid="export-confirm-button"]',
  deployConfirmButton: '[data-testid="deploy-confirm-button"]',
};

export class DialogComponent {
  async waitForDialog(testId, timeout = TIMEOUTS.medium) {
    await wait.waitForElement(`[data-testid="${testId}"]`, timeout);
  }

  async closeDialog(testId) {
    // Click on the overlay backdrop to close the modal
    // The modal structure is: overlay > content, and overlay has onClick handler
    await browser.execute((id) => {
      // Find the dialog content element
      const dialog = document.querySelector(`[data-testid="${id}"]`);
      if (dialog) {
        // The dialog is inside an overlay (parent element)
        // Click on the overlay (parent) to trigger onClose
        const overlay = dialog.parentElement;
        if (overlay) {
          overlay.click();
        }
      }
    }, testId);
    await browser.pause(300);
  }

  async clickConfirm() {
    await browser.execute(() => {
      const el = document.querySelector('[data-testid="confirm-button"]');
      if (el) el.click();
    });
  }

  async clickCancel() {
    await browser.execute(() => {
      const el = document.querySelector('[data-testid="confirm-cancel-button"]');
      if (el) el.click();
    });
  }

  async isOpen(testId) {
    // Use browser.execute to avoid WebDriverIO v9 Node.contains issues in WKWebView
    try {
      const isVisible = await browser.execute((id) => {
        const sel = `[data-testid="${id}"]`;
        const el = document.querySelector(sel);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && el.isConnected;
      }, testId);
      return isVisible;
    } catch {
      return false;
    }
  }

  // Dialog-specific convenience methods

  async waitForImportDialog() {
    await this.waitForDialog('import-dialog');
  }

  async waitForExportDialog() {
    await this.waitForDialog('export-dialog');
  }

  async waitForDeployTargetDialog() {
    await this.waitForDialog('deploy-target-dialog');
  }

  async waitForDuplicateHandlerDialog() {
    await this.waitForDialog('duplicate-handler-dialog');
  }

  async clickImportConfirm() {
    await browser.execute(() => {
      const el = document.querySelector('[data-testid="import-confirm-button"]');
      if (el) el.click();
    });
  }

  async clickImportCancel() {
    await browser.execute(() => {
      const el = document.querySelector('[data-testid="import-cancel-button"]');
      if (el) el.click();
    });
  }

  async clickExportConfirm() {
    await browser.execute(() => {
      const el = document.querySelector('[data-testid="export-confirm-button"]');
      if (el) el.click();
    });
  }

  async clickDeployConfirm() {
    await browser.execute(() => {
      const el = document.querySelector('[data-testid="deploy-confirm-button"]');
      if (el) el.click();
    });
  }
}
