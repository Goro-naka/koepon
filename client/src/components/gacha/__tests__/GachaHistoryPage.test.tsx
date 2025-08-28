import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GachaHistoryPage } from '../GachaHistoryPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useGachaStore } from '@/stores/gacha'

// Mock the gacha store
jest.mock('@/stores/gacha', () => ({
  useGachaStore: jest.fn(),
}))

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const mockDrawHistory = [
  {
    id: 'draw-1',
    gachaId: 'gacha-1',
    gachaName: 'サマーガチャ',
    vtuberName: '桜音ミク',
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
    timestamp: '2024-08-15T10:30:00Z',
  },
  {
    id: 'draw-2',
    gachaId: 'gacha-2',
    gachaName: '通常ガチャ',
    vtuberName: '花音リン',
    items: [
      {
        id: 'item-2',
        name: 'かわいいスタンプ',
        rarity: 'R',
        image: '/images/stamp.jpg',
        medalValue: 20,
      }
    ],
    totalMedals: 20,
    drawCount: 1,
    timestamp: '2024-08-14T15:45:00Z',
  },
  {
    id: 'draw-3',
    gachaId: 'gacha-1',
    gachaName: 'サマーガチャ',
    vtuberName: '桜音ミク',
    items: [
      // 10 items for 10-draw
      { id: 'item-3', name: 'ノーマルアイテム1', rarity: 'N', medalValue: 10 },
      { id: 'item-4', name: 'ノーマルアイテム2', rarity: 'N', medalValue: 10 },
      { id: 'item-5', name: 'レアアイテム', rarity: 'R', medalValue: 25 },
      // ... 7 more items
    ],
    totalMedals: 150,
    drawCount: 10,
    timestamp: '2024-08-13T20:15:00Z',
  },
]

const mockStatistics = {
  totalDrawCount: 12,
  totalMedalsEarned: 220,
  rareItemRate: 15.5, // 15.5%
  favoriteVTuber: '桜音ミク',
  totalSpent: 3300,
}

describe('GachaHistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // GH001: History Display tests
  describe('History Display', () => {
    it('should render gacha history list', async () => {
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('heading', { name: /抽選履歴/i })).toBeInTheDocument()
      expect(screen.getAllByTestId(/history-item-/)).toHaveLength(3)
    })

    it('should show history item details correctly', async () => {
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      // Check first history item details
      expect(screen.getByText('サマーガチャ')).toBeInTheDocument()
      expect(screen.getByText('桜音ミク')).toBeInTheDocument()
      expect(screen.getByText('2024/08/15 19:30')).toBeInTheDocument() // JST conversion
      expect(screen.getByText('50枚獲得')).toBeInTheDocument()
      expect(screen.getByText('サマーボイス')).toBeInTheDocument()
    })

    it('should paginate history for large datasets', async () => {
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyPagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 25,
          pageSize: 10,
        },
        setHistoryPage: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('pagination')).toBeInTheDocument()
      expect(screen.getByText(/1 \/ 3ページ/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /次のページ/i })).toBeInTheDocument()
    })
  })

  // GH002: Filtering tests
  describe('Filtering', () => {
    it('should filter history by VTuber', async () => {
      const user = userEvent.setup()
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      const vtuberFilter = screen.getByRole('combobox', { name: /VTuber選択/i })
      await user.click(vtuberFilter)
      await user.click(screen.getByText('桜音ミク'))
      
      expect(mockStore.setHistoryFilters).toHaveBeenCalledWith({
        vtuber: '桜音ミク',
        startDate: '',
        endDate: '',
        rarity: '',
      })
    })

    it('should filter history by date range', async () => {
      const user = userEvent.setup()
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      const startDateInput = screen.getByLabelText(/開始日/i)
      const endDateInput = screen.getByLabelText(/終了日/i)
      
      await user.type(startDateInput, '2024-08-01')
      await user.type(endDateInput, '2024-08-31')
      
      expect(mockStore.setHistoryFilters).toHaveBeenCalledWith({
        vtuber: '',
        startDate: '2024-08-01',
        endDate: '2024-08-31',
        rarity: '',
      })
    })

    it('should filter history by rarity', async () => {
      const user = userEvent.setup()
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      const rarityFilter = screen.getByRole('combobox', { name: /レアリティ選択/i })
      await user.click(rarityFilter)
      await user.click(screen.getByText('SR以上'))
      
      expect(mockStore.setHistoryFilters).toHaveBeenCalledWith({
        vtuber: '',
        startDate: '',
        endDate: '',
        rarity: 'SR',
      })
    })

    it('should clear all filters', async () => {
      const user = userEvent.setup()
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '桜音ミク',
          startDate: '2024-08-01',
          endDate: '2024-08-31',
          rarity: 'SR',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      const clearButton = screen.getByRole('button', { name: /フィルタークリア/i })
      await user.click(clearButton)
      
      expect(mockStore.clearHistoryFilters).toHaveBeenCalled()
    })
  })

  // GH003: Statistics tests
  describe('Statistics', () => {
    it('should display total draw count', async () => {
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyStatistics: mockStatistics,
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/総抽選回数/i)).toBeInTheDocument()
      expect(screen.getByText('12回')).toBeInTheDocument()
    })

    it('should show total medals earned', async () => {
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyStatistics: mockStatistics,
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/総獲得メダル数/i)).toBeInTheDocument()
      expect(screen.getByText('220枚')).toBeInTheDocument()
    })

    it('should calculate and display rare item rate', async () => {
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyStatistics: mockStatistics,
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/レア排出率/i)).toBeInTheDocument()
      expect(screen.getByText('15.5%')).toBeInTheDocument()
    })

    it('should show favorite VTuber', async () => {
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyStatistics: mockStatistics,
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/お気に入りVTuber/i)).toBeInTheDocument()
      expect(screen.getByText('桜音ミク')).toBeInTheDocument()
    })
  })

  // Additional features
  describe('Additional Features', () => {
    it('should provide quick access to same gacha', async () => {
      const user = userEvent.setup()
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      const quickAccessButton = screen.getAllByRole('button', { name: /もう一度引く/i })[0]
      await user.click(quickAccessButton)
      
      expect(mockPush).toHaveBeenCalledWith('/gacha/gacha-1')
    })

    it('should expand history item to show all items', async () => {
      const user = userEvent.setup()
      const mockStore = {
        drawHistory: mockDrawHistory,
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      // Click on 10-draw history item to expand
      const expandButton = screen.getByRole('button', { name: /詳細を見る/i })
      await user.click(expandButton)
      
      expect(screen.getByTestId('expanded-items')).toBeInTheDocument()
      expect(screen.getAllByTestId(/expanded-item-/)).toHaveLength(10)
    })
  })

  // Loading and Error states
  describe('Loading and Error States', () => {
    it('should show loading state during history fetch', async () => {
      const mockStore = {
        drawHistory: [],
        drawHistoryLoading: true,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('history-skeleton')).toBeInTheDocument()
    })

    it('should show empty state when no history available', async () => {
      const mockStore = {
        drawHistory: [],
        drawHistoryLoading: false,
        drawHistoryError: null,
        fetchDrawHistory: jest.fn(),
        historyFilters: {
          vtuber: '',
          startDate: '',
          endDate: '',
          rarity: '',
        },
        setHistoryFilters: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/抽選履歴がありません/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ガチャを引いてみる/i })).toBeInTheDocument()
    })
  })
})