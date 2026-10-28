import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TransactionsPage extends BasePage {
  readonly title = this.page.getByTestId('page-title');
  readonly summary = this.page.getByTestId('page-description');
  readonly table = this.page.getByTestId('txn-table');
  readonly rows = this.page.getByTestId('txn-row');
  readonly monthFilter = this.page.getByTestId('filter-month');
  readonly categoryFilter = this.page.getByTestId('filter-category');
  readonly searchInput = this.page.getByTestId('filter-search');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo('/transactions');
    await this.table.waitFor();
  }

  /** Rows whose description is exactly `description`. */
  row(description: string) {
    return this.rows.filter({
      has: this.page.getByTestId('txn-description-cell').getByText(description, { exact: true }),
    });
  }

  async addIncome(description: string, amount: string, date: string) {
    const before = await this.row(description).count();
    await this.page.getByTestId('income-description').fill(description);
    await this.page.getByTestId('income-amount').fill(amount);
    await this.page.getByTestId('income-date').fill(date);
    await this.page.getByTestId('income-submit').click();
    await expect(this.row(description)).toHaveCount(before + 1);
  }

  async fillTransactionForm(description: string, amount: string, date: string) {
    await this.page.getByTestId('txn-description').fill(description);
    await this.page.getByTestId('txn-amount').fill(amount);
    await this.page.getByTestId('txn-date').fill(date);
  }

  async selectCategory(categoryName: string) {
    await this.page.getByTestId('txn-category').selectOption({ label: categoryName });
  }

  async submitTransaction() {
    await this.page.getByTestId('txn-submit').click();
  }

  async addTransaction(category: string, description: string, amount: string, date: string) {
    const before = await this.row(description).count();
    await this.selectCategory(category);
    await this.fillTransactionForm(description, amount, date);
    await this.submitTransaction();
    await expect(this.row(description)).toHaveCount(before + 1);
  }

  async getTransactionCount(): Promise<number> {
    return this.rows.count();
  }

  async deleteTransaction(description: string) {
    const before = await this.row(description).count();
    const target = this.row(description).first();
    await target.hover();
    await target.getByTestId('txn-delete').click();
    await expect(this.row(description)).toHaveCount(before - 1);
  }

  async filterByMonth(monthLabel: string) {
    await this.monthFilter.selectOption({ label: monthLabel });
  }

  async filterByCategory(categoryName: string) {
    await this.categoryFilter.selectOption({ label: categoryName });
  }

  async searchTransactions(query: string) {
    await this.searchInput.fill(query);
  }

  getAmountCell(description: string): Locator {
    return this.row(description).first().getByTestId('txn-amount-cell');
  }
}
