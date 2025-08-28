import { renderHook, act } from '@testing-library/react'
import { useMedalStore } from '../medal'
import { apiClient } from '@/api/client'
import type { MedalBalance, MedalTransaction } from '@/types/medal'

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  }
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

const mockMedalBalance: MedalBalance = {
  totalMedals: 1500,
  availableMedals: 1200,
  usedMedals: 300,
  vtuberBalances: [
    {
      vtuberId: 'vtuber-1',
      vtuberName: 'テスト1号',
      vtuberImageUrl: 'https://example.com/test1.jpg',
      balance: 500,
      totalEarned: 600,
      totalUsed: 100,
    }
  ],
  lastUpdated: '2024-01-15T10:30:00.000Z'
}

const mockTransactionHistory: MedalTransaction[] = [
  {
    id: 'tx-1',
    type: 'earned',
    amount: 100,
    source: 'gacha-draw',
    description: 'ガチャで獲得',
    createdAt: '2024-01-15T10:00:00.000Z',
    vtuberName: 'テスト1号',
    vtuberId: 'vtuber-1',
  },
  {
    id: 'tx-2',
    type: 'used',
    amount: 50,
    source: 'exchange',
    description: 'アイテム交換',
    createdAt: '2024-01-15T09:00:00.000Z',
    vtuberName: 'テスト1号',
    vtuberId: 'vtuber-1',
  }
]

