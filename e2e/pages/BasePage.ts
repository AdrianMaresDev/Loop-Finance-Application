import { type Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  getSidebarLink(name: string) {
    return this.page.getByRole('navigation').getByRole('link', { name });
  }

  async clickSidebarLink(linkText: string) {
    await this.getSidebarLink(linkText).click();
  }

  getHeading() {
    return this.page.getByTestId('page-title');
  }

  async waitForPageLoad() {
    await this.page.getByTestId('app-main').waitFor();
  }

  async signOut() {
    await this.page.getByTestId('signout-button').click();
    await this.page.getByTestId('signin-form').waitFor();
  }
}
