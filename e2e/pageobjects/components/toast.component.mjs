import { TIMEOUTS } from '../../config/constants.mjs';
import * as wait from '../../helpers/wait.helper.mjs';

const SELECTORS = {
  container: '[data-testid="toast-container"]',
  message: '[data-testid="toast-message"]',
};

export class ToastComponent {
  async waitForMessage(text, timeout = TIMEOUTS.medium) {
    await wait.waitForElement(SELECTORS.message, timeout);
    if (text) {
      await wait.waitForText(SELECTORS.message, text, timeout);
    }
  }

  async getMessage() {
    const el = await globalThis.$(SELECTORS.message);
    const existing = await el.isExisting();
    if (!existing) return null;
    return el.getText();
  }

  async isSuccess() {
    const el = await globalThis.$(SELECTORS.message);
    const existing = await el.isExisting();
    if (!existing) return false;
    const className = await el.getAttribute('class');
    // Toast type is set as CSS class (e.g. styles.success)
    return className.includes('success');
  }

  async isError() {
    const el = await globalThis.$(SELECTORS.message);
    const existing = await el.isExisting();
    if (!existing) return false;
    const className = await el.getAttribute('class');
    return className.includes('error');
  }

  async dismiss() {
    // Toasts auto-dismiss, but can be manually closed by clicking
    const el = await globalThis.$(SELECTORS.message);
    const existing = await el.isExisting();
    if (existing) {
      await el.click();
    }
  }
}
