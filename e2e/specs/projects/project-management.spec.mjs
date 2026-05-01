import { expect } from '@wdio/globals';
import { TIMEOUTS, TEST_PREFIX } from '../../config/constants.mjs';
import * as wait from '../../helpers/wait.helper.mjs';
import * as tauri from '../../helpers/tauri.helper.mjs';
import { TestDataManager } from '../../fixtures/test-data.helper.mjs';

/**
 * PRJ-01: Add a new project
 */
describe('Projects - PRJ-01: Add new project', () => {
  const dataManager = new TestDataManager();
  let projectDir;

  before(async () => {
    await dataManager.captureInitialState();
    projectDir = await dataManager.createTestProject('add-project');
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should add a project and verify it appears in the project list', async () => {
    const result = await tauri.invoke('project_add', { path: projectDir });
    expect(result.success).toBe(true);

    if (result.success && result.data) {
      dataManager.trackProjectId(result.data.id);
    }

    // Verify via IPC that the project exists
    const projects = await tauri.getProjects();
    const found = projects.some(
      (p) => p.name?.includes(`${TEST_PREFIX}add-project`) || p.path === projectDir
    );
    expect(found).toBe(true);
  });
});

/**
 * PRJ-02: Delete a project
 */
describe('Projects - PRJ-02: Delete project', () => {
  const dataManager = new TestDataManager();
  let projectId;

  before(async () => {
    await dataManager.captureInitialState();

    // Create and add a test project
    const projectDir = await dataManager.createTestProject('delete-project');
    const result = await tauri.invoke('project_add', { path: projectDir });
    if (result.success && result.data) {
      projectId = result.data.id;
      dataManager.trackProjectId(projectId);
    }
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should remove a project and verify it no longer appears', async () => {
    expect(projectId).toBeTruthy();

    const result = await tauri.removeProject(projectId);
    expect(result.success).toBe(true);

    // Verify via IPC
    const projects = await tauri.getProjects();
    const stillExists = projects.some((p) => p.id === projectId);
    expect(stillExists).toBe(false);
  });
});

/**
 * PRJ-03: View project skills
 */
describe('Projects - PRJ-03: View project skills', () => {
  const dataManager = new TestDataManager();
  let projectId;

  before(async () => {
    await dataManager.captureInitialState();

    // Create a test project and add it
    const projectDir = await dataManager.createTestProject('view-skills');
    const addResult = await tauri.invoke('project_add', { path: projectDir });
    if (addResult.success && addResult.data) {
      projectId = addResult.data.id;
      dataManager.trackProjectId(projectId);
    }
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should list skills for a project', async () => {
    // Skip if project creation failed
    if (!projectId) {
      console.warn('Skipping test: project was not created successfully');
      return;
    }

    // Get project skills via IPC (projectId is the project's id)
    const result = await tauri.invoke('project_skills', { projectId });
    // The project may have no skills, which is fine — just verify the call succeeds
    expect(result.success).toBe(true);
  });
});
