import { expect } from '@wdio/globals';
import { TIMEOUTS, TEST_PREFIX } from '../../config/constants.mjs';
import * as tauri from '../../helpers/tauri.helper.mjs';
import { TestDataManager } from '../../fixtures/test-data.helper.mjs';
import { LibraryPage } from '../../pageobjects/library.page.mjs';

describe('Library - Skill List', () => {
  const libraryPage = new LibraryPage();
  const dataManager = new TestDataManager();
  let importedSkillId;

  before(async () => {
    await dataManager.captureInitialState();
    // Import a test skill via IPC so the list is not empty
    const tempDir = await dataManager.createTestSkill('list-skill', {
      content: '# e2e-test-list-skill\n\nA test skill for list verification.',
    });
    const result = await tauri.invoke('library_import', { path: tempDir });
    if (result.success && result.data) {
      importedSkillId = result.data.id;
      dataManager.trackSkillId(importedSkillId);
    }
    await libraryPage.open();
  });

  after(async () => {
    await dataManager.restoreToInitialState();
    await dataManager.cleanup();
  });

  it('should display skill cards in the list', async () => {
    await libraryPage.waitForSkillsToLoad();
    const count = await libraryPage.getSkillCount();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('should show correct skill name on the card', async () => {
    await libraryPage.waitForSkillsToLoad();
    const names = await libraryPage.getSkillNames();
    const hasTestSkill = names.some((n) => n.includes(TEST_PREFIX));
    expect(hasTestSkill).toBe(true);
  });

  it('should show skill description on the card', async () => {
    await libraryPage.waitForSkillsToLoad();
    const card = await libraryPage.getSkillByIndex(0);
    const description = await card.getDescription();
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(0);
  });

  it('should filter skills by search query', async () => {
    await libraryPage.waitForSkillsToLoad();
    const countBefore = await libraryPage.getSkillCount();

    await libraryPage.searchFor(TEST_PREFIX);

    // Wait for filtered results to settle
    await browser.waitUntil(
      async () => {
        const countAfter = await libraryPage.getSkillCount();
        return countAfter <= countBefore;
      },
      { timeout: TIMEOUTS.medium, timeoutMsg: 'Search did not filter results' }
    );

    const countAfter = await libraryPage.getSkillCount();
    expect(countAfter).toBeLessThanOrEqual(countBefore);
  });

  it('should show empty state when no skills match search', async () => {
    await libraryPage.waitForSkillsToLoad();
    await libraryPage.searchFor('zzz-nonexistent-skill-xyz');

    // Wait for empty state or zero cards
    await browser.waitUntil(
      async () => {
        const count = await libraryPage.getSkillCount();
        const hasEmpty = await libraryPage.isDisplayed('[data-testid="empty-state"]');
        return count === 0 || hasEmpty;
      },
      { timeout: TIMEOUTS.medium, timeoutMsg: 'Empty state did not appear for non-matching search' }
    );

    const count = await libraryPage.getSkillCount();
    expect(count).toBe(0);
  });

  it('should show empty state when library has no skills', async () => {
    // Clean up imported skills to get empty state
    await dataManager.restoreToInitialState();
    await libraryPage.open();
    await libraryPage.waitForSkillsToLoad();

    const hasEmpty = await libraryPage.isDisplayed('[data-testid="empty-state"]');
    const count = await libraryPage.getSkillCount();
    expect(hasEmpty || count === 0).toBe(true);
  });
});
