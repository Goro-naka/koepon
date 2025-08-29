import { renderHook, act } from '@testing-library/react'
import { useStripePayment } from '../../hooks/useStripePayment'

// Stripe のモック
jest.mock('@stripe/react-stripe-js')

const mockUseStripe = require('@stripe/react-stripe-js').useStripe
const mockUseElements = require('@stripe/react-stripe-js').useElements

// API client のモック
jest.mock('../../lib/frontend-api-client')
const { apiClient: mockApiClient } = require('../../lib/frontend-api-client')

describe('useStripePayment', () => {
  const mockStripe = {
    confirmCardPayment: jest.fn()
  }
  
  const mockElements = {
    getElement: jest.fn()
  }
  
  const mockCardElement = {
    focus: jest.fn(),
    clear: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStripe.mockReturnValue(mockStripe)
    mockUseElements.mockReturnValue(mockElements)
    mockElements.getElement.mockReturnValue(mockCardElement)
  })

  describe('初期化', () => {
    it('TC-041: フックが正常に初期化される', () => {
      const { result } = renderHook(() => useStripePayment())
      
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.success).toBe(false)
    })

    it('TC-042: 初期状態の確認', () => {
      const { result } = renderHook(() => useStripePayment())
      
      expect(result.current).toMatchObject({
        loading: false,
        error: null,
        success: false,
        createPaymentIntent: expect.any(Function),
        confirmPayment: expect.any(Function),
        reset: expect.any(Function)
      })
    })

    it('TC-043: Stripe・Elements参照の取得', () => {
      renderHook(() => useStripePayment())
      
      expect(mockUseStripe).toHaveBeenCalled()
      expect(mockUseElements).toHaveBeenCalled()
    })
  })

  describe('Payment Intent作成', () => {
    it('TC-044: Payment Intent正常作成', async () => {
      mockApiClient.post.mockResolvedValue({
        data: { clientSecret: 'pi_test_client_secret' }
      })
      
      const { result } = renderHook(() => useStripePayment())
      
      await act(async () => {
        const clientSecret = await result.current.createPaymentIntent({
          gachaId: 'gacha-001',
          amount: 100,
          pullType: 'single'
        })
        expect(clientSecret).toBe('pi_test_client_secret')
      })
    })

    it('TC-045: API呼び出しパラメータ検証', async () => {
      mockApiClient.post.mockResolvedValue({
        data: { clientSecret: 'pi_test_client_secret' }
      })
      
      const { result } = renderHook(() => useStripePayment())
      
      await act(async () => {
        await result.current.createPaymentIntent({
          gachaId: 'gacha-001',
          amount: 100,
          pullType: 'single'
        })
      })
      
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/payments/create-intent',
        {
          gachaId: 'gacha-001',
          amount: 100,
          pullType: 'single'
        }
      )
    })

    it('TC-046: 作成失敗時のエラーハンドリング', async () => {
      mockApiClient.post.mockRejectedValue(new Error('API Error'))
      
      const { result } = renderHook(() => useStripePayment())
      
      await act(async () => {
        try {
          await result.current.createPaymentIntent({
            gachaId: 'gacha-001',
            amount: 100,
            pullType: 'single'
          })
        } catch (error) {
          // エラーが投げられることを期待
        }
      })
      
      expect(result.current.error).toBeTruthy()
    })

    it('TC-047: ローディング状態の管理', async () => {
      mockApiClient.post.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      const { result } = renderHook(() => useStripePayment())
      
      act(() => {
        result.current.createPaymentIntent({
          gachaId: 'gacha-001',
          amount: 100,
          pullType: 'single'
        })
      })
      
      expect(result.current.loading).toBe(true)
    })

    it('TC-048: 重複リクエストの防止', async () => {
      mockApiClient.post.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      const { result } = renderHook(() => useStripePayment())
      
      act(() => {
        result.current.createPaymentIntent({
          gachaId: 'gacha-001',
          amount: 100,
          pullType: 'single'
        })
        // 2回目の呼び出し（重複）
        result.current.createPaymentIntent({
          gachaId: 'gacha-001',
          amount: 100,
          pullType: 'single'
        })
      })
      
      expect(mockApiClient.post).toHaveBeenCalledTimes(1)
    })
  })

  describe('決済確認処理', () => {
    it('TC-050: confirmCardPayment正常実行', async () => {
      mockStripe.confirmCardPayment.mockResolvedValue({
        paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
      })
      
      const { result } = renderHook(() => useStripePayment())
      
      await act(async () => {
        const result_payment = await result.current.confirmPayment('client_secret_123')
        expect(result_payment.paymentIntent.status).toBe('succeeded')
      })
    })

    it('TC-051: 決済成功時の処理', async () => {
      mockStripe.confirmCardPayment.mockResolvedValue({
        paymentIntent: { id: 'pi_test_123', status: 'succeeded' }
      })
      
      const { result } = renderHook(() => useStripePayment())
      
      await act(async () => {
        await result.current.confirmPayment('client_secret_123')
      })
      
      expect(result.current.success).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('TC-052: 決済失敗時のエラーハンドリング', async () => {
      mockStripe.confirmCardPayment.mockResolvedValue({
        error: { message: 'Your card was declined' }
      })
      
      const { result } = renderHook(() => useStripePayment())
      
      await act(async () => {
        await result.current.confirmPayment('client_secret_123')
      })
      
      expect(result.current.error).toBe('Your card was declined')
      expect(result.current.success).toBe(false)
    })
  })

  describe('状態管理', () => {
    it('TC-056: loading状態の切り替え', async () => {
      mockStripe.confirmCardPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )
      
      const { result } = renderHook(() => useStripePayment())
      
      act(() => {
        result.current.confirmPayment('client_secret_123')
      })
      
      expect(result.current.loading).toBe(true)
    })

    it('TC-059: 状態リセット機能', () => {
      const { result } = renderHook(() => useStripePayment())
      
      // エラー状態を設定
      act(() => {
        result.current.confirmPayment('invalid_secret')
      })
      
      // リセット実行
      act(() => {
        result.current.reset()
      })
      
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.success).toBe(false)
    })
  })
})