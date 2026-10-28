import { test, expect } from '../fixtures';
import { addMonths, currentMonth, formatMonth } from '../utils/format';

test.describe('Budget Management', () => {
  // Requesting `newUser` signs up a fresh account per test, so every test starts
  // from an empty budget and the exact amounts below are deterministic.
  test.beforeEach(async ({ newUser: _newUser }) => {});

  test('should display budget page after login', async ({ budgetPage }) => {
    await expect(budgetPage.monthLabel).toHaveText(formatMonth(currentMonth()));
    await expect(budgetPage.table).toBeVisible();
  });

  test('should show ready to assign amount', async ({ budgetPage }) => {
    await expect(budgetPage.readyToAssign).toHaveText('$0.00');
  });

  test('should create a new category', async ({ budgetPage }) => {
    await budgetPage.createCategory('Groceries');

    await expect(budgetPage.categoryNames).toHaveText(['Groceries']);
  });

  test('should assign budget to a category', async ({ budgetPage }) => {
    await budgetPage.createCategory('Utilities');
    await budgetPage.assignBudget('Utilities', '150');

    // No income yet, so assigning money puts Ready to Assign into the negative.
    await expect(budgetPage.readyToAssign).toHaveText('-$150.00');
  });

  test('should set a monthly spending target', async ({ budgetPage }) => {
    await budgetPage.createCategory('Entertainment');
    await budgetPage.setTarget('Entertainment', 'Monthly Spending', '100');

    const row = budgetPage.categoryRow('Entertainment');
    await expect(row.getByTestId('category-target')).toHaveText('$100.00');
    await expect(row.getByTestId('category-status')).toHaveText('Underfunded by $100.00');
  });

  test('should navigate between months', async ({ budgetPage }) => {
    await budgetPage.goToNextMonth();

    await expect(budgetPage.monthLabel).toHaveText(formatMonth(addMonths(currentMonth(), 1)));
  });

  test('should show assigned money as available', async ({ budgetPage }) => {
    await budgetPage.createCategory('Savings');
    await budgetPage.assignBudget('Savings', '500');

    await expect(budgetPage.categoryRow('Savings').getByTestId('category-available')).toHaveText('$500.00');
    await expect.poll(() => budgetPage.isCategoryFunded('Savings')).toBe(true);
  });

  test('should verify budget totals', async ({ budgetPage }) => {
    await budgetPage.createCategory('Rent');
    await budgetPage.assignBudget('Rent', '1200');

    const row = budgetPage.categoryRow('Rent');
    await expect(row.getByTestId('category-assigned')).toHaveText('$1,200.00');
    await expect(row.getByTestId('category-available')).toHaveText('$1,200.00');
  });

  test('should show $0.00 activity for a category with no transactions', async ({ budgetPage }) => {
    await budgetPage.createCategory('Rent');

    // Known bug: the backend negates activity (`activity: -activity` in
    // convex/budget/model.ts), turning 0 into -0, which formats as "-$0.00".
    // Marked here, not at the top, so a failure in the setup above still fails
    // the test normally. Remove once fixed; Playwright fails the test if it passes.
    test.fail(true, 'Known bug: Activity shows "-$0.00" instead of "$0.00"');
    await expect(budgetPage.categoryRow('Rent').getByTestId('category-activity')).toHaveText('$0.00');
  });

  test('should archive a category', async ({ budgetPage }) => {
    await budgetPage.createCategory('Old Category');
    await budgetPage.archiveCategory('Old Category');

    await expect(budgetPage.categoryRow('Old Category')).toBeHidden();
    await expect(budgetPage.archivedToggle).toContainText('Archived (1)');
  });

  test('should display correct table structure', async ({ budgetPage }) => {
    await expect(budgetPage.table.locator('thead th')).toHaveText([
      'Category',
      'Target',
      'Assigned',
      'Activity',
      'Available',
    ]);
  });
});
