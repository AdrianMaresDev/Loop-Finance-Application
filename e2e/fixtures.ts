import { test as base, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { SignInPage } from './pages/SignInPage';
import { BudgetPage } from './pages/BudgetPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { PlanningPage } from './pages/PlanningPage';

export type TestUser = { email: string; password: string };

/**
 * Categories created by the `budgetWithTargets` fixture, all with a monthly
 * spending target. With no income, the expected totals are:
 * target $2,050, assigned $1,750, funded 1 (Rent), underfunded 2.
 */
export const TARGET_CATEGORIES = [
  { name: 'Rent', target: 1500, assigned: 1500 }, // funded
  { name: 'Groceries', target: 400, assigned: 250 }, // underfunded by $150
  { name: 'Utilities', target: 150, assigned: 0 }, // underfunded by $150
] as const;

type Fixtures = {
  signInPage: SignInPage;
  budgetPage: BudgetPage;
  transactionsPage: TransactionsPage;
  reportsPage: ReportsPage;
  planningPage: PlanningPage;
  /**
   * Signs up a brand-new user through the app's sign-up form and leaves the page
   * signed in on the Budget page. Each test gets its own empty account, so tests
   * are isolated from each other and from previous runs.
   *
   * No teardown: the app has no way to delete an account, and the backend is
   * not ours to change. Isolation comes from never reusing an account.
   */
  newUser: TestUser;
  /** `newUser` plus the TARGET_CATEGORIES, created through the Budget page. */
  budgetWithTargets: typeof TARGET_CATEGORIES;
};

export const test = base.extend<Fixtures>({
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },
  budgetPage: async ({ page }, use) => {
    await use(new BudgetPage(page));
  },
  transactionsPage: async ({ page }, use) => {
    await use(new TransactionsPage(page));
  },
  reportsPage: async ({ page }, use) => {
    await use(new ReportsPage(page));
  },
  planningPage: async ({ page }, use) => {
    await use(new PlanningPage(page));
  },
  newUser: async ({ signInPage, budgetPage }, use, testInfo) => {
    const user: TestUser = {
      email: `e2e-${randomUUID()}@example.test`,
      password: `pw-${randomUUID()}`,
    };
    await signInPage.goto();
    await signInPage.signUp(user.email, user.password);
    await budgetPage.waitForBudgetLoad();
    // Shows up in the HTML report, so a failing test's account can be inspected.
    testInfo.annotations.push({ type: 'user', description: user.email });
    await use(user);
  },
  budgetWithTargets: async ({ newUser: _newUser, budgetPage }, use) => {
    for (const category of TARGET_CATEGORIES) {
      await budgetPage.createCategory(category.name);
      if (category.assigned > 0) {
        await budgetPage.assignBudget(category.name, String(category.assigned));
      }
      await budgetPage.setTarget(category.name, 'Monthly Spending', String(category.target));
    }
    await use(TARGET_CATEGORIES);
  },
});

export { expect };
