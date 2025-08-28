import { Page, Locator } from '@playwright/test'

export class AuthPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly displayNameInput: Locator
  readonly loginButton: Locator
  readonly registerButton: Locator
  readonly logoutButton: Locator
  readonly errorMessage: Locator
  readonly successMessage: Locator
  readonly termsCheckbox: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[type="email"]')
    this.passwordInput = page.locator('input[type="password"]')
    this.displayNameInput = page.locator('input[name="displayName"]')
    this.loginButton = page.locator('button', { hasText: 'ログイン' })
    this.registerButton = page.locator('button', { hasText: '登録' })
    this.logoutButton = page.locator('button', { hasText: 'ログアウト' })
    this.errorMessage = page.locator('[data-testid="error-message"]')
    this.successMessage = page.locator('[data-testid="success-message"]')
    this.termsCheckbox = page.locator('input[type="checkbox"]')
  }

  async goto() {
    await this.page.goto('/auth/login')
  }

  async gotoRegister() {
    await this.page.goto('/auth/register')
  }

  async gotoPasswordReset() {
    await this.page.goto('/auth/password-reset')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async register(email: string, password: string, displayName: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.displayNameInput.fill(displayName)
    await this.termsCheckbox.check()
    await this.registerButton.click()
  }

  async logout() {
    await this.logoutButton.click()
  }

  async expectLoginSuccess() {
    await this.page.waitForURL('/', { timeout: 10000 })
  }

  async expectRegisterSuccess() {
    await this.page.waitForURL('/auth/verify-email', { timeout: 10000 })
  }

  async expectError(_message: string) {
    await this.errorMessage.waitFor()
    // Will fail because error display is not implemented yet
  }

  async expectLoggedOut() {
    await this.page.waitForURL('/auth/login', { timeout: 10000 })
  }
}