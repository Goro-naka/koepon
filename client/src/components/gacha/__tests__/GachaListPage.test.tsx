import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GachaListPage } from '../GachaListPage'
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
  {
    id: 'gacha-2', 
    name: '通常ガチャ',
    vtuberName: '花音リン',
    vtuberIcon: '/images/rin-icon.jpg',
    description: '毎日楽しめる基本ガチャ',
    singlePrice: 100,
    tenDrawPrice: 900,
    isLimitedTime: false,
    endDate: null,
    popularityRank: 5,
    participantCount: 800,
  },
]

describe('GachaListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // GL001: Basic Rendering tests
  describe('Basic Rendering', () => {
    it('should render gacha list page with header', async () => {
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('heading', { name: /ガチャ一覧/i })).toBeInTheDocument()
    })

    it('should render search and filter controls', async () => {
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByPlaceholderText(/ガチャを検索/i)).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /VTuber選択/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /並び順/i })).toBeInTheDocument()
    })

    it('should render gacha cards in grid layout', async () => {
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('gacha-grid')).toBeInTheDocument()
      expect(screen.getAllByTestId(/gacha-card-/)).toHaveLength(2)
    })
  })

  // GL002: Data Loading tests  
  describe('Data Loading', () => {
    it('should show loading skeleton during data fetch', async () => {
      const mockStore = {
        gachaList: [],
        gachaListLoading: true,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('gacha-grid')).not.toBeInTheDocument()
    })

    it('should display gacha list after successful load', async () => {
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('gacha-grid')).toBeInTheDocument()
      expect(screen.getByText('サマーガチャ')).toBeInTheDocument()
      expect(screen.getByText('通常ガチャ')).toBeInTheDocument()
    })

    it('should show error state when API fails', async () => {
      const mockStore = {
        gachaList: [],
        gachaListLoading: false,
        gachaListError: 'ネットワークエラーが発生しました',
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/ネットワークエラーが発生しました/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument()
    })

    it('should show empty state when no gacha available', async () => {
      const mockStore = {
        gachaList: [],
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/ガチャが登録されていません/i)).toBeInTheDocument()
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
  })

  // GL003: Search and Filter tests
  describe('Search and Filter', () => {
    it('should filter gacha by VTuber selection', async () => {
      const user = userEvent.setup()
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      const vtuberSelect = screen.getByRole('combobox', { name: /VTuber選択/i })
      await user.click(vtuberSelect)
      await user.click(screen.getByText('桜音ミク'))
      
      expect(mockStore.setSelectedVTuber).toHaveBeenCalledWith('桜音ミク')
    })

    it('should search gacha by name', async () => {
      const user = userEvent.setup()
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      const searchInput = screen.getByPlaceholderText(/ガチャを検索/i)
      await user.type(searchInput, 'サマー')
      
      expect(mockStore.setSearchQuery).toHaveBeenCalledWith('サマー')
    })

    it('should sort gacha by price/popularity/latest', async () => {
      const user = userEvent.setup()
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      const sortSelect = screen.getByRole('combobox', { name: /並び順/i })
      await user.click(sortSelect)
      await user.click(screen.getByText('価格順'))
      
      expect(mockStore.setSortBy).toHaveBeenCalledWith('price')
    })

    it('should clear filters and show all gacha', async () => {
      const user = userEvent.setup()
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: 'サマー',
        selectedVTuber: '桜音ミク',
        sortBy: 'price',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
        clearFilters: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      const clearButton = screen.getByRole('button', { name: /フィルタークリア/i })
      await user.click(clearButton)
      
      expect(mockStore.clearFilters).toHaveBeenCalled()
    })
  })

  // GL004: Gacha Card Display tests
  describe('Gacha Card Display', () => {
    it('should display gacha card information correctly', async () => {
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText('サマーガチャ')).toBeInTheDocument()
      expect(screen.getByText('桜音ミク')).toBeInTheDocument()
      expect(screen.getByText('¥300')).toBeInTheDocument()
      expect(screen.getByText(/夏の特別ガチャ/i)).toBeInTheDocument()
    })

    it('should show limited-time badge for time-limited gacha', async () => {
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/期間限定/i)).toBeInTheDocument()
    })

    it('should navigate to detail page on card click', async () => {
      const user = userEvent.setup()
      const mockStore = {
        gachaList: mockGachaList,
        gachaListLoading: false,
        gachaListError: null,
        fetchGachaList: jest.fn(),
        searchQuery: '',
        selectedVTuber: '',
        sortBy: 'popular',
        setSearchQuery: jest.fn(),
        setSelectedVTuber: jest.fn(),
        setSortBy: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaListPage />, { wrapper: createWrapper() })
      
      const gachaCard = screen.getByTestId('gacha-card-gacha-1')
      await user.click(gachaCard)
      
      expect(mockPush).toHaveBeenCalledWith('/gacha/gacha-1')
    })
  })
})