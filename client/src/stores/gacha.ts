import { create } from 'zustand'
import { apiClient } from '@/api/client'
import type {
  GachaItem,
  GachaDetail,
  DrawResult,
  DrawHistoryItem,
  HistoryStatistics,
  HistoryFilters,
  HistoryPagination,
  DrawState,
  SortOption,
} from '@/types/gacha'

export interface GachaStore {
  // Gacha list state
  gachaList: GachaItem[]
  gachaListLoading: boolean
  gachaListError: string | null
  
  // Selected gacha state
  selectedGacha: GachaDetail | null
  selectedGachaLoading: boolean
  selectedGachaError?: string | null
  
  // Draw state
  drawState: DrawState
  drawResult: DrawResult | null
  drawError?: string | null
  drawProgress?: number
  multiDrawProgress?: number
  
  // Search and filter state
  searchQuery: string
  selectedVTuber: string
  sortBy: SortOption
  
  // History state
  drawHistory: DrawHistoryItem[]
  drawHistoryLoading: boolean
  drawHistoryError: string | null
  historyFilters: HistoryFilters
  historyPagination?: HistoryPagination
  historyStatistics?: HistoryStatistics
  
  
  // Actions
  fetchGachaList: () => Promise<void>
  fetchGachaDetail: (id: string) => Promise<void>
  executeDraw: (gachaId: string, count: number) => Promise<void>
  clearDrawResult: () => void
  setDrawResult: (result: DrawResult) => void
  retryDraw?: () => void
  
  // Search and filter actions
  setSearchQuery: (query: string) => void
  setSelectedVTuber: (vtuber: string) => void
  setSortBy: (sort: SortOption) => void
  clearFilters: () => void
  
  // History actions
  fetchDrawHistory: () => Promise<void>
  setHistoryFilters: (filters: HistoryFilters) => void
  clearHistoryFilters: () => void
  setHistoryPage?: (page: number) => void
}

// データベースから取得するため、ダミーデータは空に
const dummyGachaList: GachaItem[] = []

