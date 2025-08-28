import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GachaDrawPage } from '../GachaDrawPage'
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
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'gachaId') return 'gacha-1'
      if (key === 'count') return '1'
      return null
    },
  }),
}))

// Mock socket.io (not implemented in basic version)
// jest.mock('socket.io-client', () => ({
//   io: jest.fn(() => ({
//     on: jest.fn(),
//     off: jest.fn(),
//     disconnect: jest.fn(),
//     connected: true,
//   })),
// }))

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
      description: '特別な夏のボイスメッセージ',
    }
  ],
  totalMedals: 50,
  drawCount: 1,
  timestamp: new Date().toISOString(),
}

const mockMultiDrawResult = {
  id: 'draw-2',
  gachaId: 'gacha-1',
  items: [
    {
      id: 'item-1',
      name: 'サマーボイス',
      rarity: 'SR',
      image: '/images/voice.jpg',
      medalValue: 50,
      description: '特別な夏のボイスメッセージ',
    },
    {
      id: 'item-2',
      name: '限定スタンプ',
      rarity: 'R',
      image: '/images/stamp.jpg',
      medalValue: 20,
      description: '夏限定のかわいいスタンプ',
    },
    // ... 8 more items
  ],
  totalMedals: 200,
  drawCount: 10,
  timestamp: new Date().toISOString(),
}

