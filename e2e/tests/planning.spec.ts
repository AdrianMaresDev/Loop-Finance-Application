import { test, expect } from '../fixtures';

test.describe('What-If Planner', () => {
  // The planner only lists categories with targets. Seeded with TARGET_CATEGORIES
  // (fixtures.ts): Rent $1,500, Groceries $400, Utilities $150, and no income.
  test.beforeEach(async ({ budgetWithTargets: _seed, planningPage }) => {
    await planningPage.goto();
  });

  test('should display planner page', async ({ planningPage }) => {
    await expect(planningPage.heading).toHaveText('What-If Planner');
  });

  test('should show summary cards', async ({ planningPage }) => {
    await expect(planningPage.incomeValue).toHaveText('$0.00');
    await expect(planningPage.needValue).toHaveText('$2,050.00');
  });

  test('should simulate income override', async ({ planningPage }) => {
    await planningPage.simulateIncome('8000');

    await expect(planningPage.incomeValue).toHaveText('$8,000.00');
  });

  test('should clear income override', async ({ planningPage }) => {
    await planningPage.simulateIncome('10000');

    await planningPage.clearIncomeOverride();

    await expect(planningPage.incomeValue).toHaveText('$0.00');
  });

  test('should edit planned amounts using table inputs', async ({ planningPage }) => {
    const firstInput = planningPage.getPlannedInput(0);
    await firstInput.fill('200');

    await expect(firstInput).toHaveValue('200');
  });

  test('should show delta for modified categories', async ({ planningPage }) => {
    await planningPage.setPlannedAmount('Rent', '300');

    await expect(planningPage.categoryDelta('Rent')).toHaveText('-$1,200.00');
  });

  test('should update surplus/shortfall on changes', async ({ page, planningPage }) => {
    await expect(page.getByTestId('planner-surplus-label')).toHaveText('Shortfall');
    await expect(planningPage.surplusValue).toHaveText('$2,050.00');

    await planningPage.simulateIncome('3000');

    await expect(page.getByTestId('planner-surplus-label')).toHaveText('Surplus');
    await expect(planningPage.surplusValue).toHaveText('$950.00');
  });

  test('should edit a planned amount by row', async ({ planningPage }) => {
    const secondRowInput = planningPage.getPlannedInput(1);
    await secondRowInput.fill('150');

    await expect(secondRowInput).toHaveValue('150');
  });

  test('should show table footer totals', async ({ planningPage }) => {
    await expect(planningPage.tableTotal).toHaveText('$2,050.00');
  });

  test('should handle multiple planned edits', async ({ planningPage }) => {
    await planningPage.getPlannedInput(0).fill('100');
    await planningPage.getPlannedInput(1).fill('250');
    await planningPage.getPlannedInput(2).fill('175');

    await expect(planningPage.tableTotal).toHaveText('$525.00');
  });
});

test.describe('What-If Planner with a yearly target', () => {
  test('should show the monthly share of a yearly target', async ({
    newUser: _newUser,
    budgetPage,
    planningPage,
  }) => {
    await budgetPage.createCategory('Insurance');
    await budgetPage.setTarget('Insurance', 'Monthly Spending', '1200', 'Yearly');

    // The Budget page correctly needs $1,200 / 12 = $100 this month.
    await expect(budgetPage.categoryRow('Insurance').getByTestId('category-status')).toHaveText(
      'Underfunded by $100.00',
    );

    await planningPage.goto();

    // Known bug: the planner's computeMonthlyNeed (src/features/planning/PlanningPage.tsx)
    // ignores target frequency, so a $1,200 yearly target counts as $1,200/month
    // instead of $100/month like the Budget page (convex/shared/budgetMath.ts).
    // Marked here, not at the top, so a failure in the setup above still fails
    // the test normally. Remove once fixed; Playwright fails the test if it passes.
    test.fail(true, 'Known bug: Planner treats a yearly target as a monthly amount');
    await expect(planningPage.needValue).toHaveText('$100.00');
  });
});
