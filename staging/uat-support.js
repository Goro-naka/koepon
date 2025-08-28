#!/usr/bin/env node

/**
 * TASK-504 ステージング環境構築 - UAT体制構築
 * ユーザー受け入れテスト支援システム
 */

const { execSync } = require('child_process')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const UAT_CONFIG = {
  STAGING_BASE_URL: process.env.STAGING_BASE_URL || 'https://staging-koepon.vercel.app',
  STAGING_API_URL: process.env.STAGING_API_URL || 'https://koepon-api-staging.vercel.app',
  
  // テストシナリオ
  TEST_SCENARIOS: {
    BASIC_USER_FLOW: {
      name: '基本ユーザーフロー',
      steps: [
        '新規ユーザー登録',
        'ログイン',
        'ガチャ一覧表示',
        'ガチャ詳細確認',
        'ガチャ実行',
        '結果確認',
        'メダル残高確認',
        '特典BOX確認'
      ],
      duration: '15分',
      priority: 'CRITICAL'
    },
    VTUBER_MANAGEMENT: {
      name: 'VTuber管理フロー',
      steps: [
        'VTuber申請',
        '管理画面ログイン',
        'ガチャ作成',
        'ファイルアップロード',
        'ダッシュボード確認',
        '統計情報確認'
      ],
      duration: '20分',
      priority: 'HIGH'
    },
    ADMIN_FUNCTIONS: {
      name: '管理者機能フロー',
      steps: [
        '管理者ログイン',
        'ユーザー管理',
        'VTuber審査',
        'システム監視',
        'レポート生成'
      ],
      duration: '25分', 
      priority: 'HIGH'
    },
    PERFORMANCE_USABILITY: {
      name: '性能・使いやすさ',
      steps: [
        'ページロード速度確認',
        'レスポンシブデザイン確認',
        'エラーハンドリング確認',
        'アクセシビリティ確認'
      ],
      duration: '10分',
      priority: 'MEDIUM'
    }
  },
  
  // テストアカウント
  TEST_ACCOUNTS: {
    REGULAR_USER: {
      email: 'uat-user@example.com',
      password: 'UAT2024!Test',
      role: 'user',
      description: '一般ユーザーテストアカウント'
    },
    VTUBER_USER: {
      email: 'uat-vtuber@example.com', 
      password: 'VTuber2024!Test',
      role: 'vtuber',
      description: 'VTuberテストアカウント'
    },
    ADMIN_USER: {
      email: 'uat-admin@example.com',
      password: 'Admin2024!Test',
      role: 'admin',
      description: '管理者テストアカウント'
    }
  },
  
  // 受け入れ基準
  ACCEPTANCE_CRITERIA: {
    FUNCTIONAL_TESTS: {
      PASS_RATE: 95, // 95%以上のテストケース合格
      CRITICAL_BUGS: 0, // クリティカルバグ0件
      HIGH_BUGS: 3, // 高優先度バグ3件以下
      MEDIUM_BUGS: 10 // 中優先度バグ10件以下
    },
    PERFORMANCE_CRITERIA: {
      PAGE_LOAD_TIME: 3000, // 3秒以内
      API_RESPONSE_TIME: 2000, // 2秒以内
      AVAILABILITY: 99.5 // 99.5%以上
    },
    USABILITY_CRITERIA: {
      TASK_COMPLETION_RATE: 90, // タスク完了率90%以上
      USER_SATISFACTION: 4.0 // 5点満点で4.0以上
    }
  }
}

class UATSupport {
  constructor() {
    this.testResults = {
      environmentSetup: {},
      accountCreation: {},
      testScenarios: {},
      feedbackCollection: {},
      summary: {}
    }
    this.startTime = Date.now()
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const icons = { info: '🎯', success: '✅', warning: '⚠️', error: '❌' }
    console.log(`${icons[type]} [${timestamp}] ${message}`)
  }

