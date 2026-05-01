/**
 * Tauri IPC helpers for E2E tests.
 * Calls Tauri commands through the browser's window.__TAURI_INTERNALS__ bridge.
 *
 * IMPORTANT: The backend wraps all responses in IpcResult<T>:
 *   { success: boolean, data?: T, error?: { code: string, message: string } }
 * This helper returns the raw IpcResult, so callers should check result.success.
 */

/**
 * Invoke a Tauri IPC command via the browser context.
 * Returns the raw IpcResult structure from the backend.
 * Uses a synchronous polling approach to handle async Tauri invoke.
 */
export async function invoke(command, args = {}) {
  const maxRetries = 3;
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // Generate a unique callback ID
      const callbackId = `tauri_invoke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Start the invoke and store the promise
      await browser.execute((cmd, a, cid) => {
        window.__TAURI_CALLBACKS__ = window.__TAURI_CALLBACKS__ || {};
        window.__TAURI_CALLBACKS__[cid] = { status: 'pending', result: null };

        window.__TAURI_INTERNALS__.invoke(cmd, a)
          .then((res) => {
            window.__TAURI_CALLBACKS__[cid] = { status: 'done', result: res };
          })
          .catch((err) => {
            window.__TAURI_CALLBACKS__[cid] = { status: 'error', error: err.message || String(err) };
          });
      }, command, args, callbackId);

      // Poll for the result
      let result = null;
      await browser.waitUntil(
        async () => {
          const status = await browser.execute((cid) => {
            const cb = window.__TAURI_CALLBACKS__?.[cid];
            if (cb?.status === 'done' || cb?.status === 'error') {
              return cb;
            }
            return null;
          }, callbackId);

          if (status) {
            result = status;
            return true;
          }
          return false;
        },
        { timeout: 10000, timeoutMsg: `Tauri invoke ${command} timed out`, interval: 100 }
      );

      // Clean up
      await browser.execute((cid) => {
        delete window.__TAURI_CALLBACKS__?.[cid];
      }, callbackId);

      // Handle error case
      if (result?.status === 'error') {
        return { success: false, error: { message: result.error } };
      }

      // Debug log for troubleshooting IPC issues
      if (process.env.LOG_LEVEL === 'debug') {
        console.log(`[tauri.invoke] ${command}(${JSON.stringify(args)}) => ${JSON.stringify(result?.result)}`);
      }

      return result?.result;
    } catch (error) {
      lastError = error;
      // Check if this is the Node.contains error
      if (error.message?.includes('Node.contains')) {
        console.warn(`[tauri.invoke] Retry ${i + 1}/${maxRetries} for ${command} due to: ${error.message}`);
        await browser.pause(500);
        continue;
      }
      // Other errors should be thrown immediately
      throw error;
    }
  }

  throw lastError;
}

/**
 * Get all Library skills.
 */
export async function getLibrarySkills() {
  const result = await invoke('library_list');
  if (result.success) return result.data;
  throw new Error(`getLibrarySkills failed: ${result.error?.message}`);
}

/**
 * Get all Global skills.
 */
export async function getGlobalSkills() {
  const result = await invoke('global_list');
  if (result.success) return result.data;
  throw new Error(`getGlobalSkills failed: ${result.error?.message}`);
}

/**
 * Get all projects.
 */
export async function getProjects() {
  const result = await invoke('project_list');
  if (result.success) return result.data;
  throw new Error(`getProjects failed: ${result.error?.message}`);
}

/**
 * Delete a Library skill by ID.
 */
export async function deleteLibrarySkill(skillId) {
  const result = await invoke('library_delete', { id: skillId });
  if (!result.success) {
    console.warn(`deleteLibrarySkill(${skillId}) failed: ${result.error?.message}`);
  }
  return result;
}

/**
 * Delete a Global skill by ID.
 */
export async function deleteGlobalSkill(skillId) {
  const result = await invoke('global_delete', { id: skillId });
  if (!result.success) {
    console.warn(`deleteGlobalSkill(${skillId}) failed: ${result.error?.message}`);
  }
  return result;
}

/**
 * Remove a project by ID.
 */
export async function removeProject(projectId) {
  const result = await invoke('project_remove', { id: projectId });
  if (!result.success) {
    console.warn(`removeProject(${projectId}) failed: ${result.error?.message}`);
  }
  return result;
}

/**
 * Get the application version from the Tauri API.
 */
export async function getAppVersion() {
  const result = await invoke('get_app_version');
  return result.success ? result.data : null;
}
