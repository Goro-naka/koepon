import { renderHook, act } from '@testing-library/react'
import { useExchangeStore } from '../exchange'
import { apiClient } from '@/api/client'
import type { 
  ExchangeItem, 
  ExchangeHistory, 
  ExchangeResult,
  ExchangeStatistics,
  ExchangeValidationRequirements 
} from '@/types/medal'

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  }
}))

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

const mockExchangeItems: ExchangeItem[] = [
  {
    id: 'item-1',
    name: 'テストボイス1',
    description: 'テスト用のボイスアイテムです',
    cost: 100,
    category: 'voice',
    vtuberName: 'テスト1号',
    vtuberId: 'vtuber-1',
    imageUrl: 'https://example.com/item1.jpg',
    stock: 50,
    limitPerUser: 1,
    isAvailable: true,
    tags: ['限定', '人気'],
    validUntil: '2024-12-31T23:59:59.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'item-2',
    name: 'テストグッズ1',
    description: 'テスト用のグッズアイテムです',
    cost: 200,
    category: 'goods',
    vtuberName: 'テスト2号',
    vtuberId: 'vtuber-2',
    imageUrl: 'https://example.com/item2.jpg',
    stock: null,
    limitPerUser: null,
    isAvailable: true,
    tags: ['通常'],
    validUntil: null,
    createdAt: '2024-01-02T00:00:00.000Z',
  }
]

const mockExchangeHistory: ExchangeHistory[] = [
  {
    id: 'history-1',
    itemId: 'item-1',
    itemName: 'テストボイス1',
    itemImageUrl: 'https://example.com/item1.jpg',
    quantity: 1,
    totalCost: 100,
    status: 'completed',
    createdAt: '2024-01-15T10:00:00.000Z',
    completedAt: '2024-01-15T10:01:00.000Z',
    vtuberName: 'テスト1号',
    vtuberId: 'vtuber-1',
    category: 'voice',
  }
]

const mockExchangeResult: ExchangeResult = {
  id: 'exchange-1',
  itemId: 'item-1',
  itemName: 'テストボイス1',
  quantity: 1,
  totalCost: 100,
  newBalance: 1100,
  status: 'completed',
  createdAt: '2024-01-15T10:00:00.000Z',
}

const mockExchangeStatistics: ExchangeStatistics = {
  totalExchanges: 10,
  totalMedalsUsed: 1500,
  averageCostPerExchange: 150,
  mostPopularCategory: 'voice',
  mostPopularVtuber: 'テスト1号',
  thisMonthExchanges: 5,
  thisMonthMedalsUsed: 750,
  categoryBreakdown: {
    voice: { count: 6, totalCost: 600 },
    goods: { count: 4, totalCost: 900 },
    special: { count: 0, totalCost: 0 },
    limited: { count: 0, totalCost: 0 },
  },
}

