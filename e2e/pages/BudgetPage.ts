import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { SignInPage } from './SignInPage';
import { formatCurrency, parseCurrency } from '../utils/format';

export class BudgetPage extends BasePage {
  readonly table = this.page.getByTestId('budget-table');
  readonly monthLabel = this.page.getByTestId('month-label');
  readonly readyToAssign = this.page.getByTestId('ready-to-assign-amount');
  readonly categoryNames = this.page.getByTestId('category-name');
  readonly archivedToggle = this.page.getByTestId('archived-toggle');
  readonly detailPanel = this.page.getByTestId('category-detail');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo('/');
    await this.waitForBudgetLoad();
  }

  async waitForBudgetLoad() {
    await this.table.waitFor();
  }

  async loginAndNavigateToBudget(email: string, password: string) {
    const signIn = new SignInPage(this.page);
    await signIn.goto();
    await signIn.signIn(email, password);
    await this.waitForBudgetLoad();
  }

  /** The row whose name is exactly `name` (so "Rent" never matches "Parent"). */
  categoryRow(name: string) {
    return this.page
      .getByTestId('category-row')
      .filter({ has: this.page.getByTestId('category-name').getByText(name, { exact: true }) });
  }

  async createCategory(name: string) {
    await this.page.getByTestId('add-category-input').fill(name);
    await this.page.getByTestId('add-category-submit').click();
    await expect(this.categoryRow(name)).toBeVisible();
  }

  async assignBudget(categoryName: string, amount: string) {
    const row = this.categoryRow(categoryName);
    await row.getByTestId('category-assigned').click();
    await row.getByTestId('category-assigned-input').fill(amount);
    await row.getByTestId('category-assigned-input').press('Enter');
    await expect(row.getByTestId('category-assigned')).toHaveText(formatCurrency(parseFloat(amount)));
  }

  /** `frequency` is the Frequency dropdown label; the app defaults to "Monthly". */
  async setTarget(categoryName: string, type: string, amount: string, frequency?: string) {
    await this.categoryRow(categoryName).getByTestId('category-name').click();
    await this.detailPanel.getByTestId('target-create').click();
    await this.detailPanel.getByTestId('target-type').selectOption({ label: type });
    await this.detailPanel.getByTestId('target-amount').fill(amount);
    if (frequency) {
      await this.detailPanel.getByTestId('target-frequency').selectOption({ label: frequency });
    }
    await this.detailPanel.getByTestId('target-save').click();
    await expect(this.detailPanel.getByTestId('target-summary')).toBeVisible();
  }

  async goToNextMonth() {
    const before = await this.monthLabel.textContent();
    await this.page.getByTestId('month-next').click();
    await expect(this.monthLabel).not.toHaveText(before ?? '');
  }

  async goToPrevMonth() {
    const before = await this.monthLabel.textContent();
    await this.page.getByTestId('month-prev').click();
    await expect(this.monthLabel).not.toHaveText(before ?? '');
  }

  async getReadyToAssign(): Promise<number> {
    return parseCurrency(await this.readyToAssign.textContent());
  }

  async isCategoryFunded(name: string): Promise<boolean> {
    const available = await this.categoryRow(name).getByTestId('category-available').textContent();
    return parseCurrency(available) >= 0;
  }

  /** Archives a category via the row's archive popover ("All months" by default). */
  async archiveCategory(name: string, scope: 'all' | 'from-month' = 'all') {
    const row = this.categoryRow(name);
    await row.hover();
    await row.getByTestId('category-archive').click();
    await this.page.getByTestId(scope === 'all' ? 'category-archive-all' : 'category-archive-from-month').click();
    await expect(row).toBeHidden();
  }

  async getMonthDisplay(): Promise<string> {
    return (await this.monthLabel.textContent()) ?? '';
  }

  async getCategoryNames(): Promise<string[]> {
    await this.waitForBudgetLoad();
    return (await this.categoryNames.allTextContents()).map((n) => n.trim());
  }
}
