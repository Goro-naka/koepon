import { Page } from '@playwright/test'
import { performanceThresholds } from '../fixtures/test-groups'

export class PerformanceTesting {
  constructor(private page: Page) {}

  async measurePageLoadTime(url: string): Promise<number> {
    const startTime = Date.now()
    await this.page.goto(url)
    await this.page.waitForLoadState('networkidle')
    return Date.now() - startTime
  }

  async measureApiResponseTime(apiEndpoint: string): Promise<number> {
    let responseTime = 0
    
    this.page.on('response', response => {
      if (response.url().includes(apiEndpoint)) {
        responseTime = response.timing().responseEnd
      }
    })
    
    await this.page.goto('/')
    return responseTime
  }

  async measureActionTime(action: () => Promise<void>): Promise<number> {
    const startTime = Date.now()
    await action()
    return Date.now() - startTime
  }

  async captureMetrics() {
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        totalBlockingTime: navigation.domInteractive - navigation.domLoading,
      }
    })
    return metrics
  }

  async checkPerformanceThresholds(metrics: { [key: string]: number }) {
    const violations = []
    
    if (metrics.pageLoad && metrics.pageLoad > performanceThresholds.pageLoad) {
      violations.push(`Page load time ${metrics.pageLoad}ms exceeds threshold ${performanceThresholds.pageLoad}ms`)
    }
    
    if (metrics.apiResponse && metrics.apiResponse > performanceThresholds.apiResponse) {
      violations.push(`API response time ${metrics.apiResponse}ms exceeds threshold ${performanceThresholds.apiResponse}ms`)
    }
    
    return violations
  }

  async monitorMemoryUsage() {
    return await this.page.evaluate(() => {
      const memory = (performance as any).memory
      if (memory) {
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        }
      }
      return null
    })
  }
}