  // UAT環境準備状況確認
  async verifyUATEnvironment() {
    this.log('UAT環境準備状況確認開始')
    
    try {
      // フロントエンド可用性確認
      const frontendResponse = await axios.get(UAT_CONFIG.STAGING_BASE_URL, {
        timeout: 10000
      })
      
      const frontendOk = frontendResponse.status === 200
      
      // API可用性確認
      const apiResponse = await axios.get(`${UAT_CONFIG.STAGING_API_URL}/api/health`, {
        timeout: 10000
      })
      
      const apiOk = apiResponse.status === 200
      
      // データベース接続確認
      const dbOk = apiResponse.data.services?.database === 'connected'
      
      this.testResults.environmentSetup = {
        frontendAvailable: frontendOk,
        apiAvailable: apiOk,
        databaseConnected: dbOk,
        success: frontendOk && apiOk && dbOk
      }
      
      const status = (frontendOk && apiOk && dbOk) ? 'success' : 'error'
      this.log(`UAT環境状況: Frontend ${frontendOk ? 'OK' : 'NG'}, API ${apiOk ? 'OK' : 'NG'}, DB ${dbOk ? 'OK' : 'NG'}`, status)
      
    } catch (error) {
      this.testResults.environmentSetup = {
        success: false,
        error: error.message
      }
      this.log(`UAT環境確認失敗: ${error.message}`, 'error')
    }
  }

  // テストアカウント作成・確認
  async setupTestAccounts() {
    this.log('テストアカウント設定開始')
    
    const accountResults = {}
    
    for (const [accountType, accountInfo] of Object.entries(UAT_CONFIG.TEST_ACCOUNTS)) {
      try {
        // アカウント存在確認（ログイン試行）
        const loginResponse = await axios.post(`${UAT_CONFIG.STAGING_API_URL}/api/auth/login`,
          {
            email: accountInfo.email,
            password: accountInfo.password
          },
          { 
            validateStatus: () => true,
            timeout: 5000
          }
        )
        
        const accountExists = loginResponse.status === 200
        
        if (!accountExists) {
          // アカウントが存在しない場合は作成を試行
          this.log(`${accountType} アカウントが存在しません。作成をスキップします（手動作成推奨）`, 'warning')
        }
        
        accountResults[accountType] = {
          email: accountInfo.email,
          role: accountInfo.role,
          description: accountInfo.description,
          exists: accountExists,
          success: true // 存在しなくても設定情報は提供
        }
        
        const status = accountExists ? 'success' : 'warning'
        this.log(`${accountType}: ${accountExists ? '利用可能' : '要手動作成'} (${accountInfo.email})`, status)
        
      } catch (error) {
        accountResults[accountType] = {
          success: false,
          error: error.message,
          email: accountInfo.email
        }
        this.log(`${accountType} アカウント確認失敗: ${error.message}`, 'error')
      }
    }
    
    this.testResults.accountCreation = accountResults
  }

