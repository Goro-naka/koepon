// 本番環境監視・24/7アラートシステム

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
  region?: string
  details?: Record<string, any>
  error?: string
}

interface ProductionMetrics {
  uptime: number
  responseTime: {
    avg: number
    p50: number
    p95: number
    p99: number
  }
  errorRate: number
  requestCount: number
  activeUsers: number
  businessMetrics: {
    gachaPulls: number
    revenue: number
    dau: number
    conversionRate: number
  }
  systemMetrics: {
    dbConnections: number
    cacheHitRate: number
    memoryUsage: number
    diskUsage: number
  }
}

interface AlertRule {
  name: string
  condition: (metrics: ProductionMetrics) => boolean
  severity: 'critical' | 'warning' | 'info'
  channels: ('slack' | 'pagerduty' | 'email')[]
  cooldown: number // minutes
}

// 本番用高度ヘルスチェッククラス
export class ProductionHealthChecker {
  private async measureWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number = 5000
  ): Promise<{ result: T; duration: number } | { error: string; duration: number }> {
    const start = Date.now()
    
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ])
      const duration = Date.now() - start
      return { result, duration }
    } catch (error) {
      const duration = Date.now() - start
      return { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        duration 
      }
    }
  }

  // マルチリージョン Supabase ヘルスチェック
  async checkSupabaseHealth(region = 'primary'): Promise<HealthCheckResult> {
    const { result, error, duration } = await this.measureWithTimeout(async () => {
      // データベース接続テスト
      const { data: healthData, error: healthError } = await supabase
        .from('health_check')
        .select('id, created_at')
        .limit(1)

      if (healthError) throw healthError

      // 実際のビジネステーブルでのクエリテスト
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('count', { count: 'exact' })

      if (usersError) throw usersError

      // 認証サービステスト
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      })

      if (authError) throw authError

      return {
        healthCheck: healthData,
        userCount: usersData,
        authService: authData
      }
    })

    if (error) {
      return {
        service: `supabase_${region}`,
        status: 'unhealthy',
        responseTime: duration,
        timestamp: new Date().toISOString(),
        region,
        error
      }
    }

    const status = duration < 500 ? 'healthy' : duration < 2000 ? 'degraded' : 'unhealthy'

    return {
      service: `supabase_${region}`,
      status,
      responseTime: duration,
      timestamp: new Date().toISOString(),
      region,
      details: {
        connectionPool: 'active',
        queryPerformance: duration < 500 ? 'optimal' : 'slow',
        authService: 'operational',
        userCount: result?.userCount
      }
    }
  }

  // Vercel Edge Functions ヘルスチェック（複数リージョン）
  async checkVercelHealth(): Promise<HealthCheckResult[]> {
    const regions = ['nrt1', 'iad1', 'fra1'] // Tokyo, N.Virginia, Frankfurt
    const checks = await Promise.allSettled(
      regions.map(region => this.checkVercelRegion(region))
    )

    return checks.map((check, index) => 
      check.status === 'fulfilled' ? check.value : {
        service: `vercel_${regions[index]}`,
        status: 'unhealthy' as const,
        responseTime: 0,
        timestamp: new Date().toISOString(),
        region: regions[index],
        error: 'Health check failed'
      }
    )
  }

  private async checkVercelRegion(region: string): Promise<HealthCheckResult> {
    const endpoint = process.env.NODE_ENV === 'production' 
      ? 'https://koepon.app' 
      : 'https://staging-koepon.vercel.app'

    const { result, error, duration } = await this.measureWithTimeout(async () => {
      const response = await fetch(`${endpoint}/api/health?region=${region}`, {
        headers: {
          'x-vercel-region': region
        }
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    }, 3000)

    if (error) {
      return {
        service: `vercel_${region}`,
        status: 'unhealthy',
        responseTime: duration,
        timestamp: new Date().toISOString(),
        region,
        error
      }
    }

    const status = duration < 200 ? 'healthy' : duration < 1000 ? 'degraded' : 'unhealthy'

    return {
      service: `vercel_${region}`,
      status,
      responseTime: duration,
      timestamp: new Date().toISOString(),
      region,
      details: result
    }
  }

  // Upstash Redis クラスタヘルスチェック
  async checkRedisHealth(): Promise<HealthCheckResult> {
    const { result, error, duration } = await this.measureWithTimeout(async () => {
      // 書き込み・読み取りテスト
      const testKey = `health-check-${Date.now()}`
      const testValue = JSON.stringify({ timestamp: Date.now() })
      
      await redis.set(testKey, testValue, { ex: 60 })
      const retrievedValue = await redis.get(testKey)
      await redis.del(testKey)

      // パフォーマンステスト
      const start = Date.now()
      await redis.ping()
      const pingTime = Date.now() - start

      // メモリ使用量チェック
      const info = await redis.info()

      return {
        writeRead: retrievedValue === testValue,
        pingTime,
        memoryInfo: info
      }
    })

    if (error) {
      return {
        service: 'upstash_redis',
        status: 'unhealthy',
        responseTime: duration,
        timestamp: new Date().toISOString(),
        error
      }
    }

    const status = duration < 100 ? 'healthy' : duration < 500 ? 'degraded' : 'unhealthy'

    return {
      service: 'upstash_redis',
      status,
      responseTime: duration,
      timestamp: new Date().toISOString(),
      details: {
        connectionTest: result?.writeRead ? 'passed' : 'failed',
        pingTime: result?.pingTime,
        memoryStatus: 'monitored'
      }
    }
  }

  // 総合ヘルスチェック（本番用）
  async performComprehensiveHealthCheck(): Promise<{
    overall: 'healthy' | 'unhealthy' | 'degraded'
    services: HealthCheckResult[]
    timestamp: string
    summary: {
      healthy: number
      degraded: number
      unhealthy: number
    }
  }> {
    const checks = await Promise.allSettled([
      this.checkSupabaseHealth('primary'),
      this.checkRedisHealth(),
      ...await this.checkVercelHealth()
    ])

    const services = checks.map(check => 
      check.status === 'fulfilled' ? check.value : {
        service: 'unknown',
        status: 'unhealthy' as const,
        responseTime: 0,
        timestamp: new Date().toISOString(),
        error: 'Health check promise rejected'
      }
    ).flat()

    const healthyCount = services.filter(s => s.status === 'healthy').length
    const degradedCount = services.filter(s => s.status === 'degraded').length
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length

    let overall: 'healthy' | 'unhealthy' | 'degraded'
    if (unhealthyCount > 1 || (unhealthyCount === 1 && services.find(s => s.service.includes('supabase')))) {
      overall = 'unhealthy'  // データベース障害またはマルチサービス障害
    } else if (unhealthyCount > 0 || degradedCount > 1) {
      overall = 'degraded'   // 一部サービス障害
    } else {
      overall = 'healthy'
    }

    return {
      overall,
      services,
      timestamp: new Date().toISOString(),
      summary: {
        healthy: healthyCount,
        degraded: degradedCount,
        unhealthy: unhealthyCount
      }
    }
  }
}

// 本番用高度メトリクス収集
export class ProductionMetricsCollector {
  private readonly metricsKey = 'production:metrics'

  async recordBusinessEvent(event: {
    type: 'gacha_pull' | 'payment' | 'user_registration' | 'user_login'
    userId?: string
    vtuberId?: string
    amount?: number
    metadata?: Record<string, any>
  }): Promise<void> {
    const timestamp = new Date().toISOString()
    const metric = {
      ...event,
      timestamp,
      date: timestamp.split('T')[0] // YYYY-MM-DD
    }

    await redis.lpush(`${this.metricsKey}:business:${event.type}`, JSON.stringify(metric))
    await redis.expire(`${this.metricsKey}:business:${event.type}`, 86400 * 7) // 7日保持

    // リアルタイム集計用
    await redis.incr(`${this.metricsKey}:counters:${event.type}:${metric.date}`)
    await redis.expire(`${this.metricsKey}:counters:${event.type}:${metric.date}`, 86400 * 7)
  }

  async recordPerformanceMetric(metric: {
    endpoint: string
    method: string
    statusCode: number
    responseTime: number
    userAgent?: string
    country?: string
  }): Promise<void> {
    const timestamp = new Date().toISOString()
    const performanceMetric = {
      ...metric,
      timestamp
    }

    await redis.lpush(`${this.metricsKey}:performance`, JSON.stringify(performanceMetric))
    await redis.expire(`${this.metricsKey}:performance`, 86400 * 3) // 3日保持

    // P95/P99用にソート済みセット保存
    await redis.zadd(
      `${this.metricsKey}:response_times:${new Date().getHours()}`,
      metric.responseTime,
      `${timestamp}:${metric.endpoint}`
    )
    await redis.expire(`${this.metricsKey}:response_times:${new Date().getHours()}`, 3600)
  }

  async getComprehensiveMetrics(): Promise<ProductionMetrics> {
    const today = new Date().toISOString().split('T')[0]
    const currentHour = new Date().getHours()

    // 並列でメトリクス取得
    const [
      performances,
      gachaPulls,
      payments,
      registrations,
      logins,
      responseTimes
    ] = await Promise.all([
      redis.lrange(`${this.metricsKey}:performance`, 0, 999),
      redis.get(`${this.metricsKey}:counters:gacha_pull:${today}`) || '0',
      redis.lrange(`${this.metricsKey}:business:payment`, 0, 99),
      redis.get(`${this.metricsKey}:counters:user_registration:${today}`) || '0',
      redis.get(`${this.metricsKey}:counters:user_login:${today}`) || '0',
      redis.zrange(`${this.metricsKey}:response_times:${currentHour}`, 0, -1, { withScores: true })
    ])

    // パフォーマンス集計
    const performanceData = performances.map(p => JSON.parse(p))
    const responseTimes = performanceData.map(p => p.responseTime).sort((a, b) => a - b)
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0

    // パーセンタイル計算
    const p50Index = Math.floor(responseTimes.length * 0.50)
    const p95Index = Math.floor(responseTimes.length * 0.95)
    const p99Index = Math.floor(responseTimes.length * 0.99)

    // エラー率計算
    const errorCount = performanceData.filter(p => p.statusCode >= 400).length
    const totalRequests = performanceData.length
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0

    // ビジネスメトリクス
    const paymentsData = payments.map(p => JSON.parse(p))
    const revenue = paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0)

    // アクティブユーザー（直近1時間のlogin）
    const activeUsers = await this.getActiveUsers()

    // システムメトリクス
    const systemMetrics = await this.getSystemMetrics()

    return {
      uptime: await this.calculateUptime(),
      responseTime: {
        avg: avgResponseTime,
        p50: responseTimes[p50Index] || 0,
        p95: responseTimes[p95Index] || 0,
        p99: responseTimes[p99Index] || 0
      },
      errorRate,
      requestCount: totalRequests,
      activeUsers,
      businessMetrics: {
        gachaPulls: parseInt(gachaPulls),
        revenue,
        dau: parseInt(logins) + parseInt(registrations),
        conversionRate: await this.calculateConversionRate()
      },
      systemMetrics
    }
  }

  private async getActiveUsers(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', oneHourAgo)
    
    return count || 0
  }

  private async getSystemMetrics() {
    // Supabase接続数
    const { data: dbStats } = await supabase
      .rpc('get_db_stats')
      .select('connections, memory_usage, disk_usage')
      .single()

    return {
      dbConnections: dbStats?.connections || 0,
      cacheHitRate: 95, // Redis hit rate は別途計算
      memoryUsage: dbStats?.memory_usage || 0,
      diskUsage: dbStats?.disk_usage || 0
    }
  }

  private async calculateUptime(): Promise<number> {
    // 過去24時間の稼働率計算
    const checks = await redis.lrange('production:uptime_checks', 0, 287) // 5分間隔×24時間
    const healthyChecks = checks.filter(c => JSON.parse(c).status === 'healthy').length
    return checks.length > 0 ? (healthyChecks / checks.length) * 100 : 100
  }

  private async calculateConversionRate(): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const visitors = await redis.get(`${this.metricsKey}:counters:page_view:${today}`) || '1'
    const payments = await redis.get(`${this.metricsKey}:counters:payment:${today}`) || '0'
    
    return parseInt(visitors) > 0 ? (parseInt(payments) / parseInt(visitors)) * 100 : 0
  }
}

