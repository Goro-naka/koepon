// 特典関連の型定義

export type RewardCategory = 'voice' | 'image' | 'video' | 'document' | 'other'
export type RewardStatus = 'available' | 'downloaded' | 'expired' | 'downloading'
export type RewardSortOption = 'acquiredAt' | 'name' | 'size' | 'expiresAt'

// 特典基本情報
export interface Reward {
  id: string
  title: string
  description: string
  category: RewardCategory
  fileType: string
  fileSize: number
  thumbnailUrl: string
  vtuberName: string
  vtuberId: string
  acquiredAt: string
  expiresAt: string | null
  isDownloaded: boolean
  isFavorite: boolean
  tags: string[]
}

// 特典詳細情報
export interface RewardDetail extends Reward {
  downloadUrl?: string
  previewUrl?: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
    bitrate?: number
    format?: string
  }
  downloadHistory: DownloadHistoryItem[]
}

// ダウンロード履歴
export interface DownloadHistoryItem {
  downloadedAt: string
  deviceInfo?: string
  ipAddress?: string
}

// ダウンロードアイテム
export interface DownloadItem {
  id: string
  rewardId: string
  fileName: string
  fileSize: number
  downloadedSize: number
  progress: number
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused'
  error?: string
  startedAt: string
  completedAt?: string
}

// ダウンロード結果
export interface DownloadResult {
  success: boolean
  downloadId: string
  fileName: string
  error?: string
}

// フィルター条件
export interface RewardFilters {
  category: RewardCategory | ''
  vtuber: string
  status: RewardStatus | ''
  startDate: string
  endDate: string
  tags: string[]
}

// ページネーション
export interface RewardPagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

// 統計情報
export interface RewardStatistics {
  totalRewards: number
  downloadedCount: number
  totalFileSize: number
  categoryBreakdown: {
    [key in RewardCategory]: {
      count: number
      totalSize: number
    }
  }
  vtuberBreakdown: {
    [vtuberId: string]: {
      name: string
      count: number
      totalSize: number
    }
  }
}

// プレビュー設定
export interface PreviewConfig {
  type: 'image' | 'audio' | 'video' | 'document'
  url: string
  title: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
  }
}

// ダウンロードマネージャー設定
export interface DownloadManagerConfig {
  maxConcurrentDownloads: number
  chunkSize: number
  autoRetry: boolean
  retryAttempts: number
  retryDelay: number
}

// バッチダウンロード設定
export interface BatchDownloadConfig {
  rewardIds: string[]
  createZip: boolean
  zipFileName?: string
}

// API レスポンス型
export interface RewardsResponse {
  rewards: Reward[]
  pagination: RewardPagination
  statistics?: RewardStatistics
}

export interface DownloadUrlResponse {
  url: string
  expiresAt: string
  fileName: string
}

// エラー型
export interface RewardError {
  code: 'NETWORK_ERROR' | 'PERMISSION_DENIED' | 'EXPIRED' | 'NOT_FOUND' | 'QUOTA_EXCEEDED'
  message: string
  details?: any
}