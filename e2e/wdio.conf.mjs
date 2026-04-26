import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the Tauri debug binary
const APP_BIN = process.env.TAURI_APP_PATH || path.resolve(__dirname, '../src-tauri/target/debug/claude-code-skills-manager');

export const config = {
  runner: 'local',
  port: 4444,
  specs: ['./specs/**/*.spec.mjs'],
  maxInstances: 1,

  capabilities: [{
    'tauri:options': {
      application: APP_BIN,
    },
  }],

  logLevel: 'warn',
  waitforTimeout: 5000,
  connectionRetryTimeout: 30000,
  connectionRetryCount: 1,

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 30000,
  },

  // Automatically start the Tauri dev server before tests
  onPrepare: async function () {
    // Ensure the dev server is running (port 1420)
    const devServerRunning = await checkDevServer();
    if (!devServerRunning) {
      console.warn('Warning: Dev server not detected on port 1420. Tests may fail.');
      console.warn('Run `pnpm dev` in a separate terminal before starting tests.');
    }
  },
};

async function checkDevServer() {
  try {
    const response = await fetch('http://127.0.0.1:1420');
    return response.ok;
  } catch {
    return false;
  }
}
