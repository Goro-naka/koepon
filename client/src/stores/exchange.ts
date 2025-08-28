import { create } from 'zustand'
import { apiClient } from '@/api/client'
import type {
  ExchangeItem,
  ExchangeHistory,
  ExchangeResult,
  ExchangeStatistics,
  ExchangeItemFilters,
  ExchangeHistoryFilters,
  ExchangePagination,
  ExchangeState,
  ExchangeSortOption,
  ExchangeValidationRequirements,
  ExchangeValidationResult,
} from '@/types/medal'

export interface ExchangeStore {
  // Exchange items state
  exchangeItems: ExchangeItem[]
  exchangeItemsLoading: boolean
  exchangeItemsError: string | null
  selectedExchangeItem: ExchangeItem | null
  selectedItemLoading: boolean

  // Exchange execution state
  exchangeState: ExchangeState
  exchangeResult: ExchangeResult | null
  exchangeError: string | null

  // Exchange history state
  exchangeHistory: ExchangeHistory[]
  exchangeHistoryLoading: boolean
  exchangeHistoryError: string | null
  exchangeStatistics: ExchangeStatistics | null

  // Filter and search state
  searchQuery: string
  itemFilters: ExchangeItemFilters
  sortBy: ExchangeSortOption
  historyFilters: ExchangeHistoryFilters
  historyPagination?: ExchangePagination

  // Actions
  fetchExchangeItems: () => Promise<void>
  fetchExchangeItemDetail: (itemId: string) => Promise<void>
  setExchangeItems: (items: ExchangeItem[]) => void

  // Exchange execution actions
  executeExchange: (itemId: string, quantity: number) => Promise<void>
  clearExchangeResult: () => void
  setExchangeResult: (result: ExchangeResult) => void
  validateExchangeRequirements: (requirements: ExchangeValidationRequirements) => ExchangeValidationResult

  // Filter and search actions
  setSearchQuery: (query: string) => void
  setItemFilters: (filters: Partial<ExchangeItemFilters>) => void
  setSortBy: (sort: ExchangeSortOption) => void
  clearItemFilters: () => void

  // History actions
  fetchExchangeHistory: () => Promise<void>
  setHistoryFilters: (filters: Partial<ExchangeHistoryFilters>) => void
  clearHistoryFilters: () => void
  setHistoryPage: (page: number) => void
  setExchangeStatistics: (statistics: ExchangeStatistics) => void
}

// ダミー交換所データ
const dummyExchangeItems: ExchangeItem[] = [
  {
    id: '1',
    name: '星月ひなの限定壁紙セット',
    description: '季節限定の美麗壁紙コレクション（5枚セット）',
    category: 'digital',
    vtuberName: '星月ひな',
    cost: 500,
    stock: 100,
    limitPerUser: 3,
    isAvailable: true,
    imageUrl: '/exchange/hoshitsuki-wallpaper.jpg',
    availableUntil: new Date('2025-12-31'),
    popularity: 95
  },
  {
    id: '2',
    name: '桜井みおのASMRボイス',
    description: 'リラックス効果抜群の癒しボイス（30分）',
    category: 'voice',
    vtuberName: '桜井みお',
    cost: 800,
    stock: 50,
    limitPerUser: 1,
    isAvailable: true,
    imageUrl: '/exchange/sakurai-asmr.jpg',
    availableUntil: new Date('2025-11-30'),
    popularity: 88
  },
  {
    id: '3',
    name: '音羽ゆめの直筆サイン色紙',
    description: 'VTuber本人による手書きサイン（デジタル版）',
    category: 'collectible',
    vtuberName: '音羽ゆめ',
    cost: 1200,
    stock: 25,
    limitPerUser: 1,
    isAvailable: true,
    imageUrl: '/exchange/otowa-autograph.jpg',
    availableUntil: new Date('2025-10-31'),
    popularity: 92
  },
  {
    id: '4',
    name: '白雪りんの雪だるま作り動画',
    description: '冬季限定！雪だるま作り配信アーカイブ（1時間）',
    category: 'video',
    vtuberName: '白雪りん',
    cost: 600,
    stock: 80,
    limitPerUser: 2,
    isAvailable: true,
    imageUrl: '/exchange/shirayuki-snowman.jpg',
    availableUntil: new Date('2025-12-25'),
    popularity: 75
  },
  {
    id: '5',
    name: '紅葉あやねの秋の歌声',
    description: '秋の名曲を歌った特別音源（3曲セット）',
    category: 'voice',
    vtuberName: '紅葉あやね',
    cost: 700,
    stock: 60,
    limitPerUser: 2,
    isAvailable: true,
    imageUrl: '/exchange/kouyou-autumn-songs.jpg',
    availableUntil: new Date('2025-11-30'),
    popularity: 80
  },
  {
    id: '6',
    name: '星月ひなの配信セットアップガイド',
    description: '配信機材セットアップの詳細ガイドPDF',
    category: 'digital',
    vtuberName: '星月ひな',
    cost: 300,
    stock: 150,
    limitPerUser: 5,
    isAvailable: true,
    imageUrl: '/exchange/hoshitsuki-setup-guide.jpg',
    availableUntil: new Date('2025-12-31'),
    popularity: 68
  },
  {
    id: '7',
    name: '桜井みおの料理レシピ集',
    description: 'VTuberおすすめの簡単料理レシピ（20種類）',
    category: 'digital',
    vtuberName: '桜井みお',
    cost: 450,
    stock: 90,
    limitPerUser: 3,
    isAvailable: true,
    imageUrl: '/exchange/sakurai-recipes.jpg',
    availableUntil: new Date('2025-11-15'),
    popularity: 72
  },
  {
    id: '8',
    name: '音羽ゆめのゲーム配信ハイライト',
    description: 'ベストシーンをまとめた特別編集動画（45分）',
    category: 'video',
    vtuberName: '音羽ゆめ',
    cost: 550,
    stock: 75,
    limitPerUser: 2,
    isAvailable: true,
    imageUrl: '/exchange/otowa-gaming-highlights.jpg',
    availableUntil: new Date('2025-10-31'),
    popularity: 85
  }
]

