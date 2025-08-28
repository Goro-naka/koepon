import { test, expect } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'
import { testUsers } from '../fixtures/test-data'

test.describe('Admin Management Flow Tests', () => {
  let authPage: AuthPage

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page)
    
    // Login as admin user
    await authPage.goto()
    await authPage.login(testUsers.adminUser.email, testUsers.adminUser.password)
    await authPage.expectLoginSuccess()
  })

  test('TC-058: Admin dashboard access', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible()
  })

  test('TC-059: User management list', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.locator('[data-testid="user-management-table"]')).toBeVisible()
  })

  test('TC-060: User role update', async ({ page }) => {
    await page.goto('/admin/users')
    await page.locator('select[data-testid="user-role-select"]').first().selectOption('vtuber')
    await page.locator('button', { hasText: '更新' }).first().click()
    
    await expect(page.locator('text=ユーザー役割が更新されました')).toBeVisible()
  })

  test('TC-061: User account suspension', async ({ page }) => {
    await page.goto('/admin/users')
    await page.locator('button', { hasText: 'アカウント停止' }).first().click()
    await page.locator('button', { hasText: '確認' }).click()
    
    await expect(page.locator('text=アカウントが停止されました')).toBeVisible()
  })

  test('TC-062: VTuber application approval', async ({ page }) => {
    await page.goto('/admin/vtuber-applications')
    await page.locator('button', { hasText: '承認' }).first().click()
    
    await expect(page.locator('text=VTuber申請が承認されました')).toBeVisible()
  })

  test('TC-063: VTuber application rejection', async ({ page }) => {
    await page.goto('/admin/vtuber-applications')
    await page.locator('button', { hasText: '却下' }).first().click()
    await page.locator('textarea[name="reason"]').fill('申請内容に不備があります')
    await page.locator('button', { hasText: '確認' }).click()
    
    await expect(page.locator('text=VTuber申請が却下されました')).toBeVisible()
  })

  test('TC-064: System statistics view', async ({ page }) => {
    await page.goto('/admin/statistics')
    await expect(page.locator('[data-testid="system-stats"]')).toBeVisible()
    await expect(page.locator('text=総ユーザー数')).toBeVisible()
    await expect(page.locator('text=総ガチャ数')).toBeVisible()
  })

  test('TC-065: Revenue analytics', async ({ page }) => {
    await page.goto('/admin/analytics/revenue')
    await expect(page.locator('[data-testid="revenue-analytics"]')).toBeVisible()
  })

  test('TC-066: User activity analytics', async ({ page }) => {
    await page.goto('/admin/analytics/users')
    await expect(page.locator('[data-testid="user-activity-chart"]')).toBeVisible()
  })

  test('TC-067: Gacha monitoring', async ({ page }) => {
    await page.goto('/admin/gacha')
    await expect(page.locator('[data-testid="gacha-monitoring-table"]')).toBeVisible()
  })

  test('TC-068: Content moderation', async ({ page }) => {
    await page.goto('/admin/content')
    await page.locator('button', { hasText: '承認' }).first().click()
    
    await expect(page.locator('text=コンテンツが承認されました')).toBeVisible()
  })

  test('TC-069: System configuration', async ({ page }) => {
    await page.goto('/admin/settings')
    
    await page.locator('input[name="maintenanceMode"]').check()
    await page.locator('button', { hasText: '設定保存' }).click()
    
    await expect(page.locator('text=設定が保存されました')).toBeVisible()
  })

  test('TC-070: Audit log viewing', async ({ page }) => {
    await page.goto('/admin/audit')
    await expect(page.locator('[data-testid="audit-log-table"]')).toBeVisible()
  })

  test('TC-071: Payment transaction monitoring', async ({ page }) => {
    await page.goto('/admin/payments')
    await expect(page.locator('[data-testid="payment-transactions"]')).toBeVisible()
  })

  test('TC-072: Medal distribution management', async ({ page }) => {
    await page.goto('/admin/medals')
    
    await page.locator('input[name="userId"]').fill('user123')
    await page.locator('input[name="amount"]').fill('500')
    await page.locator('textarea[name="reason"]').fill('イベント報酬')
    await page.locator('button', { hasText: 'メダル付与' }).click()
    
    await expect(page.locator('text=メダルが付与されました')).toBeVisible()
  })
})