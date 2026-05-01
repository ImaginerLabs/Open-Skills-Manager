import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the Tauri debug binary
const APP_BIN = process.env.TAURI_APP_PATH || path.resolve(__dirname, '../src-tauri/target/debug/claude-code-skills-manager');

// Screenshot output directory for failed tests
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');

export const config = {
  runner: 'local',
  port: 4444,
  // Group all specs in a single array to run sequentially in one session
  // This prevents tauri-webdriver from killing the app between spec files
  specs: [
    [
      './specs/smoke.spec.mjs',
      './specs/library/skill-list.spec.mjs',
      './specs/library/skill-import.spec.mjs',
      './specs/library/skill-deploy.spec.mjs',
      './specs/library/skill-export.spec.mjs',
      './specs/global/global-skills.spec.mjs',
      './specs/projects/project-management.spec.mjs',
      './specs/settings/settings.spec.mjs',
    ]
  ],
  maxInstances: 1,

  capabilities: [{
    'tauri:options': {
      application: APP_BIN,
    },
  }],

  logLevel: process.env.LOG_LEVEL || 'warn',
  waitforTimeout: 10000,
  connectionRetryTimeout: 30000,
  connectionRetryCount: 3,

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    retries: process.env.CI ? 2 : 1,
  },

  // Automatically start the Tauri dev server before tests
  onPrepare: async function () {
    // Clear persisted Zustand stores from WKWebView localStorage SQLite
    // This prevents stale selectedCategoryId from filtering skills to empty
    await clearTauriLocalStorage();

    // Ensure the dev server is running (port 1420)
    const devServerRunning = await checkDevServer();
    if (!devServerRunning) {
      console.warn('Warning: Dev server not detected on port 1420. Tests may fail.');
      console.warn('Run `pnpm dev` in a separate terminal before starting tests.');
    }
  },

  // Take screenshot on test failure
  afterTest: async function (test, context, { error, result, duration, passed }) {
    if (!passed) {
      // Ensure screenshot directory exists
      if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      // Safely access test.fullTitle - may be undefined in some test frameworks
      const fullTitle = test?.fullTitle ?? test?.title ?? 'unknown-test';
      const safeName = fullTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 80);
      const filepath = path.join(SCREENSHOT_DIR, `${safeName}_${timestamp}.png`);

      try {
        await browser.saveScreenshot(filepath);
        console.log(`Screenshot saved: ${filepath}`);
      } catch (e) {
        console.warn(`Failed to take screenshot: ${e.message}`);
      }
    }
  },

  onComplete: async function () {
    // Placeholder for any global teardown logic
  },
};

async function checkDevServer() {
  try {
    const response = await fetch('http://localhost:1420');
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clear Tauri app's WKWebView localStorage SQLite database.
 * Zustand persist stores (library-storage, ui-storage, etc.) are stored here.
 * Removing this ensures each test run starts with clean state.
 */
async function clearTauriLocalStorage() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  if (!homeDir) return;

  const appIdentifier = 'com.alex.openskillsmanager';
  const webkitDataDir = path.join(homeDir, 'Library', 'WebKit', appIdentifier, 'WebsiteData');

  if (!fs.existsSync(webkitDataDir)) {
    return;
  }

  // Find all localstorage.sqlite3 files under the WebKit data directory
  const findDbFiles = (dir) => {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findDbFiles(fullPath));
      } else if (entry.name === 'localstorage.sqlite3') {
        files.push(fullPath);
      }
    }
    return files;
  };

  try {
    const dbFiles = findDbFiles(webkitDataDir);
    for (const dbFile of dbFiles) {
      fs.unlinkSync(dbFile);
      // Also remove WAL and SHM files if they exist
      const walFile = dbFile + '-wal';
      const shmFile = dbFile + '-shm';
      if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
      if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
      console.log(`Cleared localStorage: ${dbFile}`);
    }
  } catch (e) {
    console.warn(`Failed to clear localStorage: ${e.message}`);
  }
}
