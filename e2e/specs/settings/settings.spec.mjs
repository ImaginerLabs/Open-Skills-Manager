import { expect } from '@wdio/globals';
import { TIMEOUTS } from '../../config/constants.mjs';
import * as wait from '../../helpers/wait.helper.mjs';
import { SettingsPage } from '../../pageobjects/settings.page.mjs';

/**
 * SET-01: Settings page loads
 */
describe('Settings - SET-01: Settings page loads', () => {
  const settingsPage = new SettingsPage();

  before(async () => {
    await settingsPage.open();
  });

  it('should display the settings page container', async () => {
    const isLoaded = await settingsPage.isLoaded();
    expect(isLoaded).toBe(true);
  });

  it('should display the Settings title', async () => {
    const title = await settingsPage.getText('h1');
    expect(title).toBe('Settings');
  });
});

/**
 * SET-02: Theme switching
 *
 * Theme is applied via `document.documentElement` class:
 * - `light` class present -> light mode
 * - `light` class absent  -> dark mode
 *
 * Settings page has a <select> with options: System, Light, Dark.
 */
describe('Settings - SET-02: Theme switching', () => {
  const settingsPage = new SettingsPage();
  let originalHasLightClass;

  before(async () => {
    await settingsPage.open();
    await settingsPage.waitForLoad();

    // Capture original state
    originalHasLightClass = await browser.execute(() => {
      return document.documentElement.classList.contains('light');
    });
  });

  after(async () => {
    // Restore original theme via the <select> element
    await settingsPage.open();
    await settingsPage.waitForLoad();

    // Restore theme using execute
    await browser.execute((shouldBeLight) => {
      const select = document.querySelector('select');
      if (select) {
        select.value = shouldBeLight ? 'light' : 'dark';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, originalHasLightClass);
  });

  it('should switch theme to dark and remove light class from root', async () => {
    // Use execute to change select value
    await browser.execute(() => {
      const select = document.querySelector('select');
      if (select) {
        select.value = 'dark';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await browser.waitUntil(
      async () => {
        const hasLightClass = await browser.execute(() => {
          return document.documentElement.classList.contains('light');
        });
        return !hasLightClass;
      },
      { timeout: TIMEOUTS.medium, timeoutMsg: 'Theme did not switch to dark (light class still present)' }
    );

    const hasLightClass = await browser.execute(() => {
      return document.documentElement.classList.contains('light');
    });
    expect(hasLightClass).toBe(false);
  });

  it('should switch theme to light and add light class to root', async () => {
    // Use execute to change select value
    await browser.execute(() => {
      const select = document.querySelector('select');
      if (select) {
        select.value = 'light';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await browser.waitUntil(
      async () => {
        const hasLightClass = await browser.execute(() => {
          return document.documentElement.classList.contains('light');
        });
        return hasLightClass;
      },
      { timeout: TIMEOUTS.medium, timeoutMsg: 'Theme did not switch to light (light class not present)' }
    );

    const hasLightClass = await browser.execute(() => {
      return document.documentElement.classList.contains('light');
    });
    expect(hasLightClass).toBe(true);
  });
});
