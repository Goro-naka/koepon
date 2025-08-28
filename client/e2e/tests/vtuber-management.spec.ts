import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { testUsers } from '../fixtures/test-data'

test.describe('VTuber Management Flow Tests', () => {
  let authPage: AuthPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    
    // Login as VTuber user
    await authPage.goto()
    await authPage.login(testUsers.vtuberUser.email, testUsers.vtuberUser.password)
    await authPage.expectLoginSuccess()
  })

  test('TC-046: VTuber dashboard access', async ({ page }) => {
    await page.goto('/vtuber/dashboard')
    await expect(page.locator('[data-testid="vtuber-dashboard"]')).toBeVisible()
  })

  test('TC-047: Gacha creation form', async ({ page }) => {
    await page.goto('/vtuber/gacha/create')
    await expect(page.locator('form[data-testid="gacha-create-form"]')).toBeVisible()
  })

  test('TC-048: Create new gacha', async ({ page }) => {
    await page.goto('/vtuber/gacha/create')
    
    await page.locator('input[name="name"]').fill('新しいガチャ')
    await page.locator('input[name="price"]').fill('150')
    await page.locator('textarea[name="description"]').fill('テスト用の新しいガチャです')
    await page.locator('button[type="submit"]').click()
    
    await expect(page.locator('text=ガチャが作成されました')).toBeVisible()
  })

  test('TC-049: Gacha list management', async ({ page }) => {
    await page.goto('/vtuber/gacha')
    await expect(page.locator('[data-testid="gacha-management-list"]')).toBeVisible()
  })

  test('TC-050: Edit existing gacha', async ({ page }) => {
    await page.goto('/vtuber/gacha')
    await page.locator('button', { hasText: '編集' }).first().click()
    
    await page.locator('input[name="name"]').fill('更新されたガチャ')
    await page.locator('button[type="submit"]').click()
    
    await expect(page.locator('text=ガチャが更新されました')).toBeVisible()
  })

  test('TC-051: Delete gacha', async ({ page }) => {
    await page.goto('/vtuber/gacha')
    await page.locator('button', { hasText: '削除' }).first().click()
    await page.locator('button', { hasText: '確認' }).click()
    
    await expect(page.locator('text=ガチャが削除されました')).toBeVisible()
  })

  test('TC-052: Revenue analytics view', async ({ page }) => {
    await page.goto('/vtuber/analytics')
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
  })

  test('TC-053: User analytics view', async ({ page }) => {
    await page.goto('/vtuber/analytics')
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible()
  })

  test('TC-054: Profile management', async ({ page }) => {
    await page.goto('/vtuber/profile')
    
    await page.locator('input[name="displayName"]').fill('Updated VTuber Name')
    await page.locator('textarea[name="bio"]').fill('Updated bio description')
    await page.locator('button[type="submit"]').click()
    
    await expect(page.locator('text=プロフィールが更新されました')).toBeVisible()
  })

  test('TC-055: Content upload', async ({ page }) => {
    await page.goto('/vtuber/content/upload')
    
    // Simulate file upload
    await page.setInputFiles('input[type="file"]', {
      name: 'test-content.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    })
    
    await page.locator('input[name="title"]').fill('テストコンテンツ')
    await page.locator('button[type="submit"]').click()
    
    await expect(page.locator('text=コンテンツがアップロードされました')).toBeVisible()
  })

  test('TC-056: Content management', async ({ page }) => {
    await page.goto('/vtuber/content')
    await expect(page.locator('[data-testid="content-list"]')).toBeVisible()
  })

  test('TC-057: Earning reports', async ({ page }) => {
    await page.goto('/vtuber/earnings')
    await expect(page.locator('[data-testid="earnings-report"]')).toBeVisible()
    await expect(page.locator('text=今月の収益')).toBeVisible()
  })
})