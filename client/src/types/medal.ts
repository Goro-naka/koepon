// Core Medal Types
export interface VTuberBalance {
  vtuberName: string
  balance: number
}

export interface MedalBalance {
  id?: string
  userId?: string
  totalMedals: number
  availableMedals: number
  usedMedals: number
  earnedMedals: number
  lockedMedals: number
  vtuberBalances: VTuberBalance[]
  lastUpdated: string
  dailyChange?: number
  weeklyChange?: number
}

export interface MedalTransaction {
  id: string
  userId: string
  type: MedalTransactionType
  amount: number
  description: string
  source: MedalTransactionSource
  sourceId: string
  timestamp: string
}

// Exchange Types
export interface ExchangeItem {
  id: string
  name: string
  description: string
  category: ExchangeCategory
  cost: number
  image: string
  isAvailable: boolean
  stock: number | null
  limitPerUser: number | null
  vtuberName: string
  vtuberIcon: string
}

export interface ExchangeHistory {
  id: string
  userId: string
  itemId: string
  itemName: string
  itemImage: string
  cost: number
  quantity: number
  timestamp: string
  status: ExchangeStatus
  vtuberName: string
}

export interface ExchangeResult {
  success: boolean
  exchangeId: string
  item: ExchangeItem
  cost: number
  remainingBalance: number
  timestamp: string
}

// Filter and Pagination Types
export interface MedalTransactionFilters {
  type: MedalTransactionType | ''
  startDate: string
  endDate: string
  source: MedalTransactionSource | ''
}

export interface ExchangeItemFilters {
  category: ExchangeCategory | ''
  vtuber: string
  minCost: number | null
  maxCost: number | null
}

export interface ExchangeHistoryFilters {
  vtuber: string
  category: ExchangeCategory | ''
  startDate: string
  endDate: string
  status: ExchangeStatus | ''
}

export interface ExchangePagination {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

export interface ExchangeStatistics {
  totalExchanges: number
  totalMedalsUsed: number
  favoriteCategory: ExchangeCategory
  favoriteVTuber: string
  averageCostPerExchange: number
}

// Exchange Validation
export interface ExchangeValidationRequirements {
  itemId: string
  cost: number
  stock: number | null
  limitPerUser: number | null
  userPurchaseCount: number
  userBalance: number
}

export interface ExchangeValidationResult {
  isValid: boolean
  errors: string[]
}

// Utility Types
export type MedalTransactionType = 'earned' | 'used'
export type MedalTransactionSource = 'gacha-draw' | 'exchange' | 'reward' | 'bonus'
export type ExchangeCategory = 'voice' | 'goods' | 'special' | 'limited'
export type ExchangeStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type ExchangeState = 'idle' | 'processing' | 'completed' | 'error'
export type ExchangeSortOption = 'newest' | 'cost' | 'name' | 'popular'

// API Response Types
export interface MedalBalanceResponse {
  success: boolean
  data: MedalBalance
}

export interface MedalTransactionResponse {
  success: boolean
  data: MedalTransaction[]
  pagination: ExchangePagination
}

export interface ExchangeItemsResponse {
  success: boolean
  data: ExchangeItem[]
  total: number
}

export interface ExchangeExecuteResponse {
  success: boolean
  data: ExchangeResult
}

export interface ExchangeHistoryResponse {
  success: boolean
  data: ExchangeHistory[]
  pagination: ExchangePagination
  statistics: ExchangeStatistics
}

// Component Props Types
export interface MedalBalanceCardProps {
  showTrends?: boolean
  showRefreshButton?: boolean
  className?: string
}

export interface ExchangeItemCardProps {
  item: ExchangeItem
  onClick: (itemId: string) => void
  showStock?: boolean
  showVTuber?: boolean
}

export interface ExchangeConfirmDialogProps {
  item: ExchangeItem
  quantity: number
  totalCost: number
  onConfirm: () => void
  onCancel: () => void
  isOpen: boolean
}