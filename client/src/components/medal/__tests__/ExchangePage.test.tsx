import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ExchangePage } from '../ExchangePage'
import { useExchangeStore } from '@/stores/exchange'
import { useMedalStore } from '@/stores/medal'
import type { ExchangeItem, MedalBalance } from '@/types/medal'

// Mock the stores
jest.mock('@/stores/exchange')
jest.mock('@/stores/medal')
const mockUseExchangeStore = useExchangeStore as jest.MockedFunction<typeof useExchangeStore>
const mockUseMedalStore = useMedalStore as jest.MockedFunction<typeof useMedalStore>

// Mock API client
jest.mock('@/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  }
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

const mockMedalBalance: MedalBalance = {
  totalMedals: 1500,
  availableMedals: 1200,
  usedMedals: 300,
  vtuberBalances: [],
  lastUpdated: '2024-01-15T10:30:00.000Z'
}

describe('ExchangePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default exchange store mock
    mockUseExchangeStore.mockReturnValue({
      exchangeItems: mockExchangeItems,
      exchangeItemsLoading: false,
      exchangeItemsError: null,
      selectedExchangeItem: null,
      selectedItemLoading: false,
      exchangeState: 'idle',
      exchangeResult: null,
      exchangeError: null,
      exchangeHistory: [],
      exchangeHistoryLoading: false,
      exchangeHistoryError: null,
      exchangeStatistics: null,
      searchQuery: '',
      itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
      sortBy: 'newest',
      historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
      fetchExchangeItems: jest.fn(),
      fetchExchangeItemDetail: jest.fn(),
      setExchangeItems: jest.fn(),
      executeExchange: jest.fn(),
      clearExchangeResult: jest.fn(),
      setExchangeResult: jest.fn(),
      validateExchangeRequirements: jest.fn(),
      setSearchQuery: jest.fn(),
      setItemFilters: jest.fn(),
      setSortBy: jest.fn(),
      clearItemFilters: jest.fn(),
      fetchExchangeHistory: jest.fn(),
      setHistoryFilters: jest.fn(),
      clearHistoryFilters: jest.fn(),
      setHistoryPage: jest.fn(),
      setExchangeStatistics: jest.fn(),
    })

    // Default medal store mock
    mockUseMedalStore.mockReturnValue({
      medalBalance: mockMedalBalance,
      medalBalanceLoading: false,
      medalBalanceError: null,
      transactionHistory: [],
      transactionHistoryLoading: false,
      transactionHistoryError: null,
      transactionFilters: { type: '', startDate: '', endDate: '', source: '' },
      fetchMedalBalance: jest.fn(),
      setMedalBalance: jest.fn(),
      checkSufficientBalance: jest.fn(() => true),
      retryFetchBalance: jest.fn(),
      fetchTransactionHistory: jest.fn(),
      setTransactionFilters: jest.fn(),
      clearTransactionFilters: jest.fn(),
    })
  })

  it('should render exchange items list', () => {
    render(
      <MockedProvider>
        <ExchangePage />
      </MockedProvider>
    )

    expect(screen.getByText('テストボイス1')).toBeInTheDocument()
    expect(screen.getByText('テストグッズ1')).toBeInTheDocument()
    expect(screen.getByText('100メダル')).toBeInTheDocument()
    expect(screen.getByText('200メダル')).toBeInTheDocument()
    expect(screen.getByText('在庫: 50')).toBeInTheDocument()
    expect(screen.getByText('在庫: 制限なし')).toBeInTheDocument()
  })

  it('should filter items by category', () => {
    const mockSetItemFilters = jest.fn()
    mockUseExchangeStore.mockReturnValue({
      exchangeItems: [mockExchangeItems[0]], // Only voice item
      exchangeItemsLoading: false,
      exchangeItemsError: null,
      selectedExchangeItem: null,
      selectedItemLoading: false,
      exchangeState: 'idle',
      exchangeResult: null,
      exchangeError: null,
      exchangeHistory: [],
      exchangeHistoryLoading: false,
      exchangeHistoryError: null,
      exchangeStatistics: null,
      searchQuery: '',
      itemFilters: { category: 'voice', vtuber: '', minCost: null, maxCost: null },
      sortBy: 'newest',
      historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
      fetchExchangeItems: jest.fn(),
      fetchExchangeItemDetail: jest.fn(),
      setExchangeItems: jest.fn(),
      executeExchange: jest.fn(),
      clearExchangeResult: jest.fn(),
      setExchangeResult: jest.fn(),
      validateExchangeRequirements: jest.fn(),
      setSearchQuery: jest.fn(),
      setItemFilters: mockSetItemFilters,
      setSortBy: jest.fn(),
      clearItemFilters: jest.fn(),
      fetchExchangeHistory: jest.fn(),
      setHistoryFilters: jest.fn(),
      clearHistoryFilters: jest.fn(),
      setHistoryPage: jest.fn(),
      setExchangeStatistics: jest.fn(),
    })

    render(
      <MockedProvider>
        <ExchangePage />
      </MockedProvider>
    )

    const voiceFilter = screen.getByText('ボイス')
    fireEvent.click(voiceFilter)

    expect(mockSetItemFilters).toHaveBeenCalledWith({ category: 'voice' })
    expect(screen.getByText('テストボイス1')).toBeInTheDocument()
    expect(screen.queryByText('テストグッズ1')).not.toBeInTheDocument()
  })

  it('should handle exchange modal', async () => {
    render(
      <MockedProvider>
        <ExchangePage />
      </MockedProvider>
    )

    const exchangeButton = screen.getAllByText('交換する')[0]
    fireEvent.click(exchangeButton)

    await waitFor(() => {
      expect(screen.getByText('交換確認')).toBeInTheDocument()
      expect(screen.getByText('テストボイス1を交換しますか？')).toBeInTheDocument()
      expect(screen.getByText('必要メダル: 100メダル')).toBeInTheDocument()
      expect(screen.getByText('交換実行')).toBeInTheDocument()
      expect(screen.getByText('キャンセル')).toBeInTheDocument()
    })
  })

  it('should prevent exchange when insufficient balance', () => {
    const mockCheckSufficientBalance = jest.fn(() => false)
    mockUseMedalStore.mockReturnValue({
      medalBalance: { ...mockMedalBalance, availableMedals: 50 },
      medalBalanceLoading: false,
      medalBalanceError: null,
      transactionHistory: [],
      transactionHistoryLoading: false,
      transactionHistoryError: null,
      transactionFilters: { type: '', startDate: '', endDate: '', source: '' },
      fetchMedalBalance: jest.fn(),
      setMedalBalance: jest.fn(),
      checkSufficientBalance: mockCheckSufficientBalance,
      retryFetchBalance: jest.fn(),
      fetchTransactionHistory: jest.fn(),
      setTransactionFilters: jest.fn(),
      clearTransactionFilters: jest.fn(),
    })

    render(
      <MockedProvider>
        <ExchangePage />
      </MockedProvider>
    )

    const exchangeButton = screen.getAllByText('交換する')[0]
    expect(exchangeButton).toBeDisabled()
    expect(screen.getAllByText('メダル不足')[0]).toBeInTheDocument()
  })

  it('should handle search functionality', () => {
    const mockSetSearchQuery = jest.fn()
    mockUseExchangeStore.mockReturnValue({
      exchangeItems: mockExchangeItems,
      exchangeItemsLoading: false,
      exchangeItemsError: null,
      selectedExchangeItem: null,
      selectedItemLoading: false,
      exchangeState: 'idle',
      exchangeResult: null,
      exchangeError: null,
      exchangeHistory: [],
      exchangeHistoryLoading: false,
      exchangeHistoryError: null,
      exchangeStatistics: null,
      searchQuery: 'テストボイス',
      itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
      sortBy: 'newest',
      historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
      fetchExchangeItems: jest.fn(),
      fetchExchangeItemDetail: jest.fn(),
      setExchangeItems: jest.fn(),
      executeExchange: jest.fn(),
      clearExchangeResult: jest.fn(),
      setExchangeResult: jest.fn(),
      validateExchangeRequirements: jest.fn(),
      setSearchQuery: mockSetSearchQuery,
      setItemFilters: jest.fn(),
      setSortBy: jest.fn(),
      clearItemFilters: jest.fn(),
      fetchExchangeHistory: jest.fn(),
      setHistoryFilters: jest.fn(),
      clearHistoryFilters: jest.fn(),
      setHistoryPage: jest.fn(),
      setExchangeStatistics: jest.fn(),
    })

    render(
      <MockedProvider>
        <ExchangePage />
      </MockedProvider>
    )

    const searchInput = screen.getByPlaceholderText('アイテムを検索...')
    fireEvent.change(searchInput, { target: { value: 'テストボイス' } })

    expect(mockSetSearchQuery).toHaveBeenCalledWith('テストボイス')
  })

  it('should handle sort functionality', () => {
    const mockSetSortBy = jest.fn()
    mockUseExchangeStore.mockReturnValue({
      exchangeItems: mockExchangeItems,
      exchangeItemsLoading: false,
      exchangeItemsError: null,
      selectedExchangeItem: null,
      selectedItemLoading: false,
      exchangeState: 'idle',
      exchangeResult: null,
      exchangeError: null,
      exchangeHistory: [],
      exchangeHistoryLoading: false,
      exchangeHistoryError: null,
      exchangeStatistics: null,
      searchQuery: '',
      itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
      sortBy: 'cost',
      historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
      fetchExchangeItems: jest.fn(),
      fetchExchangeItemDetail: jest.fn(),
      setExchangeItems: jest.fn(),
      executeExchange: jest.fn(),
      clearExchangeResult: jest.fn(),
      setExchangeResult: jest.fn(),
      validateExchangeRequirements: jest.fn(),
      setSearchQuery: jest.fn(),
      setItemFilters: jest.fn(),
      setSortBy: mockSetSortBy,
      clearItemFilters: jest.fn(),
      fetchExchangeHistory: jest.fn(),
      setHistoryFilters: jest.fn(),
      clearHistoryFilters: jest.fn(),
      setHistoryPage: jest.fn(),
      setExchangeStatistics: jest.fn(),
    })

    render(
      <MockedProvider>
        <ExchangePage />
      </MockedProvider>
    )

    const sortSelect = screen.getByDisplayValue('価格順')
    fireEvent.change(sortSelect, { target: { value: 'cost' } })

    expect(mockSetSortBy).toHaveBeenCalledWith('cost')
  })

  it('should execute exchange successfully', async () => {
    const mockExecuteExchange = jest.fn()
    mockUseExchangeStore.mockReturnValue({
      exchangeItems: mockExchangeItems,
      exchangeItemsLoading: false,
      exchangeItemsError: null,
      selectedExchangeItem: null,
      selectedItemLoading: false,
      exchangeState: 'idle',
      exchangeResult: null,
      exchangeError: null,
      exchangeHistory: [],
      exchangeHistoryLoading: false,
      exchangeHistoryError: null,
      exchangeStatistics: null,
      searchQuery: '',
      itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
      sortBy: 'newest',
      historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
      fetchExchangeItems: jest.fn(),
      fetchExchangeItemDetail: jest.fn(),
      setExchangeItems: jest.fn(),
      executeExchange: mockExecuteExchange,
      clearExchangeResult: jest.fn(),
      setExchangeResult: jest.fn(),
      validateExchangeRequirements: jest.fn(() => ({ isValid: true, errors: [] })),
      setSearchQuery: jest.fn(),
      setItemFilters: jest.fn(),
      setSortBy: jest.fn(),
      clearItemFilters: jest.fn(),
      fetchExchangeHistory: jest.fn(),
      setHistoryFilters: jest.fn(),
      clearHistoryFilters: jest.fn(),
      setHistoryPage: jest.fn(),
      setExchangeStatistics: jest.fn(),
    })

    render(
      <MockedProvider>
        <ExchangePage />
      </MockedProvider>
    )

    const exchangeButton = screen.getAllByText('交換する')[0]
    fireEvent.click(exchangeButton)

    await waitFor(() => {
      const confirmButton = screen.getByText('交換実行')
      fireEvent.click(confirmButton)
    })

    expect(mockExecuteExchange).toHaveBeenCalledWith('item-1', 1)
  })

  it('should show loading state', () => {
    mockUseExchangeStore.mockReturnValue({
      exchangeItems: [],
      exchangeItemsLoading: true,
      exchangeItemsError: null,
      selectedExchangeItem: null,
      selectedItemLoading: false,
      exchangeState: 'idle',
      exchangeResult: null,
      exchangeError: null,
      exchangeHistory: [],
      exchangeHistoryLoading: false,
      exchangeHistoryError: null,
      exchangeStatistics: null,
      searchQuery: '',
      itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
      sortBy: 'newest',
      historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
      fetchExchangeItems: jest.fn(),
      fetchExchangeItemDetail: jest.fn(),
      setExchangeItems: jest.fn(),
      executeExchange: jest.fn(),
      clearExchangeResult: jest.fn(),
      setExchangeResult: jest.fn(),
      validateExchangeRequirements: jest.fn(),
      setSearchQuery: jest.fn(),
      setItemFilters: jest.fn(),
      setSortBy: jest.fn(),
      clearItemFilters: jest.fn(),
      fetchExchangeHistory: jest.fn(),
      setHistoryFilters: jest.fn(),
      clearHistoryFilters: jest.fn(),
      setHistoryPage: jest.fn(),
      setExchangeStatistics: jest.fn(),
    })

    render(
      <MockedProvider>
        <ExchangePage />
      </MockedProvider>
    )

    expect(screen.getByTestId('exchange-items-skeleton')).toBeInTheDocument()
  })

  it('should display error state', () => {
    mockUseExchangeStore.mockReturnValue({
      exchangeItems: [],
      exchangeItemsLoading: false,
      exchangeItemsError: 'アイテム取得に失敗しました',
      selectedExchangeItem: null,
      selectedItemLoading: false,
      exchangeState: 'idle',
      exchangeResult: null,
      exchangeError: null,
      exchangeHistory: [],
      exchangeHistoryLoading: false,
      exchangeHistoryError: null,
      exchangeStatistics: null,
      searchQuery: '',
      itemFilters: { category: '', vtuber: '', minCost: null, maxCost: null },
      sortBy: 'newest',
      historyFilters: { vtuber: '', category: '', startDate: '', endDate: '', status: '' },
      fetchExchangeItems: jest.fn(),
      fetchExchangeItemDetail: jest.fn(),
      setExchangeItems: jest.fn(),
      executeExchange: jest.fn(),
      clearExchangeResult: jest.fn(),
      setExchangeResult: jest.fn(),
      validateExchangeRequirements: jest.fn(),
      setSearchQuery: jest.fn(),
      setItemFilters: jest.fn(),
      setSortBy: jest.fn(),
      clearItemFilters: jest.fn(),
      fetchExchangeHistory: jest.fn(),
      setHistoryFilters: jest.fn(),
      clearHistoryFilters: jest.fn(),
      setHistoryPage: jest.fn(),
      setExchangeStatistics: jest.fn(),
    })

    render(
      <MockedProvider>
        <ExchangePage />
      </MockedProvider>
    )

    expect(screen.getByText('アイテム取得に失敗しました')).toBeInTheDocument()
    expect(screen.getByText('再試行')).toBeInTheDocument()
  })
})