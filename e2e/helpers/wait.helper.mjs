import { TIMEOUTS, SELECTORS } from '../config/constants.mjs';

/**
 * Wait for an element to appear in the DOM.
 * Uses browser.execute to avoid WebDriverIO v9 Node.contains issues in WKWebView.
 */
export async function waitForElement(selector, timeout = TIMEOUTS.medium) {
  await browser.waitUntil(
    async () => {
      const exists = await browser.execute((sel) => {
        return !!document.querySelector(sel);
      }, selector);
      return exists;
    },
    { timeout, timeoutMsg: `Element "${selector}" never appeared` }
  );
  return $(selector);
}

/**
 * Wait for an element to disappear from the DOM.
 * Uses browser.execute to avoid WebDriverIO v9 Node.contains issues in WKWebView.
 */
export async function waitForElementGone(selector, timeout = TIMEOUTS.medium) {
  await browser.waitUntil(
    async () => {
      const exists = await browser.execute((sel) => {
        return !!document.querySelector(sel);
      }, selector);
      return !exists;
    },
    { timeout, timeoutMsg: `Element "${selector}" never disappeared` }
  );
}

/**
 * Wait for an element to contain specific text.
 * Uses browser.execute to avoid WebDriverIO v9 Node.contains issues in WKWebView.
 */
export async function waitForText(selector, expectedText, timeout = TIMEOUTS.medium) {
  await browser.waitUntil(
    async () => {
      const text = await browser.execute((sel) => {
        const el = document.querySelector(sel);
        return el ? el.textContent : '';
      }, selector);
      return text.includes(expectedText);
    },
    { timeout, timeoutMsg: `Element "${selector}" never contained text "${expectedText}"` }
  );
}

/**
 * Wait for the browser URL to contain the expected path.
 */
export async function waitForUrl(expectedPath, timeout = TIMEOUTS.medium) {
  await browser.waitUntil(
    async () => {
      const url = await browser.getUrl();
      return url.includes(expectedPath);
    },
    { timeout, timeoutMsg: `URL never contained "${expectedPath}"`, interval: 500 }
  );
}

/**
 * Wait for the app to be fully ready.
 * Checks that #root exists and document.readyState is complete.
 */
export async function waitForAppReady(timeout = TIMEOUTS.long) {
  await browser.waitUntil(
    async () => {
      const ready = await browser.execute(() => {
        return document.readyState === 'complete' && !!document.querySelector('#root');
      });
      return ready;
    },
    { timeout, timeoutMsg: 'App never became ready', interval: 1000 }
  );
}

/**
 * Wait for a callback result to stabilize (return the same value twice in a row).
 */
export async function waitForStable(callback, timeout = TIMEOUTS.medium, interval = 500) {
  const start = Date.now();
  let lastValue = await callback();

  while (Date.now() - start < timeout) {
    await browser.pause(interval);
    const currentValue = await callback();
    if (currentValue === lastValue) {
      return currentValue;
    }
    lastValue = currentValue;
  }

  return lastValue;
}
