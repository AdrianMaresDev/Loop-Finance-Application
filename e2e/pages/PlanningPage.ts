import { type Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PlanningPage extends BasePage {
  readonly heading = this.page.getByTestId('page-title');
  readonly incomeInput = this.page.getByTestId('planner-income-input');
  readonly incomeClear = this.page.getByTestId('planner-income-clear');
  readonly incomeValue = this.page.getByTestId('planner-income-value');
  readonly needValue = this.page.getByTestId('planner-need-value');
  readonly surplusValue = this.page.getByTestId('planner-surplus-value');
  readonly plannedInputs = this.page.getByTestId('planner-planned-input');
  readonly tableTotal = this.page.getByTestId('planner-total-planned');

  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.navigateTo('/plan');
    await this.waitForPlannerLoad();
  }

  async waitForPlannerLoad() {
    await this.incomeInput.waitFor();
  }

  /** The override is only applied on blur, so press Enter to commit it. */
  async simulateIncome(amount: string) {
    await this.incomeInput.fill(amount);
    await this.incomeInput.press('Enter');
    await expect(this.incomeClear).toBeVisible();
  }

  async clearIncomeOverride() {
    await this.incomeClear.click();
    await expect(this.incomeClear).toBeHidden();
  }

  getPlannedInput(index: number) {
    return this.plannedInputs.nth(index);
  }

  /** The row whose category name is exactly `name` (so "Rent" never matches "Parent"). */
  getCategoryRow(name: string) {
    return this.page.getByTestId('planner-row').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  categoryDelta(categoryName: string) {
    return this.getCategoryRow(categoryName).getByTestId('planner-delta');
  }

  async setPlannedAmount(categoryName: string, amount: string) {
    await this.getCategoryRow(categoryName).getByTestId('planner-planned-input').fill(amount);
  }

  async getSurplusOrShortfall(): Promise<string> {
    return (await this.surplusValue.textContent())?.trim() ?? '';
  }

  async getMonthlyIncome(): Promise<string> {
    return (await this.incomeValue.textContent())?.trim() ?? '';
  }

  async getTotalMonthlyNeed(): Promise<string> {
    return (await this.needValue.textContent())?.trim() ?? '';
  }

  async getTableTotal(): Promise<string> {
    return (await this.tableTotal.textContent())?.trim() ?? '';
  }

  async getCategoryDelta(categoryName: string): Promise<string> {
    return (await this.categoryDelta(categoryName).textContent())?.trim() ?? '';
  }
}
