import { test as base, expect, Page } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { testUsers } from './test-data'

export const test = base.extend<{
  authPage: AuthPage
  authenticatedPage: Page
}>({
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page)
    await use(authPage)
  },

  authenticatedPage: async ({ page }, use) => {
    const authPage = new AuthPage(page)
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, testUsers.normalUser.password)
    await authPage.expectLoginSuccess()
    await use(page)
  },
})

export { expect } from '@playwright/test'