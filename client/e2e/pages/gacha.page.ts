import { Page, Locator } from '@playwright/test'

export class GachaPage {
  readonly page: Page
  readonly gachaList: Locator
  readonly gachaCard: Locator
  readonly searchInput: Locator
  readonly filterButton: Locator
  readonly drawButton: Locator
  readonly tenDrawButton: Locator
  readonly medalBalance: Locator
  readonly drawResult: Locator
  readonly historyButton: Locator

  constructor(page: Page) {
    this.page = page
    this.gachaList = page.locator('[data-testid="gacha-list"]')
    this.gachaCard = page.locator('[data-testid="gacha-card"]')
    this.searchInput = page.locator('input[placeholder*="検索"]')
    this.filterButton = page.locator('button', { hasText: 'フィルター' })
    this.drawButton = page.locator('button', { hasText: '1回引く' })
    this.tenDrawButton = page.locator('button', { hasText: '10回引く' })
    this.medalBalance = page.locator('[data-testid="medal-balance"]')
    this.drawResult = page.locator('[data-testid="draw-result"]')
    this.historyButton = page.locator('button', { hasText: '履歴' })
  }

  async goto() {
    await this.page.goto('/gacha')
  }

  async gotoGacha(gachaId: string) {
    await this.page.goto(`/gacha/${gachaId}`)
  }

  async gotoHistory() {
    await this.page.goto('/gacha/history')
  }

  async searchGacha(query: string) {
    await this.searchInput.fill(query)
    await this.page.keyboard.press('Enter')
  }

  async selectGacha(gachaName: string) {
    await this.page.locator('text=' + gachaName).first().click()
  }

  async performDraw() {
    await this.drawButton.click()
    // Wait for draw animation
    await this.page.waitForTimeout(3000)
  }

  async performTenDraw() {
    await this.tenDrawButton.click()
    // Wait for draw animation
    await this.page.waitForTimeout(5000)
  }

  async expectGachaList() {
    await this.gachaList.waitFor()
    // Will fail because gacha list is not implemented yet
  }

  async expectGachaDetail(gachaName: string) {
    await this.page.locator('h1', { hasText: gachaName }).waitFor()
    // Will fail because gacha detail page is not implemented yet
  }

  async expectDrawResult() {
    await this.drawResult.waitFor()
    // Will fail because draw result display is not implemented yet
  }

  async expectMedalBalance(_expectedBalance: number) {
    await this.medalBalance.waitFor()
    // Will fail because medal balance display is not implemented yet
  }

  async expectInsufficientMedals() {
    await this.page.locator('text=メダルが不足しています').waitFor()
    // Will fail because insufficient medal error is not implemented yet
  }
}