  // テストシナリオドキュメント生成
  generateTestScenarios() {
    this.log('テストシナリオドキュメント生成開始')
    
    try {
      let scenarioDoc = `# TASK-504 UAT テストシナリオ

## 📋 テストシナリオ一覧

**テスト実施期間**: 4.5日間  
**テスト環境**: ${UAT_CONFIG.STAGING_BASE_URL}  
**API環境**: ${UAT_CONFIG.STAGING_API_URL}

## 🎯 受け入れ基準

### 機能テスト
- テストケース合格率: **${UAT_CONFIG.ACCEPTANCE_CRITERIA.FUNCTIONAL_TESTS.PASS_RATE}%以上**
- クリティカルバグ: **${UAT_CONFIG.ACCEPTANCE_CRITERIA.FUNCTIONAL_TESTS.CRITICAL_BUGS}件**
- 高優先度バグ: **${UAT_CONFIG.ACCEPTANCE_CRITERIA.FUNCTIONAL_TESTS.HIGH_BUGS}件以下**

### パフォーマンステスト  
- ページロード時間: **${UAT_CONFIG.ACCEPTANCE_CRITERIA.PERFORMANCE_CRITERIA.PAGE_LOAD_TIME / 1000}秒以内**
- API応答時間: **${UAT_CONFIG.ACCEPTANCE_CRITERIA.PERFORMANCE_CRITERIA.API_RESPONSE_TIME / 1000}秒以内**
- 可用性: **${UAT_CONFIG.ACCEPTANCE_CRITERIA.PERFORMANCE_CRITERIA.AVAILABILITY}%以上**

### ユーザビリティテスト
- タスク完了率: **${UAT_CONFIG.ACCEPTANCE_CRITERIA.USABILITY_CRITERIA.TASK_COMPLETION_RATE}%以上**
- ユーザー満足度: **${UAT_CONFIG.ACCEPTANCE_CRITERIA.USABILITY_CRITERIA.USER_SATISFACTION}点以上**（5点満点）

`
      
      // テストアカウント情報
      scenarioDoc += '\n## 🔑 テストアカウント\n\n'
      
      for (const [accountType, accountInfo] of Object.entries(UAT_CONFIG.TEST_ACCOUNTS)) {
        scenarioDoc += `### ${accountType}\n`
        scenarioDoc += `- **メールアドレス**: \`${accountInfo.email}\`\n`
        scenarioDoc += `- **パスワード**: \`${accountInfo.password}\`\n`
        scenarioDoc += `- **役割**: ${accountInfo.role}\n`
        scenarioDoc += `- **説明**: ${accountInfo.description}\n\n`
      }
      
      // テストシナリオ詳細
      scenarioDoc += '\n## 📝 テストシナリオ詳細\n\n'
      
      for (const [scenarioId, scenario] of Object.entries(UAT_CONFIG.TEST_SCENARIOS)) {
        scenarioDoc += `### ${scenario.name}\n`
        scenarioDoc += `- **所要時間**: ${scenario.duration}\n`
        scenarioDoc += `- **優先度**: ${scenario.priority}\n`
        scenarioDoc += `- **テストステップ**:\n`
        
        scenario.steps.forEach((step, index) => {
          scenarioDoc += `  ${index + 1}. ${step}\n`
        })
        
        scenarioDoc += '\n**チェックポイント**:\n'
        scenarioDoc += '- [ ] すべてのステップが正常に実行できる\n'
        scenarioDoc += '- [ ] エラーメッセージが適切に表示される\n'  
        scenarioDoc += '- [ ] ページの表示が正しい\n'
        scenarioDoc += '- [ ] レスポンス時間が要件を満たす\n\n'
      }
      
      // バグレポートテンプレート
      scenarioDoc += `
## 🐛 バグレポートテンプレート

\`\`\`
【バグタイトル】
（簡潔で分かりやすいタイトル）

【重要度】
Critical / High / Medium / Low

【再現手順】
1. 
2. 
3. 

【期待される動作】


【実際の動作】


【環境情報】
- ブラウザ: 
- OS: 
- デバイス: 
- テストアカウント: 

【スクリーンショット】
（必要に応じて添付）

【その他】

\`\`\`

## 📊 テスト実施記録シート

| シナリオ名 | 実施日時 | 担当者 | 結果 | 所要時間 | 備考 |
|-----------|----------|--------|------|----------|------|
| ${Object.values(UAT_CONFIG.TEST_SCENARIOS).map(s => s.name).join(' | | | | | |\n| ')} | | | | | |

## 🔄 フィードバック収集方法

1. **バグ・改善要望**: GitHub Issues
2. **ユーザビリティ**: 専用フィードバックフォーム  
3. **全体評価**: UAT完了報告書

---

**注意事項**:
- テストは必ず上記のテストアカウントを使用してください
- 個人情報や機密情報を入力しないでください
- 問題発生時は即座にテストを停止し、開発チームに報告してください
`
      
      // ファイル保存
      const scenarioPath = path.join(__dirname, 'uat-test-scenarios.md')
      fs.writeFileSync(scenarioPath, scenarioDoc)
      
      this.testResults.testScenarios = {
        success: true,
        filePath: scenarioPath,
        scenarioCount: Object.keys(UAT_CONFIG.TEST_SCENARIOS).length
      }
      
      this.log(`テストシナリオドキュメント生成完了: ${scenarioPath}`, 'success')
      
    } catch (error) {
      this.testResults.testScenarios = {
        success: false,
        error: error.message
      }
      this.log(`テストシナリオ生成失敗: ${error.message}`, 'error')
    }
  }

