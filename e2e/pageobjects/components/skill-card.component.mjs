import { TIMEOUTS } from '../../config/constants.mjs';
import * as wait from '../../helpers/wait.helper.mjs';

/**
 * SkillCardComponent - operates on a skill card at a specific index.
 * Uses index-based lookups to avoid WebDriverIO Element serialization issues.
 */
export class SkillCardComponent {
  constructor(index) {
    this.index = index;
  }

  async getName() {
    // Use browser.execute with index to avoid Element serialization issues
    const text = await browser.execute((idx) => {
      const cards = document.querySelectorAll('[data-testid="skill-card"]');
      if (idx >= cards.length) return '';
      const el = cards[idx].querySelector('[data-testid="skill-name"]');
      return el ? el.textContent : '';
    }, this.index);
    return text;
  }

  async getDescription() {
    const text = await browser.execute((idx) => {
      const cards = document.querySelectorAll('[data-testid="skill-card"]');
      if (idx >= cards.length) return '';
      const el = cards[idx].querySelector('[data-testid="skill-description"]');
      return el ? el.textContent : '';
    }, this.index);
    return text;
  }

  async clickMenu() {
    await browser.execute((idx) => {
      const cards = document.querySelectorAll('[data-testid="skill-card"]');
      if (idx >= cards.length) return false;
      const btn = cards[idx].querySelector('[data-testid="skill-menu-button"]');
      if (btn) btn.click();
      return true;
    }, this.index);
  }

  async clickDeploy() {
    await this.clickMenu();
    // Wait for menu to appear and click by text using execute
    await browser.execute(() => {
      const items = document.querySelectorAll('[role="menuitem"]');
      for (const item of items) {
        if (item.textContent.includes('Deploy')) {
          item.click();
          return true;
        }
      }
      return false;
    });
  }

  async clickDelete() {
    await this.clickMenu();
    await browser.execute(() => {
      const items = document.querySelectorAll('[role="menuitem"]');
      for (const item of items) {
        if (item.textContent.includes('Delete')) {
          item.click();
          return true;
        }
      }
      return false;
    });
  }
}
