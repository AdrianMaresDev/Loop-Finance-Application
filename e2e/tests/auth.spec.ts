import { test, expect } from '../fixtures';
import { randomUUID } from 'node:crypto';

// Defaults to the account from the original suite (not present on the current
// deployment); override with E2E_EMAIL / E2E_PASSWORD.
const VALID_EMAIL = process.env.E2E_EMAIL ?? 'testuser@example.com';
const VALID_PASSWORD = process.env.E2E_PASSWORD ?? 'password123';

test.describe('Authentication', () => {
  test.beforeEach(async ({ signInPage }) => {
    await signInPage.goto();
  });

  test('should display sign in form', async ({ signInPage }) => {
    await expect(signInPage.emailInput).toBeVisible();
    await expect(signInPage.passwordInput).toBeVisible();
    await expect(signInPage.submitButton).toBeVisible();
  });

  test('should sign in with valid credentials', async ({ page, signInPage }) => {
    await signInPage.signIn(VALID_EMAIL, VALID_PASSWORD);

    await expect(page.getByTestId('app-main')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ signInPage }) => {
    await signInPage.fillEmail('bad@example.com');
    await signInPage.fillPassword('wrongpassword');
    await signInPage.clickSignIn();

    await expect(signInPage.errorToast).toBeVisible();
  });

  test('should switch to sign up flow', async ({ signInPage }) => {
    await signInPage.switchToSignUp();

    await expect(signInPage.submitButton).toHaveText('Sign up');
  });

  test('should sign up new user', async ({ page, signInPage }) => {
    await signInPage.signUp(`e2e-${randomUUID()}@example.test`, 'securepassword');

    await expect(page.getByTestId('app-main')).toBeVisible();
  });

  test('should sign in anonymously', async ({ page, signInPage }) => {
    await signInPage.clickAnonymousSignIn();

    await expect(page.getByTestId('app-main')).toBeVisible();
  });

  test('should have correct number of form fields', async ({ signInPage }) => {
    await expect(signInPage.form.locator('input')).toHaveCount(2);
  });
});
