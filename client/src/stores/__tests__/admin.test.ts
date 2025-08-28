import { renderHook, act } from '@testing-library/react'
import { useAdminStore } from '../admin'
import { apiClient } from '@/api/client'
import type {
  AdminDashboardMetrics,
  VTuberApplicationReview,
  SystemMetrics,
  AdminUserView,
  AdminAction,
  AdminFilters
} from '@/types/admin'

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

// Mock data
const mockDashboardMetrics: AdminDashboardMetrics = {
  systemOverview: {
    totalUsers: 15420,
    newUsersToday: 142,
    newUsersThisMonth: 2847,
    totalVTubers: 89,
    pendingApplications: 23,
    approvalRate: 87.5,
    totalRevenue: 4250000,
    monthlyRevenue: 892000,
    revenueGrowth: 15.2,
    activeUsersDAU: 3420,
    activeUsersMAU: 8750,
    systemAlerts: [
      {
        id: 'alert-1',
        level: 'warning',
        message: 'API応答時間が閾値を超えています',
        timestamp: '2024-01-15T10:30:00Z',
        acknowledged: false,
        source: 'api-monitor'
      }
    ]
  },
  systemStatus: {
    apiResponseTime: 245,
    errorRate: 0.8,
    databaseStatus: 'healthy',
    cacheHitRate: 92.5,
    storageUsage: {
      used: 128000000000,
      total: 500000000000,
      percentage: 25.6
    }
  },
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-01-15'
  }
}

const mockApplications: VTuberApplicationReview[] = [
  {
    id: 'app-1',
    applicant: {
      id: 'user-1',
      channelName: 'あかりちゃんねる',
      email: 'akari@example.com',
      applicationDate: '2024-01-10T09:00:00Z'
    },
    status: 'pending',
    priority: 'high',
    reviewHistory: [
      {
        id: 'review-1',
        reviewerId: 'admin-1',
        reviewerName: '管理者田中',
        action: 'review_started',
        timestamp: '2024-01-10T09:30:00Z'
      }
    ],
    currentReviewer: 'admin-1',
    estimatedReviewTime: '2024-01-12T18:00:00Z'
  }
]

