import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaymentForm } from '../../../components/payment/PaymentForm'

// Stripe のモック
jest.mock('@stripe/react-stripe-js')

const mockUseStripe = require('@stripe/react-stripe-js').useStripe
const mockUseElements = require('@stripe/react-stripe-js').useElements
const mockCardElement = require('@stripe/react-stripe-js').CardElement

describe('PaymentForm', () => {
  const mockStripe = {
    confirmCardPayment: jest.fn()
  }
  
  const mockElements = {
    getElement: jest.fn()
  }

  const defaultProps = {
    gachaId: 'gacha-001',
    amount: 100,
    pullType: 'single' as const,
    onSuccess: jest.fn(),
    onError: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStripe.mockReturnValue(mockStripe)
    mockUseElements.mockReturnValue(mockElements)
  })

  describe('基本レンダリング', () => {
    it('TC-016: フォームが正常にレンダリングされる', () => {
      render(<PaymentForm {...defaultProps} />)
      
      expect(screen.getByTestId('payment-form')).toBeInTheDocument()
    })

    it('TC-017: CardElementが表示される', () => {
      render(<PaymentForm {...defaultProps} />)
      
      expect(screen.getByTestId('card-element')).toBeInTheDocument()
    })

    it('TC-018: 決済ボタンが表示される', () => {
      render(<PaymentForm {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument()
    })

    it('TC-019: 金額表示が正しい', () => {
      render(<PaymentForm {...defaultProps} />)
      
      expect(screen.getByText('¥100')).toBeInTheDocument()
    })

    it('TC-020: ガチャ情報が表示される', () => {
      render(<PaymentForm {...defaultProps} />)
      
      expect(screen.getByText(/single pull/i)).toBeInTheDocument()
    })
  })

  describe('フォームバリデーション', () => {
    it('TC-021: カード情報入力中のリアルタイムバリデーション', async () => {
      render(<PaymentForm {...defaultProps} />)
      
      const cardElement = screen.getByTestId('card-element')
      
      // カード情報入力をシミュレート
      fireEvent.change(cardElement, {
        target: { value: '4242' }
      })
      
      expect(screen.getByTestId('validation-message')).toBeInTheDocument()
    })

    it('TC-022: 無効なカード番号のエラー表示', async () => {
      render(<PaymentForm {...defaultProps} />)
      
      const payButton = screen.getByRole('button', { name: /pay/i })
      await userEvent.click(payButton)
      
      expect(screen.getByText(/invalid card number/i)).toBeInTheDocument()
    })

    it('TC-023: 有効期限エラーのバリデーション', async () => {
      render(<PaymentForm {...defaultProps} />)
      
      const payButton = screen.getByRole('button', { name: /pay/i })
      await userEvent.click(payButton)
      
      expect(screen.getByText(/invalid expiry/i)).toBeInTheDocument()
    })
  })

  describe('ローディング状態', () => {
    it('TC-027: 決済処理中のボタン無効化', async () => {
      mockStripe.confirmCardPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<PaymentForm {...defaultProps} />)
      
      const payButton = screen.getByRole('button', { name: /pay/i })
      await userEvent.click(payButton)
      
      expect(payButton).toBeDisabled()
    })

    it('TC-028: ローディングスピナーの表示', async () => {
      mockStripe.confirmCardPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )
      
      render(<PaymentForm {...defaultProps} />)
      
      const payButton = screen.getByRole('button', { name: /pay/i })
      await userEvent.click(payButton)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('エラーハンドリング', () => {
    it('TC-031: 決済失敗時のエラー表示', async () => {
      mockStripe.confirmCardPayment.mockResolvedValue({
        error: { message: 'Payment failed' }
      })
      
      render(<PaymentForm {...defaultProps} />)
      
      const payButton = screen.getByRole('button', { name: /pay/i })
      await userEvent.click(payButton)
      
      await waitFor(() => {
        expect(screen.getByText('Payment failed')).toBeInTheDocument()
      })
    })

    it('TC-032: ネットワークエラー時の表示', async () => {
      mockStripe.confirmCardPayment.mockRejectedValue(
        new Error('Network error')
      )
      
      render(<PaymentForm {...defaultProps} />)
      
      const payButton = screen.getByRole('button', { name: /pay/i })
      await userEvent.click(payButton)
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })
})