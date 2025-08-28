import type { RarityType, DrawResultItem, GachaItem } from '@/types/gacha'

/**
 * Rarity configuration with colors and sorting order
 */
export const RARITY_CONFIG: Record<RarityType, { color: string; order: number; name: string }> = {
  N: { color: '#CCCCCC', order: 0, name: 'ノーマル' },
  R: { color: '#4CAF50', order: 1, name: 'レア' },
  SR: { color: '#2196F3', order: 2, name: 'スーパーレア' },
  SSR: { color: '#FF9800', order: 3, name: 'スーパースーパーレア' },
  UR: { color: '#9C27B0', order: 4, name: 'ウルトラレア' },
}

/**
 * Get rarity color for styling
 */
export function getRarityColor(rarity: RarityType): string {
  return RARITY_CONFIG[rarity]?.color ?? RARITY_CONFIG.N.color
}

/**
 * Get rarity display name
 */
export function getRarityName(rarity: RarityType): string {
  return RARITY_CONFIG[rarity]?.name ?? rarity
}

/**
 * Check if rarity is considered "rare" (SR and above)
 */
export function isRareItem(rarity: RarityType): boolean {
  return RARITY_CONFIG[rarity]?.order >= RARITY_CONFIG.SR.order
}

/**
 * Get the best (highest rarity) item from a list
 */
export function getBestItem(items: DrawResultItem[]): DrawResultItem | null {
  if (items.length === 0) return null
  
  return items.reduce((best, item) => {
    const currentOrder = RARITY_CONFIG[item.rarity as RarityType]?.order ?? 0
    const bestOrder = RARITY_CONFIG[best.rarity as RarityType]?.order ?? 0
    return currentOrder > bestOrder ? item : best
  })
}

/**
 * Sort items by rarity (highest first)
 */
export function sortByRarity(items: DrawResultItem[]): DrawResultItem[] {
  return [...items].sort((a, b) => {
    const aOrder = RARITY_CONFIG[a.rarity as RarityType]?.order ?? 0
    const bOrder = RARITY_CONFIG[b.rarity as RarityType]?.order ?? 0
    return bOrder - aOrder
  })
}

/**
 * Format price with Japanese yen symbol
 */
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`
}

/**
 * Calculate discount percentage for 10-draw
 */
export function calculateDiscount(singlePrice: number, tenDrawPrice: number): number {
  const originalPrice = singlePrice * 10
  const discount = (originalPrice - tenDrawPrice) / originalPrice
  return Math.round(discount * 100)
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
 * Check if gacha is expired
 */
export function isGachaExpired(endDate: string | null): boolean {
  if (!endDate) return false
  return new Date(endDate) < new Date()
}

/**
 * Get time remaining until gacha expires
 */
export function getTimeRemaining(endDate: string): { days: number; hours: number; minutes: number } {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0 }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return { days, hours, minutes }
}

/**
 * Filter gacha items based on search criteria
 */
export function filterGachaItems(
  items: GachaItem[],
  searchQuery: string,
  selectedVTuber: string,
  sortBy: 'popular' | 'price' | 'latest'
): GachaItem[] {
  let filtered = [...items]
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.vtuberName.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
  }
  
  // Apply VTuber filter
  if (selectedVTuber) {
    filtered = filtered.filter(item => item.vtuberName === selectedVTuber)
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.singlePrice - b.singlePrice
      case 'latest':
        // Assuming items are ordered by creation date
        return b.popularityRank - a.popularityRank
      case 'popular':
      default:
        return a.popularityRank - b.popularityRank
    }
  })
  
  return filtered
}

/**
 * Generate CSS class for rarity styling
 */
export function getRarityClassName(rarity: RarityType): string {
  return `rarity-${rarity.toLowerCase()}-effect`
}

/**
 * Calculate total medal value from draw items
 */
export function calculateTotalMedals(items: DrawResultItem[]): number {
  return items.reduce((total, item) => total + item.medalValue, 0)
}

/**
 * Get unique VTubers from gacha list
 */
export function getUniqueVTubers(gachaList: GachaItem[]): string[] {
  const vtubers = new Set(gachaList.map(gacha => gacha.vtuberName))
  return Array.from(vtubers).sort()
}