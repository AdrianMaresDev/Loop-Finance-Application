import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type StatKey = 'total-target' | 'funded' | 'underfunded' | 'income' | 'assigned' | 'activity';

export class ReportsPage extends BasePage {
  readonly monthLabel = this.page.getByTestId('month-label');
  readonly breakdownTable = this.page.getByTestId('breakdown-table');
  readonly breakdownRows = this.page.getByTestId('breakdown-row');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo('/reports');
    await this.waitForReportLoad();
  }

  async waitForReportLoad() {
    await this.stat('total-target').waitFor();
  }

  async navigateToMonth(direction: 'next' | 'prev') {
    const before = await this.monthLabel.textContent();
    await this.page.getByTestId(direction === 'next' ? 'month-next' : 'month-prev').click();
    await expect(this.monthLabel).not.toHaveText(before ?? '');
  }

  async getCurrentMonth(): Promise<string> {
    return (await this.monthLabel.textContent()) ?? '';
  }

  /** The value element of a Target Summary / Monthly Overview stat card. */
  stat(key: StatKey) {
    return this.page.getByTestId(`stat-${key}-value`);
  }

  async getStatValue(key: StatKey): Promise<string> {
    return (await this.stat(key).textContent())?.trim() ?? '';
  }

  async getTargetSummary() {
    return {
      totalTarget: await this.getStatValue('total-target'),
      funded: await this.getStatValue('funded'),
      underfunded: await this.getStatValue('underfunded'),
    };
  }

  breakdownRow(categoryName: string) {
    return this.breakdownRows.filter({
      has: this.page.getByTestId('breakdown-name').getByText(categoryName, { exact: true }),
    });
  }

  async getCategoryBreakdownRow(categoryName: string) {
    const row = this.breakdownRow(categoryName);
    const text = async (testId: string) => (await row.getByTestId(testId).textContent())?.trim() ?? '';
    return {
      name: await text('breakdown-name'),
      target: await text('breakdown-target'),
      assigned: await text('breakdown-assigned'),
      activity: await text('breakdown-activity'),
      available: await text('breakdown-available'),
      status: await text('breakdown-status'),
    };
  }

  async getCategoryCount(): Promise<number> {
    return this.breakdownRows.count();
  }
}
