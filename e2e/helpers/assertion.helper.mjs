import { TIMEOUTS, SELECTORS } from '../config/constants.mjs';

/**
 * Assert that an element is visible in the viewport.
 */
export async function assertElementVisible(selector) {
  const el = await $(selector);
  const displayed = await el.isDisplayed();
  if (!displayed) {
    throw new Error(`Expected element "${selector}" to be visible, but it was not`);
  }
}

/**
 * Assert that an element is not visible (or not in DOM).
 */
export async function assertElementHidden(selector) {
  const el = await $(selector);
  const existing = await el.isExisting();
  if (!existing) return;
  const displayed = await el.isDisplayed();
  if (displayed) {
    throw new Error(`Expected element "${selector}" to be hidden, but it was visible`);
  }
}

/**
 * Assert the number of elements matching a selector.
 */
export async function assertElementCount(selector, count) {
  const elements = await $$(selector);
  const actual = elements.length;
  if (actual !== count) {
    throw new Error(`Expected ${count} elements matching "${selector}", found ${actual}`);
  }
}

/**
 * Assert that an element's text exactly matches.
 */
export async function assertElementText(selector, text) {
  const el = await $(selector);
  await el.waitForExist({ timeout: TIMEOUTS.medium });
  const actual = await el.getText();
  if (actual !== text) {
    throw new Error(`Expected element "${selector}" text to be "${text}", got "${actual}"`);
  }
}

/**
 * Assert that an element's text contains the given substring.
 */
export async function assertElementContainsText(selector, partialText) {
  const el = await $(selector);
  await el.waitForExist({ timeout: TIMEOUTS.medium });
  const actual = await el.getText();
  if (!actual.includes(partialText)) {
    throw new Error(`Expected element "${selector}" text to contain "${partialText}", got "${actual}"`);
  }
}

/**
 * Assert the current URL contains the given path.
 */
export async function assertUrlContains(path) {
  const url = await browser.getUrl();
  if (!url.includes(path)) {
    throw new Error(`Expected URL to contain "${path}", got "${url}"`);
  }
}

/**
 * Assert that a toast message appears with the expected text.
 */
export async function assertToastMessage(message, timeout = TIMEOUTS.medium) {
  const toast = await $(SELECTORS.toast);
  await toast.waitForExist({ timeout });
  const toastText = await toast.getText();
  if (!toastText.includes(message)) {
    throw new Error(`Expected toast to contain "${message}", got "${toastText}"`);
  }
}
