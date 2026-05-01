import { expect } from '@wdio/globals';
import { TIMEOUTS, TEST_PREFIX } from '../../config/constants.mjs';
import * as wait from '../../helpers/wait.helper.mjs';
import * as tauri from '../../helpers/tauri.helper.mjs';
import { TestDataManager } from '../../fixtures/test-data.helper.mjs';
import { GlobalPage } from '../../pageobjects/global.page.mjs';
import { ToastComponent } from '../../pageobjects/components/toast.component.mjs';

const toast = new ToastComponent();

/**
 * GLB-01: View Global skills list
 */
describe('Global - GLB-01: View Global skills list', () => {
  const globalPage = new GlobalPage();

  before(async () => {
    await globalPage.open();
  });

  it('should load the Global page and display either skills or empty state', async () => {
    await globalPage.waitForSkillsToLoad();

    const count = await globalPage.getSkillCount();
    const hasEmpty = await globalPage.isDisplayed('[data-testid="empty-state"]');
    expect(count > 0 || hasEmpty).toBe(true);
  });
});

/**
 * GLB-02: Refresh Global skills
 */
describe('Global - GLB-02: Refresh Global skills', () => {
  const globalPage = new GlobalPage();

  before(async () => {
    await globalPage.open();
    await globalPage.waitForLoad();
  });

  it('should refresh the Global skills list', async () => {
    await globalPage.refreshSkills();

    // Wait for toast or skills to reload
    await browser.waitUntil(
      async () => {
        const msg = await toast.getMessage();
        return msg !== null;
      },
      { timeout: TIMEOUTS.medium, timeoutMsg: 'Toast did not appear after refresh' }
    );

    const msg = await toast.getMessage();
    expect(msg).toBeTruthy();
  });
});

/**
 * GLB-03: Delete a Global skill
 */
describe('Global - GLB-03: Delete Global skill', () => {
  const globalPage = new GlobalPage();
  const dataManager = new TestDataManager();
  let deployedSkillId;

  before(async () => {
    await dataManager.captureInitialState();

    // Import a skill to Library first
    const skillDir = await dataManager.createTestSkill('global-delete', {
      content: '# e2e-test-global-delete\n\nSkill for global delete test.',
    });
    const importResult = await tauri.invoke('library_import', { path: skillDir });
    if (importResult.success && importResult.data) {
      dataManager.trackSkillId(importResult.data.id);

      // Deploy to Global
      const deployResult = await tauri.invoke('deploy_to_global', {
        skillId: importResult.data.id,
      });
      if (deployResult.success) {
        // Find the deployed skill in Global list
        const globalSkills = await tauri.getGlobalSkills();
        const deployed = globalSkills.find((s) => s.name?.includes(`${TEST_PREFIX}global-delete`));
        if (deployed) {
          deployedSkillId = deployed.id;
          dataManager.trackGlobalSkillId(deployedSkillId);
        }
      }
    }

    await globalPage.open();
    await globalPage.waitForLoad();
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should delete a Global skill and verify it is removed', async () => {
    if (!deployedSkillId) {
      // Skip if setup failed (e.g. deploy didn't produce a skill)
      return;
    }

    const result = await tauri.deleteGlobalSkill(deployedSkillId);
    expect(result.success).toBe(true);

    // Verify in UI
    await globalPage.open();
    await globalPage.waitForSkillsToLoad();

    const names = await globalPage.getSkillNames();
    const stillExists = names.some((n) => n.includes(`${TEST_PREFIX}global-delete`));
    expect(stillExists).toBe(false);
  });
});
