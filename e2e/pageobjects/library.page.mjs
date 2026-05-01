import { ROUTES, TIMEOUTS } from '../config/constants.mjs';
import * as wait from '../helpers/wait.helper.mjs';
import { BasePage } from './base.page.mjs';
import { SkillCardComponent } from './components/skill-card.component.mjs';

const SELECTORS = {
  pageContainer: '[data-testid="library-page"]',
  importButton: '[data-testid="import-button"]',
  searchInput: '[data-testid="search-input"]',
  skillCard: '[data-testid="skill-card"]',
  skillName: '[data-testid="skill-name"]',
  skillDescription: '[data-testid="skill-description"]',
  skillMenuButton: '[data-testid="skill-menu-button"]',
  emptyState: '[data-testid="empty-state"]',
  errorState: '[data-testid="library-error"]',
};

export class LibraryPage extends BasePage {
  constructor() {
    super(ROUTES.library);
  }

  async open() {
    await super.open(ROUTES.library);
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
      { timeout: TIMEOUTS.long, timeoutMsg: 'Skills did not load' }
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

  async clickImportButton() {
    await this.click(SELECTORS.importButton);
  }

  async searchFor(query) {
    await this.type(SELECTORS.searchInput, query);
    // Wait for React state update and re-render
    await browser.pause(300);
  }

  async clickSkillByIndex(index) {
    const clicked = await browser.execute((sel, idx) => {
      const cards = document.querySelectorAll(sel);
      if (idx >= cards.length) return false;
      cards[idx].click();
      return true;
    }, SELECTORS.skillCard, index);
    if (!clicked) {
      throw new Error(`Skill index ${index} out of range`);
    }
  }

  async clickSkillMenu(index) {
    const clicked = await browser.execute((sel, idx) => {
      const buttons = document.querySelectorAll(sel);
      if (idx >= buttons.length) return false;
      buttons[idx].click();
      return true;
    }, SELECTORS.skillMenuButton, index);
    if (!clicked) {
      throw new Error(`Menu button index ${index} out of range`);
    }
  }

  async hasSkillNamed(name) {
    await this.waitForSkillsToLoad();
    const names = await this.getSkillNames();
    return names.includes(name);
  }

  async getSkillByIndex(index) {
    // Verify index is valid
    const count = await this.getSkillCount();
    if (index >= count) {
      throw new Error(`Skill index ${index} out of range (found ${count} cards)`);
    }
    // Return component with index instead of Element
    return new SkillCardComponent(index);
  }

  async getSkillIndexByName(name) {
    // Use browser.execute to find the index of a skill by name
    const index = await browser.execute((searchName) => {
      const cards = document.querySelectorAll('[data-testid="skill-card"]');
      for (let i = 0; i < cards.length; i++) {
        const nameEl = cards[i].querySelector('[data-testid="skill-name"]');
        if (nameEl && nameEl.textContent.includes(searchName)) {
          return i;
        }
      }
      return -1;
    }, name);
    return index;
  }

  async getSkillByName(name) {
    const index = await this.getSkillIndexByName(name);
    if (index === -1) {
      throw new Error(`Skill with name "${name}" not found`);
    }
    return new SkillCardComponent(index);
  }

  async deleteSkillByIndex(index) {
    await this.clickSkillMenu(index);
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
