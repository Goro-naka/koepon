import { render, screen, waitFor } from '@testing-library/react'
import { StripeProvider } from '../../../components/payment/StripeProvider'

// Stripe のモック
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn()
}))

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: jest.fn(({ children }) => <div data-testid="elements-wrapper">{children}</div>)
}))

const { loadStripe: mockLoadStripe } = require('@stripe/stripe-js')
const { Elements: mockElements } = require('@stripe/react-stripe-js')

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
})