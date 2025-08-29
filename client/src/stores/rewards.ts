import { create } from 'zustand'
import { apiClient } from '@/api/client'
import type {
  Reward,
  DownloadItem,
  RewardFilters,
  RewardSortOption,
  RewardStatistics,
  RewardPagination,
  RewardDetail,
} from '@/types/reward'

export interface RewardsStore {
  // Rewards state
  rewards: Reward[]
  rewardsLoading: boolean
  rewardsError: string | null
  selectedReward: RewardDetail | null
  
  // Download state
  downloads: DownloadItem[]
  downloadQueue: string[]
  
  // Filter and search state
  searchQuery: string
  filters: RewardFilters
  sortBy: RewardSortOption
  
  // Pagination and statistics
  pagination?: RewardPagination
  statistics?: RewardStatistics
  
  // Actions
  fetchRewards: () => Promise<void>
  fetchRewardDetail: (rewardId: string) => Promise<void>
  downloadReward: (rewardId: string) => Promise<void>
  downloadMultiple: (rewardIds: string[]) => Promise<void>
  
  // Filter and search actions
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<RewardFilters>) => void
  setSortBy: (sort: RewardSortOption) => void
  clearFilters: () => void
  
  // Favorite actions
  toggleFavorite: (rewardId: string) => void
  
  // Download management actions
  pauseDownload: (downloadId: string) => void
  resumeDownload: (downloadId: string) => void
  cancelDownload: (downloadId: string) => void
  retryDownload: (downloadId: string) => Promise<void>
  updateDownloadProgress: (downloadId: string, progress: number, downloadedSize: number) => void
}

const MAX_CONCURRENT_DOWNLOADS = 3

// データベースから取得するため、ダミーデータは空に
const dummyRewards: Reward[] = []

