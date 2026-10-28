import { test, expect } from '../fixtures';
import { addMonths, currentMonth, formatMonth } from '../utils/format';

test.describe('Full Application Flow', () => {
  test('complete budget workflow from sign up to reports', async ({
    newUser: _newUser, // Step 1: sign up (fresh account via the sign-up form)
    budgetPage,
    transactionsPage,
    reportsPage,
    planningPage,
  }) => {
    const month = currentMonth();

    // Step 2: Create budget categories
    await budgetPage.createCategory('Rent');
    await budgetPage.createCategory('Groceries');
    await budgetPage.createCategory('Transportation');

    await expect(budgetPage.categoryNames).toHaveText(['Rent', 'Groceries', 'Transportation']);

    // Step 3: Assign budgets ($2,100 total)
    await budgetPage.assignBudget('Rent', '1500');
    await budgetPage.assignBudget('Groceries', '400');
    await budgetPage.assignBudget('Transportation', '200');

    // Step 4: Set a target
    await budgetPage.setTarget('Groceries', 'Monthly Spending', '400');

    // Step 5: Check if funded
    await expect(budgetPage.categoryRow('Groceries').getByTestId('category-status')).toHaveText('Funded');

    // Step 6: Add income via transactions page
    await transactionsPage.goto();
    await transactionsPage.addIncome('Salary', '5000', `${month}-01`);
    await expect(transactionsPage.getAmountCell('Salary')).toHaveText('+$5,000.00');

    // Step 7: Add expenses ($1,630.50 total)
    await transactionsPage.addTransaction('Groceries', 'Whole Foods', '85.50', `${month}-05`);
    await transactionsPage.addTransaction('Transportation', 'Gas', '45.00', `${month}-06`);
    await transactionsPage.addTransaction('Rent', 'Rent Payment', '1500', `${month}-01`);

    await expect(transactionsPage.rows).toHaveCount(4);

    // Step 8: Check reports
    await reportsPage.goto();
    await expect(reportsPage.monthLabel).toHaveText(formatMonth(month));
    await expect(reportsPage.stat('income')).toHaveText('$5,000.00');
    await expect(reportsPage.stat('assigned')).toHaveText('$2,100.00');
    await expect(reportsPage.stat('activity')).toHaveText('-$1,630.50');
    await expect(reportsPage.stat('total-target')).toHaveText('$400.00');
    await expect(reportsPage.stat('funded')).toHaveText('1');
    await expect(reportsPage.stat('underfunded')).toHaveText('0');

    // Step 9: Use planner (only Groceries has a target)
    await planningPage.goto();
    await planningPage.setPlannedAmount('Groceries', '500');
    await planningPage.simulateIncome('6000');

    await expect(planningPage.surplusValue).toHaveText('$5,500.00');

    // Step 10: Navigate back to budget and verify ($5,000 income - $2,100 assigned)
    await budgetPage.goto();
    await expect(budgetPage.readyToAssign).toHaveText('$2,900.00');
  });

  test('anonymous user flow', async ({ signInPage, budgetPage }) => {
    await signInPage.goto();
    await signInPage.clickAnonymousSignIn();

    await budgetPage.waitForBudgetLoad();
    await expect(budgetPage.monthLabel).toHaveText(formatMonth(currentMonth()));

    // Create a category
    await budgetPage.createCategory('Test Category');

    await expect(budgetPage.categoryNames).toHaveText(['Test Category']);

    // Navigate to transactions
    await budgetPage.clickSidebarLink('Transactions');

    await expect(budgetPage.getHeading()).toHaveText('Transactions');
  });

  test('multi-month budget management', async ({ newUser: _newUser, budgetPage }) => {
    await budgetPage.createCategory('Monthly Bills');
    await budgetPage.assignBudget('Monthly Bills', '500');

    await budgetPage.goToNextMonth();
    await expect(budgetPage.monthLabel).toHaveText(formatMonth(addMonths(currentMonth(), 1)));

    await budgetPage.assignBudget('Monthly Bills', '500');

    // Available rolls over: $500 from last month + $500 this month.
    const row = budgetPage.categoryRow('Monthly Bills');
    await expect(row.getByTestId('category-assigned')).toHaveText('$500.00');
    await expect(row.getByTestId('category-available')).toHaveText('$1,000.00');
  });
});