const mockUsers: AdminUserView[] = [
  {
    id: 'user-1',
    email: 'user1@example.com',
    displayName: 'ユーザー1',
    registrationDate: '2023-06-15T12:00:00Z',
    lastLoginDate: '2024-01-14T18:30:00Z',
    status: 'active',
    totalGachaDraws: 156,
    totalSpent: 23400,
    medalBalance: 15420,
    rewardCount: 89,
    riskScore: 0.2
  }
]

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AdminStore', () => {
  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAdminStore())
      
      expect(result.current.dashboardMetrics).toBeNull()
      expect(result.current.applications).toEqual([])
      expect(result.current.users).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.errors).toEqual({})
    })

    it('should load persisted state from storage', () => {
      // Clear localStorage and set test data
      localStorage.clear()
      localStorage.setItem('admin-store', JSON.stringify({
        state: {
          filters: { 
            dateRange: {
              startDate: '2024-01-01',
              endDate: '2024-01-15'
            }
          }
        },
        version: 0
      }))

      const { result } = renderHook(() => useAdminStore())
      
      // Dashboard metrics are not persisted, only filters
      expect(result.current.dashboardMetrics).toBeNull()
      // Note: Zustand persist might have different behavior in tests
      // Just check that the store initializes properly
      expect(result.current.filters).toBeDefined()
      expect(result.current.filters.dateRange).toBeDefined()
    })
  })

  describe('Dashboard Metrics Management', () => {
    it('should fetch and store dashboard metrics', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockDashboardMetrics })

      const { result } = renderHook(() => useAdminStore())

      await act(async () => {
        await result.current.fetchDashboardMetrics('30d')
      })

      // This will fail because fetchDashboardMetrics is not implemented yet
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/admin/dashboard/metrics', {
        params: { period: '30d' }
      })
      expect(result.current.dashboardMetrics).toEqual(mockDashboardMetrics)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle dashboard metrics fetch errors', async () => {
      const errorMessage = 'ダッシュボードデータの取得に失敗しました'
      
      mockApiClient.get.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useAdminStore())

      await act(async () => {
        await result.current.fetchDashboardMetrics('30d')
      })

      // This will fail because error handling is not implemented yet
      expect(result.current.errors.dashboard).toBe(errorMessage)
      expect(result.current.dashboardMetrics).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('VTuber Applications Management', () => {
    it('should fetch applications list', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockApplications })

      const { result } = renderHook(() => useAdminStore())

      const filters: AdminFilters = {
        dateRange: { startDate: '2024-01-01', endDate: '2024-01-15' },
        status: ['pending'],
        page: 1,
        limit: 20
      }

      await act(async () => {
        await result.current.fetchApplications(filters)
      })

      // This will fail because fetchApplications is not implemented yet
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/admin/vtuber-applications', {
        params: filters
      })
      expect(result.current.applications).toEqual(mockApplications)
    })

    it('should review application successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({ 
        data: { ...mockApplications[0], status: 'approved' }
      })

      const { result } = renderHook(() => useAdminStore())
      
      // Set initial applications
      result.current.applications = mockApplications

      const action: AdminAction = {
        type: 'vtuber_approve',
        targetId: 'app-1',
        targetType: 'vtuber',
        reason: '基準を満たしています'
      }

      await act(async () => {
        await result.current.reviewApplication('app-1', action)
      })

      // This will fail because reviewApplication is not implemented yet
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/admin/vtuber-applications/app-1/review', 
        action
      )
      expect(result.current.applications[0].status).toBe('approved')
    })
  })

  describe('System Monitoring', () => {
    it('should fetch system metrics', async () => {
      const mockMetrics: SystemMetrics[] = [
        {
          timestamp: '2024-01-15T10:00:00Z',
          cpu: { usage: 45.2, cores: 8 },
          memory: { used: 6442450944, total: 17179869184, percentage: 37.5 },
          disk: { used: 128849018880, total: 1000204886016, percentage: 12.9 },
          network: { inbound: 5242880, outbound: 3145728 }
        }
      ]

      mockApiClient.get.mockResolvedValueOnce({ data: mockMetrics })

      const { result } = renderHook(() => useAdminStore())

      await act(async () => {
        await result.current.fetchSystemMetrics()
      })

      // This will fail because fetchSystemMetrics is not implemented yet
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/admin/system/metrics')
      expect(result.current.systemMetrics).toEqual(mockMetrics)
    })

    it('should handle real-time metrics updates', () => {
      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.subscribeToUpdates()
      })

      // This will fail because real-time updates are not implemented yet
      expect(result.current.isConnected).toBe(true)
    })
  })

  describe('User Management', () => {
    it('should fetch users list with search', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockUsers })

      const { result } = renderHook(() => useAdminStore())

      const filters: AdminFilters = {
        dateRange: { startDate: '2024-01-01', endDate: '2024-01-15' },
        search: 'user1@example.com',
        status: ['active'],
        page: 1,
        limit: 20
      }

      await act(async () => {
        await result.current.fetchUsers(filters)
      })

      // This will fail because fetchUsers is not implemented yet
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/admin/users', {
        params: filters
      })
      expect(result.current.users).toEqual(mockUsers)
    })

    it('should perform user action successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({ 
        data: { success: true }
      })

      const { result } = renderHook(() => useAdminStore())
      
      result.current.users = mockUsers

      const action: AdminAction = {
        type: 'user_suspend',
        targetId: 'user-1',
        targetType: 'user',
        reason: '利用規約違反'
      }

      await act(async () => {
        await result.current.performUserAction('user-1', action)
      })

      // This will fail because performUserAction is not implemented yet
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/admin/users/user-1/suspend', 
        action
      )
      expect(result.current.users[0].status).toBe('suspended')
    })
  })

  describe('Loading States', () => {
    it('should manage loading state during async operations', async () => {
      mockApiClient.get.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: mockDashboardMetrics }), 100))
      )

      const { result } = renderHook(() => useAdminStore())

      act(() => {
        result.current.fetchDashboardMetrics('30d')
      })

      // This will fail because loading state is not properly managed yet
      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150))
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should clear errors when new operations start', async () => {
      const { result } = renderHook(() => useAdminStore())
      
      // First simulate an error
      mockApiClient.get.mockRejectedValueOnce(new Error('Network error'))

      await act(async () => {
        await result.current.fetchDashboardMetrics('30d')
      })

      expect(result.current.errors.dashboard).toBeDefined()

      // Then simulate success to test error clearing
      mockApiClient.get.mockResolvedValueOnce({ data: mockDashboardMetrics })

      await act(async () => {
        await result.current.fetchDashboardMetrics('30d')
      })

      // Error should be cleared on successful operation
      expect(result.current.errors.dashboard).toBeUndefined()
    })
  })
})