import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { ExchangePage } from '../pages/exchange.page'
import { testUsers, testExchangeItems } from '../fixtures/test-data'

test.describe('Medal Exchange Flow Tests', () => {
  let authPage: AuthPage
  let exchangePage: ExchangePage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    exchangePage = new ExchangePage(page)
    
    // Login first
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, testUsers.normalUser.password)
    await authPage.expectLoginSuccess()
  })

  test('TC-024: Exchange item list display', async ({ page }) => {
    await exchangePage.goto()
    await expect(exchangePage.itemList).toBeVisible()
  })

  test('TC-025: Exchange item selection', async ({ page }) => {
    await exchangePage.goto()
    await exchangePage.selectItem(testExchangeItems.basicItem.name)
    await expect(page.locator('text=' + testExchangeItems.basicItem.name)).toBeVisible()
  })

  test('TC-026: Successful item exchange', async ({ page }) => {
    await exchangePage.goto()
    await exchangePage.exchangeItem(testExchangeItems.basicItem.name)
    await exchangePage.expectExchangeSuccess()
  })

  test('TC-027: Insufficient medals for exchange', async ({ page }) => {
    // Try to exchange expensive item with limited medals
    await exchangePage.goto()
    await exchangePage.exchangeItem(testExchangeItems.limitedItem.name)
    await exchangePage.expectInsufficientMedals()
  })

  test('TC-028: Exchange limit reached', async ({ page }) => {
    // Exchange limited item multiple times to hit limit
    await exchangePage.goto()
    await exchangePage.exchangeItem(testExchangeItems.limitedItem.name)
    await exchangePage.exchangeItem(testExchangeItems.limitedItem.name)
    await exchangePage.expectExchangeLimit()
  })

  test('TC-029: Out of stock item exchange', async ({ page }) => {
    await exchangePage.goto()
    // Simulate out of stock scenario
    await exchangePage.selectItem('Out of Stock Item')
    await exchangePage.exchangeButton.click()
    await exchangePage.expectItemOutOfStock()
  })

  test('TC-030: Medal balance update after exchange', async ({ page }) => {
    const initialBalance = testUsers.normalUser.medalBalance
    await exchangePage.goto()
    await exchangePage.exchangeItem(testExchangeItems.basicItem.name)
    await expect(exchangePage.medalBalance).toHaveText(
      (initialBalance - testExchangeItems.basicItem.cost).toString()
    )
  })

  test('TC-031: Exchange history access', async ({ page }) => {
    await exchangePage.goto()
    await exchangePage.gotoHistory()
    await expect(page).toHaveURL(/\/exchange\/history/)
  })

  test('TC-032: Exchange confirmation dialog', async ({ page }) => {
    await exchangePage.goto()
    await exchangePage.selectItem(testExchangeItems.basicItem.name)
    await exchangePage.exchangeButton.click()
    await expect(exchangePage.confirmButton).toBeVisible()
    await expect(exchangePage.cancelButton).toBeVisible()
  })

  test('TC-033: Exchange cancellation', async ({ page }) => {
    await exchangePage.goto()
    await exchangePage.selectItem(testExchangeItems.basicItem.name)
    await exchangePage.exchangeButton.click()
    await exchangePage.cancelButton.click()
    // Should return to exchange list without exchanging
    await expect(exchangePage.itemList).toBeVisible()
  })

  test('TC-034: Item cost display', async ({ page }) => {
    await exchangePage.goto()
    await expect(page.locator(`text=${testExchangeItems.basicItem.cost}`)).toBeVisible()
  })

  test('TC-035: Stock quantity display', async ({ page }) => {
    await exchangePage.goto()
    await expect(page.locator(`text=在庫: ${testExchangeItems.basicItem.stock}`)).toBeVisible()
  })
})