describe('ExchangeStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ES001: Exchange Items Management Tests
  describe('Exchange Items Management', () => {
    it('should fetch and store exchange items list', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValue({ data: mockExchangeItems })

      const { result } = renderHook(() => useExchangeStore())

      await act(async () => {
        await result.current.fetchExchangeItems()
      })

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/exchange/items')
      expect(result.current.exchangeItems).toEqual(mockExchangeItems)
      expect(result.current.exchangeItemsLoading).toBe(false)
      expect(result.current.exchangeItemsError).toBe(null)
    })

    it('should handle loading state during items fetch', async () => {
      const { apiClient } = require('@/api/client')
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      apiClient.get.mockReturnValue(promise)

      const { result } = renderHook(() => useExchangeStore())

      act(() => {
        result.current.fetchExchangeItems()
      })

      expect(result.current.exchangeItemsLoading).toBe(true)

      await act(async () => {
        resolvePromise({ data: mockExchangeItems })
        await promise
      })

      expect(result.current.exchangeItemsLoading).toBe(false)
    })

    it('should handle exchange items fetch error', async () => {
      const { apiClient } = require('@/api/client')
      const errorMessage = 'アイテム一覧の取得に失敗しました'
      apiClient.get.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useExchangeStore())

      await act(async () => {
        await result.current.fetchExchangeItems()
      })

      expect(result.current.exchangeItems).toEqual([])
      expect(result.current.exchangeItemsLoading).toBe(false)
      expect(result.current.exchangeItemsError).toBe(errorMessage)
    })

    it('should fetch and store exchange item detail', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValue({ data: mockExchangeItems[0] })

      const { result } = renderHook(() => useExchangeStore())

      await act(async () => {
        await result.current.fetchExchangeItemDetail('item-1')
      })

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/exchange/items/item-1')
      expect(result.current.selectedExchangeItem).toEqual(mockExchangeItems[0])
      expect(result.current.selectedItemLoading).toBe(false)
    })

    it('should filter exchange items by category', () => {
      const { result } = renderHook(() => useExchangeStore())

      act(() => {
        result.current.setExchangeItems(mockExchangeItems)
        result.current.setItemFilters({ category: 'voice' })
      })

      expect(result.current.itemFilters.category).toBe('voice')
    })

    it('should search exchange items by name and description', () => {
      const { result } = renderHook(() => useExchangeStore())

      act(() => {
        result.current.setSearchQuery('ボイス')
      })

      expect(result.current.searchQuery).toBe('ボイス')
    })

    it('should sort exchange items by cost/name/newest', () => {
      const { result } = renderHook(() => useExchangeStore())

      act(() => {
        result.current.setSortBy('cost')
      })

      expect(result.current.sortBy).toBe('cost')
    })
  })

  // ES002: Exchange Execution Tests
  describe('Exchange Execution', () => {
    it('should execute exchange successfully', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.post.mockResolvedValue({ data: mockExchangeResult })

      const { result } = renderHook(() => useExchangeStore())

      await act(async () => {
        await result.current.executeExchange('item-1', 1)
      })

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/exchange/execute', {
        itemId: 'item-1',
        quantity: 1
      })
      expect(result.current.exchangeResult).toEqual(mockExchangeResult)
      expect(result.current.exchangeState).toBe('completed')
    })

    it('should handle exchange state transitions', async () => {
      const { apiClient } = require('@/api/client')
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      apiClient.post.mockReturnValue(promise)

      const { result } = renderHook(() => useExchangeStore())

      expect(result.current.exchangeState).toBe('idle')

      act(() => {
        result.current.executeExchange('item-1', 1)
      })

      expect(result.current.exchangeState).toBe('processing')

      await act(async () => {
        resolvePromise({ data: mockExchangeResult })
        await promise
      })

      expect(result.current.exchangeState).toBe('completed')
    })

    it('should handle insufficient balance error', async () => {
      const { apiClient } = require('@/api/client')
      const balanceError = {
        response: { 
          status: 400, 
          data: { message: 'メダル残高が不足しています' }
        }
      }
      apiClient.post.mockRejectedValue(balanceError)

      const { result } = renderHook(() => useExchangeStore())

      await act(async () => {
        await result.current.executeExchange('item-1', 1)
      })

      expect(result.current.exchangeState).toBe('error')
      expect(result.current.exchangeError).toBe('エラーが発生しました')
    })

    it('should handle item out of stock error', async () => {
      const { apiClient } = require('@/api/client')
      const stockError = {
        response: { 
          status: 400, 
          data: { message: '在庫が不足しています' }
        }
      }
      apiClient.post.mockRejectedValue(stockError)

      const { result } = renderHook(() => useExchangeStore())

      await act(async () => {
        await result.current.executeExchange('item-1', 1)
      })

      expect(result.current.exchangeState).toBe('error')
      expect(result.current.exchangeError).toBe('エラーが発生しました')
    })

    it('should clear exchange result when requested', () => {
      const { result } = renderHook(() => useExchangeStore())

      act(() => {
        result.current.setExchangeResult(mockExchangeResult)
      })

      expect(result.current.exchangeResult).toEqual(mockExchangeResult)

      act(() => {
        result.current.clearExchangeResult()
      })

      expect(result.current.exchangeResult).toBe(null)
      expect(result.current.exchangeState).toBe('idle')
    })

    it('should validate exchange requirements before execution', async () => {
      const { result } = renderHook(() => useExchangeStore())

      const validationResult = result.current.validateExchangeRequirements({
        itemId: 'item-1',
        cost: 500,
        stock: 10,
        limitPerUser: 3,
        userPurchaseCount: 2,
        userBalance: 600
      })

      expect(validationResult.isValid).toBe(true)
      expect(validationResult.errors).toEqual([])
    })

    it('should detect validation errors', () => {
      const { result } = renderHook(() => useExchangeStore())

      const validationResult = result.current.validateExchangeRequirements({
        itemId: 'item-1',
        cost: 500,
        stock: 0,
        limitPerUser: 3,
        userPurchaseCount: 3,
        userBalance: 300
      })

      expect(validationResult.isValid).toBe(false)
      expect(validationResult.errors).toContain('在庫が不足しています')
      expect(validationResult.errors).toContain('購入制限に達しています')
      expect(validationResult.errors).toContain('メダル残高が不足しています')
    })
  })

  // ES003: Exchange History Tests
  describe('Exchange History', () => {
    it('should fetch and store exchange history', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValue({ 
        data: mockExchangeHistory,
        pagination: { currentPage: 1, totalPages: 1, totalCount: 1 },
        statistics: { totalExchanges: 1, totalMedalsUsed: 500 }
      })

      const { result } = renderHook(() => useExchangeStore())

      await act(async () => {
        await result.current.fetchExchangeHistory()
      })

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/exchange/history')
      expect(result.current.exchangeHistory).toEqual(mockExchangeHistory)
      expect(result.current.exchangeHistoryLoading).toBe(false)
      expect(result.current.exchangeHistoryError).toBe(null)
    })

    it('should handle exchange history with filters', async () => {
      const filters = {
        vtuber: '桜音ミク',
        category: 'voice',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: 'completed' as const
      }

      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValue({ 
        data: [],
        pagination: { currentPage: 1, totalPages: 1, totalCount: 0 },
        statistics: { totalExchanges: 0, totalMedalsUsed: 0 }
      })

      const { result } = renderHook(() => useExchangeStore())

      act(() => {
        result.current.setHistoryFilters(filters)
      })

      await act(async () => {
        await result.current.fetchExchangeHistory()
      })

      expect(result.current.historyFilters).toEqual(filters)
    })

    it('should handle exchange history pagination', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValue({ 
        data: mockExchangeHistory,
        pagination: { currentPage: 2, totalPages: 5, totalCount: 50 },
        statistics: { totalExchanges: 50, totalMedalsUsed: 25000 }
      })

      const { result } = renderHook(() => useExchangeStore())

      await act(async () => {
        await result.current.setHistoryPage(2)
        await result.current.fetchExchangeHistory()
      })

      expect(result.current.historyPagination?.currentPage).toBe(2)
    })

    it('should handle exchange history error', async () => {
      const { apiClient } = require('@/api/client')
      const errorMessage = '履歴の取得に失敗しました'
      apiClient.get.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useExchangeStore())

      await act(async () => {
        await result.current.fetchExchangeHistory()
      })

      expect(result.current.exchangeHistory).toEqual([])
      expect(result.current.exchangeHistoryLoading).toBe(false)
      expect(result.current.exchangeHistoryError).toBe(errorMessage)
    })

    it('should clear exchange history filters', () => {
      const { result } = renderHook(() => useExchangeStore())

      act(() => {
        result.current.setHistoryFilters({
          vtuber: '桜音ミク',
          category: 'voice',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          status: 'completed'
        })
      })

      act(() => {
        result.current.clearHistoryFilters()
      })

      expect(result.current.historyFilters).toEqual({
        vtuber: '',
        category: '',
        startDate: '',
        endDate: '',
        status: ''
      })
    })

    it('should calculate exchange statistics correctly', () => {
      const { result } = renderHook(() => useExchangeStore())

      act(() => {
        result.current.setExchangeStatistics({
          totalExchanges: 15,
          totalMedalsUsed: 7500,
          favoriteCategory: 'voice',
          favoriteVTuber: '桜音ミク',
          averageCostPerExchange: 500
        })
      })

      expect(result.current.exchangeStatistics?.totalExchanges).toBe(15)
      expect(result.current.exchangeStatistics?.totalMedalsUsed).toBe(7500)
      expect(result.current.exchangeStatistics?.favoriteCategory).toBe('voice')
    })
  })

  // ES004: Filter and Search Tests
  describe('Filter and Search', () => {
    it('should clear all item filters', () => {
      const { result } = renderHook(() => useExchangeStore())

      act(() => {
        result.current.setItemFilters({
          category: 'voice',
          vtuber: '桜音ミク',
          minCost: 100,
          maxCost: 1000
        })
        result.current.setSearchQuery('ボイス')
        result.current.setSortBy('cost')
      })

      act(() => {
        result.current.clearItemFilters()
      })

      expect(result.current.itemFilters).toEqual({
        category: '',
        vtuber: '',
        minCost: null,
        maxCost: null
      })
      expect(result.current.searchQuery).toBe('')
      expect(result.current.sortBy).toBe('newest')
    })
  })
})