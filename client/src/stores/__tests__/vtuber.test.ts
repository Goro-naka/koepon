import { renderHook, act } from '@testing-library/react'
import { useVTuberStore } from '../vtuber'
import { apiClient } from '@/api/client'
import type { VTuberInfo, VTuberApplication, GachaManagementData } from '@/types/vtuber'

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

const mockVTuberInfo: VTuberInfo = {
  id: 'vtuber-1',
  channelName: 'テストVTuber',
  description: 'テスト用VTuberチャンネル',
  profileImage: 'https://example.com/profile.jpg',
  bannerImage: 'https://example.com/banner.jpg',
  socialMedia: {
    youtube: 'https://youtube.com/@testvtuber',
    twitter: 'https://twitter.com/testvtuber'
  },
  status: 'approved',
  joinedAt: '2024-01-01T00:00:00.000Z',
  totalRevenue: 100000,
  fanCount: 1500,
}

const mockApplication: VTuberApplication = {
  id: 'app-1',
  channelName: 'テストVTuber申請',
  description: 'テスト用申請',
  socialMediaLinks: {
    youtube: 'https://youtube.com/@testvtuber'
  },
  profileImage: 'https://example.com/profile.jpg',
  bannerImage: 'https://example.com/banner.jpg',
  activityProof: [],
  status: 'draft'
}

const mockGachaList: GachaManagementData[] = [
  {
    id: 'gacha-1',
    title: 'テストガチャ',
    description: 'テスト用ガチャ',
    price: 500,
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T23:59:59.000Z',
    status: 'active',
    thumbnailImage: 'https://example.com/gacha.jpg',
    items: [],
    totalDraws: 100,
    revenue: 50000,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T12:00:00.000Z',
  }
]

