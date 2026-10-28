import { test, expect } from '../fixtures';
import { addMonths, currentMonth, formatMonth } from '../utils/format';

test.describe('Reports', () => {
  test.describe('empty account', () => {
    test.beforeEach(async ({ newUser: _newUser, reportsPage }) => {
      await reportsPage.goto();
    });

    test('should display reports page', async ({ reportsPage }) => {
      await expect(reportsPage.getHeading()).toHaveText('Reports');
      await expect(reportsPage.monthLabel).toHaveText(formatMonth(currentMonth()));
    });

    test('should navigate between months', async ({ reportsPage }) => {
      await reportsPage.navigateToMonth('prev');

      await expect(reportsPage.monthLabel).toHaveText(formatMonth(addMonths(currentMonth(), -1)));
    });

    test('should navigate forward and back', async ({ reportsPage }) => {
      await reportsPage.navigateToMonth('next');
      await reportsPage.navigateToMonth('prev');

      await expect(reportsPage.monthLabel).toHaveText(formatMonth(currentMonth()));
    });

    test('should show category breakdown column headers', async ({ reportsPage }) => {
      await expect(reportsPage.breakdownTable.locator('thead th')).toHaveText([
        'Category',
        'Target',
        'Assigned',
        'Activity',
        'Available',
        'Status',
      ]);
    });

    test('should show stat values as formatted currency', async ({ reportsPage }) => {
      // Funded / Underfunded are counts, not currency, so they are excluded.
      for (const key of ['total-target', 'income', 'assigned', 'activity'] as const) {
        await expect(reportsPage.stat(key)).toHaveText(/^-?\$[\d,]+\.\d{2}$/);
      }
    });
  });

  test.describe('with targets', () => {
    // See TARGET_CATEGORIES in fixtures.ts for the seeded data and expected totals.
    test.beforeEach(async ({ budgetWithTargets: _seed, reportsPage }) => {
      await reportsPage.goto();
    });

    test('should verify target summary values', async ({ reportsPage }) => {
      await expect(reportsPage.stat('total-target')).toHaveText('$2,050.00');
      await expect(reportsPage.stat('funded')).toHaveText('1');
      await expect(reportsPage.stat('underfunded')).toHaveText('2');
    });

    test('should show target counts by type', async ({ page }) => {
      await expect(page.getByTestId('stat-by-type')).toContainText(/Spending\s*3/);
    });

    test('should show monthly overview section', async ({ reportsPage }) => {
      await expect(reportsPage.stat('income')).toHaveText('$0.00');
      await expect(reportsPage.stat('assigned')).toHaveText('$1,750.00');
    });

    test('should display category breakdown table', async ({ reportsPage }) => {
      await expect(reportsPage.breakdownRows).toHaveCount(3);

      const groceries = reportsPage.breakdownRow('Groceries');
      await expect(groceries.getByTestId('breakdown-target')).toHaveText('$400.00');
      await expect(groceries.getByTestId('breakdown-assigned')).toHaveText('$250.00');
      // Activity is not asserted: it renders "-$0.00" with no transactions (known
      // bug, see the test.fail test in budget.spec.ts).
      await expect(groceries.getByTestId('breakdown-available')).toHaveText('$250.00');
      await expect(groceries.getByTestId('breakdown-status')).toHaveText('Underfunded');
    });
  });
});