export const useGachaStore = create<GachaStore>((set, get) => ({
  // Initial state
  gachaList: dummyGachaList,
  gachaListLoading: false,
  gachaListError: null,
  
  selectedGacha: null,
  selectedGachaLoading: false,
  selectedGachaError: null,
  
  drawState: 'idle',
  drawResult: null,
  drawError: null,
  drawProgress: 0,
  multiDrawProgress: 0,
  
  searchQuery: '',
  selectedVTuber: '',
  sortBy: 'popular',
  
  drawHistory: [],
  drawHistoryLoading: false,
  drawHistoryError: null,
  historyFilters: {
    vtuber: '',
    startDate: '',
    endDate: '',
    rarity: '',
  },
  
  
  // Actions
  fetchGachaList: async () => {
    set({ gachaListLoading: true, gachaListError: null })
    
    // 開発中：ダミーデータを直接使用（高速化）
    try {
      // TODO: API実装後は実際のAPI呼び出しに切り替え
      // const response = await apiClient.get('/api/gacha/list')
      
      // シミュレート（短時間で完了）
      await new Promise(resolve => setTimeout(resolve, 100))
      
      set({ 
        gachaList: dummyGachaList,
        gachaListLoading: false,
        gachaListError: null 
      })
    } catch (_error) {
      console.error("Error:", _error)
      set({ 
        gachaList: dummyGachaList,
        gachaListLoading: false,
        gachaListError: null // エラーを隠してダミーデータを使用
      })
    }
  },
  
  fetchGachaDetail: async (id: string) => {
    set({ selectedGachaLoading: true, selectedGachaError: null })
    try {
      // 開発中：ダミーデータを直接使用（高速化）
      // TODO: API実装後は実際のAPI呼び出しに切り替え
      // const response = await apiClient.get(`/api/gacha/${id}`)
      
      // シミュレート（短時間で完了）
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const baseGacha = dummyGachaList.find(g => g.id === id)
      if (!baseGacha) {
        throw new Error('ガチャが見つかりません')
      }
      
      const gachaDetail: GachaDetail = {
        ...baseGacha,
        probabilityRates: [
          { rarity: 'UR', rate: 1, color: '#ff6b6b' },
          { rarity: 'SSR', rate: 3, color: '#feca57' },
          { rarity: 'SR', rate: 10, color: '#48dbfb' },
          { rarity: 'R', rate: 30, color: '#0be881' },
          { rarity: 'N', rate: 56, color: '#a4b0be' }
        ],
        availableRewards: [
          {
            id: `${id}-reward-1`,
            name: `${baseGacha.vtuberName}の限定ボイス`,
            rarity: 'UR',
            image: `/items/${baseGacha.vtuberName}-voice.jpg`,
            description: '特別な挨拶ボイス'
          },
          {
            id: `${id}-reward-2`,
            name: `${baseGacha.vtuberName}のイラスト`,
            rarity: 'SSR',
            image: `/items/${baseGacha.vtuberName}-illustration.jpg`,
            description: '限定イラスト'
          },
          {
            id: `${id}-reward-3`,
            name: `${baseGacha.vtuberName}のメッセージ`,
            rarity: 'SR',
            image: `/items/${baseGacha.vtuberName}-message.jpg`,
            description: 'ファンへのメッセージ'
          },
          {
            id: `${id}-reward-4`,
            name: 'スタンプセット',
            rarity: 'R',
            image: `/items/stamps.jpg`,
            description: 'かわいいスタンプ'
          }
        ],
        items: [
          {
            id: `${id}-1`,
            name: `${baseGacha.vtuberName}の限定ボイス「おはよう」`,
            description: '朝の挨拶を特別な声でお届け',
            rarity: 'UR',
            probability: 1,
            imageUrl: `/items/${baseGacha.vtuberName}-voice1.jpg`,
            category: 'voice'
          },
          {
            id: `${id}-2`, 
            name: `${baseGacha.vtuberName}の直筆イラスト`,
            description: 'VTuber本人が描いた特別なイラスト',
            rarity: 'SSR',
            probability: 3,
            imageUrl: `/items/${baseGacha.vtuberName}-illust1.jpg`,
            category: 'illustration'
          },
          {
            id: `${id}-3`,
            name: `${baseGacha.vtuberName}のメッセージカード`,
            description: 'ファンへの感謝のメッセージ',
            rarity: 'SR',
            probability: 10,
            imageUrl: `/items/${baseGacha.vtuberName}-message1.jpg`,
            category: 'message'
          },
          {
            id: `${id}-4`,
            name: `${baseGacha.vtuberName}のスタンプセット`,
            description: 'チャットで使える可愛いスタンプ',
            rarity: 'R',
            probability: 30,
            imageUrl: `/items/${baseGacha.vtuberName}-stamp1.jpg`,
            category: 'stamp'
          },
          {
            id: `${id}-5`,
            name: '推しメダル',
            description: 'アプリ内で使える通貨',
            rarity: 'N',
            probability: 56,
            imageUrl: '/items/medal.png',
            category: 'medal'
          }
        ],
        stats: {
          totalDraws: baseGacha.totalDraws,
          todayDraws: Math.floor(Math.random() * 1000),
          averageRating: 4.7,
          reviewCount: Math.floor(Math.random() * 500)
        }
      }
      
      set({ 
        selectedGacha: gachaDetail,
        selectedGachaLoading: false,
        selectedGachaError: null 
      })
    } catch (_error) {
      set({ 
        selectedGacha: null,
        selectedGachaLoading: false,
        selectedGachaError: _error instanceof Error ? _error.message : 'エラーが発生しました'
      })
    }
  },
  
  executeDraw: async (gachaId: string, count: number) => {
    set({ drawState: 'payment', drawError: null })
    
    try {
      // 1. Stripe決済処理
      const paymentAmount = count === 1 ? 100 : 1000  // 円
      const baseGacha = dummyGachaList.find(g => g.id === gachaId)
      if (!baseGacha) {
        throw new Error('ガチャが見つかりません')
      }
      
      const gachaName = baseGacha.title
      
      // Stripe決済処理（将来実装）
      // const payment = await processStripePayment({
      //   amount: paymentAmount,
      //   currency: 'jpy',
      //   description: `${gachaName} ${count === 1 ? '単発' : '10連'}ガチャ`,
      //   metadata: { gachaId, count, userId: 'current_user_id' }
      // })
      
      // モック決済処理（高速化）
      await new Promise(resolve => setTimeout(resolve, 200))
      const payment = {
        success: true,
        id: `pi_mock_${Date.now()}`
      }
      
      if (!payment.success) {
        throw new Error('決済に失敗しました')
      }
      
      // 2. 決済成功後、ガチャ抽選実行
      set({ drawState: 'drawing' })
      
      const response = await apiClient.post('/api/gacha/draw', {
        gachaId,
        count,
        paymentIntentId: payment.id
      })
      
      if (response.data.result) {
        // 3. 結果処理（メダルは獲得物として含まれる）
        const result = response.data.result
        set({
          drawResult: {
            id: result.id,
            gachaId: result.gachaId,
            drawCount: result.drawCount,
            results: result.items || result.results,
            medalsEarned: result.medalsEarned,
            paymentId: payment.id,
            paymentAmount: paymentAmount,
            timestamp: result.timestamp || new Date().toISOString(),
            createdAt: new Date()
          },
          drawState: 'complete'
        })
        return
      }
      
      // ダミー抽選ロジック（高速化）
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const results = []
      const rarities = ['N', 'R', 'SR', 'SSR', 'UR']
      const rarityWeights = [56, 30, 10, 3, 1]
      
      for (let i = 0; i < count; i++) {
        const random = Math.random() * 100
        let rarity = 'N'
        let weight = 0
        
        for (let j = 0; j < rarities.length; j++) {
          weight += rarityWeights[j]
          if (random <= weight) {
            rarity = rarities[j]
            break
          }
        }
        
        results.push({
          id: `result-${gachaId}-${i}`,
          name: `${baseGacha.vtuberName}の${rarity}アイテム`,
          description: `レアリティ${rarity}のアイテムです`,
          rarity: rarity as 'N' | 'R' | 'SR' | 'SSR' | 'UR',
          imageUrl: `/items/${baseGacha.vtuberName}-${rarity.toLowerCase()}.jpg`,
          category: 'voice' as 'voice' | 'illustration' | 'message' | 'stamp' | 'medal',
          isNew: Math.random() > 0.7
        })
      }
      
      // メダル獲得計算（ガチャ結果として付与）
      const medalsEarned = Math.floor(paymentAmount / 10) + (count === 10 ? 50 : 0)
      
      const drawResult: DrawResult = {
        id: `draw-${Date.now()}`,
        gachaId,
        drawCount: count,
        results,
        medalsEarned: medalsEarned,
        paymentId: payment.id,
        paymentAmount: paymentAmount,
        timestamp: new Date().toISOString(),
        createdAt: new Date()
        // medalUsed: removed - メダル消費は削除
      }
      
      set({ 
        drawResult,
        drawState: 'complete',
        drawError: null 
      })
      
      // 4. メダル残高を更新（獲得分を追加）
      // TODO: メダルストアと連携して残高更新
      // const medalStore = useMedalStore.getState()
      // await medalStore.earnMedals(medalsEarned, 'gacha')
      
    } catch (_error) {
      const errorMessage = _error instanceof Error ? _error.message : 'エラーが発生しました'
      console.error('Gacha execution error:', _error)
      
      set({ 
        drawState: 'error',
        drawError: errorMessage
      })
    }
  },
  
  clearDrawResult: () => {
    set({ 
      drawResult: null,
      drawState: 'idle',
      drawError: null,
      drawProgress: 0,
      multiDrawProgress: 0
    })
  },
  
  setDrawResult: (result: DrawResult) => {
    set({ drawResult: result })
  },
  
  retryDraw: () => {
    const { drawResult } = get()
    if (drawResult) {
      get().executeDraw(drawResult.gachaId, drawResult.drawCount)
    }
  },
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },
  
  setSelectedVTuber: (vtuber: string) => {
    set({ selectedVTuber: vtuber })
  },
  
  setSortBy: (sort: SortOption) => {
    set({ sortBy: sort })
  },
  
  clearFilters: () => {
    set({ 
      searchQuery: '',
      selectedVTuber: '',
      sortBy: 'popular'
    })
  },
  
  fetchDrawHistory: async () => {
    set({ drawHistoryLoading: true, drawHistoryError: null })
    try {
      const response = await apiClient.get('/api/gacha/history')
      set({ 
        drawHistory: response.data.history || [],
        drawHistoryLoading: false,
        drawHistoryError: null,
        historyPagination: response.data.pagination,
        historyStatistics: response.data.statistics
      })
    } catch (_error) {
      console.error("Error:", _error)
      set({ 
        drawHistory: [],
        drawHistoryLoading: false,
        drawHistoryError: 'ガチャ履歴の取得に失敗しました'
      })
    }
  },
  
  setHistoryFilters: (filters: HistoryFilters) => {
    set({ historyFilters: filters })
  },
  
  clearHistoryFilters: () => {
    set({ 
      historyFilters: {
        vtuber: '',
        startDate: '',
        endDate: '',
        rarity: '',
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
}))