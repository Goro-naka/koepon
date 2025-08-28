import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GachaDetailPage } from '../GachaDetailPage'
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
  useParams: () => ({
    id: 'gacha-1',
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

const mockGachaDetail = {
  id: 'gacha-1',
  name: 'サマーガチャ',
  vtuberName: '桜音ミク',
  vtuberIcon: '/images/miku-icon.jpg',
  description: '夏の特別ガチャ！レアアイテムが当たるチャンス！\n期間限定の特別な景品を手に入れよう。',
  singlePrice: 300,
  tenDrawPrice: 2700,
  isLimitedTime: true,
  startDate: '2024-08-01T00:00:00Z',
  endDate: '2024-08-31T23:59:59Z',
  remainingCount: 50,
  probabilityRates: [
    { rarity: 'N', rate: 70, color: '#CCCCCC' },
    { rarity: 'R', rate: 20, color: '#4CAF50' },
    { rarity: 'SR', rate: 8, color: '#2196F3' },
    { rarity: 'SSR', rate: 2, color: '#FF9800' },
  ],
  availableRewards: [
    { 
      id: 'reward-1', 
      name: 'サマーボイス', 
      rarity: 'SR', 
      image: '/images/voice.jpg',
      description: '特別な夏のボイスメッセージ',
    },
    { 
      id: 'reward-2', 
      name: '限定スタンプ', 
      rarity: 'R', 
      image: '/images/stamp.jpg',
      description: '夏限定のかわいいスタンプ',
    },
  ],
}

describe('GachaDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // GD001: Detail Display tests
  describe('Detail Display', () => {
    it('should render gacha detail information', async () => {
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('heading', { name: /サマーガチャ/i })).toBeInTheDocument()
      expect(screen.getByText(/夏の特別ガチャ/i)).toBeInTheDocument()
      expect(screen.getByText('桜音ミク')).toBeInTheDocument()
      expect(screen.getByAltText(/桜音ミクのアイコン/i)).toBeInTheDocument()
    })

    it('should display pricing options (single/10-draw)', async () => {
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/単発ガチャ/i)).toBeInTheDocument()
      expect(screen.getByText(/¥300/)).toBeInTheDocument()
      expect(screen.getByText(/10連ガチャ/i)).toBeInTheDocument()
      expect(screen.getByText(/¥2,700/)).toBeInTheDocument()
      expect(screen.getByText(/10% OFF/i)).toBeInTheDocument()
    })

    it('should show probability rates table', async () => {
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('table', { name: /排出率/i })).toBeInTheDocument()
      expect(screen.getByText(/70%/)).toBeInTheDocument()
      expect(screen.getByText(/20%/)).toBeInTheDocument()
      expect(screen.getByText(/8%/)).toBeInTheDocument()
      expect(screen.getByText(/2%/)).toBeInTheDocument()
    })

    it('should display available rewards preview', async () => {
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/景品一覧/i)).toBeInTheDocument()
      expect(screen.getByText('サマーボイス')).toBeInTheDocument()
      expect(screen.getByText('限定スタンプ')).toBeInTheDocument()
      expect(screen.getByText(/特別な夏のボイスメッセージ/i)).toBeInTheDocument()
    })
  })

  // GD002: Purchase Options tests
  describe('Purchase Options', () => {
    it('should enable single draw button with correct price', async () => {
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
        userBalance: 500,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      const singleDrawButton = screen.getByRole('button', { name: /単発ガチャを引く/i })
      expect(singleDrawButton).toBeEnabled()
      expect(singleDrawButton).toHaveTextContent(/¥300/)
    })

    it('should enable 10-draw button with discount price', async () => {
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
        userBalance: 3000,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      const tenDrawButton = screen.getByRole('button', { name: /10連ガチャを引く/i })
      expect(tenDrawButton).toBeEnabled()
      expect(tenDrawButton).toHaveTextContent(/¥2,700/)
    })

    it('should show confirmation modal on purchase button click', async () => {
      const user = userEvent.setup()
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
        userBalance: 500,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      const singleDrawButton = screen.getByRole('button', { name: /単発ガチャを引く/i })
      await user.click(singleDrawButton)
      
      expect(screen.getByRole('dialog', { name: /確認/i })).toBeInTheDocument()
      expect(screen.getByText(/¥300でガチャを引きますか？/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /実行/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /キャンセル/i })).toBeInTheDocument()
    })

    it('should disable purchase when user has insufficient funds', async () => {
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
        userBalance: 100, // Insufficient balance
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      const singleDrawButton = screen.getByRole('button', { name: /単発ガチャを引く/i })
      expect(singleDrawButton).toBeDisabled()
      expect(screen.getByText(/残高不足/i)).toBeInTheDocument()
    })
  })

  // GD003: Period and Limits tests
  describe('Period and Limits', () => {
    it('should show campaign period for limited-time gacha', async () => {
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/期間限定/i)).toBeInTheDocument()
      expect(screen.getByText(/2024年8月1日/i)).toBeInTheDocument()
      expect(screen.getByText(/2024年8月31日/i)).toBeInTheDocument()
    })

    it('should display remaining draw count for limited gacha', async () => {
      const mockStore = {
        selectedGacha: mockGachaDetail,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/残り回数/i)).toBeInTheDocument()
      expect(screen.getByText(/50回/i)).toBeInTheDocument()
    })

    it('should show expired state for ended gacha', async () => {
      const expiredGacha = {
        ...mockGachaDetail,
        endDate: '2023-08-31T23:59:59Z', // Past date
        isExpired: true,
      }
      
      const mockStore = {
        selectedGacha: expiredGacha,
        selectedGachaLoading: false,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/終了済み/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /単発ガチャを引く/i })).toBeDisabled()
    })
  })

  // Loading and Error states
  describe('Loading and Error States', () => {
    it('should show loading state during gacha detail fetch', async () => {
      const mockStore = {
        selectedGacha: null,
        selectedGachaLoading: true,
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('gacha-detail-skeleton')).toBeInTheDocument()
    })

    it('should show error state when gacha not found', async () => {
      const mockStore = {
        selectedGacha: null,
        selectedGachaLoading: false,
        selectedGachaError: 'ガチャが見つかりません',
        fetchGachaDetail: jest.fn(),
        executeDraw: jest.fn(),
        drawState: 'idle' as const,
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDetailPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/ガチャが見つかりません/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /一覧に戻る/i })).toBeInTheDocument()
    })
  })
})