export const useRewardsStore = create<RewardsStore>((set, get) => ({
  // Initial state
  rewards: dummyRewards,
  rewardsLoading: false,
  rewardsError: null,
  selectedReward: null,
  
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
  
  // Fetch rewards
  fetchRewards: async () => {
    set({ rewardsLoading: true, rewardsError: null })
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      set({ 
        rewards: dummyRewards,
        rewardsLoading: false,
        rewardsError: null,
        statistics: {
          totalRewards: dummyRewards.length,
          totalSize: dummyRewards.reduce((sum, r) => sum + r.fileSize, 0),
          favoriteCount: dummyRewards.filter(r => r.isFavorite).length,
          newCount: dummyRewards.filter(r => r.isNew).length,
          categoryBreakdown: {
            voice: dummyRewards.filter(r => r.category === 'voice').length,
            illustration: dummyRewards.filter(r => r.category === 'illustration').length,
            message: dummyRewards.filter(r => r.category === 'message').length,
            stamp: dummyRewards.filter(r => r.category === 'stamp').length,
          }
        }
      })
    } catch (_error) {
      set({ 
        rewards: dummyRewards,
        rewardsLoading: false,
        rewardsError: null
      })
    }
  },

  // Fetch reward detail
  fetchRewardDetail: async (rewardId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/rewards/${rewardId}`)
      set({ selectedReward: response.data })
    } catch (_error) {
      console.error("Error:", _error)
    }
  },

  // Download single reward
  downloadReward: async (rewardId: string) => {
    const { downloads } = get()
    const currentDownloading = downloads.filter(d => d.status === 'downloading').length
    
    // Check if we've reached the concurrent download limit
    if (currentDownloading >= MAX_CONCURRENT_DOWNLOADS) {
      set(state => ({
        downloadQueue: [...state.downloadQueue, rewardId]
      }))
      return
    }

    try {
      // Get download URL from API
      const response = await apiClient.post(`/api/v1/rewards/${rewardId}/download`)
      const { url, fileName } = response.data
      
      // Create download item
      const downloadItem: DownloadItem = {
        id: `download-${Date.now()}`,
        rewardId,
        fileName,
        fileSize: 0, // Will be updated when download starts
        downloadedSize: 0,
        progress: 0,
        status: 'downloading',
        startedAt: new Date().toISOString(),
      }
      
      set(state => ({
        downloads: [...state.downloads, downloadItem]
      }))
      
      // Start actual download (simplified for now)
      // In real implementation, this would use a download manager
      simulateDownload(downloadItem.id, get, set)
      
    } catch (_error) {
      const downloadItem: DownloadItem = {
        id: `download-${Date.now()}`,
        rewardId,
        fileName: 'unknown',
        fileSize: 0,
        downloadedSize: 0,
        progress: 0,
        status: 'failed',
        error: _error instanceof Error ? _error.message : 'Download failed',
        startedAt: new Date().toISOString(),
      }
      
      set(state => ({
        downloads: [...state.downloads, downloadItem]
      }))
    }
  },

  // Download multiple rewards
  downloadMultiple: async (rewardIds: string[]) => {
    try {
      const response = await apiClient.post('/api/v1/rewards/batch-download', {
        rewardIds
      })
      
      const { url, fileName } = response.data
      
      const downloadItem: DownloadItem = {
        id: `download-batch-${Date.now()}`,
        rewardId: 'batch',
        fileName,
        fileSize: 0,
        downloadedSize: 0,
        progress: 0,
        status: 'downloading',
        startedAt: new Date().toISOString(),
      }
      
      set(state => ({
        downloads: [...state.downloads, downloadItem]
      }))
      
    } catch (_error) {
      const downloadItem: DownloadItem = {
        id: `download-batch-${Date.now()}`,
        rewardId: 'batch',
        fileName: 'batch-download.zip',
        fileSize: 0,
        downloadedSize: 0,
        progress: 0,
        status: 'failed',
        error: _error instanceof Error ? _error.message : 'Batch download failed',
        startedAt: new Date().toISOString(),
      }
      
      set(state => ({
        downloads: [...state.downloads, downloadItem]
      }))
    }
  },

  // Search and filter actions
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setFilters: (filters: Partial<RewardFilters>) => {
    set(state => ({ 
      filters: { ...state.filters, ...filters }
    }))
  },

  setSortBy: (sort: RewardSortOption) => {
    set({ sortBy: sort })
  },

  clearFilters: () => {
    set({ 
      filters: {
        category: '',
        vtuber: '',
        status: '',
        startDate: '',
        endDate: '',
        tags: [],
      },
      searchQuery: ''
    })
  },

  // Toggle favorite status
  toggleFavorite: (rewardId: string) => {
    set(state => ({
      rewards: state.rewards.map(reward =>
        reward.id === rewardId
          ? { ...reward, isFavorite: !reward.isFavorite }
          : reward
      )
    }))
  },

  // Download management
  pauseDownload: (downloadId: string) => {
    set(state => ({
      downloads: state.downloads.map(download =>
        download.id === downloadId
          ? { ...download, status: 'paused' as const }
          : download
      )
    }))
  },

  resumeDownload: (downloadId: string) => {
    set(state => ({
      downloads: state.downloads.map(download =>
        download.id === downloadId
          ? { ...download, status: 'downloading' as const }
          : download
      )
    }))
    
    // Resume actual download
    simulateDownload(downloadId, get, set)
  },

  cancelDownload: (downloadId: string) => {
    set(state => ({
      downloads: state.downloads.filter(download => download.id !== downloadId)
    }))
  },

  retryDownload: async (downloadId: string) => {
    const { downloads } = get()
    const download = downloads.find(d => d.id === downloadId)
    
    if (!download) return
    
    set(state => ({
      downloads: state.downloads.map(d =>
        d.id === downloadId
          ? { ...d, status: 'downloading' as const, error: undefined }
          : d
      )
    }))
    
    // Retry the download
    simulateDownload(downloadId, get, set)
  },

  updateDownloadProgress: (downloadId: string, progress: number, downloadedSize: number) => {
    set(state => ({
      downloads: state.downloads.map(download =>
        download.id === downloadId
          ? { 
              ...download, 
              progress, 
              downloadedSize,
              status: progress >= 100 ? 'completed' : download.status
            }
          : download
      )
    }))
  },
}))

// Simulate download progress (for testing)
function simulateDownload(
  downloadId: string,
  get: () => RewardsStore,
  set: (state: Partial<RewardsStore> | ((state: RewardsStore) => Partial<RewardsStore>)) => void
): void {
  let progress = 0
  const PROGRESS_INCREMENT = 10
  const UPDATE_INTERVAL = 500
  const FALLBACK_FILE_SIZE = 1000000
  
  const interval = setInterval(() => {
    const { downloads } = get()
    const download = downloads.find(d => d.id === downloadId)
    
    if (!download || download.status !== 'downloading') {
      clearInterval(interval)
      return
    }
    
    progress += PROGRESS_INCREMENT
    if (progress > 100) progress = 100
    
    const downloadedSize = (download.fileSize || FALLBACK_FILE_SIZE) * (progress / 100)
    
    set(state => ({
      downloads: state.downloads.map(d =>
        d.id === downloadId
          ? { 
              ...d, 
              progress, 
              downloadedSize,
              status: progress >= 100 ? 'completed' as const : 'downloading' as const
            }
          : d
      )
    }))
    
    if (progress >= 100) {
      clearInterval(interval)
      processNextDownload(get, set)
    }
  }, UPDATE_INTERVAL)
}

// Process next item in download queue
function processNextDownload(
  get: () => RewardsStore,
  set: (state: Partial<RewardsStore> | ((state: RewardsStore) => Partial<RewardsStore>)) => void
): void {
  const { downloadQueue } = get()
  if (downloadQueue.length > 0) {
    const nextRewardId = downloadQueue[0]
    set(state => ({
      downloadQueue: state.downloadQueue.slice(1)
    }))
    get().downloadReward(nextRewardId)
  }
}