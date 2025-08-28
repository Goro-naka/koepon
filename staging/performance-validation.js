#!/usr/bin/env node

/**
 * TASK-504 ステージング環境構築 - パフォーマンス検証実装
 * 本番同等のパフォーマンス検証テストスイート
 */

const { execSync, spawn } = require('child_process')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const PERFORMANCE_CONFIG = {
  STAGING_BASE_URL: process.env.STAGING_BASE_URL || 'https://staging-koepon.vercel.app',
  STAGING_API_URL: process.env.STAGING_API_URL || 'https://koepon-api-staging.vercel.app',
  
  // パフォーマンス要件（本番同等）
  REQUIREMENTS: {
    PAGE_LOAD_TIME: 3000,      // 3秒以内
    API_RESPONSE_TIME: 2000,   // 2秒以内
    GACHA_DRAW_TIME: 3000,     // ガチャ抽選3秒以内
    DATABASE_QUERY_TIME: 500,  // DB問い合わせ0.5秒以内
    CONCURRENT_USERS: 100,     // 同時100ユーザー処理
    THROUGHPUT_RPS: 50,        // 50リクエスト/秒
    ERROR_RATE_THRESHOLD: 5,   // エラー率5%未満
    LIGHTHOUSE_SCORE: 85       // Lighthouse スコア85点以上
  },
  
  TEST_SCENARIOS: {
    USER_REGISTRATION: '/auth/register',
    USER_LOGIN: '/auth/login',
    GACHA_LIST: '/gacha',
    GACHA_DETAIL: '/gacha/1',
    GACHA_DRAW: '/api/gacha/draw',
    MEDAL_BALANCE: '/api/medals/balance',
    REWARD_LIST: '/rewards'
  }
}

class PerformanceValidator {
  constructor() {
    this.results = {
      pageLoad: {},
      apiResponse: {},
      loadTest: {},
      lighthouse: {},
      database: {},
      summary: {}
    }
    this.startTime = Date.now()
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const icons = { info: '📊', success: '✅', warning: '⚠️', error: '❌' }
    console.log(`${icons[type]} [${timestamp}] ${message}`)
  }

  // ページロードタイムテスト
  async testPageLoadTime() {
    this.log('ページロードタイムテスト開始')
    
    const scenarios = Object.entries(PERFORMANCE_CONFIG.TEST_SCENARIOS)
      .filter(([name, path]) => !path.startsWith('/api'))

    for (const [scenarioName, scenarioPath] of scenarios) {
      try {
        const url = `${PERFORMANCE_CONFIG.STAGING_BASE_URL}${scenarioPath}`
        const startTime = Date.now()
        
        const response = await axios.get(url, {
          timeout: PERFORMANCE_CONFIG.REQUIREMENTS.PAGE_LOAD_TIME + 5000
        })
        
        const loadTime = Date.now() - startTime
        const success = loadTime <= PERFORMANCE_CONFIG.REQUIREMENTS.PAGE_LOAD_TIME
        
        this.results.pageLoad[scenarioName] = {
          loadTime,
          success,
          url,
          status: response.status
        }
        
        const status = success ? 'success' : 'warning'
        this.log(`${scenarioName}: ${loadTime}ms (${success ? '合格' : '要改善'})`, status)
        
      } catch (error) {
        this.results.pageLoad[scenarioName] = {
          loadTime: -1,
          success: false,
          error: error.message
        }
        this.log(`${scenarioName}: エラー - ${error.message}`, 'error')
      }
    }
  }

