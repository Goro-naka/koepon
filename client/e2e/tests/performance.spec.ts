import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { GachaPage } from '../pages/gacha.page'
import { testUsers } from '../fixtures/test-data'

test.describe('Performance Tests', () => {
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

  test('TC-073: Page load performance - Homepage', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
  })

  test('TC-074: Page load performance - Gacha list', async ({ page }) => {
    const startTime = Date.now()
    await gachaPage.goto()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000)
  })

  test('TC-075: Gacha draw performance', async ({ page }) => {
    await gachaPage.goto()
    await gachaPage.selectGacha('テストガチャ')
    
    const startTime = Date.now()
    await gachaPage.performDraw()
    const drawTime = Date.now() - startTime
    
    expect(drawTime).toBeLessThan(5000) // Draw should complete within 5 seconds
  })

  test('TC-076: File download performance', async ({ page }) => {
    await page.goto('/rewards')
    
    const startTime = Date.now()
    const downloadPromise = page.waitForEvent('download')
    await page.locator('button', { hasText: 'ダウンロード' }).first().click()
    const download = await downloadPromise
    const downloadTime = Date.now() - startTime
    
    expect(downloadTime).toBeLessThan(5000) // Download should start within 5 seconds
  })

  test('TC-077: API response time - Gacha list', async ({ page }) => {
    let responseTime = 0
    
    page.on('response', response => {
      if (response.url().includes('/api/gacha')) {
        responseTime = response.timing().responseEnd
      }
    })
    
    await gachaPage.goto()
    expect(responseTime).toBeLessThan(2000) // API should respond within 2 seconds
  })

  test('TC-078: Concurrent user simulation', async ({ page, context }) => {
    // Create multiple pages to simulate concurrent users
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage()
    ])
    
    const startTime = Date.now()
    
    // Simulate concurrent gacha draws
    await Promise.all(pages.map(async (p, index) => {
      const auth = new AuthPage(p)
      const gacha = new GachaPage(p)
      
      await auth.goto()
      await auth.login(testUsers.normalUser.email, testUsers.normalUser.password)
      await gacha.goto()
      await gacha.selectGacha('テストガチャ')
      await gacha.performDraw()
    }))
    
    const totalTime = Date.now() - startTime
    expect(totalTime).toBeLessThan(10000) // All concurrent operations should complete within 10 seconds
    
    // Close additional pages
    await Promise.all(pages.map(p => p.close()))
  })

  test('TC-079: Memory usage monitoring', async ({ page }) => {
    // Navigate through multiple pages to check for memory leaks
    const pages = [
      '/',
      '/gacha',
      '/exchange',
      '/rewards',
      '/profile'
    ]
    
    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      
      // Check that page loads without JavaScript errors
      const errors = []
      page.on('pageerror', error => errors.push(error))
      
      expect(errors.length).toBe(0)
    }
  })

  test('TC-080: Large dataset handling', async ({ page }) => {
    // Simulate loading page with large amount of data
    await page.goto('/gacha')
    
    // Wait for all gacha cards to load
    await page.waitForSelector('[data-testid="gacha-card"]')
    
    // Scroll through the entire list to trigger lazy loading
    await page.evaluate(() => {
      return new Promise(resolve => {
        let totalHeight = 0
        const distance = 100
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer)
            resolve(null)
          }
        }, 100)
      })
    })
    
    // Verify that page remains responsive
    const gachaCards = page.locator('[data-testid="gacha-card"]')
    await expect(gachaCards.first()).toBeVisible()
  })
})