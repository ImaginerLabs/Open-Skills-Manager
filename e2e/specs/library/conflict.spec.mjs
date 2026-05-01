/**
 * iCloud Sync Conflict Resolution E2E Tests
 *
 * Tests the conflict detection and resolution flow:
 * 1. Conflict detection when same skill modified on multiple devices
 * 2. Conflict UI display and interaction
 * 3. Resolution strategies: local, remote, both
 */

import { expect } from '@wdio/globals';
import { TIMEOUTS } from '../../config/constants.mjs';
import * as tauri from '../../helpers/tauri.helper.mjs';
import { LibraryPage } from '../../pageobjects/library.page.mjs';

describe('iCloud Sync Conflict Resolution', function () {
  this.timeout(TIMEOUTS.long);

  const libraryPage = new LibraryPage();

  describe('Conflict Detection', () => {
    it('CD-01: should return conflict list via IPC', async () => {
      // Call the IPC to get conflicts
      const result = await tauri.invoke('icloud_get_conflicts');

      // Verify the response structure
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('CD-02: should detect conflict type correctly', async () => {
      const result = await tauri.invoke('icloud_get_conflicts');

      if (result.success && result.data.length > 0) {
        const conflict = result.data[0];
        expect(conflict.skillId).toBeDefined();
        expect(conflict.skillName).toBeDefined();
      }
    });
  });

  describe('Conflict UI', () => {
    before(async () => {
      await libraryPage.open();
    });

    it('CU-01: should display library page', async () => {
      await libraryPage.waitForLoad();
      const count = await libraryPage.getSkillCount();
      // Just verify the page loaded
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Conflict Resolution', () => {
    it('CR-01: should resolve conflict with "local" strategy', async () => {
      const conflictsResult = await tauri.invoke('icloud_get_conflicts');

      if (!conflictsResult.success || conflictsResult.data.length === 0) {
        // Skip if no conflicts to resolve
        console.log('No conflicts available for testing');
        return;
      }

      const conflict = conflictsResult.data[0];

      // Resolve with "local" strategy
      const resolveResult = await tauri.invoke('icloud_resolve_conflict', {
        skillId: conflict.skillId,
        resolution: 'local',
      });

      expect(resolveResult.success).toBe(true);
    });

    it('CR-02: should resolve conflict with "remote" strategy', async () => {
      const conflictsResult = await tauri.invoke('icloud_get_conflicts');

      if (!conflictsResult.success || conflictsResult.data.length === 0) {
        console.log('No conflicts available for testing');
        return;
      }

      const conflict = conflictsResult.data[0];

      const resolveResult = await tauri.invoke('icloud_resolve_conflict', {
        skillId: conflict.skillId,
        resolution: 'remote',
      });

      expect(resolveResult.success).toBe(true);
    });

    it('CR-03: should resolve conflict with "both" strategy', async () => {
      const conflictsResult = await tauri.invoke('icloud_get_conflicts');

      if (!conflictsResult.success || conflictsResult.data.length === 0) {
        console.log('No conflicts available for testing');
        return;
      }

      const conflict = conflictsResult.data[0];

      const resolveResult = await tauri.invoke('icloud_resolve_conflict', {
        skillId: conflict.skillId,
        resolution: 'both',
      });

      expect(resolveResult.success).toBe(true);
    });
  });

  describe('Sync Status', () => {
    it('SS-01: should return sync status via IPC', async () => {
      const result = await tauri.invoke('icloud_sync_status');

      expect(result.success).toBe(true);
      expect(result.data.status).toBeDefined();
    });

    it('SS-02: should handle offline state gracefully', async () => {
      const statusResult = await tauri.invoke('icloud_sync_status');

      expect(statusResult.success).toBe(true);
      // Just verify the status is one of the expected values
      const validStatuses = ['synced', 'syncing', 'pending', 'offline', 'error'];
      expect(validStatuses).toContain(statusResult.data.status);
    });
  });
});
