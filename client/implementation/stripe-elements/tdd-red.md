import { render, screen, waitFor } from '@testing-library/react'
import { StripeProvider } from '@/components/payment/StripeProvider'

// Stripe のモック
jest.mock('@stripe/stripe-js')
jest.mock('@stripe/react-stripe-js')

const mockLoadStripe = require('@stripe/stripe-js').loadStripe as jest.MockedFunction<typeof import('@stripe/stripe-js').loadStripe>
const mockElements = require('@stripe/react-stripe-js').Elements

describe('StripeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // 環境変数のモック
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
  })

  describe('基本レンダリング', () => {
    it('TC-001: コンポーネントが正常にレンダリングされる', () => {
      render(
        <StripeProvider>
          <div data-testid="child-component">Test Child</div>
        </StripeProvider>
      )
      
      expect(screen.getByTestId('stripe-provider')).toBeInTheDocument()
    })

    it('TC-002: childrenが正しく表示される', () => {
      render(
        <StripeProvider>
          <div data-testid="child-component">Test Child</div>
        </StripeProvider>
      )
      
      expect(screen.getByTestId('child-component')).toBeInTheDocument()
      expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    it('TC-003: publishable keyが設定される', () => {
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123')
    })
  })

  describe('Stripe設定', () => {
    it('TC-004: loadStripe が正しく呼ばれる', async () => {
      mockLoadStripe.mockResolvedValue({} as any)
      
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      await waitFor(() => {
        expect(mockLoadStripe).toHaveBeenCalledTimes(1)
      })
    })

    it('TC-005: publishable key が環境変数から取得される', () => {
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      expect(mockLoadStripe).toHaveBeenCalledWith(
        expect.stringMatching(/^pk_test_/)
      )
    })

    it('TC-006: 無効なpublishable keyでエラーハンドリング', () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'invalid_key'
      
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      expect(screen.getByTestId('stripe-error')).toBeInTheDocument()
    })

    it('TC-007: Elements theme設定が適用される', () => {
      mockElements.mockImplementation(({ options, children }) => {
        expect(options.appearance.theme).toBe('stripe')
        return <div data-testid="elements-wrapper">{children}</div>
      })

      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      expect(screen.getByTestId('elements-wrapper')).toBeInTheDocument()
    })
  })

  describe('エラーハンドリング', () => {
    it('TC-008: publishable key未設定時のエラー表示', () => {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      expect(screen.getByText(/stripe publishable key/i)).toBeInTheDocument()
    })

    it('TC-009: Stripeロード失敗時のエラー表示', async () => {
      mockLoadStripe.mockRejectedValue(new Error('Stripe load failed'))
      
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load stripe/i)).toBeInTheDocument()
      })
    })

    it('TC-010: ネットワークエラー時の適切な表示', async () => {
      mockLoadStripe.mockRejectedValue(new Error('Network Error'))
      
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('TC-011: エラー境界での例外キャッチ', async () => {
      const ErrorThrowingChild = () => {
        throw new Error('Child error')
      }
      
      render(
        <StripeProvider>
          <ErrorThrowingChild />
        </StripeProvider>
      )
      
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  describe('状態管理', () => {
    it('TC-012: ローディング状態の表示', () => {
      mockLoadStripe.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      expect(screen.getByTestId('stripe-loading')).toBeInTheDocument()
    })

    it('TC-013: 準備完了状態の表示', async () => {
      mockLoadStripe.mockResolvedValue({} as any)
      
      render(
        <StripeProvider>
          <div data-testid="child">Test</div>
        </StripeProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument()
      })
    })

    it('TC-014: エラー状態の表示', async () => {
      mockLoadStripe.mockRejectedValue(new Error('Test error'))
      
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByTestId('stripe-error')).toBeInTheDocument()
      })
    })

    it('TC-015: 再試行機能の動作', async () => {
      mockLoadStripe.mockRejectedValueOnce(new Error('First failure'))
      mockLoadStripe.mockResolvedValueOnce({} as any)
      
      render(
        <StripeProvider>
          <div>Test</div>
        </StripeProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument()
      })
      
      const retryButton = screen.getByText(/retry/i)
      retryButton.click()
      
      await waitFor(() => {
        expect(screen.queryByTestId('stripe-error')).not.toBeInTheDocument()
      })
    })
  })
})