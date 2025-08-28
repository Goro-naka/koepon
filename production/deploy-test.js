#!/usr/bin/env node

/**
 * TASK-505 本番環境構築 - 本番デプロイメントテスト
 * 本番環境への安全なデプロイメントと動作確認を実行するテストスクリプト
 */

const { execSync } = require('child_process')
const https = require('https')
const fs = require('fs')

const PRODUCTION_CONFIG = {
  // 本番環境URL（環境変数から取得）
  PRODUCTION_BASE_URL: process.env.PRODUCTION_BASE_URL || 'https://koepon.app',
  PRODUCTION_API_URL: process.env.PRODUCTION_API_URL || 'https://api.koepon.app',
  
  // デプロイメント設定
  HEALTH_CHECK_TIMEOUT: 30000,    // ヘルスチェックタイムアウト30秒
  DEPLOYMENT_TIMEOUT: 600000,     // デプロイタイムアウト10分
  ROLLBACK_TIMEOUT: 300000,       // ロールバックタイムアウト5分
  
  // 監視設定
  MONITORING_ENDPOINTS: [
    '/api/health',
    '/api/health/database',
    '/api/health/redis',
    '/api/health/storage'
  ],
  
  // 性能要件
  RESPONSE_TIME_THRESHOLD: 2000,  // 応答時間2秒以内
  ERROR_RATE_THRESHOLD: 0.01,     // エラー率1%以内
  AVAILABILITY_THRESHOLD: 0.995   // 可用性99.5%
}

class ProductionDeploymentTest {
  constructor() {
    this.results = {}
    this.deploymentStartTime = Date.now()
    this.testMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const icons = { info: '🚀', success: '✅', warning: '⚠️', error: '❌', deploy: '🔧' }
    console.log(`${icons[type]} [${timestamp}] ${message}`)
  }

