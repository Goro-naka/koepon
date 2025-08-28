import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { GachaPage } from '../pages/gacha.page'
import { testUsers } from '../fixtures/test-data'

test.describe('Edge Cases and Error Handling Tests', () => {
  let authPage: AuthPage
  let gachaPage: GachaPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    gachaPage = new GachaPage(page)
  })

  test('TC-081: Network failure handling', async ({ page }) => {
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, testUsers.normalUser.password)
    
    // Simulate network failure
    await page.route('**/api/**', route => route.abort())
    
    await gachaPage.goto()
    await expect(page.locator('text=ネットワークエラーが発生しました')).toBeVisible()
  })

  test('TC-082: Session timeout handling', async ({ page }) => {
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, testUsers.normalUser.password)
    
    // Simulate session timeout by clearing cookies
    await page.context().clearCookies()
    
    await gachaPage.goto()
    // Should redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('TC-083: Invalid URL handling', async ({ page }) => {
    await page.goto('/invalid-page-that-does-not-exist')
    await expect(page.locator('text=404')).toBeVisible()
  })

  test('TC-084: Malformed data handling', async ({ page }) => {
    await authPage.goto()
    
    // Simulate malformed API response
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      })
    })
    
    await authPage.login(testUsers.normalUser.email, testUsers.normalUser.password)
    await expect(page.locator('text=データ処理エラーが発生しました')).toBeVisible()
  })

  test('TC-085: Extremely long input handling', async ({ page }) => {
    await authPage.gotoRegister()
    
    const longString = 'a'.repeat(1000)
    await authPage.emailInput.fill(longString + '@example.com')
    await authPage.passwordInput.fill('ValidPass123!')
    await authPage.displayNameInput.fill(longString)
    
    await authPage.registerButton.click()
    await expect(page.locator('text=入力値が長すぎます')).toBeVisible()
  })
})