// 本番用アドバンスドアラートシステム
export class ProductionAlerting {
  private alertRules: AlertRule[] = [
    // Critical alerts
    {
      name: 'Service Unavailable',
      condition: (m) => m.uptime < 99.0,
      severity: 'critical',
      channels: ['pagerduty', 'slack'],
      cooldown: 5
    },
    {
      name: 'High Error Rate',
      condition: (m) => m.errorRate > 5,
      severity: 'critical',
      channels: ['pagerduty', 'slack'],
      cooldown: 10
    },
    {
      name: 'Response Time Critical',
      condition: (m) => m.responseTime.p99 > 5000,
      severity: 'critical',
      channels: ['pagerduty', 'slack'],
      cooldown: 10
    },
    
    // Warning alerts
    {
      name: 'Performance Degradation',
      condition: (m) => m.responseTime.p95 > 1000,
      severity: 'warning',
      channels: ['slack'],
      cooldown: 15
    },
    {
      name: 'Revenue Drop',
      condition: (m) => m.businessMetrics.revenue < 1000, // 仮の基準
      severity: 'warning',
      channels: ['slack', 'email'],
      cooldown: 60
    },
    {
      name: 'Low Active Users',
      condition: (m) => m.activeUsers < 10,
      severity: 'warning',
      channels: ['slack'],
      cooldown: 30
    }
  ]

