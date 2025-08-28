import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RewardsBoxPage } from '../RewardsBoxPage'
import { useRewardsStore } from '@/stores/rewards'
import type { Reward } from '@/types/reward'

// Mock the rewards store
jest.mock('@/stores/rewards')
const mockUseRewardsStore = useRewardsStore as jest.MockedFunction<typeof useRewardsStore>

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
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

const mockRewards: Reward[] = [
  {
    id: 'reward-1',
    title: 'ボイス特典 #1',
    description: '特別ボイスメッセージ',
    category: 'voice',
    fileType: 'audio/mp3',
    fileSize: 2500000,
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    vtuberName: 'テストVTuber1',
    vtuberId: 'vtuber-1',
    acquiredAt: '2024-01-15T10:00:00.000Z',
    expiresAt: '2024-12-31T23:59:59.000Z',
    isDownloaded: false,
    isFavorite: false,
    tags: ['限定', 'ボイス'],
  },
  {
    id: 'reward-2',
    title: '壁紙特典 #1',
    description: '高解像度壁紙',
    category: 'image',
    fileType: 'image/jpeg',
    fileSize: 5200000,
    thumbnailUrl: 'https://example.com/thumb2.jpg',
    vtuberName: 'テストVTuber2',
    vtuberId: 'vtuber-2',
    acquiredAt: '2024-01-14T10:00:00.000Z',
    expiresAt: null,
    isDownloaded: true,
    isFavorite: true,
    tags: ['壁紙', '限定'],
  },
]

