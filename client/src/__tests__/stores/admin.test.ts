import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAdminStore } from '@/stores/admin'

// APIクライアントのモック
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

describe('Admin Store', () => {
  beforeEach(() => {
    // ストアをリセット
    const { result } = renderHook(() => useAdminStore())
    act(() => {
      result.current.clearErrors()
    })
  })

  describe('fetchDashboardMetrics', () => {
    it('should fetch dashboard metrics successfully', async () => {
      const mockData = {
        systemOverview: {
          totalUsers: 1000,
          totalVTubers: 50,
          totalRevenue: 500000,
          activeUsersDAU: 200,
          systemAlerts: []
        },
        systemStatus: {
          apiResponseTime: 100,
          errorRate: 0.01,
          databaseStatus: 'healthy',
          cacheHitRate: 95.0,
          storageUsage: { used: 100, total: 1000, percentage: 10 }
        },
        dateRange: {
          startDate: '2025-07-29',
          endDate: '2025-08-28'
        }
      }

      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValueOnce({ data: mockData })

      const { result } = renderHook(() => useAdminStore())

      await act(async () => {
        await result.current.fetchDashboardMetrics('30d')
      })

      await waitFor(() => {
        expect(result.current.dashboardMetrics).toEqual(mockData)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.errors.dashboard).toBeUndefined()
      })
    })

    it('should handle fetch dashboard metrics error', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAdminStore())

      await act(async () => {
        await result.current.fetchDashboardMetrics('30d')
      })

      await waitFor(() => {
        expect(result.current.dashboardMetrics).toBeNull()
        expect(result.current.isLoading).toBe(false)
        expect(result.current.errors.dashboard).toBe('Network error')
      })
    })
  })

  describe('fetchUsers', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          displayName: 'ユーザー1',
          status: 'active',
          totalGachaDraws: 10,
          medalBalance: 1000
        }
      ]

      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValueOnce({ data: mockUsers })

      const { result } = renderHook(() => useAdminStore())

      await act(async () => {
        await result.current.fetchUsers({ dateRange: { startDate: '2025-07-01', endDate: '2025-08-01' } })
      })

      await waitFor(() => {
        expect(result.current.users).toEqual(mockUsers)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.errors.users).toBeUndefined()
      })
    })
  })

  describe('fetchApplications', () => {
    it('should fetch VTuber applications successfully', async () => {
      const mockApplications = [
        {
          id: '1',
          applicant: {
            id: 'app1',
            channelName: 'Test Channel',
            email: 'test@example.com',
            applicationDate: '2025-08-01'
          },
          status: 'pending',
          priority: 'medium',
          reviewHistory: []
        }
      ]

      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValueOnce({ data: mockApplications })

      const { result } = renderHook(() => useAdminStore())

      await act(async () => {
        await result.current.fetchApplications({ dateRange: { startDate: '2025-07-01', endDate: '2025-08-01' } })
      })

      await waitFor(() => {
        expect(result.current.applications).toEqual(mockApplications)
        expect(result.current.isLoading).toBe(false)
        expect(result.current.errors.applications).toBeUndefined()
      })
    })
  })

  describe('reviewApplication', () => {
    it('should review application successfully', async () => {
      const mockApplications = [
        {
          id: '1',
          applicant: { id: 'app1', channelName: 'Test', email: 'test@example.com', applicationDate: '2025-08-01' },
          status: 'pending',
          priority: 'medium',
          reviewHistory: []
        }
      ]

      const { result } = renderHook(() => useAdminStore())
      
      // 初期データを設定
      act(() => {
        result.current.applications = mockApplications
      })

      const { apiClient } = require('@/api/client')
      apiClient.post.mockResolvedValueOnce({ data: { status: 'approved' } })

      await act(async () => {
        await result.current.reviewApplication('1', { type: 'approve', comment: 'Approved' })
      })

      await waitFor(() => {
        const updatedApplication = result.current.applications.find(app => app.id === '1')
        expect(updatedApplication?.status).toBe('approved')
        expect(result.current.isLoading).toBe(false)
        expect(result.current.errors.review).toBeUndefined()
      })
    })
  })

  describe('performUserAction', () => {
    it('should perform user action successfully', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@example.com',
          displayName: 'ユーザー1',
          status: 'active' as const,
          totalGachaDraws: 10,
          medalBalance: 1000,
          registrationDate: '2025-07-01',
          lastLoginDate: '2025-08-01',
          totalSpent: 5000,
          rewardCount: 5,
          riskScore: 0.1
        }
      ]

      const { result } = renderHook(() => useAdminStore())
      
      // 初期データを設定
      act(() => {
        result.current.users = mockUsers
      })

      const { apiClient } = require('@/api/client')
      apiClient.post.mockResolvedValueOnce({ data: { success: true } })

      await act(async () => {
        await result.current.performUserAction('1', { type: 'user_suspend', reason: 'Test suspension' })
      })

      await waitFor(() => {
        const updatedUser = result.current.users.find(user => user.id === '1')
        expect(updatedUser?.status).toBe('suspended')
        expect(result.current.isLoading).toBe(false)
        expect(result.current.errors.userAction).toBeUndefined()
      })
    })
  })

  describe('fetchSystemStatus', () => {
    it('should fetch system status successfully', async () => {
      const mockStatus = {
        server: 'healthy' as const,
        database: 'connected' as const,
        redis: 'connected' as const,
        uptime: 3600
      }

      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValueOnce({ data: mockStatus })

      const { result } = renderHook(() => useAdminStore())

      await act(async () => {
        await result.current.fetchSystemStatus()
      })

      await waitFor(() => {
        expect(result.current.systemStatus).toEqual(mockStatus)
      })
    })
  })
})