import type { 
  RewardCategory,
  RewardStatus,
  Reward,
  RewardFilters,
  RewardSortOption,
} from '@/types/reward'

/**
 * Reward category configuration
 */
export const REWARD_CATEGORY_CONFIG: Record<RewardCategory, { name: string; icon: string; color: string }> = {
  voice: { name: 'ボイス', icon: '🎵', color: '#FF6B6B' },
  image: { name: '画像', icon: '🖼️', color: '#4ECDC4' },
  video: { name: '動画', icon: '🎬', color: '#45B7D1' },
  document: { name: 'ドキュメント', icon: '📄', color: '#96CEB4' },
  other: { name: 'その他', icon: '📦', color: '#FFEAA7' },
}

/**
 * Reward status configuration
 */
export const REWARD_STATUS_CONFIG: Record<RewardStatus, { name: string; color: string }> = {
  available: { name: '利用可能', color: '#4CAF50' },
  downloaded: { name: 'ダウンロード済み', color: '#2196F3' },
  expired: { name: '期限切れ', color: '#F44336' },
  downloading: { name: 'ダウンロード中', color: '#FF9800' },
}

/**
 * Get reward category display name
 */
export function getRewardCategoryName(category: RewardCategory): string {
  return REWARD_CATEGORY_CONFIG[category]?.name ?? category
}

/**
 * Get reward category icon
 */
export function getRewardCategoryIcon(category: RewardCategory): string {
  return REWARD_CATEGORY_CONFIG[category]?.icon ?? '📦'
}

/**
 * Get reward status display name
 */
export function getRewardStatusName(status: RewardStatus): string {
  return REWARD_STATUS_CONFIG[status]?.name ?? status
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file type from MIME type
 */
export function getFileTypeFromMimeType(mimeType: string): RewardCategory {
  if (mimeType.startsWith('audio/')) return 'voice'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.includes('pdf') || mimeType.includes('text')) return 'document'
  return 'other'
}

/**
 * Check if reward is expired
 */
export function isRewardExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

/**
 * Get reward status
 */
export function getRewardStatus(reward: Reward): RewardStatus {
  if (isRewardExpired(reward.expiresAt)) return 'expired'
  if (reward.isDownloaded) return 'downloaded'
  return 'available'
}

/**
 * Filter rewards based on filters
 */
export function filterRewards(
  rewards: Reward[],
  searchQuery: string,
  filters: RewardFilters
): Reward[] {
  let filtered = [...rewards]

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(reward => 
      reward.title.toLowerCase().includes(query) ||
      reward.description.toLowerCase().includes(query) ||
      reward.vtuberName.toLowerCase().includes(query) ||
      reward.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Apply category filter
  if (filters.category) {
    filtered = filtered.filter(reward => reward.category === filters.category)
  }

  // Apply VTuber filter
  if (filters.vtuber) {
    filtered = filtered.filter(reward => reward.vtuberName === filters.vtuber)
  }

  // Apply status filter
  if (filters.status) {
    filtered = filtered.filter(reward => getRewardStatus(reward) === filters.status)
  }

  // Apply date range filter
  if (filters.startDate) {
    filtered = filtered.filter(reward => 
      new Date(reward.acquiredAt) >= new Date(filters.startDate)
    )
  }
  if (filters.endDate) {
    filtered = filtered.filter(reward => 
      new Date(reward.acquiredAt) <= new Date(filters.endDate)
    )
  }

  // Apply tags filter
  if (filters.tags.length > 0) {
    filtered = filtered.filter(reward =>
      filters.tags.some(tag => reward.tags.includes(tag))
    )
  }

  return filtered
}

/**
 * Sort rewards by specified option
 */
export function sortRewards(rewards: Reward[], sortBy: RewardSortOption): Reward[] {
  const sorted = [...rewards]

  switch (sortBy) {
    case 'acquiredAt':
      return sorted.sort((a, b) => 
        new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
      )
    case 'name':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ja-JP'))
    case 'size':
      return sorted.sort((a, b) => b.fileSize - a.fileSize)
    case 'expiresAt':
      return sorted.sort((a, b) => {
        if (!a.expiresAt) return 1
        if (!b.expiresAt) return -1
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
      })
    default:
      return sorted
  }
}

/**
 * Get unique VTubers from rewards list
 */
export function getUniqueVTubersFromRewards(rewards: Reward[]): string[] {
  const vtubers = new Set(rewards.map(reward => reward.vtuberName))
  return Array.from(vtubers).sort()
}

/**
 * Get unique tags from rewards list
 */
export function getUniqueTagsFromRewards(rewards: Reward[]): string[] {
  const tags = new Set(rewards.flatMap(reward => reward.tags))
  return Array.from(tags).sort()
}

/**
 * Calculate download progress percentage
 */
export function calculateDownloadProgress(downloadedSize: number, totalSize: number): number {
  if (totalSize === 0) return 0
  return Math.round((downloadedSize / totalSize) * 100)
}

/**
 * Format download time remaining
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分`
  return `${Math.floor(seconds / 3600)}時間`
}

/**
 * Generate download filename
 */
export function generateDownloadFilename(reward: Reward): string {
  const date = new Date().toISOString().slice(0, 10)
  const safeName = reward.title.replace(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龥]/g, '_')
  const extension = reward.fileType.split('/')[1] || 'bin'
  return `${date}_${safeName}.${extension}`
}

/**
 * Validate file integrity (simplified)
 */
export function validateFileIntegrity(fileSize: number, expectedSize: number): boolean {
  return Math.abs(fileSize - expectedSize) < 1024 // Allow 1KB difference
}

/**
 * Get file icon by type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('audio/')) return '🎵'
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType.startsWith('video/')) return '🎬'
  if (fileType.includes('pdf')) return '📄'
  if (fileType.includes('text')) return '📝'
  if (fileType.includes('zip')) return '🗜️'
  return '📦'
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Get reward display status
 */
export function getRewardDisplayStatus(reward: Reward): { text: string; color: string } {
  const status = getRewardStatus(reward)
  const config = REWARD_STATUS_CONFIG[status]
  return {
    text: reward.isDownloaded ? 'ダウンロード済み' : '未ダウンロード',
    color: config.color
  }
}

/**
 * Check if reward can be downloaded
 */
export function canDownloadReward(reward: Reward): boolean {
  return !isRewardExpired(reward.expiresAt) && !reward.isDownloaded
}

/**
 * Get total file size for multiple rewards
 */
export function getTotalFileSize(rewards: Reward[]): number {
  return rewards.reduce((total, reward) => total + reward.fileSize, 0)
}

/**
 * Get estimated download time (simplified calculation)
 */
export function getEstimatedDownloadTime(fileSize: number, speedBytesPerSecond = 1000000): string {
  const seconds = Math.ceil(fileSize / speedBytesPerSecond)
  return formatTimeRemaining(seconds)
}