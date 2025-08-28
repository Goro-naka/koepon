import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { GachaPage } from '../pages/gacha.page'
import { testUsers, testGachas } from '../fixtures/test-data'

test.describe('Gacha Flow Tests', () => {
  let authPage: AuthPage
  let gachaPage: GachaPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    gachaPage = new GachaPage(page)
    
    // Login first
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, testUsers.normalUser.password)
    await authPage.expectLoginSuccess()
  })

  test('TC-009: Gacha list display', async ({ page }) => {
    await gachaPage.goto()
    await gachaPage.expectGachaList()
  })

  test('TC-010: Gacha detail view', async ({ page }) => {
    await gachaPage.gotoGacha(testGachas.basicGacha.id)
    await gachaPage.expectGachaDetail(testGachas.basicGacha.name)
  })

  test('TC-011: Single gacha draw', async ({ page }) => {
    await gachaPage.gotoGacha(testGachas.basicGacha.id)
    await gachaPage.performDraw()
    await gachaPage.expectDrawResult()
  })

  test('TC-012: Ten gacha draw', async ({ page }) => {
    await gachaPage.gotoGacha(testGachas.basicGacha.id)
    await gachaPage.performTenDraw()
    await gachaPage.expectDrawResult()
  })

  test('TC-013: Medal balance update after draw', async ({ page }) => {
    const initialBalance = testUsers.normalUser.medalBalance
    await gachaPage.gotoGacha(testGachas.basicGacha.id)
    await gachaPage.performDraw()
    await gachaPage.expectMedalBalance(initialBalance - testGachas.basicGacha.price)
  })

  test('TC-014: Insufficient medals error', async ({ page }) => {
    // Simulate user with low medals
    await gachaPage.gotoGacha(testGachas.expensiveGacha.id)
    await gachaPage.performDraw()
    await gachaPage.expectInsufficientMedals()
  })

  test('TC-015: Gacha search functionality', async ({ page }) => {
    await gachaPage.goto()
    await gachaPage.searchGacha(testGachas.basicGacha.name)
    await gachaPage.expectGachaDetail(testGachas.basicGacha.name)
  })

  test('TC-016: Gacha history access', async ({ page }) => {
    await gachaPage.goto()
    await gachaPage.gotoHistory()
    await expect(page).toHaveURL(/\/gacha\/history/)
  })

  test('TC-017: Draw animation timing', async ({ page }) => {
    await gachaPage.gotoGacha(testGachas.basicGacha.id)
    const startTime = Date.now()
    await gachaPage.performDraw()
    const endTime = Date.now()
    expect(endTime - startTime).toBeGreaterThanOrEqual(3000) // 3 second animation
  })

  test('TC-018: Ten draw animation timing', async ({ page }) => {
    await gachaPage.gotoGacha(testGachas.basicGacha.id)
    const startTime = Date.now()
    await gachaPage.performTenDraw()
    const endTime = Date.now()
    expect(endTime - startTime).toBeGreaterThanOrEqual(5000) // 5 second animation
  })

  test('TC-019: Gacha filter functionality', async ({ page }) => {
    await gachaPage.goto()
    await gachaPage.filterButton.click()
    // Will fail because filter functionality is not implemented yet
    await expect(page.locator('[data-testid="filter-panel"]')).toBeVisible()
  })

  test('TC-020: Medal balance display accuracy', async ({ page }) => {
    await gachaPage.goto()
    await gachaPage.expectMedalBalance(testUsers.normalUser.medalBalance)
  })

  test('TC-021: Gacha card display', async ({ page }) => {
    await gachaPage.goto()
    await expect(gachaPage.gachaCard.first()).toBeVisible()
  })

  test('TC-022: Gacha selection', async ({ page }) => {
    await gachaPage.goto()
    await gachaPage.selectGacha(testGachas.basicGacha.name)
    await gachaPage.expectGachaDetail(testGachas.basicGacha.name)
  })

  test('TC-023: Draw button availability', async ({ page }) => {
    await gachaPage.gotoGacha(testGachas.basicGacha.id)
    await expect(gachaPage.drawButton).toBeVisible()
    await expect(gachaPage.tenDrawButton).toBeVisible()
  })
})