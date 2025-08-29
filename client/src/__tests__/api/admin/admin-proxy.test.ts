import { describe, it, expect, beforeAll } from '@jest/globals'

// Frontend Proxy APIのテスト
describe('Admin API Proxy Tests', () => {
  const FRONTEND_URL = 'http://localhost:3000'
  
  beforeAll(async () => {
    // フロントエンドサーバーが起動していることを確認
    try {
      const response = await fetch(`${FRONTEND_URL}/api/health`)
      expect(response.status).toBe(200)
    } catch (error) {
      throw new Error('Frontend server is not running on port 3000')
    }
  })

  describe('Admin Dashboard Proxy', () => {
    it('should proxy dashboard metrics correctly', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/admin/dashboard/metrics`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('systemOverview')
      expect(data).toHaveProperty('systemStatus')
      expect(data).toHaveProperty('dateRange')
      
      // データの整合性確認
      expect(typeof data.systemOverview.totalUsers).toBe('number')
      expect(typeof data.systemStatus.apiResponseTime).toBe('number')
    })

    it('should handle query parameters in dashboard metrics', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/admin/dashboard/metrics?period=7d`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('systemOverview')
    })
  })

  describe('Admin Users Proxy', () => {
    it('should proxy users list correctly', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/admin/users`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      const user = data[0]
      expect(user).toHaveProperty('displayName')
      expect(user).toHaveProperty('status')
    })
  })

  describe('Admin VTuber Applications Proxy', () => {
    it('should proxy VTuber applications correctly', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/admin/vtuber-applications`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      
      const application = data[0]
      expect(application).toHaveProperty('applicant')
      expect(application.applicant).toHaveProperty('channelName')
    })
  })

  describe('Admin System Status Proxy', () => {
    it('should proxy system status correctly', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/admin/system/status`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('server')
      expect(data.server).toBe('healthy')
    })
  })

  describe('Admin System Metrics Proxy', () => {
    it('should proxy system metrics correctly', async () => {
      const response = await fetch(`${FRONTEND_URL}/api/admin/system/metrics`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data).toHaveProperty('database')
    })
  })
})