  // HTTP リクエスト実行（タイムアウト・リトライ対応）
  async httpRequest(url, options = {}) {
    const startTime = Date.now()
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout: ${url}`))
      }, options.timeout || PRODUCTION_CONFIG.HEALTH_CHECK_TIMEOUT)
      
      https.get(url, {
        ...options,
        headers: {
          'User-Agent': 'TASK-505-Production-Deploy-Test/1.0',
          ...options.headers
        }
      }, (res) => {
        clearTimeout(timeout)
        let data = ''
        
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          const duration = Date.now() - startTime
          resolve({
            status: res.statusCode,
            data: data,
            duration: duration,
            headers: res.headers
          })
        })
      }).on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })
  }

  // テスト結果記録
  recordTest(testName, passed, error = null, metrics = {}) {
    this.results[testName] = {
      passed,
      error,
      metrics,
      timestamp: new Date().toISOString()
    }
    
    if (passed) {
      this.log(`${testName}: 成功`, 'success')
    } else {
      this.log(`${testName}: 失敗 - ${error}`, 'error')
    }
  }

  // 1. 本番環境ヘルスチェック
  async testProductionHealthCheck() {
    this.log('本番環境ヘルスチェック実行中', 'deploy')
    
    try {
      for (const endpoint of PRODUCTION_CONFIG.MONITORING_ENDPOINTS) {
        const url = `${PRODUCTION_CONFIG.PRODUCTION_API_URL}${endpoint}`
        const { status, duration } = await this.httpRequest(url)
        
        const endpointHealthy = status === 200 && duration < PRODUCTION_CONFIG.RESPONSE_TIME_THRESHOLD
        this.recordTest(`Health Check: ${endpoint}`, endpointHealthy, 
          endpointHealthy ? null : `Status: ${status}, Duration: ${duration}ms`)
        
        this.testMetrics.totalRequests++
        if (endpointHealthy) {
          this.testMetrics.successfulRequests++
        } else {
          this.testMetrics.failedRequests++
        }
        this.testMetrics.totalResponseTime += duration
      }
    } catch (error) {
      this.recordTest('Production Health Check', false, error.message)
    }
  }

  // 2. 本番フロントエンド動作確認
  async testProductionFrontend() {
    this.log('本番フロントエンド動作確認実行中', 'deploy')
    
    try {
      const { status, duration, data } = await this.httpRequest(PRODUCTION_CONFIG.PRODUCTION_BASE_URL)
      
      // 基本的な動作確認
      const frontendHealthy = status === 200 && duration < PRODUCTION_CONFIG.RESPONSE_TIME_THRESHOLD
      
      // コンテンツ確認（こえポン！が含まれているか）
      const contentValid = data.includes('こえポン') || data.includes('koepon')
      
      // セキュリティヘッダー確認
      const headers = await this.httpRequest(PRODUCTION_CONFIG.PRODUCTION_BASE_URL, { method: 'HEAD' })
      const securityHeaders = [
        'strict-transport-security',
        'x-content-type-options', 
        'x-frame-options'
      ]
      const headersValid = securityHeaders.every(header => headers.headers[header])
      
      const overallValid = frontendHealthy && contentValid && headersValid
      
      this.recordTest('Production Frontend', overallValid, 
        overallValid ? null : `Health: ${frontendHealthy}, Content: ${contentValid}, Headers: ${headersValid}`,
        { responseTime: duration, contentLength: data.length })
        
    } catch (error) {
      this.recordTest('Production Frontend', false, error.message)
    }
  }

  // 3. 本番データベース接続テスト
  async testProductionDatabase() {
    this.log('本番データベース接続テスト実行中', 'deploy')
    
    try {
      const { status, data } = await this.httpRequest(`${PRODUCTION_CONFIG.PRODUCTION_API_URL}/api/health/database`)
      
      const dbHealthy = status === 200
      let connectionPool = null
      
      try {
        const healthData = JSON.parse(data)
        connectionPool = healthData.connectionPool || 'unknown'
      } catch (e) {
        // JSON パースに失敗した場合はスキップ
      }
      
      this.recordTest('Production Database Connection', dbHealthy,
        dbHealthy ? null : `Database health check failed: ${status}`,
        { connectionPool })
        
    } catch (error) {
      this.recordTest('Production Database Connection', false, error.message)
    }
  }

  // 4. 本番パフォーマンステスト
  async testProductionPerformance() {
    this.log('本番パフォーマンステスト実行中', 'deploy')
    
    const performanceTests = [
      { name: '本番ホームページ読み込み', url: PRODUCTION_CONFIG.PRODUCTION_BASE_URL, threshold: 3000 },
      { name: '本番API認証', url: `${PRODUCTION_CONFIG.PRODUCTION_API_URL}/api/health`, threshold: 2000 },
      { name: '本番ガチャ一覧API', url: `${PRODUCTION_CONFIG.PRODUCTION_API_URL}/api/gacha/list`, threshold: 2000 }
    ]
    
    for (const test of performanceTests) {
      try {
        const { status, duration } = await this.httpRequest(test.url)
        const performanceOk = status === 200 && duration < test.threshold
        
        this.recordTest(test.name, performanceOk,
          performanceOk ? null : `Response time ${duration}ms exceeds ${test.threshold}ms threshold`,
          { responseTime: duration, threshold: test.threshold })
          
      } catch (error) {
        this.recordTest(test.name, false, error.message)
      }
    }
  }

  // 5. 本番可用性・信頼性テスト
  async testProductionReliability() {
    this.log('本番可用性・信頼性テスト実行中', 'deploy')
    
    // 連続ヘルスチェック実行（5分間）
    const testDuration = 5 * 60 * 1000 // 5分
    const interval = 10 * 1000        // 10秒間隔
    const testCount = testDuration / interval
    
    let successCount = 0
    let totalTests = 0
    
    this.log(`可用性テスト開始: ${testCount}回のヘルスチェックを実行`, 'deploy')
    
    for (let i = 0; i < testCount; i++) {
      try {
        const { status } = await this.httpRequest(`${PRODUCTION_CONFIG.PRODUCTION_API_URL}/api/health`)
        totalTests++
        if (status === 200) {
          successCount++
        }
        
        // 10秒待機（最後のテスト以外）
        if (i < testCount - 1) {
          await new Promise(resolve => setTimeout(resolve, interval))
        }
        
      } catch (error) {
        totalTests++
        // エラーもカウントして継続
      }
    }
    
    const availability = totalTests > 0 ? (successCount / totalTests) : 0
    const availabilityPercent = Math.round(availability * 10000) / 100
    const availabilityOk = availability >= PRODUCTION_CONFIG.AVAILABILITY_THRESHOLD
    
    this.recordTest('Production Availability', availabilityOk,
      availabilityOk ? null : `Availability ${availabilityPercent}% below ${PRODUCTION_CONFIG.AVAILABILITY_THRESHOLD * 100}% threshold`,
      { successCount, totalTests, availability: availabilityPercent })
  }

  // 統合レポート生成
  generateReport() {
    const totalTests = Object.keys(this.results).length
    const passedTests = Object.values(this.results).filter(r => r.passed).length
    const successRate = Math.round((passedTests / totalTests) * 100)
    const totalDuration = Date.now() - this.deploymentStartTime
    
    console.log('\n' + '='.repeat(120))
    console.log('🎉 TASK-505 本番環境構築 - デプロイメントテスト結果')
    console.log('='.repeat(120))
    console.log(`デプロイメントテスト完了時間: ${Math.round(totalDuration / 1000)}秒 (${Math.round(totalDuration / 60000)}分)`)
    console.log(`テスト成功率: ${successRate}% (${passedTests}/${totalTests})`)
    
    // 平均レスポンス時間計算
    const avgResponseTime = this.testMetrics.totalRequests > 0 
      ? Math.round(this.testMetrics.totalResponseTime / this.testMetrics.totalRequests)
      : 0
    console.log(`平均レスポンス時間: ${avgResponseTime}ms`)
    
    console.log('')
    console.log('📊 詳細テスト結果:')
    for (const [testName, result] of Object.entries(this.results)) {
      const status = result.passed ? '✅' : '❌'
      const metrics = result.metrics ? ` (${Object.entries(result.metrics).map(([k,v]) => `${k}: ${v}`).join(', ')})` : ''
      console.log(`${status} ${testName}${metrics}`)
      if (!result.passed && result.error) {
        console.log(`    エラー: ${result.error}`)
      }
    }
    
    console.log('\n🎯 TASK-505 本番デプロイメント完了チェック:')
    
    const healthCheckPassed = Object.keys(this.results).filter(key => 
      key.includes('Health Check') && this.results[key].passed).length > 0
    const frontendPassed = this.results['Production Frontend']?.passed || false
    const databasePassed = this.results['Production Database Connection']?.passed || false
    const performancePassed = Object.keys(this.results).filter(key => 
      key.includes('本番') && key.includes('API') && this.results[key].passed).length > 0
    const availabilityPassed = this.results['Production Availability']?.passed || false
    
    console.log(`${healthCheckPassed ? '✅' : '❌'} 本番環境ヘルスチェック`)
    console.log(`${frontendPassed ? '✅' : '❌'} 本番フロントエンド動作確認`)
    console.log(`${databasePassed ? '✅' : '❌'} 本番データベース接続`)
    console.log(`${performancePassed ? '✅' : '❌'} 本番パフォーマンス要件`)
    console.log(`${availabilityPassed ? '✅' : '❌'} 本番可用性要件 (99.5%)`)
    
    console.log('\n🚀 次のステップ:')
    
    const allTestsPassed = healthCheckPassed && frontendPassed && databasePassed && performancePassed && availabilityPassed
    
    if (allTestsPassed) {
      console.log('✅ TASK-505 本番環境構築のデプロイメントテストが完了しました!')
      console.log('')
      console.log('📋 完了確認項目:')
      console.log('✅ 本番環境正常稼働確認')
      console.log('✅ パフォーマンス要件満足')
      console.log('✅ データベース接続確立')
      console.log('')
      console.log('🔄 残りのTASK-505要件:')
      console.log('- 監視システム動作確認 (monitoring-test.js)')
      console.log('- バックアップ・リストアテスト (backup-test.js)')
      
    } else {
      console.log('⚠️  一部のデプロイメントテストで問題が検出されました')
      console.log('')
      console.log('🔧 対応が必要な項目:')
      if (!healthCheckPassed) console.log('- 本番環境ヘルスチェックの修正')
      if (!frontendPassed) console.log('- フロントエンド設定の修正') 
      if (!databasePassed) console.log('- データベース接続の修正')
      if (!performancePassed) console.log('- パフォーマンス要件の改善')
      if (!availabilityPassed) console.log('- 可用性要件の改善')
      console.log('')
      console.log('📝 推奨アクション: 上記問題を修正後、再度デプロイメントテストを実行してください')
    }
    
    console.log('\n' + '='.repeat(120))
    
    return allTestsPassed
  }

  // メイン実行
  async run() {
    console.log('🚀 TASK-505 本番環境構築 - デプロイメントテスト開始')
    console.log(`対象本番環境: ${PRODUCTION_CONFIG.PRODUCTION_BASE_URL}`)
    console.log(`対象本番API: ${PRODUCTION_CONFIG.PRODUCTION_API_URL}`)
    console.log('')

    // 各テストを順次実行
    await this.testProductionHealthCheck()
    await this.testProductionFrontend()
    await this.testProductionDatabase()
    await this.testProductionPerformance()
    await this.testProductionReliability()
    
    // 統合レポート生成
    const finalResult = this.generateReport()
    
    return finalResult
  }
}

// スクリプト実行
if (require.main === module) {
  const deployTest = new ProductionDeploymentTest()
  deployTest.run().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { ProductionDeploymentTest, PRODUCTION_CONFIG }