describe('RewardsBoxPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render rewards list with correct layout', () => {
    mockUseRewardsStore.mockReturnValue({
      rewards: mockRewards,
      rewardsLoading: false,
      rewardsError: null,
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: jest.fn(),
      downloadReward: jest.fn(),
      downloadMultiple: jest.fn(),
      setFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    expect(screen.getByText('特典BOX')).toBeInTheDocument()
    expect(screen.getByText('ボイス特典 #1')).toBeInTheDocument()
    expect(screen.getByText('壁紙特典 #1')).toBeInTheDocument()
    expect(screen.getByText('テストVTuber1')).toBeInTheDocument()
    expect(screen.getByText('テストVTuber2')).toBeInTheDocument()
  })

  it('should display reward cards with thumbnail, title, and metadata', () => {
    mockUseRewardsStore.mockReturnValue({
      rewards: mockRewards,
      rewardsLoading: false,
      rewardsError: null,
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: jest.fn(),
      downloadReward: jest.fn(),
      downloadMultiple: jest.fn(),
      setFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    // Check thumbnails
    const thumbnails = screen.getAllByRole('img')
    expect(thumbnails).toHaveLength(2)
    expect(thumbnails[0]).toHaveAttribute('src', 'https://example.com/thumb1.jpg')

    // Check file sizes
    expect(screen.getByText('2.38 MB')).toBeInTheDocument()
    expect(screen.getByText('4.96 MB')).toBeInTheDocument()

    // Check download status
    expect(screen.getByText('未ダウンロード')).toBeInTheDocument()
    expect(screen.getByText('ダウンロード済み')).toBeInTheDocument()
  })

  it('should show empty state when no rewards available', () => {
    mockUseRewardsStore.mockReturnValue({
      rewards: [],
      rewardsLoading: false,
      rewardsError: null,
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: jest.fn(),
      downloadReward: jest.fn(),
      downloadMultiple: jest.fn(),
      setFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    expect(screen.getByText('特典がありません')).toBeInTheDocument()
    expect(screen.getByText('ガチャで特典を獲得しましょう！')).toBeInTheDocument()
  })

  it('should handle loading state with skeleton loaders', () => {
    mockUseRewardsStore.mockReturnValue({
      rewards: [],
      rewardsLoading: true,
      rewardsError: null,
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: jest.fn(),
      downloadReward: jest.fn(),
      downloadMultiple: jest.fn(),
      setFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    expect(screen.getByTestId('rewards-skeleton')).toBeInTheDocument()
  })

  it('should display error state with retry button', () => {
    const mockRetry = jest.fn()
    mockUseRewardsStore.mockReturnValue({
      rewards: [],
      rewardsLoading: false,
      rewardsError: 'データの取得に失敗しました',
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: mockRetry,
      downloadReward: jest.fn(),
      downloadMultiple: jest.fn(),
      setFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
    
    const retryButton = screen.getByText('再試行')
    fireEvent.click(retryButton)
    expect(mockRetry).toHaveBeenCalled()
  })

  it('should open preview on card click', async () => {
    mockUseRewardsStore.mockReturnValue({
      rewards: mockRewards,
      rewardsLoading: false,
      rewardsError: null,
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: jest.fn(),
      downloadReward: jest.fn(),
      downloadMultiple: jest.fn(),
      setFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    const rewardCard = screen.getByText('ボイス特典 #1').closest('.reward-card')
    fireEvent.click(rewardCard!)

    await waitFor(() => {
      expect(screen.getByTestId('reward-preview-modal')).toBeInTheDocument()
    })
  })

  it('should trigger download on download button click', async () => {
    const mockDownload = jest.fn()
    mockUseRewardsStore.mockReturnValue({
      rewards: mockRewards,
      rewardsLoading: false,
      rewardsError: null,
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: jest.fn(),
      downloadReward: mockDownload,
      downloadMultiple: jest.fn(),
      setFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    const downloadButton = screen.getAllByText('ダウンロード')[0]
    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith('reward-1')
    })
  })

  it('should filter rewards by category', () => {
    const mockSetFilters = jest.fn()
    mockUseRewardsStore.mockReturnValue({
      rewards: mockRewards,
      rewardsLoading: false,
      rewardsError: null,
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: jest.fn(),
      downloadReward: jest.fn(),
      downloadMultiple: jest.fn(),
      setFilters: mockSetFilters,
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    const voiceFilter = screen.getByText('ボイス')
    fireEvent.click(voiceFilter)

    expect(mockSetFilters).toHaveBeenCalledWith({ category: 'voice' })
  })

  it('should search rewards by keyword', () => {
    const mockSetSearchQuery = jest.fn()
    mockUseRewardsStore.mockReturnValue({
      rewards: mockRewards,
      rewardsLoading: false,
      rewardsError: null,
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: jest.fn(),
      downloadReward: jest.fn(),
      downloadMultiple: jest.fn(),
      setFilters: jest.fn(),
      setSearchQuery: mockSetSearchQuery,
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    const searchInput = screen.getByPlaceholderText('特典を検索...')
    fireEvent.change(searchInput, { target: { value: 'ボイス' } })

    expect(mockSetSearchQuery).toHaveBeenCalledWith('ボイス')
  })

  it('should select multiple items for batch download', async () => {
    const mockDownloadMultiple = jest.fn()
    mockUseRewardsStore.mockReturnValue({
      rewards: mockRewards,
      rewardsLoading: false,
      rewardsError: null,
      downloads: [],
      downloadQueue: [],
      searchQuery: '',
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      sortBy: 'acquiredAt',
      selectedReward: null,
      fetchRewards: jest.fn(),
      downloadReward: jest.fn(),
      downloadMultiple: mockDownloadMultiple,
      setFilters: jest.fn(),
      setSearchQuery: jest.fn(),
      setSortBy: jest.fn(),
      toggleFavorite: jest.fn(),
      retryDownload: jest.fn(),
    })

    render(
      <MockedProvider>
        <RewardsBoxPage />
      </MockedProvider>
    )

    // Select multiple items
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])

    // Click batch download button
    const batchDownloadButton = screen.getByText(/一括ダウンロード/)
    fireEvent.click(batchDownloadButton)

    await waitFor(() => {
      expect(mockDownloadMultiple).toHaveBeenCalledWith(['reward-1', 'reward-2'])
    })
  })
})