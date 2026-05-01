import { expect } from '@wdio/globals';
import { SELECTORS, TIMEOUTS, ROUTES } from '../config/constants.mjs';
import * as wait from '../helpers/wait.helper.mjs';
import { LibraryPage } from '../pageobjects/library.page.mjs';
import { GlobalPage } from '../pageobjects/global.page.mjs';
import { SettingsPage } from '../pageobjects/settings.page.mjs';

describe('Smoke Tests', () => {
  // Global setup: wait for app to be fully ready before any tests
  before(async () => {
    // Wait for WebDriver window to be available
    await browser.waitUntil(
      async () => {
        try {
          const handles = await browser.getWindowHandles();
          return handles.length > 0;
        } catch {
          return false;
        }
      },
      { timeout: TIMEOUTS.extraLong, timeoutMsg: 'Window never became available', interval: 500 }
    );

    await wait.waitForAppReady(TIMEOUTS.long);
    // Additional wait for React to render initial page
    await browser.pause(2000);
  });

  it('should launch the app and render #root', async () => {
    const root = await $(SELECTORS.root);
    expect(await root.isExisting()).toBe(true);
  });

  it('should navigate from Library to Global', async () => {
    const libraryPage = new LibraryPage();
    await libraryPage.open();
    await libraryPage.waitForLoad();

    // Click the Global nav section to expand it, then click nav-global
    const navScopes = await $(`[data-testid="nav-scopes"]`);
    await navScopes.click();

    const globalNav = await $(`[data-testid="nav-global"]`);
    await globalNav.click();

    await wait.waitForUrl(ROUTES.global, TIMEOUTS.medium);
    const url = await browser.getUrl();
    expect(url).toContain(ROUTES.global);
  });

  it('should navigate from Global to Settings', async () => {
    const settingsPage = new SettingsPage();
    await settingsPage.open();
    await settingsPage.waitForLoad();

    const url = await browser.getUrl();
    expect(url).toContain(ROUTES.settings);
  });

  it('should navigate from Settings back to Library', async () => {
    const libraryPage = new LibraryPage();
    await libraryPage.open();
    await libraryPage.waitForLoad();

    const url = await browser.getUrl();
    expect(url).toContain(ROUTES.library);
  });

  it('should render Library page container', async () => {
    const libraryPage = new LibraryPage();
    await libraryPage.open();
    await libraryPage.waitForLoad();

    const container = await $('[data-testid="library-page"]');
    expect(await container.isExisting()).toBe(true);
  });

  it('should render Global page container', async () => {
    const globalPage = new GlobalPage();
    await globalPage.open();
    await globalPage.waitForLoad();

    const container = await $('[data-testid="global-page"]');
    expect(await container.isExisting()).toBe(true);
  });

  it('should render Settings page container', async () => {
    const settingsPage = new SettingsPage();
    await settingsPage.open();
    await settingsPage.waitForLoad();

    const container = await $('[data-testid="settings-page"]');
    expect(await container.isExisting()).toBe(true);
  });
});
