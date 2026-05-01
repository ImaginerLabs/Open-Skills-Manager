import { expect } from '@wdio/globals';
import { TIMEOUTS, TEST_PREFIX } from '../../config/constants.mjs';
import * as wait from '../../helpers/wait.helper.mjs';
import * as tauri from '../../helpers/tauri.helper.mjs';
import { TestDataManager } from '../../fixtures/test-data.helper.mjs';
import { LibraryPage } from '../../pageobjects/library.page.mjs';
import { DialogComponent } from '../../pageobjects/components/dialog.component.mjs';

const dialog = new DialogComponent();

/**
 * EXP-01: Export a single skill
 *
 * library_export requires a destPath which triggers a Tauri save-file dialog.
 * Since we cannot drive file dialogs via WebDriver, we verify the export
 * dialog opens correctly and shows the expected skill information.
 * The actual export IPC call is validated in unit tests.
 */
describe('Library - Skill Export - EXP-01: Export single skill', () => {
  const libraryPage = new LibraryPage();
  const dataManager = new TestDataManager();
  let skillId;

  before(async () => {
    await dataManager.captureInitialState();

    // Create and import a test skill
    const skillDir = await dataManager.createTestSkill('export-single', {
      content: '# e2e-test-export-single\n\nSkill for export test.',
    });
    const result = await tauri.invoke('library_import', { path: skillDir });
    if (result.success && result.data) {
      skillId = result.data.id;
      dataManager.trackSkillId(skillId);
    }

    // Reload to ensure skill appears in the list
    await browser.execute(() => {
      window.location.reload();
    });
    await browser.pause(1000);
    await libraryPage.open();
    await libraryPage.waitForLoad();
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should open the export dialog with the correct skill name', async () => {
    await libraryPage.waitForSkillsToLoad();

    // Open export dialog via skill card menu (find by name to ensure correct skill)
    const card = await libraryPage.getSkillByName(`${TEST_PREFIX}export-single`);
    await card.clickMenu();

    // Click Export menu item using execute to avoid Node.contains issues
    await browser.execute(() => {
      const items = document.querySelectorAll('[role="menuitem"]');
      for (const item of items) {
        if (item.textContent.includes('Export')) {
          item.click();
          return true;
        }
      }
      return false;
    });

    await dialog.waitForExportDialog();

    // Verify the dialog shows the skill name
    const dialogEl = await $('[data-testid="export-dialog"]');
    const dialogText = await dialogEl.getText();
    expect(dialogText).toContain('Export');
    expect(dialogText).toContain(`${TEST_PREFIX}export-single`);

    // Close the dialog (we cannot complete the export via WebDriver)
    await dialog.closeDialog('export-dialog');
    await wait.waitForElementGone('[data-testid="export-dialog"]', TIMEOUTS.medium);
  });
});

/**
 * EXP-02: Cancel export
 */
describe('Library - Skill Export - EXP-02: Cancel export', () => {
  const libraryPage = new LibraryPage();
  const dataManager = new TestDataManager();
  let skillId;

  before(async () => {
    await dataManager.captureInitialState();

    // Create and import a test skill
    const skillDir = await dataManager.createTestSkill('export-cancel', {
      content: '# e2e-test-export-cancel\n\nSkill for cancel export test.',
    });
    const result = await tauri.invoke('library_import', { path: skillDir });
    if (result.success && result.data) {
      skillId = result.data.id;
      dataManager.trackSkillId(skillId);
    }

    // Reload to ensure skill appears in the list
    await browser.execute(() => {
      window.location.reload();
    });
    await browser.pause(1000);
    await libraryPage.open();
    await libraryPage.waitForLoad();
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should open and close export dialog without exporting', async () => {
    // Open export dialog via skill card menu (find by name to ensure correct skill)
    await libraryPage.waitForSkillsToLoad();
    const card = await libraryPage.getSkillByName(`${TEST_PREFIX}export-cancel`);
    await card.clickMenu();

    // Click Export menu item using execute to avoid Node.contains issues
    await browser.execute(() => {
      const items = document.querySelectorAll('[role="menuitem"]');
      for (const item of items) {
        if (item.textContent.includes('Export')) {
          item.click();
          return true;
        }
      }
      return false;
    });

    await dialog.waitForExportDialog();
    const isOpen = await dialog.isOpen('export-dialog');
    expect(isOpen).toBe(true);

    // Close the dialog
    await dialog.closeDialog('export-dialog');
    await wait.waitForElementGone('[data-testid="export-dialog"]', TIMEOUTS.medium);

    const isGone = await dialog.isOpen('export-dialog');
    expect(isGone).toBe(false);
  });
});
