import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExchangeHistoryPage } from '../ExchangeHistoryPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useExchangeStore } from '@/stores/exchange'

// Mock the exchange store
jest.mock('@/stores/exchange', () => ({
  useExchangeStore: jest.fn(),
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

const mockExchangeHistory = [
  {
    id: 'history-1',
    userId: 'user-1',
    itemId: 'item-1',
    itemName: '限定ボイス集',
    itemImage: '/images/voice-collection.jpg',
    cost: 500,
    quantity: 1,
    timestamp: '2024-01-01T10:00:00Z',
    status: 'completed' as const,
    vtuberName: '桜音ミク',
  },
  {
    id: 'history-2',
    userId: 'user-1',
    itemId: 'item-2',
    itemName: 'デジタル壁紙セット',
    itemImage: '/images/wallpaper-set.jpg',
    cost: 200,
    quantity: 2,
    timestamp: '2024-01-02T14:00:00Z',
    status: 'completed' as const,
    vtuberName: '花音リン',
  },
]

const mockHistoryStatistics = {
  totalExchanges: 15,
  totalMedalsUsed: 7500,
  favoriteCategory: 'voice',
  favoriteVTuber: '桜音ミク',
  averageCostPerExchange: 500
}

describe('ExchangeHistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // UC004: Exchange History Page Tests
  describe('Basic Rendering', () => {
    it('should render exchange history page with header', () => {
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('heading', { name: /交換履歴/i })).toBeInTheDocument()
    })

    it('should render statistics summary section', () => {
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText('15回')).toBeInTheDocument() // totalExchanges
      expect(screen.getByText('7,500メダル')).toBeInTheDocument() // totalMedalsUsed
      expect(screen.getByText('桜音ミク')).toBeInTheDocument() // favoriteVTuber
    })

    it('should render history filter controls', () => {
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('combobox', { name: /VTuber選択/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /カテゴリ選択/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /ステータス選択/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/開始日/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/終了日/i)).toBeInTheDocument()
    })

    it('should render history items list', () => {
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('exchange-history-list')).toBeInTheDocument()
      expect(screen.getAllByTestId(/history-item-/)).toHaveLength(2)
    })
  })

  describe('Data Loading', () => {
    it('should show loading skeleton during data fetch', () => {
      const mockStore = {
        exchangeHistory: [],
        exchangeHistoryLoading: true,
        exchangeHistoryError: null,
        exchangeStatistics: null,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: null,
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('exchange-history-loading')).toBeInTheDocument()
      expect(screen.queryByTestId('exchange-history-list')).not.toBeInTheDocument()
    })

    it('should display history items after successful load', () => {
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('exchange-history-list')).toBeInTheDocument()
      expect(screen.getByText('限定ボイス集')).toBeInTheDocument()
      expect(screen.getByText('デジタル壁紙セット')).toBeInTheDocument()
    })

    it('should show error state when API fails', () => {
      const mockStore = {
        exchangeHistory: [],
        exchangeHistoryLoading: false,
        exchangeHistoryError: '履歴の取得に失敗しました',
        exchangeStatistics: null,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: null,
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/履歴の取得に失敗しました/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument()
    })

    it('should show empty state when no history available', () => {
      const mockStore = {
        exchangeHistory: [],
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: { totalExchanges: 0, totalMedalsUsed: 0, favoriteCategory: '', favoriteVTuber: '', averageCostPerExchange: 0 },
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 0 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/まだ交換履歴がありません/i)).toBeInTheDocument()
      expect(screen.getByTestId('exchange-history-empty-state')).toBeInTheDocument()
    })
  })

  describe('Filter and Search', () => {
    it('should filter history by VTuber', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      const vtuberSelect = screen.getByRole('combobox', { name: /VTuber選択/i })
      await user.click(vtuberSelect)
      await user.click(screen.getByText('桜音ミク'))
      
      expect(mockStore.setHistoryFilters).toHaveBeenCalledWith({ vtuber: '桜音ミク' })
    })

    it('should filter history by category', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      const categorySelect = screen.getByRole('combobox', { name: /カテゴリ選択/i })
      await user.click(categorySelect)
      await user.click(screen.getByText('ボイス'))
      
      expect(mockStore.setHistoryFilters).toHaveBeenCalledWith({ category: 'voice' })
    })

    it('should filter history by date range', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      const startDateInput = screen.getByLabelText(/開始日/i)
      const endDateInput = screen.getByLabelText(/終了日/i)
      
      await user.type(startDateInput, '2024-01-01')
      await user.type(endDateInput, '2024-01-31')
      
      expect(mockStore.setHistoryFilters).toHaveBeenCalledWith({ startDate: '2024-01-01' })
      expect(mockStore.setHistoryFilters).toHaveBeenCalledWith({ endDate: '2024-01-31' })
    })

    it('should clear all history filters', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '桜音ミク', category: 'voice', startDate: '2024-01-01', endDate: '2024-01-31', status: 'completed' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      const clearButton = screen.getByRole('button', { name: /フィルタークリア/i })
      await user.click(clearButton)
      
      expect(mockStore.clearHistoryFilters).toHaveBeenCalled()
    })
  })

  describe('History Items Display', () => {
    it('should display history item information correctly', () => {
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText('限定ボイス集')).toBeInTheDocument()
      expect(screen.getByText('500メダル')).toBeInTheDocument()
      expect(screen.getByText('1個')).toBeInTheDocument()
      expect(screen.getByText('桜音ミク')).toBeInTheDocument()
    })

    it('should show correct status badges', () => {
      const historyWithDifferentStatuses = [
        { ...mockExchangeHistory[0], status: 'completed' as const },
        { ...mockExchangeHistory[1], status: 'pending' as const, id: 'history-3' },
        { ...mockExchangeHistory[0], status: 'failed' as const, id: 'history-4' },
      ]

      const mockStore = {
        exchangeHistory: historyWithDifferentStatuses,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 3 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/完了/i)).toBeInTheDocument()
      expect(screen.getByText(/処理中/i)).toBeInTheDocument()
      expect(screen.getByText(/失敗/i)).toBeInTheDocument()
    })

    it('should format timestamps correctly', () => {
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 1, totalCount: 2 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      // Check if Japanese date format is used
      expect(screen.getByText(/2024年1月1日/)).toBeInTheDocument()
      expect(screen.getByText(/2024年1月2日/)).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should handle pagination navigation', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 1, totalPages: 3, totalCount: 30 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      const nextPageButton = screen.getByRole('button', { name: /次のページ/i })
      await user.click(nextPageButton)
      
      expect(mockStore.setHistoryPage).toHaveBeenCalledWith(2)
    })

    it('should show pagination info', () => {
      const mockStore = {
        exchangeHistory: mockExchangeHistory,
        exchangeHistoryLoading: false,
        exchangeHistoryError: null,
        exchangeStatistics: mockHistoryStatistics,
        historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
        historyPagination: { currentPage: 2, totalPages: 5, totalCount: 50 },
        fetchExchangeHistory: jest.fn(),
        setHistoryFilters: jest.fn(),
        setHistoryPage: jest.fn(),
        clearHistoryFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeHistoryPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/2 \/ 5ページ/)).toBeInTheDocument()
      expect(screen.getByText(/全50件中/)).toBeInTheDocument()
    })
  })
})