describe('GachaDrawPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // GDR001: Draw Animation tests
  describe('Draw Animation', () => {
    it('should start draw animation on page load', async () => {
      const mockStore = {
        drawState: 'drawing' as const,
        drawResult: null,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('draw-animation')).toBeInTheDocument()
      expect(screen.getByText(/抽選中/i)).toBeInTheDocument()
      expect(mockStore.executeDraw).toHaveBeenCalledWith('gacha-1', 1)
    })

    it('should prevent user interaction during animation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const mockStore = {
        drawState: 'drawing' as const,
        drawResult: null,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      const animationArea = screen.getByTestId('draw-animation')
      await user.click(animationArea)
      
      // Animation should continue and not be interrupted
      expect(screen.getByTestId('draw-animation')).toBeInTheDocument()
      expect(screen.queryByTestId('draw-result')).not.toBeInTheDocument()
    })

    it('should show progress indicator during draw', async () => {
      const mockStore = {
        drawState: 'drawing' as const,
        drawResult: null,
        drawProgress: 65,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByText(/65%/)).toBeInTheDocument()
    })

    it('should complete animation within 3 seconds', async () => {
      const mockStore = {
        drawState: 'drawing' as const,
        drawResult: null,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('draw-animation')).toBeInTheDocument()
      
      // Fast-forward 3 seconds
      jest.advanceTimersByTime(3000)
      
      // Animation should complete within 3 seconds
      await waitFor(() => {
        expect(screen.queryByTestId('draw-animation')).not.toBeInTheDocument()
      }, { timeout: 100 })
    })
  })

  // GDR002: Result Display tests
  describe('Result Display', () => {
    it('should display single draw result with item details', async () => {
      const mockStore = {
        drawState: 'complete' as const,
        drawResult: mockDrawResult,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('draw-result')).toBeInTheDocument()
      expect(screen.getByText('サマーボイス')).toBeInTheDocument()
      expect(screen.getByText(/特別な夏のボイスメッセージ/i)).toBeInTheDocument()
      expect(screen.getByAltText(/サマーボイス/i)).toBeInTheDocument()
    })

    it('should show rarity-specific visual effects', async () => {
      const mockStore = {
        drawState: 'complete' as const,
        drawResult: mockDrawResult,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      const rarityIndicator = screen.getByTestId('rarity-sr')
      expect(rarityIndicator).toBeInTheDocument()
      expect(rarityIndicator).toHaveClass('rarity-sr-effect')
    })

    it('should display earned medal count prominently', async () => {
      const mockStore = {
        drawState: 'complete' as const,
        drawResult: mockDrawResult,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('medal-count')).toBeInTheDocument()
      expect(screen.getByText(/50枚獲得/i)).toBeInTheDocument()
    })

    it('should provide share functionality for rare items', async () => {
      const mockStore = {
        drawState: 'complete' as const,
        drawResult: mockDrawResult, // SR item
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByRole('button', { name: /シェア/i })).toBeInTheDocument()
    })
  })

  // GDR003: Multi Draw tests
  describe('Multi Draw (10-draw)', () => {
    beforeEach(() => {
      // Mock 10-draw params
      jest.mocked(require('next/navigation').useSearchParams).mockReturnValue({
        get: (key: string) => {
          if (key === 'gachaId') return 'gacha-1'
          if (key === 'count') return '10'
          return null
        },
      })
    })

    it('should show 10-draw animation sequence', async () => {
      const mockStore = {
        drawState: 'drawing' as const,
        drawResult: null,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
        multiDrawProgress: 3, // Currently drawing 3rd item
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('multi-draw-animation')).toBeInTheDocument()
      expect(screen.getByText(/3 \/ 10/i)).toBeInTheDocument()
      expect(mockStore.executeDraw).toHaveBeenCalledWith('gacha-1', 10)
    })

    it('should display all 10 results in summary view', async () => {
      const mockStore = {
        drawState: 'complete' as const,
        drawResult: mockMultiDrawResult,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByTestId('multi-draw-result')).toBeInTheDocument()
      expect(screen.getByText(/10連ガチャ結果/i)).toBeInTheDocument()
      expect(screen.getAllByTestId(/result-item-/)).toHaveLength(10)
    })

    it('should highlight best result in multi-draw', async () => {
      const mockStore = {
        drawState: 'complete' as const,
        drawResult: mockMultiDrawResult,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      // First item (SR) should be highlighted as best result
      expect(screen.getByTestId('best-result-item-1')).toBeInTheDocument()
      expect(screen.getByTestId('best-result-item-1')).toHaveClass('best-result-highlight')
    })
  })

  // GDR004: Error Handling tests
  describe('Error Handling', () => {
    it('should handle network error during draw', async () => {
      const mockStore = {
        drawState: 'error' as const,
        drawResult: null,
        drawError: 'ネットワークエラーが発生しました',
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
        retryDraw: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/ネットワークエラーが発生しました/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument()
    })

    it('should handle insufficient balance error', async () => {
      const mockStore = {
        drawState: 'error' as const,
        drawResult: null,
        drawError: '残高不足です',
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/残高不足です/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /チャージ/i })).toBeInTheDocument()
    })

    it('should handle server error gracefully', async () => {
      const mockStore = {
        drawState: 'error' as const,
        drawResult: null,
        drawError: 'サーバーエラーが発生しました',
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      expect(screen.getByText(/サーバーエラーが発生しました/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /ホームに戻る/i })).toBeInTheDocument()
    })

    it('should retry draw on retry button click', async () => {
      const user = userEvent.setup()
      const mockStore = {
        drawState: 'error' as const,
        drawResult: null,
        drawError: 'ネットワークエラーが発生しました',
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
        retryDraw: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      const retryButton = screen.getByRole('button', { name: /再試行/i })
      await user.click(retryButton)
      
      expect(mockStore.retryDraw).toHaveBeenCalled()
    })
  })

  // Navigation and cleanup
  describe('Navigation and Cleanup', () => {
    it('should provide navigation back to gacha list', async () => {
      const user = userEvent.setup()
      const mockStore = {
        drawState: 'complete' as const,
        drawResult: mockDrawResult,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      const backButton = screen.getByRole('button', { name: /ガチャ一覧に戻る/i })
      await user.click(backButton)
      
      expect(mockPush).toHaveBeenCalledWith('/gacha')
    })

    it('should clear draw result on component unmount', () => {
      const mockStore = {
        drawState: 'complete' as const,
        drawResult: mockDrawResult,
        executeDraw: jest.fn(),
        clearDrawResult: jest.fn(),
      }
      
      jest.mocked(useGachaStore).mockReturnValue(mockStore)
      
      const { unmount } = render(<GachaDrawPage />, { wrapper: createWrapper() })
      
      unmount()
      
      expect(mockStore.clearDrawResult).toHaveBeenCalled()
    })
  })
})