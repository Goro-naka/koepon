import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminDashboardPage } from '../AdminDashboardPage'
import { useAdminStore } from '@/stores/admin'
import type { AdminDashboardMetrics } from '@/types/admin'

// Mock the Admin store
jest.mock('@/stores/admin')
const mockUseAdminStore = useAdminStore as jest.MockedFunction<typeof useAdminStore>

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

const MockedProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

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

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AdminDashboardPage', () => {
  describe('Basic Rendering', () => {
    it('should render dashboard title and main elements', () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // Check main dashboard elements
      expect(screen.getByText('管理者ダッシュボード')).toBeInTheDocument()
      expect(screen.getByText('システム概要')).toBeInTheDocument()
      expect(screen.getByText('システムステータス')).toBeInTheDocument()
    })

    it('should render period selection filter', () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // This will fail because period filter is not implemented yet
      expect(screen.getByText('今日')).toBeInTheDocument()
      expect(screen.getByText('7日間')).toBeInTheDocument()
      expect(screen.getByText('30日間')).toBeInTheDocument()
      expect(screen.getByText('90日間')).toBeInTheDocument()
      expect(screen.getByText('カスタム')).toBeInTheDocument()
    })
  })

  describe('System Overview Metrics', () => {
    it('should display system overview metrics correctly', () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // Check metrics display
      expect(screen.getByText('15,420')).toBeInTheDocument() // totalUsers
      expect(screen.getByText('89')).toBeInTheDocument() // totalVTubers
      expect(screen.getByText('¥4,250,000')).toBeInTheDocument() // totalRevenue
      expect(screen.getByText(/15\.2%/)).toBeInTheDocument() // revenueGrowth (may include + prefix)
      // Check total users section exists
      expect(screen.getByText('総ユーザー数')).toBeInTheDocument()
    })

    it('should display system status metrics', () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // This will fail because system status display is not implemented yet
      expect(screen.getByText('245ms')).toBeInTheDocument() // API response time
      expect(screen.getByText('0.8%')).toBeInTheDocument() // error rate
      expect(screen.getByText('92.5%')).toBeInTheDocument() // cache hit rate
      expect(screen.getByText('25.6%')).toBeInTheDocument() // storage usage
    })
  })

  describe('Period Filter Functionality', () => {
    it('should call fetchDashboardMetrics when period is changed', () => {
      const mockFetchDashboardMetrics = jest.fn()
      
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: mockFetchDashboardMetrics,
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // This will fail because period filter interaction is not implemented yet
      fireEvent.click(screen.getByText('7日間'))
      
      expect(mockFetchDashboardMetrics).toHaveBeenCalledWith('7d')
    })

    it('should show custom date picker when custom is selected', () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // This will fail because custom date picker is not implemented yet
      fireEvent.click(screen.getByText('カスタム'))
      
      expect(screen.getByLabelText('開始日')).toBeInTheDocument()
      expect(screen.getByLabelText('終了日')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading skeleton when data is loading', () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: null,
        isLoading: true,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // This will fail because loading skeleton is not implemented yet
      expect(screen.getByTestId('dashboard-loading-skeleton')).toBeInTheDocument()
    })

    it('should show loading indicator when fetching new data', async () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: true,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // Check if loading indicator appears when loading is true
      expect(screen.getByText('データ更新中...')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when fetch fails', () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: null,
        isLoading: false,
        errors: { dashboard: 'データの取得に失敗しました' },
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // This will fail because error display is not implemented yet
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
      expect(screen.getByText('再試行')).toBeInTheDocument()
    })

    it('should retry data fetch when retry button is clicked', () => {
      const mockFetchDashboardMetrics = jest.fn()
      
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: null,
        isLoading: false,
        errors: { dashboard: 'データの取得に失敗しました' },
        fetchDashboardMetrics: mockFetchDashboardMetrics,
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      fireEvent.click(screen.getByText('再試行'))
      
      // This will fail because retry functionality is not implemented yet
      expect(mockFetchDashboardMetrics).toHaveBeenCalled()
    })
  })

  describe('System Alerts', () => {
    it('should display system alerts when available', () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // This will fail because alerts display is not implemented yet
      expect(screen.getByText('システムアラート')).toBeInTheDocument()
      expect(screen.getByText('API応答時間が閾値を超えています')).toBeInTheDocument()
    })

    it('should show alert level with appropriate styling', () => {
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // This will fail because alert styling is not implemented yet
      const alertElement = screen.getByText('API応答時間が閾値を超えています')
      expect(alertElement.closest('.alert-warning')).toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to real-time updates on mount', () => {
      const mockSubscribeToUpdates = jest.fn()
      
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: mockSubscribeToUpdates,
        unsubscribeFromUpdates: jest.fn(),
      } as any)

      render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      // This will fail because real-time subscription is not implemented yet
      expect(mockSubscribeToUpdates).toHaveBeenCalled()
    })

    it('should unsubscribe from updates on unmount', () => {
      const mockUnsubscribeFromUpdates = jest.fn()
      
      mockUseAdminStore.mockReturnValue({
        dashboardMetrics: mockDashboardMetrics,
        isLoading: false,
        errors: {},
        fetchDashboardMetrics: jest.fn(),
        subscribeToUpdates: jest.fn(),
        unsubscribeFromUpdates: mockUnsubscribeFromUpdates,
      } as any)

      const { unmount } = render(
        <MockedProvider>
          <AdminDashboardPage />
        </MockedProvider>
      )

      unmount()

      // This will fail because cleanup is not implemented yet
      expect(mockUnsubscribeFromUpdates).toHaveBeenCalled()
    })
  })
})