  constructor(
    private healthChecker: ProductionHealthChecker,
    private metricsCollector: ProductionMetricsCollector
  ) {}

  async runAlertChecks(): Promise<void> {
    const [healthCheck, metrics] = await Promise.all([
      this.healthChecker.performComprehensiveHealthCheck(),
      this.metricsCollector.getComprehensiveMetrics()
    ])

    // アラートルール評価
    for (const rule of this.alertRules) {
      const shouldAlert = rule.condition(metrics)
      
      if (shouldAlert && await this.shouldSendAlert(rule)) {
        await this.sendAlert(rule, healthCheck, metrics)
        await this.recordAlertSent(rule)
      }
    }
  }

  private async shouldSendAlert(rule: AlertRule): Promise<boolean> {
    const lastSent = await redis.get(`alert:${rule.name}:last_sent`)
    if (!lastSent) return true

    const cooldownMs = rule.cooldown * 60 * 1000
    return Date.now() - parseInt(lastSent) > cooldownMs
  }

  private async sendAlert(
    rule: AlertRule,
    healthCheck: any,
    metrics: ProductionMetrics
  ): Promise<void> {
    const alertData = {
      rule: rule.name,
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      metrics: {
        uptime: metrics.uptime,
        errorRate: metrics.errorRate,
        responseTime: metrics.responseTime.p99,
        activeUsers: metrics.activeUsers,
        revenue: metrics.businessMetrics.revenue
      },
      services: healthCheck.services
    }

    // Slack通知
    if (rule.channels.includes('slack')) {
      await this.sendSlackAlert(alertData)
    }

    // PagerDuty通知（Critical）
    if (rule.channels.includes('pagerduty') && rule.severity === 'critical') {
      await this.sendPagerDutyAlert(alertData)
    }

    // Email通知
    if (rule.channels.includes('email')) {
      await this.sendEmailAlert(alertData)
    }
  }