  // APIレスポンス時間テスト
  async testApiResponseTime() {
    this.log('APIレスポンス時間テスト開始')
    
    const apiScenarios = Object.entries(PERFORMANCE_CONFIG.TEST_SCENARIOS)
      .filter(([name, path]) => path.startsWith('/api'))

    // 追加的なAPIエンドポイント
    const additionalApis = [
      ['HEALTH_CHECK', '/api/health'],
      ['AUTH_VALIDATE', '/api/auth/validate'],
      ['GACHA_LIST_API', '/api/gacha/list'],
      ['GACHA_HISTORY', '/api/gacha/history']
    ]

    const allApis = [...apiScenarios, ...additionalApis]

    for (const [apiName, apiPath] of allApis) {
      try {
        const url = `${PERFORMANCE_CONFIG.STAGING_API_URL}${apiPath}`
        const results = []
        
        // 複数回測定（平均値算出）
        for (let i = 0; i < 5; i++) {
          const startTime = Date.now()
          
          let response
          if (apiName === 'AUTH_VALIDATE') {
            // POST リクエストの場合
            response = await axios.post(url, 
              { token: 'invalid-token' },
              { 
                timeout: PERFORMANCE_CONFIG.REQUIREMENTS.API_RESPONSE_TIME + 2000,
                validateStatus: () => true 
              }
            )
          } else {
            response = await axios.get(url, {
              timeout: PERFORMANCE_CONFIG.REQUIREMENTS.API_RESPONSE_TIME + 2000,
              validateStatus: () => true
            })
          }
          
          const responseTime = Date.now() - startTime
          results.push(responseTime)
          
          // APIリクエスト間隔
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        const avgResponseTime = Math.round(results.reduce((a, b) => a + b, 0) / results.length)
        const maxResponseTime = Math.max(...results)
        const success = avgResponseTime <= PERFORMANCE_CONFIG.REQUIREMENTS.API_RESPONSE_TIME
        
        this.results.apiResponse[apiName] = {
          avgResponseTime,
          maxResponseTime,
          success,
          url,
          measurements: results
        }
        
        const status = success ? 'success' : 'warning'
        this.log(`${apiName}: 平均${avgResponseTime}ms, 最大${maxResponseTime}ms (${success ? '合格' : '要改善'})`, status)
        
      } catch (error) {
        this.results.apiResponse[apiName] = {
          avgResponseTime: -1,
          success: false,
          error: error.message
        }
        this.log(`${apiName}: エラー - ${error.message}`, 'error')
      }
    }
  }

  // データベースクエリパフォーマンステスト
  async testDatabasePerformance() {
    this.log('データベースパフォーマンステスト開始')
    
    const dbTests = [
      {
        name: 'SIMPLE_HEALTH_CHECK',
        endpoint: '/api/health/db',
        description: 'シンプルなDB接続チェック'
      },
      {
        name: 'GACHA_LIST_QUERY',
        endpoint: '/api/gacha/list',
        description: 'ガチャ一覧クエリ'
      },
      {
        name: 'USER_MEDAL_BALANCE',
        endpoint: '/api/medals/balance',
        description: 'ユーザーメダル残高クエリ'
      }
    ]

    for (const test of dbTests) {
      try {
        const url = `${PERFORMANCE_CONFIG.STAGING_API_URL}${test.endpoint}`
        const queryTimes = []
        
        // 複数回実行
        for (let i = 0; i < 10; i++) {
          const startTime = Date.now()
          
          const response = await axios.get(url, {
            timeout: PERFORMANCE_CONFIG.REQUIREMENTS.DATABASE_QUERY_TIME + 1000,
            validateStatus: () => true
          })
          
          const queryTime = Date.now() - startTime
          queryTimes.push(queryTime)
          
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        const avgQueryTime = Math.round(queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length)
        const maxQueryTime = Math.max(...queryTimes)
        const success = avgQueryTime <= PERFORMANCE_CONFIG.REQUIREMENTS.DATABASE_QUERY_TIME
        
        this.results.database[test.name] = {
          avgQueryTime,
          maxQueryTime,
          success,
          description: test.description,
          measurements: queryTimes
        }
        
        const status = success ? 'success' : 'warning'
        this.log(`${test.name}: 平均${avgQueryTime}ms, 最大${maxQueryTime}ms (${success ? '合格' : '要改善'})`, status)
        
      } catch (error) {
        this.results.database[test.name] = {
          avgQueryTime: -1,
          success: false,
          error: error.message
        }
        this.log(`${test.name}: エラー - ${error.message}`, 'error')
      }
    }
  }

  // 負荷テスト（k6使用）
  async runLoadTest() {
    this.log('負荷テスト開始')
    
    try {
      // k6テストスクリプトを作成
      const k6Script = this.generateK6Script()
      const scriptPath = path.join(__dirname, 'load-test.js')
      fs.writeFileSync(scriptPath, k6Script)
      
      this.log('k6負荷テストスクリプト作成完了')
      
      // k6実行
      const k6Result = execSync(
        `k6 run --vus ${PERFORMANCE_CONFIG.REQUIREMENTS.CONCURRENT_USERS} --duration 30s "${scriptPath}"`,
        { encoding: 'utf8', timeout: 60000 }
      )
      
      // k6結果パース
      const metrics = this.parseK6Results(k6Result)
      this.results.loadTest = metrics
      
      // 成功基準チェック
      const success = this.validateLoadTestResults(metrics)
      const status = success ? 'success' : 'warning'
      
      this.log(`負荷テスト完了 - 平均RPS: ${metrics.rps}, エラー率: ${metrics.errorRate}% (${success ? '合格' : '要改善'})`, status)
      
      // テストファイルクリーンアップ
      fs.unlinkSync(scriptPath)
      
    } catch (error) {
      this.results.loadTest = {
        success: false,
        error: error.message
      }
      this.log(`負荷テスト失敗: ${error.message}`, 'error')
    }
  }

  // k6テストスクリプト生成
  generateK6Script() {
    return `
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: ${PERFORMANCE_CONFIG.REQUIREMENTS.CONCURRENT_USERS},
  duration: '30s',
};

export default function() {
  // フロントエンドページテスト
  let frontendResponse = http.get('${PERFORMANCE_CONFIG.STAGING_BASE_URL}');
  check(frontendResponse, {
    'frontend status is 200': (r) => r.status === 200,
    'frontend response time < 3s': (r) => r.timings.duration < 3000,
  });
  
  // APIテスト
  let apiResponse = http.get('${PERFORMANCE_CONFIG.STAGING_API_URL}/api/health');
  check(apiResponse, {
    'api status is 200': (r) => r.status === 200,
    'api response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  // ガチャリストAPI
  let gachaResponse = http.get('${PERFORMANCE_CONFIG.STAGING_API_URL}/api/gacha/list');
  check(gachaResponse, {
    'gacha list status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
    `.trim()
  }

  // k6結果パース
  parseK6Results(k6Output) {
    try {
      const lines = k6Output.split('\n')
      const metrics = {}
      
      for (const line of lines) {
        if (line.includes('http_reqs')) {
          const rpsMatch = line.match(/(\d+(?:\.\d+)?)\s*\/s/)
          if (rpsMatch) metrics.rps = parseFloat(rpsMatch[1])
        }
        
        if (line.includes('http_req_duration')) {
          const avgMatch = line.match(/avg=(\d+(?:\.\d+)?ms)/)
          if (avgMatch) metrics.avgDuration = avgMatch[1]
        }
        
        if (line.includes('http_req_failed')) {
          const errorRateMatch = line.match(/(\d+(?:\.\d+)?)%/)
          if (errorRateMatch) metrics.errorRate = parseFloat(errorRateMatch[1])
        }
      }
      
      metrics.success = true
      return metrics
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // 負荷テスト結果検証
  validateLoadTestResults(metrics) {
    return (
      metrics.rps >= PERFORMANCE_CONFIG.REQUIREMENTS.THROUGHPUT_RPS &&
      metrics.errorRate <= PERFORMANCE_CONFIG.REQUIREMENTS.ERROR_RATE_THRESHOLD
    )
  }

  // Lighthouseパフォーマンス監査
  async runLighthouseAudit() {
    this.log('Lighthouseパフォーマンス監査開始')
    
    try {
      // Lighthouseレポート生成
      const lighthouseCmd = `lighthouse ${PERFORMANCE_CONFIG.STAGING_BASE_URL} --output=json --quiet --chrome-flags="--headless --no-sandbox"`
      
      const lighthouseOutput = execSync(lighthouseCmd, { 
        encoding: 'utf8',
        timeout: 120000 
      })
      
      const report = JSON.parse(lighthouseOutput)
      const scores = report.lhr.categories
      
      this.results.lighthouse = {
        performance: Math.round(scores.performance.score * 100),
        accessibility: Math.round(scores.accessibility.score * 100),
        bestPractices: Math.round(scores['best-practices'].score * 100),
        seo: Math.round(scores.seo.score * 100),
        success: scores.performance.score * 100 >= PERFORMANCE_CONFIG.REQUIREMENTS.LIGHTHOUSE_SCORE
      }
      
      const status = this.results.lighthouse.success ? 'success' : 'warning'
      this.log(`Lighthouse監査完了 - パフォーマンス: ${this.results.lighthouse.performance}点 (${this.results.lighthouse.success ? '合格' : '要改善'})`, status)
      
    } catch (error) {
      this.results.lighthouse = {
        success: false,
        error: error.message
      }
      this.log(`Lighthouse監査失敗: ${error.message}`, 'warning')
    }
  }

  // 総合レポート生成
  generateReport() {
    const totalDuration = Date.now() - this.startTime
    
    // 各カテゴリの成功数を集計
    const pageLoadSuccess = Object.values(this.results.pageLoad).filter(r => r.success).length
    const pageLoadTotal = Object.keys(this.results.pageLoad).length
    
    const apiSuccess = Object.values(this.results.apiResponse).filter(r => r.success).length
    const apiTotal = Object.keys(this.results.apiResponse).length
    
    const dbSuccess = Object.values(this.results.database).filter(r => r.success).length
    const dbTotal = Object.keys(this.results.database).length
    
    // 総合成功率
    const totalTests = pageLoadTotal + apiTotal + dbTotal + 1 + 1 // +Lighthouse +LoadTest
    let successfulTests = pageLoadSuccess + apiSuccess + dbSuccess
    
    if (this.results.loadTest.success) successfulTests++
    if (this.results.lighthouse.success) successfulTests++
    
    const overallSuccessRate = Math.round((successfulTests / totalTests) * 100)

    console.log('\n' + '='.repeat(80))
    console.log('📊 TASK-504 パフォーマンス検証結果（本番同等）')
    console.log('='.repeat(80))
    console.log(`総実行時間: ${Math.round(totalDuration / 1000)}秒`)
    console.log(`総合成功率: ${overallSuccessRate}% (${successfulTests}/${totalTests})`)
    console.log('')
    
    console.log('📱 ページロード性能:')
    Object.entries(this.results.pageLoad).forEach(([name, result]) => {
      const status = result.success ? '✅' : '❌'
      console.log(`  ${status} ${name}: ${result.loadTime}ms`)
    })
    
    console.log('\n🚀 API応答性能:')
    Object.entries(this.results.apiResponse).forEach(([name, result]) => {
      const status = result.success ? '✅' : '❌'
      console.log(`  ${status} ${name}: 平均${result.avgResponseTime}ms`)
    })
    
    console.log('\n💾 データベース性能:')
    Object.entries(this.results.database).forEach(([name, result]) => {
      const status = result.success ? '✅' : '❌'
      console.log(`  ${status} ${name}: 平均${result.avgQueryTime}ms`)
    })
    
    if (this.results.loadTest.success) {
      console.log(`\n⚡ 負荷テスト: ✅ RPS ${this.results.loadTest.rps}, エラー率 ${this.results.loadTest.errorRate}%`)
    } else {
      console.log(`\n⚡ 負荷テスト: ❌ ${this.results.loadTest.error || '実行失敗'}`)
    }
    
    if (this.results.lighthouse.success !== undefined) {
      const status = this.results.lighthouse.success ? '✅' : '❌'
      console.log(`\n🔍 Lighthouse監査: ${status} パフォーマンススコア ${this.results.lighthouse.performance}点`)
    }
    
    console.log('\n' + '='.repeat(80))
    
    // 判定基準
    if (overallSuccessRate >= 95) {
      console.log('🎉 パフォーマンス検証成功! ステージング環境は本番同等の性能を満たしています')
      return true
    } else if (overallSuccessRate >= 85) {
      console.log('⚠️  警告: 一部のパフォーマンス要件を満たしていませんが、基本性能は確保されています')
      return true
    } else {
      console.log('❌ パフォーマンス検証失敗: 改善が必要です')
      return false
    }
  }

  // メイン実行
  async run() {
    this.log('TASK-504 パフォーマンス検証開始（本番同等）')
    this.log(`テスト対象: ${PERFORMANCE_CONFIG.STAGING_BASE_URL}`)
    console.log('')

    try {
      await this.testPageLoadTime()
      await this.testApiResponseTime()
      await this.testDatabasePerformance()
      await this.runLoadTest()
      await this.runLighthouseAudit()
      
      return this.generateReport()
    } catch (error) {
      this.log(`パフォーマンス検証中に予期しないエラーが発生: ${error.message}`, 'error')
      return false
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const validator = new PerformanceValidator()
  validator.run().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { PerformanceValidator, PERFORMANCE_CONFIG }