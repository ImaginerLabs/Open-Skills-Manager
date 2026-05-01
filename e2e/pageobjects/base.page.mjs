import { ROUTES, TIMEOUTS } from '../config/constants.mjs';
import * as wait from '../helpers/wait.helper.mjs';

export class BasePage {
  constructor(url = '') {
    this.url = url;
  }

  async open(path = '') {
    const target = path || this.url;
    // Use history.pushState to navigate without page reload.
    // This avoids tauri-webdriver plugin issues with navigate/url.
    await browser.execute((url) => {
      window.history.pushState({}, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, target);
    await browser.pause(500);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await wait.waitForAppReady(TIMEOUTS.long);
  }

  async $(selector) {
    const el = await globalThis.$(selector);
    return el;
  }

  async $$(selector) {
    const elements = await globalThis.$$(selector);
    return elements;
  }

  async click(selector) {
    // Use browser.execute to avoid WebDriverIO v9 Node.contains issues
    await browser.execute((sel) => {
      const el = document.querySelector(sel);
      if (el) el.click();
    }, selector);
    await browser.pause(100);
  }

  async type(selector, text) {
    // Use browser.execute to avoid WebDriverIO v9 Node.contains issues
    // For React controlled inputs, we need to properly set the value and trigger React's synthetic events
    await browser.execute((sel, value) => {
      const el = document.querySelector(sel);
      if (!el) {
        console.error(`Element not found: ${sel}`);
        return;
      }

      // Focus the element
      el.focus();

      // Get the native input value setter to bypass React's controlled input protection
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      // Clear existing value using native setter
      nativeInputValueSetter.call(el, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));

      // Set new value using native setter (this bypasses React's read-only warning)
      nativeInputValueSetter.call(el, value);

      // Dispatch input event with proper InputEvent for React compatibility
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: false,
        data: value,
        inputType: 'insertText',
      });
      el.dispatchEvent(inputEvent);

      // Also dispatch change event
      const changeEvent = new Event('change', { bubbles: true });
      el.dispatchEvent(changeEvent);

      // Blur to finalize
      el.blur();
    }, selector, text);
    await browser.pause(300);
  }

  async getText(selector) {
    // Use browser.execute to avoid WebDriverIO v9 Node.contains issues
    const text = await browser.execute((sel) => {
      const el = document.querySelector(sel);
      return el ? el.textContent : '';
    }, selector);
    return text;
  }

  async isDisplayed(selector) {
    // Use browser.execute for more reliable element existence check in WKWebView
    // This avoids WebDriverIO v9's Node.contains issue with stale element references
    try {
      const isVisible = await browser.execute((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && el.isConnected;
      }, selector);
      return isVisible;
    } catch {
      return false;
    }
  }

  async waitForElement(selector, timeout = TIMEOUTS.medium) {
    return wait.waitForElement(selector, timeout);
  }

  async waitForElementGone(selector, timeout = TIMEOUTS.medium) {
    await wait.waitForElementGone(selector, timeout);
  }
}
