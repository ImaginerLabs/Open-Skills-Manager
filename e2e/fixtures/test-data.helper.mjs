import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { TEST_PREFIX } from '../config/constants.mjs';
import * as tauri from '../helpers/tauri.helper.mjs';

/**
 * TestDataManager - ensures test data is created with a known prefix
 * and fully cleaned up after each test, even if individual deletions fail.
 */
export class TestDataManager {
  constructor() {
    this._skillIds = [];
    this._globalSkillIds = [];
    this._projectIds = [];
    this._deployedPaths = [];
    this._tempDirs = [];
    this._initialState = null;
  }

  /**
   * Internal IPC invoke proxy.
   */
  async _invoke(command, args = {}) {
    return tauri.invoke(command, args);
  }

  // ── State snapshot ──────────────────────────────────────────────

  /**
   * Record the initial state of Library skills, Global skills, and projects.
   * Call this in before() / beforeAll() to enable restoreToInitialState().
   */
  async captureInitialState() {
    const [librarySkills, globalSkills, projects] = await Promise.all([
      tauri.getLibrarySkills().catch(() => []),
      tauri.getGlobalSkills().catch(() => []),
      tauri.getProjects().catch(() => []),
    ]);

    this._initialState = {
      librarySkillIds: new Set(librarySkills.map((s) => s.id)),
      globalSkillIds: new Set(globalSkills.map((s) => s.id)),
      projectIds: new Set(projects.map((p) => p.id)),
    };
  }

  // ── Test data creation ─────────────────────────────────────────

