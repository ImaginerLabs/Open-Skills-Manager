import { ROUTES, TIMEOUTS } from '../config/constants.mjs';
import * as wait from '../helpers/wait.helper.mjs';
import { BasePage } from './base.page.mjs';

const SELECTORS = {
  pageContainer: '[data-testid="settings-page"]',
};

export class SettingsPage extends BasePage {
  constructor() {
    super(ROUTES.settings);
  }

  async open() {
    await super.open(ROUTES.settings);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await wait.waitForElement(SELECTORS.pageContainer, TIMEOUTS.long);
  }

  async isLoaded() {
    return this.isDisplayed(SELECTORS.pageContainer);
  }
}
