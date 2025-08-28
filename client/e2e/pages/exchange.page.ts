import { Page, Locator } from '@playwright/test'

export class ExchangePage {
  readonly page: Page
  readonly itemList: Locator
  readonly itemCard: Locator
  readonly exchangeButton: Locator
  readonly confirmButton: Locator
  readonly cancelButton: Locator
  readonly medalBalance: Locator
  readonly historyButton: Locator

  constructor(page: Page) {
    this.page = page
    this.itemList = page.locator('[data-testid="exchange-items"]')
    this.itemCard = page.locator('[data-testid="exchange-item"]')
    this.exchangeButton = page.locator('button', { hasText: '交換する' })
    this.confirmButton = page.locator('button', { hasText: '確認' })
    this.cancelButton = page.locator('button', { hasText: 'キャンセル' })
    this.medalBalance = page.locator('[data-testid="medal-balance"]')
    this.historyButton = page.locator('button', { hasText: '履歴' })
  }

  async goto() {
    await this.page.goto('/exchange')
  }

  async gotoHistory() {
    await this.page.goto('/exchange/history')
  }

  async selectItem(itemName: string) {
    await this.page.locator('text=' + itemName).first().click()
  }

  async exchangeItem(itemName: string) {
    await this.selectItem(itemName)
    await this.exchangeButton.click()
    await this.confirmButton.click()
  }

  async expectExchangeSuccess() {
    await this.page.locator('text=交換が完了しました').waitFor()
    // Will fail because exchange success message is not implemented yet
  }

  async expectInsufficientMedals() {
    await this.page.locator('text=メダルが不足しています').waitFor()
    // Will fail because insufficient medal error is not implemented yet
  }

  async expectExchangeLimit() {
    await this.page.locator('text=交換上限に達しています').waitFor()
    // Will fail because exchange limit error is not implemented yet
  }

  async expectItemOutOfStock() {
    await this.page.locator('text=在庫がありません').waitFor()
    // Will fail because out of stock error is not implemented yet
  }
}