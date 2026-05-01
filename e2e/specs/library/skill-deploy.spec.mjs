import { expect } from '@wdio/globals';
import { TIMEOUTS, TEST_PREFIX } from '../../config/constants.mjs';
import * as wait from '../../helpers/wait.helper.mjs';
import * as tauri from '../../helpers/tauri.helper.mjs';
import { TestDataManager } from '../../fixtures/test-data.helper.mjs';
import { LibraryPage } from '../../pageobjects/library.page.mjs';
import { GlobalPage } from '../../pageobjects/global.page.mjs';
import { DialogComponent } from '../../pageobjects/components/dialog.component.mjs';
import { ToastComponent } from '../../pageobjects/components/toast.component.mjs';

const dialog = new DialogComponent();
const toast = new ToastComponent();

/**
 * DEP-01: Deploy skill to Global
 */
describe('Library - Skill Deploy - DEP-01: Deploy to Global', () => {
  const libraryPage = new LibraryPage();
  const globalPage = new GlobalPage();
  const dataManager = new TestDataManager();
  let skillDir;
  let skillId;

  before(async () => {
    await dataManager.captureInitialState();

    // Create and import a test skill
    skillDir = await dataManager.createTestSkill('deploy-global', {
      content: '# e2e-test-deploy-global\n\nSkill for deploy-to-global test.',
    });
    const result = await tauri.invoke('library_import', { path: skillDir });
    if (result.success && result.data) {
      skillId = result.data.id;
      dataManager.trackSkillId(skillId);
    }
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should deploy a library skill to global and show it in Global list', async () => {
    // Deploy via IPC (bypasses deploy dialog file selection)
    const result = await tauri.invoke('deploy_to_global', {
      skillId,
    });
    expect(result.success).toBe(true);

    // Navigate to Global page and verify
    await globalPage.open();
    await globalPage.waitForSkillsToLoad();

    const hasSkill = await globalPage.hasSkillNamed(`${TEST_PREFIX}deploy-global`);
    expect(hasSkill).toBe(true);

    // Track for cleanup (find the newly deployed skill)
    const globalSkills = await tauri.getGlobalSkills();
    const deployed = globalSkills.find((s) => s.name?.includes(`${TEST_PREFIX}deploy-global`));
    if (deployed) {
      dataManager.trackGlobalSkillId(deployed.id);
    }
  });
});

/**
 * DEP-02: Deploy skill to Project
 */
describe('Library - Skill Deploy - DEP-02: Deploy to Project', () => {
  const libraryPage = new LibraryPage();
  const dataManager = new TestDataManager();
  let skillDir;
  let skillId;
  let projectDir;
  let projectId;
  let projectPath;

  before(async () => {
    await dataManager.captureInitialState();

    // Create and import a test skill
    skillDir = await dataManager.createTestSkill('deploy-project', {
      content: '# e2e-test-deploy-project\n\nSkill for deploy-to-project test.',
    });
    const importResult = await tauri.invoke('library_import', { path: skillDir });
    if (importResult.success && importResult.data) {
      skillId = importResult.data.id;
      dataManager.trackSkillId(skillId);
    }

    // Create a test project
    projectDir = await dataManager.createTestProject('deploy-target-project');
    const projectResult = await tauri.invoke('project_add', { path: projectDir });
    if (projectResult.success && projectResult.data) {
      projectId = projectResult.data.id;
      projectPath = projectResult.data.path; // Backend expects project path, not UUID
      dataManager.trackProjectId(projectId);
    }
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should deploy a library skill to a project', async () => {
    // Note: deploy_to_project expects project_id to be the project PATH, not UUID
    const result = await tauri.invoke('deploy_to_project', {
      skillId,
      projectId: projectPath,
    });
    expect(result.success).toBe(true);
  });
});

/**
 * DEP-03: Cancel deploy
 */
describe('Library - Skill Deploy - DEP-03: Cancel deploy', () => {
  const libraryPage = new LibraryPage();
  const dataManager = new TestDataManager();
  let skillId;

  before(async () => {
    await dataManager.captureInitialState();

    // Create and import a test skill
    const skillDir = await dataManager.createTestSkill('deploy-cancel', {
      content: '# e2e-test-deploy-cancel\n\nSkill for cancel deploy test.',
    });
    const result = await tauri.invoke('library_import', { path: skillDir });
    if (result.success && result.data) {
      skillId = result.data.id;
      dataManager.trackSkillId(skillId);
    }

    await libraryPage.open();
    await libraryPage.waitForLoad();
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should open and close deploy target dialog without changes', async () => {
    // Open deploy dialog via the skill card menu (find by name to ensure correct skill)
    await libraryPage.waitForSkillsToLoad();
    const card = await libraryPage.getSkillByName(`${TEST_PREFIX}deploy-cancel`);
    await card.clickDeploy();

    await dialog.waitForDeployTargetDialog();
    const isOpen = await dialog.isOpen('deploy-target-dialog');
    expect(isOpen).toBe(true);

    // Close the dialog
    await dialog.closeDialog('deploy-target-dialog');
    await wait.waitForElementGone('[data-testid="deploy-target-dialog"]', TIMEOUTS.medium);

    const isGone = await dialog.isOpen('deploy-target-dialog');
    expect(isGone).toBe(false);
  });
});
