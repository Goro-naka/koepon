import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { testUsers, testRewards } from '../fixtures/test-data'

test.describe('Rewards Box Flow Tests', () => {
  let authPage: AuthPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    
    // Login first
    await authPage.goto()
    await authPage.login(testUsers.normalUser.email, testUsers.normalUser.password)
    await authPage.expectLoginSuccess()
  })

  test('TC-036: Rewards box access', async ({ page }) => {
    await page.goto('/rewards')
    await expect(page.locator('[data-testid="rewards-list"]')).toBeVisible()
  })

  test('TC-037: Reward list display', async ({ page }) => {
    await page.goto('/rewards')
    await expect(page.locator('[data-testid="reward-item"]').first()).toBeVisible()
  })

  test('TC-038: Image reward download', async ({ page }) => {
    await page.goto('/rewards')
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download')
    await page.locator(`text=${testRewards.imageReward.name}`).click()
    await page.locator('button', { hasText: 'ダウンロード' }).click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.jpg')
  })

  test('TC-039: Video reward download', async ({ page }) => {
    await page.goto('/rewards')
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download')
    await page.locator(`text=${testRewards.videoReward.name}`).click()
    await page.locator('button', { hasText: 'ダウンロード' }).click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.mp4')
  })

  test('TC-040: Download progress indicator', async ({ page }) => {
    await page.goto('/rewards')
    await page.locator(`text=${testRewards.imageReward.name}`).click()
    await page.locator('button', { hasText: 'ダウンロード' }).click()
    
    // Check for progress indicator
    await expect(page.locator('[data-testid="download-progress"]')).toBeVisible()
  })

  test('TC-041: File size display', async ({ page }) => {
    await page.goto('/rewards')
    await expect(page.locator(`text=${(testRewards.imageReward.fileSize / 1024 / 1024).toFixed(1)}MB`)).toBeVisible()
  })

  test('TC-042: Reward category filtering', async ({ page }) => {
    await page.goto('/rewards')
    await page.locator('select[name="category"]').selectOption('image')
    await expect(page.locator(`text=${testRewards.imageReward.name}`)).toBeVisible()
    await expect(page.locator(`text=${testRewards.videoReward.name}`)).not.toBeVisible()
  })

  test('TC-043: Download timeout handling', async ({ page }) => {
    // Simulate slow download
    await page.route('**/api/rewards/*/download', route => {
      setTimeout(() => route.continue(), 6000) // 6 second delay
    })
    
    await page.goto('/rewards')
    await page.locator(`text=${testRewards.imageReward.name}`).click()
    await page.locator('button', { hasText: 'ダウンロード' }).click()
    
    // Should show timeout message after 5 seconds
    await expect(page.locator('text=ダウンロードがタイムアウトしました')).toBeVisible({ timeout: 6000 })
  })

  test('TC-044: Reward preview functionality', async ({ page }) => {
    await page.goto('/rewards')
    await page.locator(`text=${testRewards.imageReward.name}`).click()
    await expect(page.locator('[data-testid="reward-preview"]')).toBeVisible()
  })

  test('TC-045: Empty rewards box', async ({ page }) => {
    // Simulate user with no rewards
    await authPage.login('empty@koepon.com', 'EmptyPass123!')
    await page.goto('/rewards')
    await expect(page.locator('text=まだ獲得した報酬がありません')).toBeVisible()
  })
})