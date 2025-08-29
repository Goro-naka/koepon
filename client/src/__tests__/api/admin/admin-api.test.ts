import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

// Backend APIのテスト
describe('Admin API Backend Tests', () => {
  const BACKEND_URL = 'http://localhost:3002/api/v1'
  
  beforeAll(async () => {
    // バックエンドサーバーが起動していることを確認
    try {
      const response = await fetch(`${BACKEND_URL}/health`)
      expect(response.status).toBe(200)
    } catch (error) {
      throw new Error('Backend server is not running on port 3002')
    }
  })

  describe('Dashboard API', () => {
    it('should return dashboard stats with correct structure', async () => {
      const response = await fetch(`${BACKEND_URL}/admin/dashboard/stats`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('systemOverview')
      expect(data).toHaveProperty('systemStatus')
      expect(data).toHaveProperty('dateRange')
      
      // System Overview validation
      expect(data.systemOverview).toHaveProperty('totalUsers')
      expect(data.systemOverview).toHaveProperty('newUsersToday')
      expect(data.systemOverview).toHaveProperty('totalVTubers')
      expect(data.systemOverview).toHaveProperty('pendingApplications')
      expect(data.systemOverview).toHaveProperty('totalRevenue')
      expect(data.systemOverview).toHaveProperty('activeUsersDAU')
      expect(data.systemOverview).toHaveProperty('systemAlerts')
      
      // System Status validation
      expect(data.systemStatus).toHaveProperty('apiResponseTime')
      expect(data.systemStatus).toHaveProperty('errorRate')
      expect(data.systemStatus).toHaveProperty('databaseStatus')
      expect(data.systemStatus).toHaveProperty('cacheHitRate')
      expect(data.systemStatus).toHaveProperty('storageUsage')
      
      // Type validation
      expect(typeof data.systemOverview.totalUsers).toBe('number')
      expect(typeof data.systemStatus.apiResponseTime).toBe('number')
      expect(Array.isArray(data.systemOverview.systemAlerts)).toBe(true)
    })
  })

  describe('Users API', () => {
    it('should return users list with correct structure', async () => {
      const response = await fetch(`${BACKEND_URL}/admin/users`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      // Validate user structure
      const user = data[0]
      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user).toHaveProperty('displayName')
      expect(user).toHaveProperty('registrationDate')
      expect(user).toHaveProperty('lastLoginDate')
      expect(user).toHaveProperty('status')
      expect(user).toHaveProperty('totalGachaDraws')
      expect(user).toHaveProperty('totalSpent')
      expect(user).toHaveProperty('medalBalance')
      expect(user).toHaveProperty('rewardCount')
      expect(user).toHaveProperty('riskScore')
      
      // Type validation
      expect(typeof user.totalGachaDraws).toBe('number')
      expect(typeof user.riskScore).toBe('number')
      expect(['active', 'suspended', 'deleted']).toContain(user.status)
    })
  })

  describe('VTuber Applications API', () => {
    it('should return VTuber applications with correct structure', async () => {
      const response = await fetch(`${BACKEND_URL}/admin/vtubers`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      // Validate application structure
      const application = data[0]
      expect(application).toHaveProperty('id')
      expect(application).toHaveProperty('applicant')
      expect(application).toHaveProperty('status')
      expect(application).toHaveProperty('priority')
      expect(application).toHaveProperty('reviewHistory')
      
      // Validate applicant structure
      expect(application.applicant).toHaveProperty('id')
      expect(application.applicant).toHaveProperty('channelName')
      expect(application.applicant).toHaveProperty('email')
      expect(application.applicant).toHaveProperty('applicationDate')
      
      // Type validation
      expect(['pending', 'under_review', 'approved', 'rejected', 'requires_info']).toContain(application.status)
      expect(['low', 'medium', 'high', 'urgent']).toContain(application.priority)
      expect(Array.isArray(application.reviewHistory)).toBe(true)
    })
  })

  describe('System Monitoring API', () => {
    it('should return system status with correct structure', async () => {
      const response = await fetch(`${BACKEND_URL}/admin/system/monitoring`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('server')
      expect(data).toHaveProperty('database')
      expect(data).toHaveProperty('redis')
      expect(data).toHaveProperty('uptime')
      
      // Type validation
      expect(['healthy', 'warning', 'critical']).toContain(data.server)
      expect(['connected', 'disconnected']).toContain(data.database)
      expect(typeof data.uptime).toBe('number')
    })
  })

  describe('Gacha Probability API', () => {
    it('should return gacha probability settings', async () => {
      const response = await fetch(`${BACKEND_URL}/admin/gacha/probability`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('settings')
      expect(data.success).toBe(true)
      
      // Validate probability settings structure
      const settings = data.settings
      expect(settings).toHaveProperty('N')
      expect(settings).toHaveProperty('R')
      expect(settings).toHaveProperty('SR')
      expect(settings).toHaveProperty('SSR')
      expect(settings).toHaveProperty('UR')
      
      // Validate each rarity setting
      Object.values(settings).forEach((setting: any) => {
        expect(setting).toHaveProperty('rate')
        expect(setting).toHaveProperty('minValue')
        expect(setting).toHaveProperty('maxValue')
        expect(typeof setting.rate).toBe('number')
      })
    })

    it('should handle gacha probability update', async () => {
      const updateData = {
        N: { rate: 65.0, minValue: 55, maxValue: 75 },
        R: { rate: 20.0, minValue: 15, maxValue: 25 }
      }
      
      const response = await fetch(`${BACKEND_URL}/admin/gacha/probability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('message')
      expect(data.success).toBe(true)
    })
  })
})