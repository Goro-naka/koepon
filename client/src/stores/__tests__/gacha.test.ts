import { renderHook, act } from '@testing-library/react'
import { useGachaStore, type GachaStore } from '../gacha'

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const mockGachaList = [
  {
    id: 'gacha-1',
    name: 'サマーガチャ',
    vtuberName: '桜音ミク',
    vtuberIcon: '/images/miku-icon.jpg',
    description: '夏の特別ガチャ！レアアイテムが当たるチャンス',
    singlePrice: 300,
    tenDrawPrice: 2700,
    isLimitedTime: true,
    endDate: '2024-08-31T23:59:59Z',
    popularityRank: 1,
    participantCount: 1250,
  },
]

const mockGachaDetail = {
  ...mockGachaList[0],
  probabilityRates: [
    { rarity: 'N', rate: 70, color: '#CCCCCC' },
    { rarity: 'R', rate: 20, color: '#4CAF50' },
    { rarity: 'SR', rate: 8, color: '#2196F3' },
    { rarity: 'SSR', rate: 2, color: '#FF9800' },
  ],
  availableRewards: [
    { id: 'reward-1', name: 'サマーボイス', rarity: 'SR', image: '/images/voice.jpg' },
    { id: 'reward-2', name: '限定スタンプ', rarity: 'R', image: '/images/stamp.jpg' },
  ],
}

const mockDrawResult = {
  id: 'draw-1',
  gachaId: 'gacha-1',
  items: [
    {
      id: 'item-1',
      name: 'サマーボイス',
      rarity: 'SR',
      image: '/images/voice.jpg',
      medalValue: 50,
    }
  ],
  totalMedals: 50,
  drawCount: 1,
  timestamp: new Date().toISOString(),
}

describe('GachaStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ZS001: Gacha List State Management
  describe('List Management', () => {
    it('should fetch and store gacha list', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValue({ data: mockGachaList })

      const { result } = renderHook(() => useGachaStore())

      await act(async () => {
        await result.current.fetchGachaList()
      })

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/gacha')
      expect(result.current.gachaList).toEqual(mockGachaList)
      expect(result.current.gachaListLoading).toBe(false)
      expect(result.current.gachaListError).toBe(null)
    })

    it('should handle loading state during fetch', async () => {
      const { apiClient } = require('@/api/client')
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      apiClient.get.mockReturnValue(promise)

      const { result } = renderHook(() => useGachaStore())

      act(() => {
        result.current.fetchGachaList()
      })

      expect(result.current.gachaListLoading).toBe(true)

      await act(async () => {
        resolvePromise({ data: mockGachaList })
        await promise
      })

      expect(result.current.gachaListLoading).toBe(false)
    })

    it('should handle fetch error appropriately', async () => {
      const { apiClient } = require('@/api/client')
      const errorMessage = 'ネットワークエラーが発生しました'
      apiClient.get.mockRejectedValue(new Error(errorMessage))

      const { result } = renderHook(() => useGachaStore())

      await act(async () => {
        await result.current.fetchGachaList()
      })

      expect(result.current.gachaList).toEqual([])
      expect(result.current.gachaListLoading).toBe(false)
      expect(result.current.gachaListError).toBe(errorMessage)
    })
  })

  // ZS002: Draw State Management
  describe('Draw State Management', () => {
    it('should execute draw and update state', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.post.mockResolvedValue({ data: mockDrawResult })

      const { result } = renderHook(() => useGachaStore())

      await act(async () => {
        await result.current.executeDraw('gacha-1', 1)
      })

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/gacha/gacha-1/draw', { count: 1 })
      expect(result.current.drawResult).toEqual(mockDrawResult)
      expect(result.current.drawState).toBe('complete')
    })

    it('should manage draw state transitions', async () => {
      const { apiClient } = require('@/api/client')
      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      apiClient.post.mockReturnValue(promise)

      const { result } = renderHook(() => useGachaStore())

      // Reset store to initial state
      act(() => {
        result.current.clearDrawResult()
      })

      expect(result.current.drawState).toBe('idle')

      act(() => {
        result.current.executeDraw('gacha-1', 1)
      })

      expect(result.current.drawState).toBe('drawing')

      await act(async () => {
        resolvePromise({ data: mockDrawResult })
        await promise
      })

      expect(result.current.drawState).toBe('complete')
    })

    it('should clear draw result when requested', async () => {
      const { result } = renderHook(() => useGachaStore())

      act(() => {
        result.current.setDrawResult(mockDrawResult)
      })

      expect(result.current.drawResult).toEqual(mockDrawResult)

      act(() => {
        result.current.clearDrawResult()
      })

      expect(result.current.drawResult).toBe(null)
      expect(result.current.drawState).toBe('idle')
    })

    it('should handle draw error state', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.post.mockRejectedValue(new Error('残高不足です'))

      const { result } = renderHook(() => useGachaStore())

      await act(async () => {
        await result.current.executeDraw('gacha-1', 1)
      })

      expect(result.current.drawState).toBe('error')
      expect(result.current.drawError).toBe('残高不足です')
    })
  })

  // Test gacha detail fetching
  describe('Gacha Detail Management', () => {
    it('should fetch and store gacha detail', async () => {
      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValue({ data: mockGachaDetail })

      const { result } = renderHook(() => useGachaStore())

      await act(async () => {
        await result.current.fetchGachaDetail('gacha-1')
      })

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/gacha/gacha-1')
      expect(result.current.selectedGacha).toEqual(mockGachaDetail)
      expect(result.current.selectedGachaLoading).toBe(false)
    })
  })

  // Test search and filter functionality
  describe('Search and Filter', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useGachaStore())

      act(() => {
        result.current.setSearchQuery('サマー')
      })

      expect(result.current.searchQuery).toBe('サマー')
    })

    it('should update selected VTuber filter', () => {
      const { result } = renderHook(() => useGachaStore())

      act(() => {
        result.current.setSelectedVTuber('桜音ミク')
      })

      expect(result.current.selectedVTuber).toBe('桜音ミク')
    })

    it('should update sort by option', () => {
      const { result } = renderHook(() => useGachaStore())

      act(() => {
        result.current.setSortBy('price')
      })

      expect(result.current.sortBy).toBe('price')
    })

    it('should clear all filters', () => {
      const { result } = renderHook(() => useGachaStore())

      act(() => {
        result.current.setSearchQuery('サマー')
        result.current.setSelectedVTuber('桜音ミク')
        result.current.setSortBy('price')
      })

      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.searchQuery).toBe('')
      expect(result.current.selectedVTuber).toBe('')
      expect(result.current.sortBy).toBe('popular')
    })
  })

  // Test history management
  describe('History Management', () => {
    it('should fetch and store draw history', async () => {
      const mockHistory = [mockDrawResult]
      const { apiClient } = require('@/api/client')
      apiClient.get.mockResolvedValue({ data: mockHistory })

      const { result } = renderHook(() => useGachaStore())

      await act(async () => {
        await result.current.fetchDrawHistory()
      })

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/gacha/history')
      expect(result.current.drawHistory).toEqual(mockHistory)
    })
  })
})