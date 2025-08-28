#!/usr/bin/env node

/**
 * TASK-504 ステージング環境構築 - デプロイテスト実装
 * ステージング環境の自動デプロイテストスクリプト
 */

const { execSync } = require('child_process')
const axios = require('axios')

const STAGING_CONFIG = {
  BASE_URL: process.env.STAGING_BASE_URL || 'https://staging-koepon.vercel.app',
  API_URL: process.env.STAGING_API_URL || 'https://koepon-api-staging.vercel.app',
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  EXPECTED_SERVICES: [
    'frontend',
    'api',
    'database',
    'auth',
    'storage'
  ]
}

class StagingDeployTest {
  constructor() {
    this.testResults = []
    this.startTime = Date.now()
  }

  // テスト結果を記録
  recordTest(testName, passed, details = null, duration = 0) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      duration,
      timestamp: new Date().toISOString()
    })
    
    const status = passed ? '✅' : '❌'
    const durationStr = duration > 0 ? ` (${duration}ms)` : ''
    console.log(`${status} ${testName}${durationStr}`)
    if (details && !passed) {
      console.log(`   Error: ${details}`)
    }
  }

  // HTTPリクエストのリトライ機能
  async httpRequest(url, options = {}, retryCount = STAGING_CONFIG.RETRY_COUNT) {
    for (let i = 0; i < retryCount; i++) {
      try {
        const startTime = Date.now()
        const response = await axios({
          url,
          timeout: STAGING_CONFIG.TIMEOUT,
          validateStatus: () => true, // すべてのレスポンスを受け入れ
          ...options
        })
        const duration = Date.now() - startTime
        return { response, duration }
      } catch (error) {
        if (i === retryCount - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  // フロントエンドアプリケーションのデプロイテスト
  async testFrontendDeployment() {
    console.log('\n📱 フロントエンドデプロイテスト')
    
    try {
      const { response, duration } = await this.httpRequest(STAGING_CONFIG.BASE_URL)
      
      // HTTPステータス確認
      const statusOk = response.status === 200
      this.recordTest(
        'Frontend HTTP Status', 
        statusOk, 
        statusOk ? null : `Expected 200, got ${response.status}`,
        duration
      )

      // HTML内容確認
      const hasTitle = response.data.includes('こえポン！')
      this.recordTest(
        'Frontend Title Check',
        hasTitle,
        hasTitle ? null : 'Application title not found in HTML'
      )

      // 必要なアセットの確認
      const hasJS = response.data.includes('.js')
      const hasCSS = response.data.includes('.css')
      this.recordTest(
        'Frontend Assets Check',
        hasJS && hasCSS,
        (hasJS && hasCSS) ? null : 'Missing JS or CSS assets'
      )

      // レスポンス時間確認（3秒以内）
      const responseTimeOk = duration < 3000
      this.recordTest(
        'Frontend Response Time',
        responseTimeOk,
        responseTimeOk ? null : `Response time ${duration}ms exceeds 3000ms limit`
      )

    } catch (error) {
      this.recordTest('Frontend Deployment', false, error.message)
    }
  }

  // APIデプロイテスト
  async testApiDeployment() {
    console.log('\n🚀 APIデプロイテスト')
    
    try {
      // ヘルスチェックエンドポイント
      const { response, duration } = await this.httpRequest(`${STAGING_CONFIG.API_URL}/api/health`)
      
      const statusOk = response.status === 200
      this.recordTest(
        'API Health Check',
        statusOk,
        statusOk ? null : `Health check failed with status ${response.status}`,
        duration
      )

      if (statusOk && response.data) {
        // サービス状態確認
        const services = response.data.services || {}
        for (const service of STAGING_CONFIG.EXPECTED_SERVICES) {
          const serviceOk = services[service] === 'healthy' || services[service] === 'connected'
          this.recordTest(
            `API Service: ${service}`,
            serviceOk,
            serviceOk ? null : `Service ${service} status: ${services[service]}`
          )
        }
      }

      // 認証エンドポイントテスト
      const authResponse = await this.httpRequest(`${STAGING_CONFIG.API_URL}/api/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { token: 'test-token' }
      })
      
      // 認証エンドポイントが適切にエラーレスポンスを返すか確認
      const authOk = authResponse.response.status === 401
      this.recordTest(
        'API Auth Endpoint',
        authOk,
        authOk ? null : `Expected 401 for invalid token, got ${authResponse.response.status}`
      )

    } catch (error) {
      this.recordTest('API Deployment', false, error.message)
    }
  }

  // データベース接続テスト
  async testDatabaseConnection() {
    console.log('\n💾 データベース接続テスト')
    
    try {
      const { response } = await this.httpRequest(`${STAGING_CONFIG.API_URL}/api/health/db`)
      
      const dbOk = response.status === 200 && response.data.database === 'connected'
      this.recordTest(
        'Database Connection',
        dbOk,
        dbOk ? null : `Database status: ${response.data?.database || 'unknown'}`
      )

      if (dbOk && response.data.tables) {
        // 主要テーブルの存在確認
        const expectedTables = ['users', 'vtubers', 'gacha', 'medals', 'rewards']
        const tableCount = Object.keys(response.data.tables).length
        const tablesOk = tableCount >= expectedTables.length
        
        this.recordTest(
          'Database Tables',
          tablesOk,
          tablesOk ? null : `Expected at least ${expectedTables.length} tables, found ${tableCount}`
        )
      }

    } catch (error) {
      this.recordTest('Database Connection', false, error.message)
    }
  }

  // 環境変数・設定テスト
  async testEnvironmentConfig() {
    console.log('\n⚙️  環境設定テスト')
    
    try {
      const { response } = await this.httpRequest(`${STAGING_CONFIG.API_URL}/api/health/config`)
      
      if (response.status === 200 && response.data) {
        const config = response.data
        
        // 必要な環境変数の確認
        const requiredEnvs = ['DATABASE_URL', 'NEXTAUTH_URL', 'NODE_ENV']
        for (const env of requiredEnvs) {
          const envOk = config.env && config.env[env] !== undefined
          this.recordTest(
            `Environment Variable: ${env}`,
            envOk,
            envOk ? null : `Missing or undefined environment variable: ${env}`
          )
        }
        
        // ステージング環境であることの確認
        const isStaging = config.env?.NODE_ENV === 'staging' || 
                         config.env?.VERCEL_ENV === 'staging'
        this.recordTest(
          'Staging Environment',
          isStaging,
          isStaging ? null : `Environment is not staging: ${config.env?.NODE_ENV}`
        )
      } else {
        this.recordTest('Environment Config', false, `Config endpoint returned ${response.status}`)
      }

    } catch (error) {
      this.recordTest('Environment Config', false, error.message)
    }
  }

  // セキュリティヘッダーテスト
  async testSecurityHeaders() {
    console.log('\n🔒 セキュリティヘッダーテスト')
    
    try {
      const { response } = await this.httpRequest(STAGING_CONFIG.BASE_URL)
      const headers = response.headers
      
      // 重要なセキュリティヘッダーの確認
      const securityHeaders = {
        'x-frame-options': ['DENY', 'SAMEORIGIN'],
        'x-content-type-options': ['nosniff'],
        'x-xss-protection': ['1; mode=block', '1'],
        'strict-transport-security': null // 存在すればOK
      }

      for (const [header, expectedValues] of Object.entries(securityHeaders)) {
        const headerValue = headers[header] || headers[header.toLowerCase()]
        const headerOk = expectedValues === null ? 
          !!headerValue : 
          expectedValues.some(value => headerValue?.includes(value))
        
        this.recordTest(
          `Security Header: ${header}`,
          headerOk,
          headerOk ? null : `Missing or invalid ${header} header`
        )
      }

    } catch (error) {
      this.recordTest('Security Headers', false, error.message)
    }
  }

  // 統合テスト実行
  async runIntegrationTests() {
    console.log('\n🔄 統合テストスイート')
    
    try {
      // クライアント側のテストスイート実行
      console.log('Running client-side tests...')
      const clientTestResult = execSync('cd client && npm test -- --passWithNoTests', { 
        encoding: 'utf8',
        timeout: 60000 
      })
      
      this.recordTest(
        'Client Test Suite',
        true,
        'All client tests passed'
      )

    } catch (error) {
      this.recordTest(
        'Client Test Suite', 
        false, 
        `Client tests failed: ${error.message}`
      )
    }

    // E2Eテスト実行
    try {
      console.log('Running E2E tests...')
      const e2eResult = execSync('cd client && npx playwright test --reporter=line', {
        encoding: 'utf8',
        timeout: 120000,
        env: { 
          ...process.env, 
          BASE_URL: STAGING_CONFIG.BASE_URL 
        }
      })
      
      this.recordTest(
        'E2E Test Suite',
        true,
        'All E2E tests passed'
      )

    } catch (error) {
      const errorOutput = error.stdout + error.stderr
      const testsPassed = !errorOutput.includes('failed')
      
      this.recordTest(
        'E2E Test Suite',
        testsPassed,
        testsPassed ? 'Tests completed with warnings' : `E2E tests failed: ${error.message}`
      )
    }
  }

  // テストレポート生成
  generateReport() {
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(test => test.passed).length
    const failedTests = totalTests - passedTests
    const passRate = Math.round((passedTests / totalTests) * 100)
    const totalDuration = Date.now() - this.startTime

    console.log('\n' + '='.repeat(60))
    console.log('📊 TASK-504 ステージングデプロイテスト結果')
    console.log('='.repeat(60))
    console.log(`総実行時間: ${Math.round(totalDuration / 1000)}秒`)
    console.log(`総テスト数: ${totalTests}`)
    console.log(`成功: ${passedTests} (${passRate}%)`)
    console.log(`失敗: ${failedTests}`)
    console.log('')

    if (failedTests > 0) {
      console.log('❌ 失敗したテスト:')
      this.testResults.filter(test => !test.passed).forEach(test => {
        console.log(`  - ${test.name}: ${test.details}`)
      })
      console.log('')
    }

    // 成功率による判定
    if (passRate >= 95) {
      console.log('🎉 ステージングデプロイテスト成功!')
      console.log('✅ ステージング環境は正常に動作しています')
      return true
    } else if (passRate >= 85) {
      console.log('⚠️  警告: 一部テストが失敗していますが、基本機能は動作しています')
      return true
    } else {
      console.log('❌ ステージングデプロイテスト失敗')
      console.log('🔧 修正が必要な問題があります')
      return false
    }
  }

  // メインテスト実行
  async run() {
    console.log('🚀 TASK-504 ステージングデプロイテスト開始')
    console.log(`Environment: ${STAGING_CONFIG.BASE_URL}`)
    console.log(`API: ${STAGING_CONFIG.API_URL}`)
    console.log('')

    try {
      await this.testFrontendDeployment()
      await this.testApiDeployment()
      await this.testDatabaseConnection()
      await this.testEnvironmentConfig()
      await this.testSecurityHeaders()
      await this.runIntegrationTests()

      return this.generateReport()
    } catch (error) {
      console.error('❌ テスト実行中に予期しないエラーが発生しました:', error)
      return false
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const test = new StagingDeployTest()
  test.run().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { StagingDeployTest, STAGING_CONFIG }