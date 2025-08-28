import { create } from 'zustand'
import { apiClient } from '@/api/client'
import type {
  MedalBalance,
  MedalTransaction,
  MedalTransactionFilters,
  ExchangePagination,
} from '@/types/medal'

export interface MedalStore {
  // Medal balance state
  medalBalance: MedalBalance | null
  medalBalanceLoading: boolean
  medalBalanceError: string | null

  // Transaction history state
  transactionHistory: MedalTransaction[]
  transactionHistoryLoading: boolean
  transactionHistoryError: string | null
  transactionFilters: MedalTransactionFilters
  transactionPagination?: ExchangePagination

  // Actions
  fetchMedalBalance: () => Promise<void>
  setMedalBalance: (balance: MedalBalance) => void
  checkSufficientBalance: (requiredAmount: number) => boolean
  retryFetchBalance: () => Promise<void>
  
  // TASK-507: 新しいメソッド
  earnMedals: (amount: number, source: 'gacha' | 'bonus') => Promise<void>
  exchangeMedals: (itemId: string, cost: number) => Promise<void>

  // Transaction actions
  fetchTransactionHistory: () => Promise<void>
  setTransactionFilters: (filters: MedalTransactionFilters) => void
  clearTransactionFilters: () => void
}

// ダミーメダル残高データ
const dummyMedalBalance: MedalBalance = {
  totalMedals: 2500,
  availableMedals: 2500,
  lockedMedals: 0,
  vtuberBalances: [
    { vtuberName: '星月ひな', balance: 500 },
    { vtuberName: '桜井みお', balance: 400 },
    { vtuberName: '音羽ゆめ', balance: 350 },
    { vtuberName: '白雪りん', balance: 300 },
    { vtuberName: '紅葉あやね', balance: 250 },
  ],
  lastUpdated: new Date().toISOString()
}

export const useMedalStore = create<MedalStore>((set, get) => ({
  // Initial state
  medalBalance: dummyMedalBalance,
  medalBalanceLoading: false,
  medalBalanceError: null,

  transactionHistory: [],
  transactionHistoryLoading: false,
  transactionHistoryError: null,
  transactionFilters: {
    type: '',
    startDate: '',
    endDate: '',
    source: '',
  },

  // Medal balance actions
  fetchMedalBalance: async () => {
    set({ medalBalanceLoading: true, medalBalanceError: null })
    try {
      await new Promise(resolve => setTimeout(resolve, 50))
      set({ 
        medalBalance: dummyMedalBalance,
        medalBalanceLoading: false,
        medalBalanceError: null 
      })
    } catch (_error) {
      set({ 
        medalBalance: dummyMedalBalance,
        medalBalanceLoading: false,
        medalBalanceError: null
      })
    }
  },

  setMedalBalance: (balance: MedalBalance) => {
    set({ medalBalance: balance })
  },

  checkSufficientBalance: (requiredAmount: number): boolean => {
    const { medalBalance } = get()
    if (!medalBalance) return false
    return medalBalance.availableMedals >= requiredAmount
  },

  retryFetchBalance: async () => {
    await get().fetchMedalBalance()
  },

  // Transaction history actions
  fetchTransactionHistory: async () => {
    set({ transactionHistoryLoading: true, transactionHistoryError: null })
    try {
      const response = await apiClient.get('/api/v1/medals/transactions')
      set({ 
        transactionHistory: response.data,
        transactionHistoryLoading: false,
        transactionHistoryError: null,
        transactionPagination: response.pagination
      })
    } catch (_error) {
      set({ 
        transactionHistory: [],
        transactionHistoryLoading: false,
        transactionHistoryError: _error instanceof Error ? _error.message : 'エラーが発生しました'
      })
    }
  },

  setTransactionFilters: (filters: MedalTransactionFilters) => {
    set({ transactionFilters: filters })
  },

  clearTransactionFilters: () => {
    set({ 
      transactionFilters: {
        type: '',
        startDate: '',
        endDate: '',
        source: '',
      }
    })
  },

  // TASK-507: メダル獲得機能（ガチャ結果として）
  earnMedals: async (amount: number, source: 'gacha' | 'bonus') => {
    const { medalBalance } = get()
    if (!medalBalance) {
      console.warn('Medal balance not available for earning medals')
      return
    }

    if (amount <= 0) {
      console.warn('Invalid medal amount:', amount)
      return
    }

    const newBalance: MedalBalance = {
      ...medalBalance,
      totalMedals: medalBalance.totalMedals + amount,
      availableMedals: medalBalance.availableMedals + amount,
      lastUpdated: new Date().toISOString()
    }

    set({ medalBalance: newBalance })
    console.log(`Earned ${amount} medals from ${source}`)

    // TODO: API呼び出しでメダル獲得を記録
    // await apiClient.post('/api/v1/medals/earn', { amount, source })
  },

  exchangeMedals: async (itemId: string, cost: number) => {
    const { medalBalance } = get()
    if (!medalBalance) throw new Error('メダル残高情報がありません')
    
    if (medalBalance.availableMedals < cost) {
      throw new Error('メダル残高が不足しています')
    }

    const newBalance: MedalBalance = {
      ...medalBalance,
      totalMedals: medalBalance.totalMedals - cost,
      availableMedals: medalBalance.availableMedals - cost,
      lastUpdated: new Date().toISOString()
    }

    set({ medalBalance: newBalance })

    // TODO: API呼び出しでメダル交換を記録
    // await apiClient.post('/api/v1/medals/exchange', { itemId, cost })
  },
}))