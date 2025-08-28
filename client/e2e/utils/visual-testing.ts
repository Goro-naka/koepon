import { Page, expect } from '@playwright/test'

export class VisualTesting {
  constructor(private page: Page) {}

  async takeFullPageScreenshot(name: string) {
    return await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true 
    })
  }

  async compareVisualRegression(name: string, selector?: string) {
    if (selector) {
      const element = this.page.locator(selector)
      await expect(element).toHaveScreenshot(`${name}-element.png`)
    } else {
      await expect(this.page).toHaveScreenshot(`${name}-page.png`)
    }
  }

  async waitForStableLayout(timeout = 5000) {
    // Wait for layout shifts to settle
    await this.page.waitForFunction(() => {
      return new Promise(resolve => {
        let timer: NodeJS.Timeout
        const observer = new ResizeObserver(() => {
          clearTimeout(timer)
          timer = setTimeout(() => {
            observer.disconnect()
            resolve(true)
          }, 100)
        })
        observer.observe(document.body)
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect()
          resolve(true)
        }, 3000)
      })
    }, { timeout })
  }

  async maskDynamicContent() {
    // Mask timestamps, random IDs, and other dynamic content
    await this.page.addStyleTag({
      content: `
        [data-testid*="timestamp"],
        [data-testid*="id"],
        .timestamp,
        .dynamic-content {
          background: #000 !important;
          color: transparent !important;
        }
      `
    })
  }
}