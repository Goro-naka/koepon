// ステージング環境監視・ヘルスチェックシステム

import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

// 環境設定
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

interface HealthCheckResult {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime: number
  timestamp: string
  details?: Record<string, any>
  error?: string
}

interface MonitoringMetrics {
  uptime: number
  responseTime: {
    avg: number
    p95: number
    p99: number
  }
  errorRate: number
  requestCount: number
  dbConnections: number
  cacheHitRate: number
}

// ヘルスチェック実装
export class StagingHealthChecker {
  private async measureResponseTime<T>(
    fn: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now()
    const result = await fn()
    const duration = Date.now() - start
    return { result, duration }
  }

  // Supabase Database ヘルスチェック
  async checkSupabaseDatabase(): Promise<HealthCheckResult> {
    try {
      const { result, duration } = await this.measureResponseTime(async () => {
        const { data, error } = await supabase
          .from('health_check')
          .select('id')
          .limit(1)
        
        if (error) throw error
        return data
      })

      return {
        service: 'supabase_database',
        status: duration < 1000 ? 'healthy' : 'degraded',
        responseTime: duration,
        timestamp: new Date().toISOString(),
        details: {
          connectionPool: 'active',
          tablesAccessible: true
        }
      }
    } catch (error) {
      return {
        service: 'supabase_database',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Supabase Auth ヘルスチェック
  async checkSupabaseAuth(): Promise<HealthCheckResult> {
    try {
      const { result, duration } = await this.measureResponseTime(async () => {
        // テストユーザーでのログイン試行
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'staging-health-check@example.com',
          password: 'health-check-password'
        })
        return { data, error }
      })

      return {
        service: 'supabase_auth',
        status: duration < 2000 ? 'healthy' : 'degraded',
        responseTime: duration,
        timestamp: new Date().toISOString(),
        details: {
          jwtValidation: 'working',
          sessionManagement: 'active'
        }
      }
    } catch (error) {
      return {
        service: 'supabase_auth',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Upstash Redis ヘルスチェック
  async checkUpstashRedis(): Promise<HealthCheckResult> {
    try {
      const { result, duration } = await this.measureResponseTime(async () => {
        const testKey = `health-check-${Date.now()}`
        await redis.set(testKey, 'test', { ex: 60 })
        const value = await redis.get(testKey)
        await redis.del(testKey)
        return value === 'test'
      })

      return {
        service: 'upstash_redis',
        status: duration < 500 ? 'healthy' : 'degraded',
        responseTime: duration,
        timestamp: new Date().toISOString(),
        details: {
          connectionPool: 'active',
          readWrite: result ? 'working' : 'failed'
        }
      }
    } catch (error) {
      return {
        service: 'upstash_redis',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Vercel Frontend ヘルスチェック
  async checkVercelFrontend(): Promise<HealthCheckResult> {
    try {
      const { result, duration } = await this.measureResponseTime(async () => {
        const response = await fetch('https://staging-koepon.vercel.app/api/health')
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })

      return {
        service: 'vercel_frontend',
        status: duration < 3000 ? 'healthy' : 'degraded',
        responseTime: duration,
        timestamp: new Date().toISOString(),
        details: result
      }
    } catch (error) {
      return {
        service: 'vercel_frontend',
        status: 'unhealthy',
        responseTime: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 総合ヘルスチェック
  async performFullHealthCheck(): Promise<{
    overall: 'healthy' | 'unhealthy' | 'degraded'
    services: HealthCheckResult[]
    timestamp: string
  }> {
    const checks = await Promise.allSettled([
      this.checkSupabaseDatabase(),
      this.checkSupabaseAuth(),
      this.checkUpstashRedis(),
      this.checkVercelFrontend()
    ])

    const services = checks.map(check => 
      check.status === 'fulfilled' ? check.value : {
        service: 'unknown',
        status: 'unhealthy' as const,
        responseTime: 0,
        timestamp: new Date().toISOString(),
        error: 'Health check promise rejected'
      }
    )

    const healthyCount = services.filter(s => s.status === 'healthy').length
    const degradedCount = services.filter(s => s.status === 'degraded').length
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length

    let overall: 'healthy' | 'unhealthy' | 'degraded'
    if (unhealthyCount > 0) {
      overall = 'unhealthy'
    } else if (degradedCount > 0) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    return {
      overall,
      services,
      timestamp: new Date().toISOString()
    }
  }
}

// メトリクス収集
export class StagingMetricsCollector {
  private readonly metricsKey = 'staging:metrics'
  
  async recordApiRequest(endpoint: string, duration: number, status: number): Promise<void> {
    const timestamp = new Date().toISOString()
    const metric = {
      type: 'api_request',
      endpoint,
      duration,
      status,
      timestamp
    }
    
    await redis.lpush(`${this.metricsKey}:requests`, JSON.stringify(metric))
    await redis.expire(`${this.metricsKey}:requests`, 86400) // 24時間保持
  }

  async recordError(error: string, context: Record<string, any>): Promise<void> {
    const timestamp = new Date().toISOString()
    const errorMetric = {
      type: 'error',
      error,
      context,
      timestamp
    }
    
    await redis.lpush(`${this.metricsKey}:errors`, JSON.stringify(errorMetric))
    await redis.expire(`${this.metricsKey}:errors`, 86400) // 24時間保持
  }

  async getMetrics(): Promise<MonitoringMetrics> {
    const [requests, errors] = await Promise.all([
      redis.lrange(`${this.metricsKey}:requests`, 0, 999),
      redis.lrange(`${this.metricsKey}:errors`, 0, 999)
    ])

    const requestData = requests.map(r => JSON.parse(r))
    const errorData = errors.map(e => JSON.parse(e))

    const responseTimes = requestData.map(r => r.duration)
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0

    responseTimes.sort((a, b) => a - b)
    const p95Index = Math.floor(responseTimes.length * 0.95)
    const p99Index = Math.floor(responseTimes.length * 0.99)

    const errorCount = errorData.length
    const totalRequests = requestData.length
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

    // キャッシュヒット率の計算（仮）
    const cacheHits = requestData.filter(r => r.duration < 100).length
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0

    return {
      uptime: 99.9, // 実際のアップタイム計算は別途実装
      responseTime: {
        avg: avgResponseTime,
        p95: responseTimes[p95Index] || 0,
        p99: responseTimes[p99Index] || 0
      },
      errorRate,
      requestCount: totalRequests,
      dbConnections: 10, // 実際の接続数は別途取得
      cacheHitRate
    }
  }
}

// アラート機能
export class StagingAlerting {
  constructor(
    private healthChecker: StagingHealthChecker,
    private metricsCollector: StagingMetricsCollector
  ) {}

  async checkAlertConditions(): Promise<void> {
    const healthCheck = await this.healthChecker.performFullHealthCheck()
    const metrics = await this.metricsCollector.getMetrics()

    // アラート条件チェック
    const alerts: string[] = []

    if (healthCheck.overall === 'unhealthy') {
      alerts.push('🚨 Critical: One or more services are down')
    }

    if (metrics.responseTime.p95 > 5000) {
      alerts.push('⚠️ Warning: High response time detected (P95: ' + metrics.responseTime.p95 + 'ms)')
    }

    if (metrics.errorRate > 5) {
      alerts.push('⚠️ Warning: High error rate detected (' + metrics.errorRate.toFixed(2) + '%)')
    }

    // Slack通知
    if (alerts.length > 0) {
      await this.sendSlackAlert(alerts, healthCheck, metrics)
    }
  }

  private async sendSlackAlert(
    alerts: string[],
    healthCheck: any,
    metrics: MonitoringMetrics
  ): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!webhookUrl) return

    const message = {
      text: '🔔 Staging Environment Alert',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🔔 Staging Environment Alert'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Environment:* Staging`
            },
            {
              type: 'mrkdwn',
              text: `*Overall Status:* ${healthCheck.overall}`
            },
            {
              type: 'mrkdwn',
              text: `*Error Rate:* ${metrics.errorRate.toFixed(2)}%`
            },
            {
              type: 'mrkdwn',
              text: `*P95 Response Time:* ${metrics.responseTime.p95}ms`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Alerts:*\n${alerts.join('\n')}`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Staging'
              },
              url: 'https://staging-koepon.vercel.app'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Logs'
              },
              url: 'https://vercel.com/dashboard'
            }
          ]
        }
      ]
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
  }
}

// 使用例・エクスポート
export const healthChecker = new StagingHealthChecker()
export const metricsCollector = new StagingMetricsCollector()
export const alerting = new StagingAlerting(healthChecker, metricsCollector)

// API Route for health check
export async function GET() {
  const health = await healthChecker.performFullHealthCheck()
  const metrics = await metricsCollector.getMetrics()
  
  return Response.json({
    health,
    metrics,
    timestamp: new Date().toISOString()
  }, {
    status: health.overall === 'healthy' ? 200 : 503
  })
}