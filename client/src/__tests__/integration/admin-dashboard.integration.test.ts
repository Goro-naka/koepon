import { describe, it, expect } from '@jest/globals'

// 管理画面統合テスト
describe('Admin Dashboard Integration Tests', () => {
  const BACKEND_URL = 'http://localhost:3002/api/v1'
  const FRONTEND_URL = 'http://localhost:3000'

  describe('Data Flow Integration', () => {
    it('should have consistent data between backend and frontend', async () => {
      // バックエンドから直接データを取得
      const backendResponse = await fetch(`${BACKEND_URL}/admin/dashboard/stats`)
      const backendData = await backendResponse.json()
      
      // フロントエンドプロキシ経由でデータを取得
      const frontendResponse = await fetch(`${FRONTEND_URL}/api/admin/dashboard/metrics`)
      const frontendData = await frontendResponse.json()
      
      expect(backendResponse.status).toBe(200)
      expect(frontendResponse.status).toBe(200)
      
      // データの一貫性を確認
      expect(frontendData.systemOverview.totalUsers)
        .toBe(backendData.systemOverview.totalUsers)
      expect(frontendData.systemStatus.apiResponseTime)
        .toBe(backendData.systemStatus.apiResponseTime)
      expect(frontendData.systemStatus.databaseStatus)
        .toBe(backendData.systemStatus.databaseStatus)
    })

    it('should handle user data consistently', async () => {
      // バックエンドのユーザーデータ
      const backendResponse = await fetch(`${BACKEND_URL}/admin/users`)
      const backendUsers = await backendResponse.json()
      
      // フロントエンドプロキシのユーザーデータ
      const frontendResponse = await fetch(`${FRONTEND_URL}/api/admin/users`)
      const frontendUsers = await frontendResponse.json()
      
      expect(backendResponse.status).toBe(200)
      expect(frontendResponse.status).toBe(200)
      expect(frontendUsers.length).toBe(backendUsers.length)
      
      // 最初のユーザーのデータ整合性確認
      if (frontendUsers.length > 0 && backendUsers.length > 0) {
        expect(frontendUsers[0].id).toBe(backendUsers[0].id)
        expect(frontendUsers[0].email).toBe(backendUsers[0].email)
        expect(frontendUsers[0].status).toBe(backendUsers[0].status)
      }
    })

    it('should handle VTuber applications consistently', async () => {
      // バックエンドのVTuber申請データ
      const backendResponse = await fetch(`${BACKEND_URL}/admin/vtubers`)
      const backendApps = await backendResponse.json()
      
      // フロントエンドプロキシのVTuber申請データ
      const frontendResponse = await fetch(`${FRONTEND_URL}/api/admin/vtuber-applications`)
      const frontendApps = await frontendResponse.json()
      
      expect(backendResponse.status).toBe(200)
      expect(frontendResponse.status).toBe(200)
      expect(frontendApps.length).toBe(backendApps.length)
      
      // 最初の申請のデータ整合性確認
      if (frontendApps.length > 0 && backendApps.length > 0) {
        expect(frontendApps[0].id).toBe(backendApps[0].id)
        expect(frontendApps[0].applicant.channelName)
          .toBe(backendApps[0].applicant.channelName)
        expect(frontendApps[0].status).toBe(backendApps[0].status)
      }
    })

    it('should handle system status consistently', async () => {
      // バックエンドのシステム状態
      const backendResponse = await fetch(`${BACKEND_URL}/admin/system/monitoring`)
      const backendStatus = await backendResponse.json()
      
      // フロントエンドプロキシのシステム状態
      const frontendResponse = await fetch(`${FRONTEND_URL}/api/admin/system/status`)
      const frontendStatus = await frontendResponse.json()
      
      expect(backendResponse.status).toBe(200)
      expect(frontendResponse.status).toBe(200)
      
      // システム状態の一貫性確認
      expect(frontendStatus.server).toBe(backendStatus.server)
      expect(frontendStatus.database).toBe(backendStatus.database)
      expect(frontendStatus.uptime).toBe(backendStatus.uptime)
    })
  })

  describe('API Response Format Validation', () => {
    it('should return properly formatted dashboard data', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/admin/dashboard/metrics`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      
      // システム概要の構造確認
      expect(data).toHaveProperty('systemOverview')
      expect(data.systemOverview).toHaveProperty('totalUsers')
      expect(data.systemOverview).toHaveProperty('totalVTubers')
      expect(data.systemOverview).toHaveProperty('totalRevenue')
      expect(data.systemOverview).toHaveProperty('activeUsersDAU')
      expect(data.systemOverview).toHaveProperty('systemAlerts')
      
      // システム状態の構造確認
      expect(data).toHaveProperty('systemStatus')
      expect(data.systemStatus).toHaveProperty('apiResponseTime')
      expect(data.systemStatus).toHaveProperty('errorRate')
      expect(data.systemStatus).toHaveProperty('databaseStatus')
      expect(data.systemStatus).toHaveProperty('storageUsage')
      
      // データ型の確認
      expect(typeof data.systemOverview.totalUsers).toBe('number')
      expect(typeof data.systemStatus.apiResponseTime).toBe('number')
      expect(Array.isArray(data.systemOverview.systemAlerts)).toBe(true)
      
      // 有効な値範囲の確認
      expect(data.systemOverview.totalUsers).toBeGreaterThanOrEqual(0)
      expect(data.systemStatus.errorRate).toBeGreaterThanOrEqual(0)
      expect(data.systemStatus.errorRate).toBeLessThanOrEqual(100)
    })

    it('should return properly formatted users data', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/admin/users`)
      const users = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(users)).toBe(true)
      
      if (users.length > 0) {
        const user = users[0]
        expect(user).toHaveProperty('id')
        expect(user).toHaveProperty('email')
        expect(user).toHaveProperty('displayName')
        expect(user).toHaveProperty('status')
        expect(user).toHaveProperty('totalGachaDraws')
        expect(user).toHaveProperty('medalBalance')
        expect(user).toHaveProperty('riskScore')
        
        // データ型確認
        expect(typeof user.totalGachaDraws).toBe('number')
        expect(typeof user.medalBalance).toBe('number')
        expect(typeof user.riskScore).toBe('number')
        
        // 値の妥当性確認
        expect(['active', 'suspended', 'deleted']).toContain(user.status)
        expect(user.riskScore).toBeGreaterThanOrEqual(0)
        expect(user.riskScore).toBeLessThanOrEqual(1)
      }
    })

    it('should return properly formatted VTuber applications data', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/admin/vtuber-applications`)
      const applications = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(applications)).toBe(true)
      
      if (applications.length > 0) {
        const app = applications[0]
        expect(app).toHaveProperty('id')
        expect(app).toHaveProperty('applicant')
        expect(app).toHaveProperty('status')
        expect(app).toHaveProperty('priority')
        expect(app).toHaveProperty('reviewHistory')
        
        // 申請者情報の確認
        expect(app.applicant).toHaveProperty('channelName')
        expect(app.applicant).toHaveProperty('email')
        expect(app.applicant).toHaveProperty('applicationDate')
        
        // 値の妥当性確認
        expect(['pending', 'under_review', 'approved', 'rejected', 'requires_info'])
          .toContain(app.status)
        expect(['low', 'medium', 'high', 'urgent']).toContain(app.priority)
        expect(Array.isArray(app.reviewHistory)).toBe(true)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle backend unavailable gracefully', async () => {
      // 存在しないポートにリクエストしてエラーハンドリングを確認
      try {
        const response = await fetch('http://localhost:9999/api/admin/dashboard/stats', {
          signal: AbortSignal.timeout(1000) // 1秒でタイムアウト
        })
        // ここには到達しないはず
        expect(false).toBe(true)
      } catch (error) {
        // エラーが期待通りに発生することを確認
        expect(error).toBeDefined()
      }
    })
  })

  describe('Performance Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const start = Date.now()
      
      const response = await fetch(`${FRONTEND_URL}/api/admin/dashboard/metrics`)
      
      const end = Date.now()
      const responseTime = end - start
      
      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // 5秒以内
      console.log(`Dashboard API response time: ${responseTime}ms`)
    })

    it('should handle multiple concurrent requests', async () => {
      const promises = []
      const requestCount = 5
      
      for (let i = 0; i < requestCount; i++) {
        promises.push(fetch(`${FRONTEND_URL}/api/admin/dashboard/metrics`))
      }
      
      const responses = await Promise.all(promises)
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200)
        console.log(`Request ${index + 1}: ${response.status}`)
      })
    })
  })
})