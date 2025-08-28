import type { 
  ExchangeItem, 
  ExchangeCategory, 
  ExchangeSortOption,
  MedalTransactionType,
  MedalTransactionSource,
  ExchangeStatus,
} from '@/types/medal'

/**
 * Exchange category configuration with display names and icons
 */
export const EXCHANGE_CATEGORY_CONFIG: Record<ExchangeCategory, { name: string; icon: string; color: string }> = {
  voice: { name: 'ボイス', icon: '🎤', color: '#FF6B6B' },
  goods: { name: 'グッズ', icon: '🛍️', color: '#4ECDC4' },
  special: { name: '特典', icon: '⭐', color: '#FFE66D' },
  limited: { name: '限定', icon: '💎', color: '#A8E6CF' },
}

/**
 * Medal transaction type configuration
 */
export const TRANSACTION_TYPE_CONFIG: Record<MedalTransactionType, { name: string; color: string; icon: string }> = {
  earned: { name: '獲得', color: '#4CAF50', icon: '+' },
  used: { name: '使用', color: '#F44336', icon: '-' },
}

/**
 * Medal transaction source configuration
 */
export const TRANSACTION_SOURCE_CONFIG: Record<MedalTransactionSource, { name: string; color: string }> = {
  'gacha-draw': { name: 'ガチャ', color: '#9C27B0' },
  'exchange': { name: '交換', color: '#FF9800' },
  'purchase': { name: '購入', color: '#2196F3' },
  'reward': { name: '報酬', color: '#4CAF50' },
  'bonus': { name: 'ボーナス', color: '#FFC107' },
}

/**
 * Exchange status configuration
 */
export const EXCHANGE_STATUS_CONFIG: Record<ExchangeStatus, { name: string; color: string; bgColor: string }> = {
  pending: { name: '処理中', color: '#FF9800', bgColor: '#FFF3E0' },
  completed: { name: '完了', color: '#4CAF50', bgColor: '#E8F5E8' },
  failed: { name: '失敗', color: '#F44336', bgColor: '#FFEBEE' },
  cancelled: { name: 'キャンセル', color: '#9E9E9E', bgColor: '#FAFAFA' },
}

/**
 * Get exchange category display name
 */
export function getExchangeCategoryName(category: ExchangeCategory): string {
  return EXCHANGE_CATEGORY_CONFIG[category]?.name ?? category
}

/**
 * Get exchange category icon
 */
export function getExchangeCategoryIcon(category: ExchangeCategory): string {
  return EXCHANGE_CATEGORY_CONFIG[category]?.icon ?? '📦'
}

/**
 * Get exchange category color
 */
export function getExchangeCategoryColor(category: ExchangeCategory): string {
  return EXCHANGE_CATEGORY_CONFIG[category]?.color ?? '#000000'
}

/**
 * Get transaction type display name
 */
export function getTransactionTypeName(type: MedalTransactionType): string {
  return TRANSACTION_TYPE_CONFIG[type]?.name ?? type
}

/**
 * Get transaction type color
 */
export function getTransactionTypeColor(type: MedalTransactionType): string {
  return TRANSACTION_TYPE_CONFIG[type]?.color ?? '#000000'
}

/**
 * Get transaction source display name
 */
export function getTransactionSourceName(source: MedalTransactionSource): string {
  return TRANSACTION_SOURCE_CONFIG[source]?.name ?? source
}

/**
 * Get exchange status display name
 */
export function getExchangeStatusName(status: ExchangeStatus): string {
  return EXCHANGE_STATUS_CONFIG[status]?.name ?? status
}

/**
 * Get exchange status color
 */
export function getExchangeStatusColor(status: ExchangeStatus): string {
  return EXCHANGE_STATUS_CONFIG[status]?.color ?? '#000000'
}

/**
 * Get exchange status background color
 */
export function getExchangeStatusBgColor(status: ExchangeStatus): string {
  return EXCHANGE_STATUS_CONFIG[status]?.bgColor ?? '#FFFFFF'
}

/**
 * Format medal amount with comma separators
 */
export function formatMedalAmount(amount: number): string {
  return amount.toLocaleString('ja-JP')
}

