import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GachaManagementPage } from '../GachaManagementPage'
import { useVTuberStore } from '@/stores/vtuber'
import type { GachaManagementData } from '@/types/vtuber'

// Mock the VTuber store
jest.mock('@/stores/vtuber')
const mockUseVTuberStore = useVTuberStore as jest.MockedFunction<typeof useVTuberStore>

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}))

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

const mockGachaList: GachaManagementData[] = [
  {
    id: 'gacha-1',
    title: 'テストガチャ1',
    description: 'テスト用ガチャ1の説明',
    price: 500,
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T23:59:59.000Z',
    status: 'active',
    thumbnailImage: 'https://example.com/gacha1.jpg',
    items: [
      {
        id: 'item-1',
        name: 'レアアイテム',
        description: 'とてもレアなアイテム',
        rarity: 'rare',
        dropRate: 10,
        image: 'https://example.com/item1.jpg',
        category: 'special'
      }
    ],
    totalDraws: 150,
    revenue: 75000,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T12:00:00.000Z',
  },
  {
    id: 'gacha-2',
    title: 'テストガチャ2',
    description: 'テスト用ガチャ2の説明',
    price: 300,
    startDate: '2024-02-01T00:00:00.000Z',
    endDate: '2024-11-30T23:59:59.000Z',
    status: 'draft',
    thumbnailImage: 'https://example.com/gacha2.jpg',
    items: [],
    totalDraws: 0,
    revenue: 0,
    createdAt: '2024-01-20T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z',
  }
]

describe('GachaManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Display', () => {
    it('should render gacha list with correct information', () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: null,
        gachaList: mockGachaList,
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because the component doesn't exist yet
      expect(screen.getByText('ガチャ管理')).toBeInTheDocument()
      expect(screen.getByText('テストガチャ1')).toBeInTheDocument()
      expect(screen.getByText('テストガチャ2')).toBeInTheDocument()
      expect(screen.getByText('500円')).toBeInTheDocument()
      expect(screen.getByText('公開中')).toBeInTheDocument()
      expect(screen.getByText('下書き')).toBeInTheDocument()
    })

    it('should display empty state when no gacha exists', () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because empty state is not implemented
      expect(screen.getByText('まだガチャが作成されていません')).toBeInTheDocument()
      expect(screen.getByText('最初のガチャを作成しましょう')).toBeInTheDocument()
    })

    it('should show loading state while fetching data', () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: true,
        error: null,
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because loading state is not implemented
      expect(screen.getByTestId('gacha-loading-skeleton')).toBeInTheDocument()
    })

    it('should display error state when fetch fails', () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: 'データの取得に失敗しました',
        gachaList: [],
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because error state is not implemented
      expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
      expect(screen.getByText('再試行')).toBeInTheDocument()
    })
  })

  describe('Gacha Creation', () => {
    it('should open create gacha modal', async () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: null,
        gachaList: mockGachaList,
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because the create button and modal don't exist yet
      const createButton = screen.getByText('新しいガチャを作成')
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByTestId('create-gacha-modal')).toBeInTheDocument()
        expect(screen.getByText('ガチャ作成')).toBeInTheDocument()
      })
    })

    it('should validate gacha creation form', async () => {
      // This test will fail because form validation is not implemented
      expect(screen.getByText('ガチャタイトルを入力してください')).toBeInTheDocument()
    })

    it('should create gacha successfully', async () => {
      const mockCreate = jest.fn()
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: null,
        gachaList: mockGachaList,
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: mockCreate,
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because gacha creation is not implemented
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled()
        expect(screen.getByText('ガチャを作成しました')).toBeInTheDocument()
      })
    })

    it('should validate drop rate total equals 100%', async () => {
      // This will fail because drop rate validation is not implemented
      expect(screen.getByText('排出率の合計は100%である必要があります')).toBeInTheDocument()
    })
  })

  describe('Gacha Editing', () => {
    it('should edit existing gacha information', async () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: null,
        gachaList: mockGachaList,
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because edit functionality is not implemented
      const editButton = screen.getAllByText('編集')[0]
      fireEvent.click(editButton)

      await waitFor(() => {
        expect(screen.getByTestId('edit-gacha-modal')).toBeInTheDocument()
      })
    })

    it('should update gacha status (active/inactive)', async () => {
      // This will fail because status update is not implemented
      const statusToggle = screen.getByTestId('status-toggle-gacha-1')
      fireEvent.click(statusToggle)

      await waitFor(() => {
        expect(screen.getByText('ステータスを更新しました')).toBeInTheDocument()
      })
    })
  })

  describe('Gacha Deletion', () => {
    it('should show confirmation dialog before deletion', async () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: null,
        gachaList: mockGachaList,
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because delete functionality is not implemented
      const deleteButton = screen.getAllByTestId('delete-gacha-button')[0]
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('本当に削除しますか？')).toBeInTheDocument()
        expect(screen.getByText('この操作は取り消せません')).toBeInTheDocument()
      })
    })

    it('should delete gacha successfully', async () => {
      const mockDelete = jest.fn()
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: null,
        gachaList: mockGachaList,
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: mockDelete,
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      // This will fail because delete functionality is not implemented
      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('gacha-1')
        expect(screen.getByText('ガチャを削除しました')).toBeInTheDocument()
      })
    })
  })

  describe('Filter and Search', () => {
    it('should filter gacha by status', () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: null,
        gachaList: mockGachaList,
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because filtering is not implemented
      const activeFilter = screen.getByText('公開中のみ')
      fireEvent.click(activeFilter)

      expect(screen.getByText('テストガチャ1')).toBeInTheDocument()
      expect(screen.queryByText('テストガチャ2')).not.toBeInTheDocument()
    })

    it('should search gacha by name', () => {
      // This will fail because search is not implemented
      const searchInput = screen.getByPlaceholderText('ガチャを検索...')
      fireEvent.change(searchInput, { target: { value: 'ガチャ1' } })

      expect(screen.getByText('テストガチャ1')).toBeInTheDocument()
      expect(screen.queryByText('テストガチャ2')).not.toBeInTheDocument()
    })
  })

  describe('Preview', () => {
    it('should show gacha preview modal', async () => {
      mockUseVTuberStore.mockReturnValue({
        vtuberInfo: null,
        applicationStatus: { status: 'approved' },
        isLoading: false,
        error: null,
        gachaList: mockGachaList,
        dashboardMetrics: null,
        statisticsData: null,
        uploadedFiles: [],
        fetchVTuberInfo: jest.fn(),
        updateVTuberInfo: jest.fn(),
        submitApplication: jest.fn(),
        createGacha: jest.fn(),
        updateGacha: jest.fn(),
        deleteGacha: jest.fn(),
        uploadFile: jest.fn(),
        fetchDashboardMetrics: jest.fn(),
        fetchStatisticsData: jest.fn(),
      })

      render(
        <MockedProvider>
          <GachaManagementPage />
        </MockedProvider>
      )

      // This will fail because preview is not implemented
      const previewButton = screen.getAllByText('プレビュー')[0]
      fireEvent.click(previewButton)

      await waitFor(() => {
        expect(screen.getByTestId('gacha-preview-modal')).toBeInTheDocument()
        expect(screen.getByText('ガチャプレビュー')).toBeInTheDocument()
      })
    })
  })
})