  // フィードバック収集システム設定
  setupFeedbackCollection() {
    this.log('フィードバック収集システム設定開始')
    
    try {
      // フィードバック収集用のスクリプト生成
      const feedbackScript = `
// TASK-504 UAT フィードバック収集システム
// ステージング環境にのみ表示されるフィードバックウィジェット

(function() {
  // ステージング環境でのみ実行
  if (!window.location.hostname.includes('staging')) {
    return;
  }
  
  // フィードバックボタンを作成
  const feedbackButton = document.createElement('div');
  feedbackButton.id = 'uat-feedback-button';
  feedbackButton.innerHTML = '📝 UAT フィードバック';
  feedbackButton.style.cssText = \`
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #007bff;
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,123,255,0.3);
    z-index: 10000;
    transition: all 0.3s ease;
  \`;
  
  feedbackButton.onmouseover = function() {
    this.style.transform = 'scale(1.05)';
    this.style.boxShadow = '0 4px 15px rgba(0,123,255,0.4)';
  };
  
  feedbackButton.onmouseout = function() {
    this.style.transform = 'scale(1)';
    this.style.boxShadow = '0 2px 10px rgba(0,123,255,0.3)';
  };
  
  // フィードバックモーダルを作成
  feedbackButton.onclick = function() {
    const modal = document.createElement('div');
    modal.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    \`;
    
    const form = document.createElement('div');
    form.style.cssText = \`
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    \`;
    
    form.innerHTML = \`
      <h3 style="margin-top: 0; color: #333;">UAT フィードバック</h3>
      <p style="color: #666; margin-bottom: 20px;">テスト中に気づいた点をお聞かせください</p>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">フィードバック種別:</label>
        <select id="feedback-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="bug">バグ報告</option>
          <option value="improvement">改善要望</option>
          <option value="usability">使いやすさ</option>
          <option value="performance">性能問題</option>
          <option value="other">その他</option>
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">重要度:</label>
        <select id="feedback-priority" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="critical">クリティカル</option>
        </select>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">現在のページ:</label>
        <input type="text" id="feedback-page" value="\${window.location.pathname}" readonly 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: bold;">詳細内容:</label>
        <textarea id="feedback-content" rows="5" 
                  style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"
                  placeholder="具体的な内容、再現手順、期待される動作などを記入してください..."></textarea>
      </div>
      
      <div style="text-align: right;">
        <button type="button" onclick="this.closest('.feedback-modal').remove()" 
                style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">
          キャンセル
        </button>
        <button type="button" id="submit-feedback" 
                style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          送信
        </button>
      </div>
    \`;
    
    modal.className = 'feedback-modal';
    modal.appendChild(form);
    document.body.appendChild(modal);
    
    // 送信処理
    document.getElementById('submit-feedback').onclick = function() {
      const feedback = {
        type: document.getElementById('feedback-type').value,
        priority: document.getElementById('feedback-priority').value,
        page: document.getElementById('feedback-page').value,
        content: document.getElementById('feedback-content').value,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // ローカルストレージに保存（実際の実装では外部APIに送信）
      const feedbacks = JSON.parse(localStorage.getItem('uat-feedbacks') || '[]');
      feedbacks.push(feedback);
      localStorage.setItem('uat-feedbacks', JSON.stringify(feedbacks));
      
      alert('フィードバックを送信しました。ありがとうございます！');
      modal.remove();
    };
    
    // 背景クリックで閉じる
    modal.onclick = function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    };
  };
  
  // ページに追加
  document.body.appendChild(feedbackButton);
  
  // フィードバック数を表示
  const feedbacks = JSON.parse(localStorage.getItem('uat-feedbacks') || '[]');
  if (feedbacks.length > 0) {
    const badge = document.createElement('div');
    badge.textContent = feedbacks.length;
    badge.style.cssText = \`
      position: absolute;
      top: -8px;
      right: -8px;
      background: #dc3545;
      color: white;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 50%;
      min-width: 18px;
      text-align: center;
    \`;
    feedbackButton.appendChild(badge);
  }
})();
`
      
      const scriptPath = path.join(__dirname, 'uat-feedback-widget.js')
      fs.writeFileSync(scriptPath, feedbackScript)
      
      this.testResults.feedbackCollection = {
        success: true,
        scriptPath: scriptPath,
        description: 'UAT環境でのフィードバック収集ウィジェット'
      }
      
      this.log(`フィードバック収集システム設定完了: ${scriptPath}`, 'success')
      
    } catch (error) {
      this.testResults.feedbackCollection = {
        success: false,
        error: error.message
      }
      this.log(`フィードバック収集システム設定失敗: ${error.message}`, 'error')
    }
  }

