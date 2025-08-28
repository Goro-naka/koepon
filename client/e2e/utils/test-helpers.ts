import { Page } from '@playwright/test'

export class TestHelpers {
  static async waitForApiResponse(page: Page, url: string, timeout = 5000): Promise<void> {
    await page.waitForResponse(response => response.url().includes(url), { timeout })
  }

  static async simulateSlowNetwork(page: Page): Promise<void> {
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 2000)
    })
  }

  static async clearLocalStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  }

  static async mockApiError(page: Page, endpoint: string, statusCode = 500): Promise<void> {
    await page.route(`**/api/${endpoint}`, route => {
      route.fulfill({
        status: statusCode,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Mocked API error' })
      })
    })
  }

  static async takeScreenshotOnFailure(page: Page, testName: string): Promise<void> {
    await page.screenshot({ 
      path: `test-results/screenshots/${testName}-failure.png`,
      fullPage: true 
    })
  }

  static generateTestEmail(prefix = 'test'): string {
    const timestamp = Date.now()
    return `${prefix}-${timestamp}@koepon.com`
  }

  static async waitForElementCount(
    page: Page, 
    selector: string, 
    expectedCount: number, 
    timeout = 5000
  ): Promise<void> {
    await page.waitForFunction(
      ({ selector, count }) => {
        return document.querySelectorAll(selector).length === count
      },
      { selector, count: expectedCount },
      { timeout }
    )
  }

  static async scrollToBottom(page: Page): Promise<void> {
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
  }
}