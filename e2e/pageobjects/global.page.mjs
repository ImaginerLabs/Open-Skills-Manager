import { ROUTES, TIMEOUTS } from '../config/constants.mjs';
import * as wait from '../helpers/wait.helper.mjs';
import { BasePage } from './base.page.mjs';

const SELECTORS = {
  pageContainer: '[data-testid="global-page"]',
  skillCard: '[data-testid="skill-card"]',
  skillName: '[data-testid="skill-name"]',
  refreshButton: '[data-testid="global-page"] button[aria-label="Refresh global skills"]',
  emptyState: '[data-testid="empty-state"]',
};

export class GlobalPage extends BasePage {
  constructor() {
    super(ROUTES.global);
  }

  async open() {
    await super.open(ROUTES.global);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await wait.waitForElement(SELECTORS.pageContainer, TIMEOUTS.long);
  }

  async waitForSkillsToLoad() {
    // Either skill cards or empty state should appear
    // Use browser.execute to avoid WebDriverIO v9 Node.contains issues
    await browser.waitUntil(
      async () => {
        const hasCards = await browser.execute((sel) => {
          return !!document.querySelector(sel);
        }, SELECTORS.skillCard);
        const hasEmpty = await browser.execute((sel) => {
          return !!document.querySelector(sel);
        }, SELECTORS.emptyState);
        return hasCards || hasEmpty;
      },
      { timeout: TIMEOUTS.long, timeoutMsg: 'Global skills did not load' }
    );
  }

  async getSkillCount() {
    // Use browser.execute to avoid WebDriverIO v9 Node.contains issues
    const count = await browser.execute((sel) => {
      return document.querySelectorAll(sel).length;
    }, SELECTORS.skillCard);
    return count;
  }

  async getSkillNames() {
    // Use browser.execute to avoid WebDriverIO v9 Node.contains issues
    const names = await browser.execute((sel) => {
      const elements = document.querySelectorAll(sel);
      return Array.from(elements).map((el) => el.textContent || '');
    }, SELECTORS.skillName);
    return names;
  }

  async hasSkillNamed(name) {
    await this.waitForSkillsToLoad();
    const names = await this.getSkillNames();
    return names.includes(name);
  }

  async refreshSkills() {
    const btn = await wait.waitForElement(SELECTORS.refreshButton, TIMEOUTS.medium);
    await btn.click();
  }
}