  // UAT支援レポート生成
  generateUATReport() {
    const totalDuration = Date.now() - this.startTime
    
    console.log('\n' + '='.repeat(80))
    console.log('🎯 TASK-504 UAT体制構築結果')
    console.log('='.repeat(80))
    console.log(`総準備時間: ${Math.round(totalDuration / 1000)}秒`)
    console.log(`テストシナリオ数: ${Object.keys(UAT_CONFIG.TEST_SCENARIOS).length}`)
    console.log(`テストアカウント数: ${Object.keys(UAT_CONFIG.TEST_ACCOUNTS).length}`)
    console.log('')
    
    // 環境準備状況
    const envStatus = this.testResults.environmentSetup.success ? '✅' : '❌'
    console.log(`${envStatus} UAT環境準備: ${this.testResults.environmentSetup.success ? '完了' : '要対応'}`)
    
    // テストアカウント状況
    const accountCount = Object.keys(this.testResults.accountCreation).length
    const readyAccounts = Object.values(this.testResults.accountCreation).filter(acc => acc.exists).length
    console.log(`📋 テストアカウント: ${readyAccounts}/${accountCount} 準備完了`)
    
    // テストシナリオ
    const scenarioStatus = this.testResults.testScenarios.success ? '✅' : '❌'
    console.log(`${scenarioStatus} テストシナリオ: ${this.testResults.testScenarios.success ? '生成完了' : '生成失敗'}`)
    
    // フィードバックシステム
    const feedbackStatus = this.testResults.feedbackCollection.success ? '✅' : '❌'
    console.log(`${feedbackStatus} フィードバック収集: ${this.testResults.feedbackCollection.success ? 'セットアップ完了' : 'セットアップ失敗'}`)
    
    console.log('\n📝 UAT実施ガイダンス:')
    console.log('1. テストシナリオドキュメントを確認してください')
    console.log('2. 指定されたテストアカウントでログインしてください')
    console.log('3. 各シナリオを順番に実施してください')
    console.log('4. 問題発見時は即座にフィードバックを送信してください')
    console.log('5. テスト完了後、総合評価レポートを作成してください')
    
    console.log('\n🎯 受け入れ基準:')
    console.log(`- 機能テスト合格率: ${UAT_CONFIG.ACCEPTANCE_CRITERIA.FUNCTIONAL_TESTS.PASS_RATE}%以上`)
    console.log(`- クリティカルバグ: ${UAT_CONFIG.ACCEPTANCE_CRITERIA.FUNCTIONAL_TESTS.CRITICAL_BUGS}件`)
    console.log(`- ページロード時間: ${UAT_CONFIG.ACCEPTANCE_CRITERIA.PERFORMANCE_CRITERIA.PAGE_LOAD_TIME / 1000}秒以内`)
    console.log(`- ユーザー満足度: ${UAT_CONFIG.ACCEPTANCE_CRITERIA.USABILITY_CRITERIA.USER_SATISFACTION}点以上`)
    
    console.log('\n' + '='.repeat(80))
    
    // 総合判定
    const allSystemsReady = (
      this.testResults.environmentSetup.success &&
      this.testResults.testScenarios.success &&
      this.testResults.feedbackCollection.success
    )
    
    if (allSystemsReady) {
      console.log('🎉 UAT体制構築完了! ユーザー受け入れテストの準備が整いました')
      console.log('📋 テストシナリオ: staging/uat-test-scenarios.md')
      console.log('🔧 フィードバックシステム: staging/uat-feedback-widget.js')
      return true
    } else {
      console.log('❌ UAT体制構築で問題が発生しました。修正が必要です')
      return false
    }
  }

  // メイン実行
  async run() {
    this.log('TASK-504 UAT体制構築開始')
    this.log(`対象環境: ${UAT_CONFIG.STAGING_BASE_URL}`)
    console.log('')

    try {
      await this.verifyUATEnvironment()
      await this.setupTestAccounts()
      this.generateTestScenarios()
      this.setupFeedbackCollection()
      
      return this.generateUATReport()
    } catch (error) {
      this.log(`UAT体制構築中に予期しないエラーが発生: ${error.message}`, 'error')
      return false
    }
  }
}

// スクリプト実行
if (require.main === module) {
  const uatSupport = new UATSupport()
  uatSupport.run().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { UATSupport, UAT_CONFIG }