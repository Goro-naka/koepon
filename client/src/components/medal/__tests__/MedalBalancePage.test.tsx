import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MedalBalancePage } from '../MedalBalancePage'
import { useMedalStore } from '@/stores/medal'
import type { MedalBalance } from '@/types/medal'

// Mock the medal store
jest.mock('@/stores/medal')
const mockUseMedalStore = useMedalStore as jest.MockedFunction<typeof useMedalStore>

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  }
}))

// Mock chart component
jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

const MockedProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

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
    },
    {
      vtuberId: 'vtuber-2', 
      vtuberName: 'テスト2号',
      vtuberImageUrl: 'https://example.com/test2.jpg',
      balance: 700,
      totalEarned: 800,
      totalUsed: 100,
    }
  ],
  lastUpdated: '2024-01-15T10:30:00.000Z'
}

describe('MedalBalancePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render balance information correctly', () => {
    mockUseMedalStore.mockReturnValue({
      medalBalance: mockMedalBalance,
      medalBalanceLoading: false,
      medalBalanceError: null,
      fetchMedalBalance: jest.fn(),
      retryFetchBalance: jest.fn(),
      transactionHistory: [],
      transactionHistoryLoading: false,
      transactionHistoryError: null,
      transactionFilters: { type: '', startDate: '', endDate: '', source: '' },
      fetchTransactionHistory: jest.fn(),
      setTransactionFilters: jest.fn(),
      clearTransactionFilters: jest.fn(),
      setMedalBalance: jest.fn(),
      checkSufficientBalance: jest.fn(),
    })

    render(
      <MockedProvider>
        <MedalBalancePage />
      </MockedProvider>
    )

    expect(screen.getByText('1,500メダル')).toBeInTheDocument()
    expect(screen.getByText('1,200メダル')).toBeInTheDocument()
    expect(screen.getByText('300メダル')).toBeInTheDocument()
    expect(screen.getByText('テスト1号')).toBeInTheDocument()
    expect(screen.getByText('テスト2号')).toBeInTheDocument()
    expect(screen.getByText('500メダル')).toBeInTheDocument()
    expect(screen.getByText('700メダル')).toBeInTheDocument()
  })

  it('should handle loading state', () => {
    mockUseMedalStore.mockReturnValue({
      medalBalance: null,
      medalBalanceLoading: true,
      medalBalanceError: null,
      fetchMedalBalance: jest.fn(),
      retryFetchBalance: jest.fn(),
      transactionHistory: [],
      transactionHistoryLoading: false,
      transactionHistoryError: null,
      transactionFilters: { type: '', startDate: '', endDate: '', source: '' },
      fetchTransactionHistory: jest.fn(),
      setTransactionFilters: jest.fn(),
      clearTransactionFilters: jest.fn(),
      setMedalBalance: jest.fn(),
      checkSufficientBalance: jest.fn(),
    })

    render(
      <MockedProvider>
        <MedalBalancePage />
      </MockedProvider>
    )

    expect(screen.getByTestId('medal-balance-skeleton')).toBeInTheDocument()
    expect(screen.queryByText('1,500メダル')).not.toBeInTheDocument()
  })

  it('should display error state with retry button', () => {
    const mockRetry = jest.fn()
    mockUseMedalStore.mockReturnValue({
      medalBalance: null,
      medalBalanceLoading: false,
      medalBalanceError: 'データ取得に失敗しました',
      fetchMedalBalance: jest.fn(),
      retryFetchBalance: mockRetry,
      transactionHistory: [],
      transactionHistoryLoading: false,
      transactionHistoryError: null,
      transactionFilters: { type: '', startDate: '', endDate: '', source: '' },
      fetchTransactionHistory: jest.fn(),
      setTransactionFilters: jest.fn(),
      clearTransactionFilters: jest.fn(),
      setMedalBalance: jest.fn(),
      checkSufficientBalance: jest.fn(),
    })

    render(
      <MockedProvider>
        <MedalBalancePage />
      </MockedProvider>
    )

    expect(screen.getByText('データ取得に失敗しました')).toBeInTheDocument()
    
    const retryButton = screen.getByText('再試行')
    fireEvent.click(retryButton)
    expect(mockRetry).toHaveBeenCalledTimes(1)
  })

  it('should show empty state for new users', () => {
    const emptyBalance: MedalBalance = {
      totalMedals: 0,
      availableMedals: 0,
      usedMedals: 0,
      vtuberBalances: [],
      lastUpdated: '2024-01-15T10:30:00.000Z'
    }

    mockUseMedalStore.mockReturnValue({
      medalBalance: emptyBalance,
      medalBalanceLoading: false,
      medalBalanceError: null,
      fetchMedalBalance: jest.fn(),
      retryFetchBalance: jest.fn(),
      transactionHistory: [],
      transactionHistoryLoading: false,
      transactionHistoryError: null,
      transactionFilters: { type: '', startDate: '', endDate: '', source: '' },
      fetchTransactionHistory: jest.fn(),
      setTransactionFilters: jest.fn(),
      clearTransactionFilters: jest.fn(),
      setMedalBalance: jest.fn(),
      checkSufficientBalance: jest.fn(),
    })

    render(
      <MockedProvider>
        <MedalBalancePage />
      </MockedProvider>
    )

    expect(screen.getByText('メダルを獲得してみましょう！')).toBeInTheDocument()
    expect(screen.getByText('ガチャを回す')).toBeInTheDocument()
  })

  it('should display medal distribution chart', () => {
    mockUseMedalStore.mockReturnValue({
      medalBalance: mockMedalBalance,
      medalBalanceLoading: false,
      medalBalanceError: null,
      fetchMedalBalance: jest.fn(),
      retryFetchBalance: jest.fn(),
      transactionHistory: [],
      transactionHistoryLoading: false,
      transactionHistoryError: null,
      transactionFilters: { type: '', startDate: '', endDate: '', source: '' },
      fetchTransactionHistory: jest.fn(),
      setTransactionFilters: jest.fn(),
      clearTransactionFilters: jest.fn(),
      setMedalBalance: jest.fn(),
      checkSufficientBalance: jest.fn(),
    })

    render(
      <MockedProvider>
        <MedalBalancePage />
      </MockedProvider>
    )

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('should show VTuber balance details on expansion', async () => {
    mockUseMedalStore.mockReturnValue({
      medalBalance: mockMedalBalance,
      medalBalanceLoading: false,
      medalBalanceError: null,
      fetchMedalBalance: jest.fn(),
      retryFetchBalance: jest.fn(),
      transactionHistory: [],
      transactionHistoryLoading: false,
      transactionHistoryError: null,
      transactionFilters: { type: '', startDate: '', endDate: '', source: '' },
      fetchTransactionHistory: jest.fn(),
      setTransactionFilters: jest.fn(),
      clearTransactionFilters: jest.fn(),
      setMedalBalance: jest.fn(),
      checkSufficientBalance: jest.fn(),
    })

    render(
      <MockedProvider>
        <MedalBalancePage />
      </MockedProvider>
    )

    const expandButton = screen.getByLabelText('テスト1号の詳細を表示')
    fireEvent.click(expandButton)

    await waitFor(() => {
      expect(screen.getAllByText('獲得総数: 600メダル')[0]).toBeInTheDocument()
      expect(screen.getAllByText('使用総数: 100メダル')[0]).toBeInTheDocument()
    })
  })

  it('should handle chart data rendering with multiple VTubers', () => {
    mockUseMedalStore.mockReturnValue({
      medalBalance: mockMedalBalance,
      medalBalanceLoading: false,
      medalBalanceError: null,
      fetchMedalBalance: jest.fn(),
      retryFetchBalance: jest.fn(),
      transactionHistory: [],
      transactionHistoryLoading: false,
      transactionHistoryError: null,
      transactionFilters: { type: '', startDate: '', endDate: '', source: '' },
      fetchTransactionHistory: jest.fn(),
      setTransactionFilters: jest.fn(),
      clearTransactionFilters: jest.fn(),
      setMedalBalance: jest.fn(),
      checkSufficientBalance: jest.fn(),
    })

    render(
      <MockedProvider>
        <MedalBalancePage />
      </MockedProvider>
    )

    // Chart should render with multiple data points
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
    expect(screen.getAllByTestId('cell')).toHaveLength(2)
  })
})