  private async sendSlackAlert(alertData: any): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!webhookUrl) return

    const emoji = alertData.severity === 'critical' ? '🚨' : '⚠️'
    const color = alertData.severity === 'critical' ? '#ff0000' : '#ffaa00'

    const message = {
      text: `${emoji} Production Alert: ${alertData.rule}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} Production Alert: ${alertData.rule}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Severity:* ${alertData.severity.toUpperCase()}`
            },
            {
              type: 'mrkdwn',
              text: `*Uptime:* ${alertData.metrics.uptime.toFixed(2)}%`
            },
            {
              type: 'mrkdwn',
              text: `*Error Rate:* ${alertData.metrics.errorRate.toFixed(2)}%`
            },
            {
              type: 'mrkdwn',
              text: `*P99 Response:* ${alertData.metrics.responseTime}ms`
            },
            {
              type: 'mrkdwn',
              text: `*Active Users:* ${alertData.metrics.activeUsers}`
            },
            {
              type: 'mrkdwn',
              text: `*Revenue:* ¥${alertData.metrics.revenue}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Dashboard'
              },
              url: 'https://datadog.com/dashboard/koepon'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Check Production'
              },
              url: 'https://koepon.app'
            }
          ]
        }
      ],
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Service Status',
              value: alertData.services.map((s: any) => 
                `${s.service}: ${s.status} (${s.responseTime}ms)`
              ).join('\n'),
              short: false
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

  private async sendPagerDutyAlert(alertData: any): Promise<void> {
    const integrationKey = process.env.PAGERDUTY_INTEGRATION_KEY
    if (!integrationKey) return

    const payload = {
      routing_key: integrationKey,
      event_action: 'trigger',
      dedup_key: `koepon-${alertData.rule}`,
      payload: {
        summary: `Production Alert: ${alertData.rule}`,
        severity: alertData.severity === 'critical' ? 'critical' : 'warning',
        source: 'koepon-production',
        component: 'application',
        group: 'production-monitoring',
        class: 'alert',
        custom_details: alertData
      }
    }

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  private async sendEmailAlert(alertData: any): Promise<void> {
    // SendGrid/SES等を使用した実装
    console.log('Email alert would be sent:', alertData)
  }

  private async recordAlertSent(rule: AlertRule): Promise<void> {
    await redis.set(`alert:${rule.name}:last_sent`, Date.now().toString(), { ex: 86400 })
  }
}

// エクスポート・使用例
export const productionHealthChecker = new ProductionHealthChecker()
export const productionMetricsCollector = new ProductionMetricsCollector()
export const productionAlerting = new ProductionAlerting(
  productionHealthChecker,
  productionMetricsCollector
)

// Cron job用エンドポイント (Vercel Cron)
export async function monitoringCronJob() {
  try {
    // 5分間隔でのヘルスチェック
    const healthCheck = await productionHealthChecker.performComprehensiveHealthCheck()
    
    // アップタイム記録
    await redis.lpush(
      'production:uptime_checks',
      JSON.stringify({ timestamp: new Date().toISOString(), status: healthCheck.overall })
    )
    await redis.ltrim('production:uptime_checks', 0, 287) // 24時間分保持

    // アラートチェック
    await productionAlerting.runAlertChecks()

    return { success: true, healthCheck }
  } catch (error) {
    console.error('Monitoring cron job failed:', error)
    return { success: false, error }
  }
}

// API Route for production health
export async function GET() {
  const [health, metrics] = await Promise.all([
    productionHealthChecker.performComprehensiveHealthCheck(),
    productionMetricsCollector.getComprehensiveMetrics()
  ])

  // Blue-Green環境識別
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'blue'

  return Response.json({
    environment,
    health,
    metrics,
    timestamp: new Date().toISOString()
  }, {
    status: health.overall === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Environment': environment
    }
  })
}