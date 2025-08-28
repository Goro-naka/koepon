// Core Gacha Types
export interface GachaItem {
  id: string
  name: string
  vtuberName: string
  vtuberIcon: string
  description: string
  singlePrice: number
  tenDrawPrice: number
  isLimitedTime: boolean
  endDate: string | null
  popularityRank: number
  participantCount: number
}

export interface GachaDetail extends GachaItem {
  startDate?: string
  remainingCount?: number
  probabilityRates: ProbabilityRate[]
  availableRewards: Reward[]
  isExpired?: boolean
}

export interface ProbabilityRate {
  rarity: RarityType
  rate: number
  color: string
}

export interface Reward {
  id: string
  name: string
  rarity: RarityType
  image: string
  description?: string
}

// Draw Result Types
export interface DrawResultItem {
  id: string
  name: string
  rarity: RarityType
  image: string
  medalValue: number
  description?: string
}

export interface DrawResult {
  id: string
  gachaId: string
  items?: DrawResultItem[]
  results?: DrawResultItem[]  // Support both formats
  medalsEarned: number      // 追加: 獲得メダル数
  paymentId: string         // 追加: Stripe決済ID
  paymentAmount: number     // 追加: 支払金額（円）
  drawCount: number
  timestamp: string
  createdAt: Date
  // totalMedals: number    // 削除: 旧プロパティ
  // medalUsed: number      // 削除: メダル消費は無し
}

export interface DrawHistoryItem extends DrawResult {
  gachaName: string
  vtuberName: string
}

// Filter and Pagination Types
export interface HistoryFilters {
  vtuber: string
  startDate: string
  endDate: string
  rarity: string
}

export interface HistoryPagination {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

export interface HistoryStatistics {
  totalDrawCount: number
  totalMedalsEarned: number
  rareItemRate: number
  favoriteVTuber: string
  totalSpent: number
}

// Utility Types
export type RarityType = 'N' | 'R' | 'SR' | 'SSR' | 'UR'
export type SortOption = 'popular' | 'price' | 'latest'
export type DrawState = 'idle' | 'payment' | 'drawing' | 'complete' | 'error'

// API Response Types
export interface GachaListResponse {
  data: GachaItem[]
  total: number
  page: number
  limit: number
}

export interface DrawResponse {
  success: boolean
  result: DrawResult
  balance: number
}

export interface HistoryResponse {
  data: DrawHistoryItem[]
  pagination: HistoryPagination
  statistics: HistoryStatistics
}

// Component Props Types
export interface GachaCardProps {
  gacha: GachaItem
  onClick: (id: string) => void
}

export interface DrawAnimationProps {
  progress: number
  isMultiDraw?: boolean
  currentDraw?: number
}

export interface FilterPanelProps {
  searchQuery: string
  selectedVTuber: string
  sortBy: SortOption
  onSearchChange: (query: string) => void
  onVTuberChange: (vtuber: string) => void
  onSortChange: (sort: SortOption) => void
  onClearFilters: () => void
}