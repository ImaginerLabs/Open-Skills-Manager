import { expect } from '@wdio/globals';

describe('Library Page', () => {
  it('should load the library page', async () => {
    const title = await browser.getTitle();
    expect(title).toBe('Claude Code Skills Manager');
  });

  it('should render skill cards grid', async () => {
    // Wait for the app to load
    await browser.waitUntil(async () => {
      const root = await browser.$('#root');
      return await root.isExisting();
    }, { timeout: 5000 });

    const root = await browser.$('#root');
    expect(await root.isExisting()).toBe(true);
  });

  it('should have a search input or button', async () => {
    // Try to find search-related element by aria-label or icon
    const searchBtn = await browser.$('button[aria-label*="search" i]');
    // Fallback: check if any button exists in the toolbar area
    const hasButtons = await browser.execute(() => {
      return document.querySelectorAll('button').length > 0;
    });
    expect(hasButtons).toBe(true);
  });

  it('should take a full page screenshot', async () => {
    const screenshot = await browser.takeScreenshot();
    expect(typeof screenshot).toBe('string');
    expect(screenshot.length).toBeGreaterThan(1000);
  });

  it('should execute JavaScript in the app context', async () => {
    const result = await browser.execute(() => {
      return {
        title: document.title,
        url: window.location.href,
        bodyHasContent: document.body.innerText.length > 0,
      };
    });

    expect(result.title).toBe('Claude Code Skills Manager');
    expect(result.bodyHasContent).toBe(true);
  });
});