describe('MedalStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset store state
    useMedalStore.setState({
      medalBalance: null,
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
    })
  })

  describe('fetchMedalBalance', () => {
    it('should fetch medal balance successfully', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockMedalBalance })

      const { result } = renderHook(() => useMedalStore())

      await act(async () => {
        await result.current.fetchMedalBalance()
      })

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/medals/balance')
      expect(result.current.medalBalance).toEqual(mockMedalBalance)
      expect(result.current.medalBalanceLoading).toBe(false)
      expect(result.current.medalBalanceError).toBeNull()
    })

    it('should handle API error', async () => {
      const errorMessage = 'Network error'
      mockApiClient.get.mockRejectedValueOnce(new Error(errorMessage))

      const { result } = renderHook(() => useMedalStore())

      await act(async () => {
        await result.current.fetchMedalBalance()
      })

      expect(result.current.medalBalance).toBeNull()
      expect(result.current.medalBalanceLoading).toBe(false)
      expect(result.current.medalBalanceError).toBe(errorMessage)
    })

    it('should set loading state during fetch', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useMedalStore())

      act(() => {
        result.current.fetchMedalBalance()
      })

      expect(result.current.medalBalanceLoading).toBe(true)
      expect(result.current.medalBalanceError).toBeNull()
    })

  })

  describe('setMedalBalance', () => {
    it('should set medal balance', () => {
      const { result } = renderHook(() => useMedalStore())

      act(() => {
        result.current.setMedalBalance(mockMedalBalance)
      })

      expect(result.current.medalBalance).toEqual(mockMedalBalance)
    })
  })

  describe('checkSufficientBalance', () => {
    it('should return true when balance is sufficient', () => {
      const { result } = renderHook(() => useMedalStore())

      act(() => {
        result.current.setMedalBalance(mockMedalBalance)
      })

      const hasSufficientBalance = result.current.checkSufficientBalance(1000)
      expect(hasSufficientBalance).toBe(true)
    })

    it('should return false when balance is insufficient', () => {
      const { result } = renderHook(() => useMedalStore())

      act(() => {
        result.current.setMedalBalance(mockMedalBalance)
      })

      const hasSufficientBalance = result.current.checkSufficientBalance(1500)
      expect(hasSufficientBalance).toBe(false)
    })

    it('should return false when balance is null', () => {
      const { result } = renderHook(() => useMedalStore())

      const hasSufficientBalance = result.current.checkSufficientBalance(100)
      expect(hasSufficientBalance).toBe(false)
    })
  })

  describe('retryFetchBalance', () => {
    it('should call fetchMedalBalance', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: mockMedalBalance })

      const { result } = renderHook(() => useMedalStore())

      await act(async () => {
        await result.current.retryFetchBalance()
      })

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/medals/balance')
      expect(result.current.medalBalance).toEqual(mockMedalBalance)
    })
  })

  describe('fetchTransactionHistory', () => {
    it('should fetch transaction history successfully', async () => {
      mockApiClient.get.mockResolvedValueOnce({ 
        data: mockTransactionHistory,
        pagination: { currentPage: 1, totalPages: 1, totalItems: 2 }
      })

      const { result } = renderHook(() => useMedalStore())

      await act(async () => {
        await result.current.fetchTransactionHistory()
      })

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/medals/transactions')
      expect(result.current.transactionHistory).toEqual(mockTransactionHistory)
      expect(result.current.transactionHistoryLoading).toBe(false)
      expect(result.current.transactionHistoryError).toBeNull()
      expect(result.current.transactionPagination).toEqual({ 
        currentPage: 1, 
        totalPages: 1, 
        totalItems: 2 
      })
    })

    it('should handle transaction history with filters', async () => {
      const filters = {
        type: 'earned' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        source: 'gacha-draw'
      }

      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValue({ 
        data: [],
        pagination: { currentPage: 1, totalPages: 1, totalCount: 0 }
      })

      const { result } = renderHook(() => useMedalStore())

      act(() => {
        result.current.setTransactionFilters(filters)
      })

      await act(async () => {
        await result.current.fetchTransactionHistory()
      })

      expect(result.current.transactionFilters).toEqual(filters)
    })

    it('should handle transaction history error', async () => {
      const { apiClient } = require('@/api/client')
      const errorMessage = 'データの取得に失敗しました'
      apiClient.get.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useMedalStore())

      await act(async () => {
        await result.current.fetchTransactionHistory()
      })

      expect(result.current.transactionHistory).toEqual([])
      expect(result.current.transactionHistoryLoading).toBe(false)
      expect(result.current.transactionHistoryError).toBe(errorMessage)
    })

    it('should clear transaction filters', () => {
      const { result } = renderHook(() => useMedalStore())

      act(() => {
        result.current.setTransactionFilters({
          type: 'earned',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          source: 'gacha-draw'
        })
      })

      act(() => {
        result.current.clearTransactionFilters()
      })

      expect(result.current.transactionFilters).toEqual({
        type: '',
        startDate: '',
        endDate: '',
        source: ''
      })
    })
  })

  // MS003: Error Handling Tests
  describe('Error Handling', () => {
    it('should handle network timeout errors', async () => {
      const { apiClient } = require('@/api/client')
      const timeoutError = new Error('Network timeout')
      timeoutError.name = 'TimeoutError'
      apiClient.get.mockRejectedValue(timeoutError)

      const { result } = renderHook(() => useMedalStore())

      await act(async () => {
        await result.current.fetchMedalBalance()
      })

      expect(result.current.medalBalanceError).toBe('Network timeout')
    })

    it('should handle API server errors', async () => {
      const { apiClient } = require('@/api/client')
      const serverError = {
        response: { 
          status: 500, 
          data: { message: 'サーバーエラーが発生しました' }
        }
      }
      apiClient.get.mockRejectedValue(serverError)

      const { result } = renderHook(() => useMedalStore())

      await act(async () => {
        await result.current.fetchMedalBalance()
      })

      expect(result.current.medalBalanceError).toBe('エラーが発生しました')
    })

    it('should retry failed requests', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: mockMedalBalance })

      const { result } = renderHook(() => useMedalStore())

      await act(async () => {
        await result.current.retryFetchBalance()
      })

      expect(apiClient.get).toHaveBeenCalledTimes(2)
      expect(result.current.medalBalance).toEqual(mockMedalBalance)
    })

    it('should reset error state on successful request', async () => {
      const { apiClient } = require('@/api/client')
      
      // First call fails
      apiClient.get.mockRejectedValueOnce(new Error('Error'))
      
      const { result } = renderHook(() => useMedalStore())

      await act(async () => {
        await result.current.fetchMedalBalance()
      })

      expect(result.current.medalBalanceError).toBe('Error')

      // Second call succeeds
      apiClient.get.mockResolvedValueOnce({ data: mockMedalBalance })

      await act(async () => {
        await result.current.fetchMedalBalance()
      })

      expect(result.current.medalBalanceError).toBe(null)
      expect(result.current.medalBalance).toEqual(mockMedalBalance)
    })
  })
})