/**
 * Format medal amount with unit
 */
export function formatMedalAmountWithUnit(amount: number): string {
  return `${formatMedalAmount(amount)}メダル`
}

/**
 * Check if item is out of stock
 */
export function isItemOutOfStock(item: ExchangeItem): boolean {
  return !item.isAvailable || (item.stock !== null && item.stock <= 0)
}

/**
 * Check if item has limited stock
 */
export function isLimitedStock(item: ExchangeItem): boolean {
  return item.stock !== null && item.stock > 0 && item.stock <= 10
}

/**
 * Check if user can purchase more of this item
 */
export function canUserPurchaseMore(item: ExchangeItem, userPurchaseCount: number): boolean {
  if (item.limitPerUser === null) return true
  return userPurchaseCount < item.limitPerUser
}

/**
 * Calculate remaining purchase count for user
 */
export function getRemainingPurchaseCount(item: ExchangeItem, userPurchaseCount: number): number | null {
  if (item.limitPerUser === null) return null
  return Math.max(0, item.limitPerUser - userPurchaseCount)
}

/**
 * Filter exchange items based on search criteria
 */
export function filterExchangeItems(
  items: ExchangeItem[],
  searchQuery: string,
  category: ExchangeCategory | '',
  vtuber: string,
  minCost: number | null,
  maxCost: number | null
): ExchangeItem[] {
  let filtered = [...items]

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.vtuberName.toLowerCase().includes(query)
    )
  }

  // Apply category filter
  if (category) {
    filtered = filtered.filter(item => item.category === category)
  }

  // Apply VTuber filter
  if (vtuber) {
    filtered = filtered.filter(item => item.vtuberName === vtuber)
  }

  // Apply cost range filter
  if (minCost !== null) {
    filtered = filtered.filter(item => item.cost >= minCost)
  }
  if (maxCost !== null) {
    filtered = filtered.filter(item => item.cost <= maxCost)
  }

  return filtered
}

/**
 * Sort exchange items by specified option
 */
export function sortExchangeItems(items: ExchangeItem[], sortBy: ExchangeSortOption): ExchangeItem[] {
  const sortedItems = [...items]

  switch (sortBy) {
    case 'cost':
      return sortedItems.sort((a, b) => a.cost - b.cost)
    case 'name':
      return sortedItems.sort((a, b) => a.name.localeCompare(b.name, 'ja-JP'))
    case 'popular':
      // Assuming items with lower stock are more popular
      return sortedItems.sort((a, b) => {
        const aStock = a.stock ?? Infinity
        const bStock = b.stock ?? Infinity
        return aStock - bStock
      })
    case 'newest':
    default:
      // Assuming items are already ordered by creation date (newest first)
      return sortedItems
  }
}

/**
 * Get unique VTubers from exchange items list
 */
export function getUniqueVTubersFromExchangeItems(items: ExchangeItem[]): string[] {
  const vtubers = new Set(items.map(item => item.vtuberName))
  return Array.from(vtubers).sort()
}

/**
 * Get unique categories from exchange items list
 */
export function getUniqueCategoriesFromExchangeItems(items: ExchangeItem[]): ExchangeCategory[] {
  const categories = new Set(items.map(item => item.category))
  return Array.from(categories).sort()
}

/**
 * Format date for display in Japanese locale
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format relative time (e.g., "3日前", "2時間前")
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'たった今'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}時間前`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays}日前`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths}ヶ月前`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears}年前`
}

/**
 * Check if medal balance is low (less than 100 medals)
 */
export function isLowBalance(availableMedals: number): boolean {
  return availableMedals < 100
}

/**
 * Calculate percentage of available medals from total
 */
export function calculateBalancePercentage(availableMedals: number, totalMedals: number): number {
  if (totalMedals === 0) return 0
  return Math.round((availableMedals / totalMedals) * 100)
}

/**
 * Generate CSS class for exchange status styling
 */
export function getExchangeStatusClassName(status: ExchangeStatus): string {
  return `exchange-status-${status}`
}

/**
 * Generate CSS class for category styling
 */
export function getExchangeCategoryClassName(category: ExchangeCategory): string {
  return `exchange-category-${category}`
}