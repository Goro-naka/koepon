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
  checkSufficientBalanceForVtuber: (vtuberName: string, requiredAmount: number) => boolean
  getMedalBalanceByVtuber: (vtuberName: string) => number
  retryFetchBalance: () => Promise<void>
  
  // TASK-507: 新しいメソッド（VTuber対応）
  earnMedals: (amount: number, source: 'gacha' | 'bonus', vtuberName?: string) => Promise<void>
  exchangeMedals: (itemId: string, cost: number, vtuberName: string) => Promise<void>

  // Transaction actions
  fetchTransactionHistory: () => Promise<void>
  setTransactionFilters: (filters: MedalTransactionFilters) => void
  clearTransactionFilters: () => void
}

// データベースから取得するため、ダミーデータは空に
const dummyMedalBalance: MedalBalance = {
  totalMedals: 0,
  availableMedals: 0,
  lockedMedals: 0,
  vtuberBalances: [],
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

  checkSufficientBalanceForVtuber: (vtuberName: string, requiredAmount: number): boolean => {
    const { medalBalance } = get()
    if (!medalBalance) return false
    const vtuberBalance = medalBalance.vtuberBalances.find(v => v.vtuberName === vtuberName)
    return vtuberBalance ? vtuberBalance.balance >= requiredAmount : false
  },

  getMedalBalanceByVtuber: (vtuberName: string): number => {
    const { medalBalance } = get()
    if (!medalBalance) return 0
    const vtuberBalance = medalBalance.vtuberBalances.find(v => v.vtuberName === vtuberName)
    return vtuberBalance ? vtuberBalance.balance : 0
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

  // TASK-507: メダル獲得機能（ガチャ結果として）VTuber対応
  earnMedals: async (amount: number, source: 'gacha' | 'bonus', vtuberName?: string) => {
    const { medalBalance } = get()
    if (!medalBalance) {
      console.warn('Medal balance not available for earning medals')
      return
    }

    if (amount <= 0) {
      console.warn('Invalid medal amount:', amount)
      return
    }

    let newBalance: MedalBalance = {
      ...medalBalance,
      totalMedals: medalBalance.totalMedals + amount,
      availableMedals: medalBalance.availableMedals + amount,
      lastUpdated: new Date().toISOString(),
      vtuberBalances: [...medalBalance.vtuberBalances]
    }

    // VTuber指定がある場合、そのVTuberのメダルに追加
    if (vtuberName) {
      const vtuberIndex = newBalance.vtuberBalances.findIndex(v => v.vtuberName === vtuberName)
      if (vtuberIndex >= 0) {
        newBalance.vtuberBalances[vtuberIndex] = {
          ...newBalance.vtuberBalances[vtuberIndex],
          balance: newBalance.vtuberBalances[vtuberIndex].balance + amount
        }
      } else {
        // 新しいVTuberの場合は追加
        newBalance.vtuberBalances.push({
          vtuberName,
          balance: amount
        })
      }
    }

    set({ medalBalance: newBalance })
    console.log(`Earned ${amount} medals from ${source}${vtuberName ? ` for ${vtuberName}` : ''}`)

    // TODO: API呼び出しでメダル獲得を記録
    // await apiClient.post('/api/v1/medals/earn', { amount, source, vtuberName })
  },

  exchangeMedals: async (itemId: string, cost: number, vtuberName: string) => {
    const { medalBalance } = get()
    if (!medalBalance) throw new Error('メダル残高情報がありません')
    
    const vtuberIndex = medalBalance.vtuberBalances.findIndex(v => v.vtuberName === vtuberName)
    if (vtuberIndex < 0) {
      throw new Error(`${vtuberName}のメダル情報が見つかりません`)
    }

    const vtuberBalance = medalBalance.vtuberBalances[vtuberIndex]
    if (vtuberBalance.balance < cost) {
      throw new Error(`${vtuberName}のメダル残高が不足しています`)
    }

    const newBalance: MedalBalance = {
      ...medalBalance,
      totalMedals: medalBalance.totalMedals - cost,
      availableMedals: medalBalance.availableMedals - cost,
      lastUpdated: new Date().toISOString(),
      vtuberBalances: medalBalance.vtuberBalances.map((v, index) => 
        index === vtuberIndex 
          ? { ...v, balance: v.balance - cost }
          : v
      )
    }

    set({ medalBalance: newBalance })

    // TODO: API呼び出しでメダル交換を記録
    // await apiClient.post('/api/v1/medals/exchange', { itemId, cost, vtuberName })
  },
}))