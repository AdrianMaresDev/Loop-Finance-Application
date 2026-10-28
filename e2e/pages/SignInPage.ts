import { type Page, type Locator, expect } from '@playwright/test';

export class SignInPage {
  readonly page: Page;
  readonly form: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly toggleFlowButton: Locator;
  readonly anonymousButton: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId('signin-form');
    this.emailInput = page.getByTestId('signin-email');
    this.passwordInput = page.getByTestId('signin-password');
    this.submitButton = page.getByTestId('signin-submit');
    this.toggleFlowButton = page.getByTestId('signin-toggle-flow');
    this.anonymousButton = page.getByTestId('signin-anonymous');
    // Auth errors are shown as sonner toasts, not inline in the form.
    this.errorToast = page.locator('[data-sonner-toast][data-type="error"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async fillEmail(value: string) {
    await this.emailInput.fill(value);
  }

  async fillPassword(value: string) {
    await this.passwordInput.fill(value);
  }

  async clickSignIn() {
    await this.submitButton.click();
  }

  async switchToSignUp() {
    await this.toggleFlowButton.click();
    await expect(this.submitButton).toHaveText('Sign up');
  }

  async switchToSignIn() {
    await this.toggleFlowButton.click();
    await expect(this.submitButton).toHaveText('Sign in');
  }

  async clickAnonymousSignIn() {
    await this.anonymousButton.click();
  }

  async signIn(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
    await this.page.getByTestId('app-main').waitFor();
  }

  async signUp(email: string, password: string) {
    await this.switchToSignUp();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSignIn();
    await this.page.getByTestId('app-main').waitFor();
  }

  async getFormFieldCount(): Promise<number> {
    return this.form.locator('input').count();
  }

  async getErrorMessage(): Promise<string | null> {
    return this.errorToast.first().textContent();
  }
}
