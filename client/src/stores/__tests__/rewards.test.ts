import { renderHook, act } from '@testing-library/react'
import { useRewardsStore } from '../rewards'
import { apiClient } from '@/api/client'
import type { Reward, DownloadItem } from '@/types/reward'

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  }
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

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

const mockDownloadItem: DownloadItem = {
  id: 'download-1',
  rewardId: 'reward-1',
  fileName: 'voice-001.mp3',
  fileSize: 2500000,
  downloadedSize: 0,
  progress: 0,
  status: 'pending',
  startedAt: '2024-01-15T10:00:00.000Z',
}

describe('RewardsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store state
    useRewardsStore.setState({
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
    })
  })

  describe('fetchRewards', () => {
    it('should fetch and store rewards list', async () => {
      mockApiClient.get.mockResolvedValueOnce({ 
        data: mockRewards,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 10 }
      })

      const { result } = renderHook(() => useRewardsStore())

      await act(async () => {
        await result.current.fetchRewards()
      })

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/rewards')
      expect(result.current.rewards).toEqual(mockRewards)
      expect(result.current.rewardsLoading).toBe(false)
      expect(result.current.rewardsError).toBeNull()
    })

    it('should handle fetch error', async () => {
      const errorMessage = 'Failed to fetch rewards'
      mockApiClient.get.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useRewardsStore())

      await act(async () => {
        await result.current.fetchRewards()
      })

      expect(result.current.rewards).toEqual([])
      expect(result.current.rewardsLoading).toBe(false)
      expect(result.current.rewardsError).toBe(errorMessage)
    })

    it('should set loading state during fetch', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}))

      const { result } = renderHook(() => useRewardsStore())

      act(() => {
        result.current.fetchRewards()
      })

      expect(result.current.rewardsLoading).toBe(true)
      expect(result.current.rewardsError).toBeNull()
    })
  })

  describe('downloadReward', () => {
    it('should initiate single reward download', async () => {
      mockApiClient.post.mockResolvedValueOnce({ 
        data: { 
          url: 'https://example.com/download/signed-url',
          expiresAt: '2024-01-15T11:00:00.000Z',
          fileName: 'voice-001.mp3'
        }
      })

      const { result } = renderHook(() => useRewardsStore())

      await act(async () => {
        await result.current.downloadReward('reward-1')
      })

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/rewards/reward-1/download')
      expect(result.current.downloads).toHaveLength(1)
      expect(result.current.downloads[0].rewardId).toBe('reward-1')
      expect(result.current.downloads[0].status).toBe('downloading')
    })

    it('should handle download error', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Download failed'))

      const { result } = renderHook(() => useRewardsStore())

      await act(async () => {
        await result.current.downloadReward('reward-1')
      })

      expect(result.current.downloads).toHaveLength(1)
      expect(result.current.downloads[0].status).toBe('failed')
      expect(result.current.downloads[0].error).toBe('Download failed')
    })

    it('should add to download queue when limit reached', async () => {
      const { result } = renderHook(() => useRewardsStore())

      // Set max concurrent downloads to 3 (reach limit)
      act(() => {
        useRewardsStore.setState({
          downloads: [
            { ...mockDownloadItem, id: 'download-1', status: 'downloading' },
            { ...mockDownloadItem, id: 'download-2', status: 'downloading' },
            { ...mockDownloadItem, id: 'download-3', status: 'downloading' }
          ]
        })
      })

      await act(async () => {
        await result.current.downloadReward('reward-2')
      })

      expect(result.current.downloadQueue).toContain('reward-2')
    })
  })

  describe('downloadMultiple', () => {
    it('should download multiple rewards', async () => {
      mockApiClient.post.mockResolvedValue({ 
        data: { 
          url: 'https://example.com/download/batch.zip',
          expiresAt: '2024-01-15T11:00:00.000Z',
          fileName: 'rewards-batch.zip'
        }
      })

      const { result } = renderHook(() => useRewardsStore())

      await act(async () => {
        await result.current.downloadMultiple(['reward-1', 'reward-2'])
      })

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/v1/rewards/batch-download', {
        rewardIds: ['reward-1', 'reward-2']
      })
    })

    it('should handle batch download error', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Batch download failed'))

      const { result } = renderHook(() => useRewardsStore())

      await act(async () => {
        await result.current.downloadMultiple(['reward-1', 'reward-2'])
      })

      expect(result.current.downloads).toHaveLength(1)
      expect(result.current.downloads[0].status).toBe('failed')
    })
  })

  describe('filters and search', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useRewardsStore())

      act(() => {
        result.current.setSearchQuery('ボイス')
      })

      expect(result.current.searchQuery).toBe('ボイス')
    })

    it('should update filters', () => {
      const { result } = renderHook(() => useRewardsStore())

      act(() => {
        result.current.setFilters({ category: 'voice' })
      })

      expect(result.current.filters.category).toBe('voice')
    })

    it('should update sort option', () => {
      const { result } = renderHook(() => useRewardsStore())

      act(() => {
        result.current.setSortBy('name')
      })

      expect(result.current.sortBy).toBe('name')
    })

    it('should clear filters', () => {
      const { result } = renderHook(() => useRewardsStore())

      // Set some filters first
      act(() => {
        result.current.setFilters({ 
          category: 'voice',
          vtuber: 'テストVTuber1',
          status: 'downloaded'
        })
        result.current.setSearchQuery('test')
      })

      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.filters).toEqual({
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      })
      expect(result.current.searchQuery).toBe('')
    })
  })

  describe('favorite management', () => {
    it('should toggle favorite status', () => {
      const { result } = renderHook(() => useRewardsStore())

      act(() => {
        result.current.rewards = mockRewards
      })

      act(() => {
        result.current.toggleFavorite('reward-1')
      })

      expect(result.current.rewards[0].isFavorite).toBe(true)

      act(() => {
        result.current.toggleFavorite('reward-1')
      })

      expect(result.current.rewards[0].isFavorite).toBe(false)
    })
  })

  describe('download management', () => {
    it('should pause download', () => {
      const { result } = renderHook(() => useRewardsStore())

      act(() => {
        result.current.downloads = [
          { ...mockDownloadItem, status: 'downloading' }
        ]
      })

      act(() => {
        result.current.pauseDownload('download-1')
      })

      expect(result.current.downloads[0].status).toBe('paused')
    })

    it('should resume download', () => {
      const { result } = renderHook(() => useRewardsStore())

      act(() => {
        result.current.downloads = [
          { ...mockDownloadItem, status: 'paused' }
        ]
      })

      act(() => {
        result.current.resumeDownload('download-1')
      })

      expect(result.current.downloads[0].status).toBe('downloading')
    })

    it('should cancel download', () => {
      const { result } = renderHook(() => useRewardsStore())

      act(() => {
        result.current.downloads = [
          { ...mockDownloadItem, status: 'downloading' }
        ]
      })

      act(() => {
        result.current.cancelDownload('download-1')
      })

      expect(result.current.downloads).toHaveLength(0)
    })

    it('should retry failed download', async () => {
      mockApiClient.post.mockResolvedValueOnce({ 
        data: { 
          url: 'https://example.com/download/signed-url',
          expiresAt: '2024-01-15T11:00:00.000Z',
          fileName: 'voice-001.mp3'
        }
      })

      const { result } = renderHook(() => useRewardsStore())

      act(() => {
        result.current.downloads = [
          { ...mockDownloadItem, status: 'failed', error: 'Network error' }
        ]
      })

      await act(async () => {
        await result.current.retryDownload('download-1')
      })

      expect(result.current.downloads[0].status).toBe('downloading')
      expect(result.current.downloads[0].error).toBeUndefined()
    })
  })

  describe('store integration', () => {
    it('should maintain state consistency across operations', async () => {
      mockApiClient.get.mockResolvedValueOnce({ 
        data: mockRewards,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 10 }
      })

      const { result } = renderHook(() => useRewardsStore())

      // Fetch rewards
      await act(async () => {
        await result.current.fetchRewards()
      })

      expect(result.current.rewards).toEqual(mockRewards)

      // Apply filters
      act(() => {
        result.current.setFilters({ category: 'voice' })
      })

      // Toggle favorite
      act(() => {
        result.current.toggleFavorite('reward-1')
      })

      expect(result.current.rewards[0].isFavorite).toBe(true)
      expect(result.current.filters.category).toBe('voice')
    })
  })
})