export const useExchangeStore = create<ExchangeStore>((set, get) => ({
  // Initial state
  exchangeItems: dummyExchangeItems,
  exchangeItemsLoading: false,
  exchangeItemsError: null,
  selectedExchangeItem: null,
  selectedItemLoading: false,

  exchangeState: 'idle',
  exchangeResult: null,
  exchangeError: null,

  exchangeHistory: [],
  exchangeHistoryLoading: false,
  exchangeHistoryError: null,
  exchangeStatistics: null,

  searchQuery: '',
  itemFilters: {
    category: '',
    vtuber: '',
    minCost: null,
    maxCost: null,
  },
  sortBy: 'newest',
  historyFilters: {
    vtuber: '',
    category: '',
    startDate: '',
    endDate: '',
    status: '',
  },

  // Exchange items actions
  fetchExchangeItems: async () => {
    set({ exchangeItemsLoading: true, exchangeItemsError: null })
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      set({ 
        exchangeItems: dummyExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null 
      })
    } catch (_error) {
      set({ 
        exchangeItems: dummyExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null
      })
    }
  },

  fetchExchangeItemDetail: async (itemId: string) => {
    set({ selectedItemLoading: true })
    try {
      const response = await apiClient.get(`/api/v1/exchange/items/${itemId}`)
      set({ 
        selectedExchangeItem: response.data,
        selectedItemLoading: false
      })
    } catch (_error) {
      set({ 
        selectedExchangeItem: null,
        selectedItemLoading: false
      })
    }
  },

  setExchangeItems: (items: ExchangeItem[]) => {
    set({ exchangeItems: items })
  },

  // Exchange execution actions
  executeExchange: async (itemId: string, quantity: number) => {
    set({ exchangeState: 'processing', exchangeError: null })
    try {
      const response = await apiClient.post('/api/v1/exchange/execute', {
        itemId,
        quantity,
      })
      set({ 
        exchangeResult: response.data,
        exchangeState: 'completed',
        exchangeError: null 
      })
    } catch (_error) {
      set({ 
        exchangeState: 'error',
        exchangeError: _error instanceof Error ? _error.message : 'エラーが発生しました'
      })
    }
  },

  clearExchangeResult: () => {
    set({ 
      exchangeResult: null,
      exchangeState: 'idle',
      exchangeError: null 
    })
  },

  setExchangeResult: (result: ExchangeResult) => {
    set({ exchangeResult: result })
  },

  validateExchangeRequirements: (requirements: ExchangeValidationRequirements): ExchangeValidationResult => {
    const errors: string[] = []

    // Check stock
    if (requirements.stock !== null && requirements.stock <= 0) {
      errors.push('在庫が不足しています')
    }

    // Check user purchase limit
    if (requirements.limitPerUser !== null && requirements.userPurchaseCount >= requirements.limitPerUser) {
      errors.push('購入制限に達しています')
    }

    // Check user balance
    if (requirements.userBalance < requirements.cost) {
      errors.push('メダル残高が不足しています')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  // Filter and search actions
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setItemFilters: (filters: Partial<ExchangeItemFilters>) => {
    set(state => ({ 
      itemFilters: { ...state.itemFilters, ...filters }
    }))
  },

  setSortBy: (sort: ExchangeSortOption) => {
    set({ sortBy: sort })
  },

  clearItemFilters: () => {
    set({ 
      itemFilters: {
        category: '',
        vtuber: '',
        minCost: null,
        maxCost: null,
      },
      searchQuery: '',
      sortBy: 'newest'
    })
  },

  // History actions
  fetchExchangeHistory: async () => {
    set({ exchangeHistoryLoading: true, exchangeHistoryError: null })
    try {
      const response = await apiClient.get('/api/v1/exchange/history')
      set({ 
        exchangeHistory: response.data,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        historyPagination: response.pagination,
        exchangeStatistics: response.statistics
      })
    } catch (_error) {
      set({ 
        exchangeHistory: [],
        exchangeHistoryLoading: false,
        exchangeHistoryError: _error instanceof Error ? _error.message : 'エラーが発生しました'
      })
    }
  },

  setHistoryFilters: (filters: Partial<ExchangeHistoryFilters>) => {
    set(state => ({ 
      historyFilters: { ...state.historyFilters, ...filters }
    }))
  },

  clearHistoryFilters: () => {
    set({ 
      historyFilters: {
        vtuber: '',
        category: '',
        startDate: '',
        endDate: '',
        status: '',
      }
    })
  },

  setHistoryPage: (page: number) => {
    const { historyPagination } = get()
    if (historyPagination) {
      set({ 
        historyPagination: {
          ...historyPagination,
          currentPage: page
        }
      })
    }
  },

  setExchangeStatistics: (statistics: ExchangeStatistics) => {
    set({ exchangeStatistics: statistics })
  },
}))