import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExchangeListPage } from '../ExchangeListPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useExchangeStore } from '@/stores/exchange'

// Mock the exchange store
jest.mock('@/stores/exchange', () => ({
  useExchangeStore: jest.fn(),
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

const mockExchangeItems = [
  {
    id: 'item-1',
    name: '限定ボイス集',
    description: '桜音ミクの限定ボイス10セット',
    category: 'voice' as const,
    cost: 500,
    image: '/images/voice-collection.jpg',
    isAvailable: true,
    stock: 100,
    limitPerUser: 3,
    vtuberName: '桜音ミク',
    vtuberIcon: '/images/miku-icon.jpg',
  },
  {
    id: 'item-2',
    name: 'デジタル壁紙セット',
    description: '高解像度壁紙5枚セット',
    category: 'goods' as const,
    cost: 200,
    image: '/images/wallpaper-set.jpg',
    isAvailable: true,
    stock: null,
    limitPerUser: null,
    vtuberName: '花音リン',
    vtuberIcon: '/images/rin-icon.jpg',
  },
]

describe('ExchangeListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // UC002: Exchange List Page Tests
  describe('Basic Rendering', () => {
    it('should render exchange list page with header', () => {
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('heading', { name: /交換所/i })).toBeInTheDocument()
    })

    it('should render search and filter controls', () => {
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByPlaceholderText(/アイテムを検索/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /カテゴリ選択/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /VTuber選択/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /並び順/i })).toBeInTheDocument()
    })

    it('should render exchange items in grid layout', () => {
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('exchange-items-grid')).toBeInTheDocument()
      expect(screen.getAllByTestId(/exchange-item-card-/)).toHaveLength(2)
    })
  })

  describe('Data Loading', () => {
    it('should show loading skeleton during data fetch', () => {
      const mockStore = {
        exchangeItems: [],
        exchangeItemsLoading: true,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('exchange-items-loading')).toBeInTheDocument()
      expect(screen.queryByTestId('exchange-items-grid')).not.toBeInTheDocument()
    })

    it('should display exchange items after successful load', () => {
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('exchange-items-grid')).toBeInTheDocument()
      expect(screen.getByText('限定ボイス集')).toBeInTheDocument()
      expect(screen.getByText('デジタル壁紙セット')).toBeInTheDocument()
    })

    it('should show error state when API fails', () => {
      const mockStore = {
        exchangeItems: [],
        exchangeItemsLoading: false,
        exchangeItemsError: 'アイテムの取得に失敗しました',
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/アイテムの取得に失敗しました/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument()
    })

    it('should show empty state when no items available', () => {
      const mockStore = {
        exchangeItems: [],
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/交換可能なアイテムがありません/i)).toBeInTheDocument()
      expect(screen.getByTestId('exchange-items-empty-state')).toBeInTheDocument()
    })
  })

  describe('Search and Filter', () => {
    it('should search exchange items by name', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      const searchInput = screen.getByPlaceholderText(/アイテムを検索/i)
      await user.type(searchInput, 'ボイス')
      
      expect(mockStore.setSearchQuery).toHaveBeenCalledWith('ボイス')
    })

    it('should filter exchange items by category', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      const categorySelect = screen.getByRole('combobox', { name: /カテゴリ選択/i })
      await user.click(categorySelect)
      await user.click(screen.getByText('ボイス'))
      
      expect(mockStore.setItemFilters).toHaveBeenCalledWith({ category: 'voice' })
    })

    it('should filter exchange items by VTuber', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      const vtuberSelect = screen.getByRole('combobox', { name: /VTuber選択/i })
      await user.click(vtuberSelect)
      await user.click(screen.getByText('桜音ミク'))
      
      expect(mockStore.setItemFilters).toHaveBeenCalledWith({ vtuber: '桜音ミク' })
    })

    it('should sort exchange items by cost/name/newest', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      const sortSelect = screen.getByRole('combobox', { name: /並び順/i })
      await user.click(sortSelect)
      await user.click(screen.getByText('価格順'))
      
      expect(mockStore.setSortBy).toHaveBeenCalledWith('cost')
    })

    it('should clear all filters', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: 'ボイス',
        itemFilters: { category: 'voice', vtuber: '桜音ミク', minCost: null, maxCost: null },
        sortBy: 'cost',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      const clearButton = screen.getByRole('button', { name: /フィルタークリア/i })
      await user.click(clearButton)
      
      expect(mockStore.clearItemFilters).toHaveBeenCalled()
    })
  })

  describe('Exchange Item Cards', () => {
    it('should display item information correctly', () => {
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText('限定ボイス集')).toBeInTheDocument()
      expect(screen.getByText('500メダル')).toBeInTheDocument()
      expect(screen.getByText('桜音ミク')).toBeInTheDocument()
      expect(screen.getByText(/桜音ミクの限定ボイス10セット/i)).toBeInTheDocument()
    })

    it('should show out of stock badge for unavailable items', () => {
      const outOfStockItems = [
        {
          ...mockExchangeItems[0],
          isAvailable: false,
          stock: 0,
        }
      ]

      const mockStore = {
        exchangeItems: outOfStockItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/在庫切れ/i)).toBeInTheDocument()
    })

    it('should show limited stock indicator', () => {
      const limitedItems = [
        {
          ...mockExchangeItems[0],
          stock: 5,
        }
      ]

      const mockStore = {
        exchangeItems: limitedItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/残り5個/i)).toBeInTheDocument()
    })

    it('should navigate to item detail page on card click', async () => {
      const user = userEvent.setup()
      const mockStore = {
        exchangeItems: mockExchangeItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      const itemCard = screen.getByTestId('exchange-item-card-item-1')
      await user.click(itemCard)
      
      expect(mockPush).toHaveBeenCalledWith('/exchange/item-1')
    })

    it('should disable item card when out of stock', () => {
      const outOfStockItems = [
        {
          ...mockExchangeItems[0],
          isAvailable: false,
          stock: 0,
        }
      ]

      const mockStore = {
        exchangeItems: outOfStockItems,
        exchangeItemsLoading: false,
        exchangeItemsError: null,
        fetchExchangeItems: jest.fn(),
        searchQuery: '',
        itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
        sortBy: 'newest',
        setSearchQuery: jest.fn(),
        setItemFilters: jest.fn(),
        setSortBy: jest.fn(),
        clearItemFilters: jest.fn(),
      }
      
      jest.mocked(useExchangeStore).mockReturnValue(mockStore)
      
      render(<ExchangeListPage />, { wrapper: createWrapper() })
      
      const itemCard = screen.getByTestId('exchange-item-card-item-1')
      expect(itemCard).toHaveClass('opacity-50', 'cursor-not-allowed')
    })
  })
})