describe('VTuberStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store state
    useVTuberStore.setState({
      vtuberInfo: null,
      applicationStatus: { status: 'draft' },
      gachaList: [],
      dashboardMetrics: null,
      statisticsData: null,
      uploadedFiles: [],
      isLoading: false,
      error: null,
    })
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useVTuberStore())

      expect(result.current.vtuberInfo).toBeNull()
      expect(result.current.applicationStatus).toEqual({ status: 'draft' })
      expect(result.current.gachaList).toEqual([])
      expect(result.current.dashboardMetrics).toBeNull()
      expect(result.current.statisticsData).toBeNull()
      expect(result.current.uploadedFiles).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should load persisted state from storage', () => {
      // This will fail because persistence is not implemented yet
      const persistedState = {
        vtuberInfo: mockVTuberInfo,
        applicationStatus: { status: 'approved' as const }
      }
      
      localStorage.setItem('vtuber-store', JSON.stringify(persistedState))
      
      const { result } = renderHook(() => useVTuberStore())
      
      expect(result.current.vtuberInfo).toEqual(mockVTuberInfo)
      expect(result.current.applicationStatus.status).toBe('approved')
    })
  })

  describe('VTuber Info Management', () => {
    it('should fetch and store VTuber information', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: mockVTuberInfo
      })

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.fetchVTuberInfo()
      })

      // This will fail because fetchVTuberInfo is not implemented yet
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/vtuber/info')
      expect(result.current.vtuberInfo).toEqual(mockVTuberInfo)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should update VTuber information', async () => {
      const updatedInfo = { channelName: '更新されたチャンネル名' }
      mockApiClient.put.mockResolvedValueOnce({
        data: { ...mockVTuberInfo, ...updatedInfo }
      })

      const { result } = renderHook(() => useVTuberStore())
      
      act(() => {
        useVTuberStore.setState({ vtuberInfo: mockVTuberInfo })
      })

      await act(async () => {
        await result.current.updateVTuberInfo(updatedInfo)
      })

      // This will fail because updateVTuberInfo is not implemented yet
      expect(mockApiClient.put).toHaveBeenCalledWith('/api/vtuber/info', updatedInfo)
      expect(result.current.vtuberInfo?.channelName).toBe('更新されたチャンネル名')
    })

    it('should handle VTuber info fetch errors', async () => {
      const errorMessage = 'VTuber情報の取得に失敗しました'
      mockApiClient.get.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.fetchVTuberInfo()
      })

      // This will fail because error handling is not implemented yet
      expect(result.current.vtuberInfo).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('Application Management', () => {
    it('should submit application successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({
        data: { ...mockApplication, status: 'submitted' }
      })

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.submitApplication(mockApplication)
      })

      // This will fail because submitApplication is not implemented yet
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/vtuber/application', mockApplication)
      expect(result.current.applicationStatus.status).toBe('submitted')
    })

    it('should handle application submission errors', async () => {
      const errorMessage = '申請の送信に失敗しました'
      mockApiClient.post.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.submitApplication(mockApplication)
      })

      // This will fail because error handling is not implemented yet
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.applicationStatus.status).toBe('draft')
    })
  })

  describe('Gacha Management', () => {
    it('should fetch gacha list', async () => {
      mockApiClient.get.mockResolvedValueOnce({
        data: mockGachaList
      })

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        // This will fail because fetchGachaList method doesn't exist yet
        await result.current.fetchGachaList()
      })

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/vtuber/gacha')
      expect(result.current.gachaList).toEqual(mockGachaList)
    })

    it('should create new gacha', async () => {
      const newGacha = {
        title: '新しいガチャ',
        description: '新しいガチャの説明',
        price: 300,
        startDate: '2024-02-01T00:00:00.000Z',
        endDate: '2024-12-31T23:59:59.000Z',
        thumbnailImage: new File([''], 'thumb.jpg', { type: 'image/jpeg' }),
        items: []
      }
      
      const createdGacha = { ...newGacha, id: 'gacha-new', status: 'draft' as const }
      mockApiClient.post.mockResolvedValueOnce({
        data: createdGacha
      })

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.createGacha(newGacha)
      })

      // This will fail because createGacha is not implemented yet
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/vtuber/gacha', newGacha)
      expect(result.current.gachaList).toContainEqual(createdGacha)
    })

    it('should update existing gacha', async () => {
      const gachaId = 'gacha-1'
      const updateData = { title: '更新されたガチャ' }
      const updatedGacha = { ...mockGachaList[0], ...updateData }
      
      mockApiClient.put.mockResolvedValueOnce({
        data: updatedGacha
      })

      const { result } = renderHook(() => useVTuberStore())
      
      act(() => {
        useVTuberStore.setState({ gachaList: mockGachaList })
      })

      await act(async () => {
        await result.current.updateGacha(gachaId, updateData)
      })

      // This will fail because updateGacha is not implemented yet
      expect(mockApiClient.put).toHaveBeenCalledWith(`/api/vtuber/gacha/${gachaId}`, updateData)
      expect(result.current.gachaList[0].title).toBe('更新されたガチャ')
    })

    it('should delete gacha from list', async () => {
      const gachaId = 'gacha-1'
      mockApiClient.delete.mockResolvedValueOnce({ data: { success: true } })

      const { result } = renderHook(() => useVTuberStore())
      
      act(() => {
        useVTuberStore.setState({ gachaList: mockGachaList })
      })

      await act(async () => {
        await result.current.deleteGacha(gachaId)
      })

      // This will fail because deleteGacha is not implemented yet
      expect(mockApiClient.delete).toHaveBeenCalledWith(`/api/vtuber/gacha/${gachaId}`)
      expect(result.current.gachaList).toHaveLength(0)
    })
  })

  describe('File Upload Management', () => {
    it('should upload file successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const uploadedFile = {
        id: 'file-1',
        name: 'test.jpg',
        size: 1000,
        type: 'image/jpeg',
        url: 'https://example.com/test.jpg',
        uploadedAt: '2024-01-01T00:00:00.000Z'
      }
      
      mockApiClient.post.mockResolvedValueOnce({
        data: uploadedFile
      })

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.uploadFile(file, 'image')
      })

      // This will fail because uploadFile is not implemented yet
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/upload', expect.any(FormData))
      expect(result.current.uploadedFiles).toContainEqual(uploadedFile)
    })

    it('should handle upload errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const errorMessage = 'ファイルのアップロードに失敗しました'
      
      mockApiClient.post.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.uploadFile(file, 'image')
      })

      // This will fail because error handling is not implemented yet
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.uploadedFiles).toHaveLength(0)
    })
  })

  describe('Dashboard Metrics Management', () => {
    it('should fetch dashboard metrics', async () => {
      const mockMetrics = {
        totalRevenue: 150000,
        monthlyRevenue: 45000,
        weeklyRevenue: 12000,
        dailyRevenue: 2500,
        fanCount: 2000,
        fanGrowthRate: 15.5,
        totalGachaDraws: 500,
        averageRevenuePerUser: 75,
        topPerformingGacha: {
          id: 'gacha-1',
          title: 'トップガチャ',
          revenue: 80000
        },
        recentActivities: [],
        revenueChart: [],
        fanGrowthChart: []
      }
      
      mockApiClient.get.mockResolvedValueOnce({
        data: mockMetrics
      })

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.fetchDashboardMetrics()
      })

      // This will fail because fetchDashboardMetrics is not implemented yet
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/vtuber/dashboard/metrics')
      expect(result.current.dashboardMetrics).toEqual(mockMetrics)
    })

    it('should handle dashboard metrics fetch errors', async () => {
      const errorMessage = 'ダッシュボードデータの取得に失敗しました'
      mockApiClient.get.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.fetchDashboardMetrics()
      })

      // This will fail because error handling is not implemented yet
      expect(result.current.dashboardMetrics).toBeNull()
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('Statistics Data Management', () => {
    it('should fetch statistics data', async () => {
      const dateRange = {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
      
      const mockStatistics = {
        revenueAnalytics: {
          totalRevenue: 200000,
          periodicRevenue: {
            daily: [],
            weekly: [],
            monthly: [],
            yearly: []
          },
          revenueBySource: {
            gacha: 150000,
            medals: 30000,
            other: 20000
          },
          averageOrderValue: 450,
          revenueGrowthRate: 25.5
        },
        fanDemographics: {
          ageGroups: [],
          genderDistribution: { male: 60, female: 35, other: 5 },
          geographicDistribution: [],
          engagementLevels: []
        },
        gachaRankings: [],
        activityHeatmap: [],
        conversionRates: {
          overallConversionRate: 3.2,
          gachaConversionRates: [],
          funnelAnalysis: []
        },
        customReports: []
      }
      
      mockApiClient.get.mockResolvedValueOnce({
        data: mockStatistics
      })

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.fetchStatisticsData(dateRange)
      })

      // This will fail because fetchStatisticsData is not implemented yet
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/vtuber/statistics', {
        params: dateRange
      })
      expect(result.current.statisticsData).toEqual(mockStatistics)
    })

    it('should handle statistics fetch errors', async () => {
      const dateRange = { startDate: '2024-01-01', endDate: '2024-12-31' }
      const errorMessage = '統計データの取得に失敗しました'
      mockApiClient.get.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useVTuberStore())

      await act(async () => {
        await result.current.fetchStatisticsData(dateRange)
      })

      // This will fail because error handling is not implemented yet
      expect(result.current.statisticsData).toBeNull()
      expect(result.current.error).toBe(errorMessage)
    })
  })

  describe('Loading States', () => {
    it('should set loading state during async operations', async () => {
      // Mock a slow API call
      let resolvePromise: (value: unknown) => void
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve
      })
      mockApiClient.get.mockReturnValueOnce(slowPromise)

      const { result } = renderHook(() => useVTuberStore())

      act(() => {
        result.current.fetchVTuberInfo()
      })

      // This will fail because loading state is not implemented yet
      expect(result.current.isLoading).toBe(true)

      await act(async () => {
        resolvePromise!({ data: mockVTuberInfo })
        await slowPromise
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should clear errors when new operations start', async () => {
      const { result } = renderHook(() => useVTuberStore())
      
      // Set initial error state
      act(() => {
        useVTuberStore.setState({ error: 'Previous error' })
      })

      expect(result.current.error).toBe('Previous error')

      mockApiClient.get.mockResolvedValueOnce({
        data: mockVTuberInfo
      })

      await act(async () => {
        await result.current.fetchVTuberInfo()
      })

      // This will fail because error clearing is not implemented yet
      expect(result.current.error).toBeNull()
    })
  })
})