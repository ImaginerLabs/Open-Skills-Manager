import { expect } from '@wdio/globals';

describe('Smoke Tests', () => {
  it('should have correct title', async () => {
    const title = await browser.getTitle();
    expect(title).toBe('Claude Code Skills Manager');
  });

  it('should find the app container', async () => {
    const app = await browser.$('#root');
    expect(await app.isExisting()).toBe(true);
  });

  it('should get window handle', async () => {
    const handle = await browser.getWindowHandle();
    expect(typeof handle).toBe('string');
    expect(handle.length).toBeGreaterThan(0);
  });

  it('should take a screenshot', async () => {
    const screenshot = await browser.takeScreenshot();
    expect(typeof screenshot).toBe('string');
    expect(screenshot.length).toBeGreaterThan(100);
  });
});
