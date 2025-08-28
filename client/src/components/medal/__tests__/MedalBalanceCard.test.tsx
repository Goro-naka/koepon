import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MedalBalanceCard } from '../MedalBalanceCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMedalStore } from '@/stores/medal'

// Mock the medal store
jest.mock('@/stores/medal', () => ({
  useMedalStore: jest.fn(),
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

const mockMedalBalance = {
  id: 'balance-1',
  userId: 'user-1',
  totalMedals: 1500,
  availableMedals: 1200,
  usedMedals: 300,
  earnedMedals: 1500,
  lastUpdated: '2024-01-01T12:00:00Z',
}

describe('MedalBalanceCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // UC001: Medal Balance Display Tests
  describe('Medal Balance Display', () => {
    it('should display current medal balance correctly', () => {
      const mockStore = {
        medalBalance: mockMedalBalance,
        medalBalanceLoading: false,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('medal-balance-card')).toBeInTheDocument()
      expect(screen.getByText('1,200')).toBeInTheDocument()
      expect(screen.getByText(/利用可能メダル/i)).toBeInTheDocument()
    })

    it('should display total medals earned and used', () => {
      const mockStore = {
        medalBalance: mockMedalBalance,
        medalBalanceLoading: false,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      expect(screen.getByText('1,500')).toBeInTheDocument() // totalMedals
      expect(screen.getByText('300')).toBeInTheDocument()   // usedMedals
      expect(screen.getByText(/獲得メダル/i)).toBeInTheDocument()
      expect(screen.getByText(/使用メダル/i)).toBeInTheDocument()
    })

    it('should show loading skeleton during data fetch', () => {
      const mockStore = {
        medalBalance: null,
        medalBalanceLoading: true,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('medal-balance-loading')).toBeInTheDocument()
      expect(screen.queryByTestId('medal-balance-card')).not.toBeInTheDocument()
    })

    it('should display error state when balance fetch fails', () => {
      const mockStore = {
        medalBalance: null,
        medalBalanceLoading: false,
        medalBalanceError: 'メダル残高の取得に失敗しました',
        fetchMedalBalance: jest.fn(),
        retryFetchBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/メダル残高の取得に失敗しました/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument()
    })

    it('should handle retry button click in error state', async () => {
      const user = userEvent.setup()
      const mockStore = {
        medalBalance: null,
        medalBalanceLoading: false,
        medalBalanceError: 'ネットワークエラー',
        fetchMedalBalance: jest.fn(),
        retryFetchBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      const retryButton = screen.getByRole('button', { name: /再試行/i })
      await user.click(retryButton)
      
      expect(mockStore.retryFetchBalance).toHaveBeenCalledTimes(1)
    })

    it('should format medal numbers with proper locale formatting', () => {
      const largeBalanceMock = {
        ...mockMedalBalance,
        totalMedals: 1234567,
        availableMedals: 987654,
        usedMedals: 246913,
      }

      const mockStore = {
        medalBalance: largeBalanceMock,
        medalBalanceLoading: false,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      expect(screen.getByText('987,654')).toBeInTheDocument()
      expect(screen.getByText('1,234,567')).toBeInTheDocument()
      expect(screen.getByText('246,913')).toBeInTheDocument()
    })

    it('should show medal balance trend indicator when provided', () => {
      const mockStore = {
        medalBalance: {
          ...mockMedalBalance,
          dailyChange: 150,
          weeklyChange: -200
        },
        medalBalanceLoading: false,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('daily-trend-positive')).toBeInTheDocument()
      expect(screen.getByText('+150')).toBeInTheDocument()
    })

    it('should display last updated timestamp', () => {
      const mockStore = {
        medalBalance: mockMedalBalance,
        medalBalanceLoading: false,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/最終更新/i)).toBeInTheDocument()
    })

    it('should handle refresh balance action', async () => {
      const user = userEvent.setup()
      const mockStore = {
        medalBalance: mockMedalBalance,
        medalBalanceLoading: false,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      const refreshButton = screen.getByRole('button', { name: /更新/i })
      await user.click(refreshButton)
      
      expect(mockStore.fetchMedalBalance).toHaveBeenCalledTimes(1)
    })

    it('should show balance warning when low on medals', () => {
      const lowBalanceMock = {
        ...mockMedalBalance,
        availableMedals: 50,
      }

      const mockStore = {
        medalBalance: lowBalanceMock,
        medalBalanceLoading: false,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('low-balance-warning')).toBeInTheDocument()
      expect(screen.getByText(/メダル残高が少なくなっています/i)).toBeInTheDocument()
    })

    it('should not show warning when balance is sufficient', () => {
      const mockStore = {
        medalBalance: mockMedalBalance,
        medalBalanceLoading: false,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      expect(screen.queryByTestId('low-balance-warning')).not.toBeInTheDocument()
    })

    it('should display proper accessibility attributes', () => {
      const mockStore = {
        medalBalance: mockMedalBalance,
        medalBalanceLoading: false,
        medalBalanceError: null,
        fetchMedalBalance: jest.fn(),
        checkSufficientBalance: jest.fn(),
      }
      
      jest.mocked(useMedalStore).mockReturnValue(mockStore)
      
      render(<MedalBalanceCard />, { wrapper: createWrapper() })
      
      const balanceCard = screen.getByTestId('medal-balance-card')
      expect(balanceCard).toHaveAttribute('role', 'region')
      expect(balanceCard).toHaveAttribute('aria-label', 'メダル残高情報')
    })
  })
})