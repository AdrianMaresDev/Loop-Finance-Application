import { test, expect } from '../fixtures';
import { addMonths, currentMonth, formatMonth } from '../utils/format';

// Dates are built from the current month (days 01–28 exist in every month).
const month = currentMonth();

test.describe('Transactions', () => {
  // Every test starts with a fresh, empty account.
  test.beforeEach(async ({ newUser: _newUser, transactionsPage }) => {
    await transactionsPage.goto();
  });

  test('should display transactions page', async ({ transactionsPage }) => {
    await expect(transactionsPage.title).toHaveText('Transactions');
  });

  test('should add income', async ({ transactionsPage }) => {
    await transactionsPage.addIncome('Monthly Salary', '5000', `${month}-01`);

    await expect(transactionsPage.rows).toHaveCount(1);
  });

  test('should add a transaction with category', async ({ budgetPage, transactionsPage }) => {
    await budgetPage.goto();
    await budgetPage.createCategory('Groceries');
    await transactionsPage.goto();

    await transactionsPage.addTransaction('Groceries', 'Weekly groceries', '85.50', `${month}-02`);

    await expect(transactionsPage.rows).toHaveCount(1);
    await expect(transactionsPage.getAmountCell('Weekly groceries')).toHaveText('-$85.50');
  });

  test('should display transaction amount correctly', async ({ transactionsPage }) => {
    await transactionsPage.addIncome('Freelance Work', '1500', `${month}-05`);

    await expect(transactionsPage.getAmountCell('Freelance Work')).toHaveText('+$1,500.00');
  });

  test('should filter transactions by search', async ({ transactionsPage }) => {
    await transactionsPage.addIncome('Special Payment', '200', `${month}-10`);
    await transactionsPage.addIncome('Regular Payment', '300', `${month}-11`);

    await transactionsPage.searchTransactions('Special');

    await expect(transactionsPage.rows).toHaveCount(1);
    await expect(transactionsPage.row('Special Payment')).toBeVisible();
  });

  test('should delete a transaction', async ({ page, transactionsPage }) => {
    await transactionsPage.addIncome('To Delete', '100', `${month}-15`);

    await transactionsPage.deleteTransaction('To Delete');

    await expect(transactionsPage.rows).toHaveCount(0);
    await expect(page.getByTestId('txn-empty')).toBeVisible();
  });

  test('should show income badge for income transactions', async ({ transactionsPage }) => {
    await transactionsPage.addIncome('Bonus', '500', `${month}-20`);

    await expect(transactionsPage.row('Bonus').getByTestId('txn-category-cell')).toHaveText('Income');
  });

  test('should filter by month', async ({ transactionsPage }) => {
    await transactionsPage.addIncome('This Month', '100', `${month}-01`);
    await transactionsPage.addIncome('Last Month', '100', `${addMonths(month, -1)}-01`);

    await transactionsPage.filterByMonth(formatMonth(month));

    await expect(transactionsPage.rows).toHaveCount(1);
    await expect(transactionsPage.row('This Month')).toBeVisible();
  });

  test('should show an amount for a new transaction', async ({ transactionsPage }) => {
    await transactionsPage.addIncome('Check Amount', '750', `${month}-25`);

    await expect(transactionsPage.getAmountCell('Check Amount')).toBeVisible();
  });

  test('should show transaction summary in header', async ({ transactionsPage }) => {
    await expect(transactionsPage.summary).toContainText('0 transactions');
  });
});