  /**
   * Create a test skill folder with SKILL.md in a temp directory.
   * Returns the folder path.
   */
  async createTestSkill(name, options = {}) {
    const skillName = `${TEST_PREFIX}${name}`;
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `${TEST_PREFIX}skill-`));
    this._tempDirs.push(tempDir);

    const skillDir = path.join(tempDir, skillName);
    await fs.promises.mkdir(skillDir, { recursive: true });

    const content = options.content || `# ${skillName}\n\nTest skill for E2E.`;
    await fs.promises.writeFile(path.join(skillDir, 'SKILL.md'), content, 'utf-8');

    return skillDir;
  }

  /**
   * Create an invalid skill folder (missing SKILL.md).
   * Returns the folder path.
   */
  async createInvalidSkill(name) {
    const skillName = `${TEST_PREFIX}${name}`;
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `${TEST_PREFIX}invalid-`));
    this._tempDirs.push(tempDir);

    const skillDir = path.join(tempDir, skillName);
    await fs.promises.mkdir(skillDir, { recursive: true });

    // Intentionally no SKILL.md
    await fs.promises.writeFile(path.join(skillDir, 'README.md'), 'Invalid skill', 'utf-8');

    return skillDir;
  }

  /**
   * Create a test project directory.
   * Returns the directory path.
   */
  async createTestProject(name) {
    const projectName = `${TEST_PREFIX}${name}`;
    // Create a temp directory first
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `${TEST_PREFIX}project-`));

    // Create the actual project directory with the desired name inside temp
    const projectDir = path.join(tempDir, projectName);
    await fs.promises.mkdir(projectDir, { recursive: true });

    // Create a minimal .claude directory to look like a real project
    const claudeDir = path.join(projectDir, '.claude');
    await fs.promises.mkdir(claudeDir, { recursive: true });
    await fs.promises.writeFile(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify({ projectName }),
      'utf-8'
    );

    // Track both directories for cleanup
    this._tempDirs.push(tempDir);
    return projectDir;
  }

  // ── Tracking ───────────────────────────────────────────────────

  /**
   * Track a Library skill ID for later cleanup.
   */
  trackSkillId(skillId) {
    this._skillIds.push(skillId);
  }

  /**
   * Track a Global skill ID for later cleanup.
   */
  trackGlobalSkillId(skillId) {
    this._globalSkillIds.push(skillId);
  }

  /**
   * Track a project ID for later cleanup.
   */
  trackProjectId(projectId) {
    this._projectIds.push(projectId);
  }

  /**
   * Track a deployed file path for later cleanup.
   */
  trackDeployedPath(filePath) {
    this._deployedPaths.push(filePath);
  }

  // ── Cleanup ────────────────────────────────────────────────────

  /**
   * Full cleanup: delete all tracked data + temp dirs.
   * Each deletion is independent — failures do not block others.
   */
  async cleanup() {
    const errors = [];

    // Delete tracked Library skills
    for (const id of this._skillIds) {
      try {
        await tauri.deleteLibrarySkill(id);
      } catch (e) {
        errors.push(`deleteLibrarySkill(${id}): ${e.message}`);
      }
    }

    // Delete tracked Global skills
    for (const id of this._globalSkillIds) {
      try {
        await tauri.deleteGlobalSkill(id);
      } catch (e) {
        errors.push(`deleteGlobalSkill(${id}): ${e.message}`);
      }
    }

    // Remove tracked projects
    for (const id of this._projectIds) {
      try {
        await tauri.removeProject(id);
      } catch (e) {
        errors.push(`removeProject(${id}): ${e.message}`);
      }
    }

    // Delete deployed paths
    for (const filePath of this._deployedPaths) {
      try {
        await fs.promises.rm(filePath, { recursive: true, force: true });
      } catch (e) {
        errors.push(`rm(${filePath}): ${e.message}`);
      }
    }

    // Clean temp directories
    for (const dir of this._tempDirs) {
      try {
        await fs.promises.rm(dir, { recursive: true, force: true });
      } catch (e) {
        errors.push(`rm(${dir}): ${e.message}`);
      }
    }

    // Reset tracking arrays
    this._skillIds = [];
    this._globalSkillIds = [];
    this._projectIds = [];
    this._deployedPaths = [];
    this._tempDirs = [];

    if (errors.length > 0) {
      console.warn('TestDataManager.cleanup() encountered errors:', errors);
    }
  }

  /**
   * Restore to the state recorded by captureInitialState().
   * Deletes any Library skills, Global skills, or projects that
   * were not present at capture time.
   */
  async restoreToInitialState() {
    if (!this._initialState) {
      console.warn('restoreToInitialState: no initial state captured, skipping');
      return;
    }

    const errors = [];

    try {
      const [librarySkills, globalSkills, projects] = await Promise.all([
        tauri.getLibrarySkills().catch(() => []),
        tauri.getGlobalSkills().catch(() => []),
        tauri.getProjects().catch(() => []),
      ]);

      // Remove Library skills not in initial state
      for (const skill of librarySkills) {
        if (!this._initialState.librarySkillIds.has(skill.id)) {
          try {
            await tauri.deleteLibrarySkill(skill.id);
          } catch (e) {
            errors.push(`restore: deleteLibrarySkill(${skill.id}): ${e.message}`);
          }
        }
      }

      // Remove Global skills not in initial state
      for (const skill of globalSkills) {
        if (!this._initialState.globalSkillIds.has(skill.id)) {
          try {
            await tauri.deleteGlobalSkill(skill.id);
          } catch (e) {
            errors.push(`restore: deleteGlobalSkill(${skill.id}): ${e.message}`);
          }
        }
      }

      // Remove projects not in initial state
      for (const project of projects) {
        if (!this._initialState.projectIds.has(project.id)) {
          try {
            await tauri.removeProject(project.id);
          } catch (e) {
            errors.push(`restore: removeProject(${project.id}): ${e.message}`);
          }
        }
      }
    } catch (e) {
      errors.push(`restore: ${e.message}`);
    }

    if (errors.length > 0) {
      console.warn('TestDataManager.restoreToInitialState() encountered errors:', errors);
    }
  }

  /**
   * Verify no test-prefixed data remains.
   * Throws if any e2e-test- prefixed items are found.
   */
  async verifyCleanup() {
    const [librarySkills, globalSkills, projects] = await Promise.all([
      tauri.getLibrarySkills().catch(() => []),
      tauri.getGlobalSkills().catch(() => []),
      tauri.getProjects().catch(() => []),
    ]);

    const leaking = [];

    for (const s of librarySkills) {
      if (s.name?.startsWith(TEST_PREFIX)) leaking.push(`Library skill: ${s.name}`);
    }
    for (const s of globalSkills) {
      if (s.name?.startsWith(TEST_PREFIX)) leaking.push(`Global skill: ${s.name}`);
    }
    for (const p of projects) {
      if (p.name?.startsWith(TEST_PREFIX)) leaking.push(`Project: ${p.name}`);
    }

    if (leaking.length > 0) {
      throw new Error(`Test data leak detected:\n${leaking.join('\n')}`);
    }
  }
}
