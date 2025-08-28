/**
 * TASK-507: 決済フロー修正 - PaymentService テスト
 * 
 * Stripe統合による決済処理をテスト
 */

import { PaymentService } from '@/payment/payment.service'
import Stripe from 'stripe'

// Stripe モック
const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    confirm: jest.fn(),
    retrieve: jest.fn()
  },
  webhooks: {
    constructEvent: jest.fn()
  }
}

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe)
})

describe('TASK-507: PaymentService - Stripe統合', () => {
  let paymentService: PaymentService
  
  beforeEach(() => {
    jest.clearAllMocks()
    paymentService = new PaymentService()
  })

  describe('TC-B001: createPaymentIntent - Stripe決済作成', () => {
    it('単発ガチャ用のPaymentIntentが作成されること', async () => {
      // Given: 単発ガチャの決済情報
      const paymentData = {
        amount: 100,
        currency: 'jpy' as const,
        metadata: {
          userId: 'user_123',
          gachaId: 'gacha_001',
          drawCount: 1
        }
      }

      const mockPaymentIntent = {
        id: 'pi_test_123',
        amount: 100,
        currency: 'jpy',
        client_secret: 'pi_test_123_secret_abc',
        metadata: paymentData.metadata
      }

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent)

      // When: PaymentIntentを作成
      const result = await paymentService.createPaymentIntent(paymentData)

      // Then: Stripeが正しいパラメータで呼ばれる
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 100,
        currency: 'jpy',
        metadata: {
          userId: 'user_123',
          gachaId: 'gacha_001',
          drawCount: 1
        },
        description: expect.stringContaining('ガチャ'),
        automatic_payment_methods: {
          enabled: true
        }
      })

      // 適切なPaymentIntentが作成される
      expect(result.id).toBe('pi_test_123')
      expect(result.amount).toBe(100)
      expect(result.currency).toBe('jpy')
      expect(result.client_secret).toBe('pi_test_123_secret_abc')
      expect(result.metadata.gachaId).toBe('gacha_001')
    })

    it('10連ガチャ用のPaymentIntentが作成されること', async () => {
      // Given: 10連ガチャの決済情報
      const paymentData = {
        amount: 1000,
        currency: 'jpy' as const,
        metadata: {
          userId: 'user_456',
          gachaId: 'gacha_002',
          drawCount: 10
        }
      }

      const mockPaymentIntent = {
        id: 'pi_test_456',
        amount: 1000,
        currency: 'jpy',
        client_secret: 'pi_test_456_secret_def',
        metadata: paymentData.metadata
      }

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent)

      // When: PaymentIntentを作成
      const result = await paymentService.createPaymentIntent(paymentData)

      // Then: 10連の設定で作成される
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'jpy',
        metadata: expect.objectContaining({
          drawCount: 10
        }),
        description: expect.stringContaining('10連'),
        automatic_payment_methods: {
          enabled: true
        }
      })

      expect(result.amount).toBe(1000)
    })
  })

  describe('TC-B002: confirmPayment - 決済確認', () => {
    it('有効なPaymentIntentIDで決済が確認されること', async () => {
      // Given: 有効なPaymentIntentID
      const paymentIntentId = 'pi_test_123'
      
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: paymentIntentId,
        status: 'succeeded',
        amount: 100
      })

      // When: 決済確認
      const result = await paymentService.confirmPayment(paymentIntentId)

      // Then: 決済が成功
      expect(result).toBe(true)
      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith(paymentIntentId)
    })
    
    it('無効なPaymentIntentIDで決済が失敗すること', async () => {
      // Given: 無効なPaymentIntentID
      const paymentIntentId = 'pi_invalid'
      
      mockStripe.paymentIntents.retrieve.mockRejectedValue(
        new Error('No such payment_intent')
      )

      // When: 決済確認
      const result = await paymentService.confirmPayment(paymentIntentId)

      // Then: 決済が失敗
      expect(result).toBe(false)
    })

    it('未完了の決済で失敗すること', async () => {
      // Given: 未完了のPaymentIntent
      const paymentIntentId = 'pi_pending'
      
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: paymentIntentId,
        status: 'requires_payment_method',
        amount: 100
      })

      // When: 決済確認
      const result = await paymentService.confirmPayment(paymentIntentId)

      // Then: 決済が失敗
      expect(result).toBe(false)
    })
  })

  describe('TC-B003: handleWebhook - Webhook処理', () => {
    it('payment_intent.succeeded イベントが処理されること', async () => {
      // Given: 決済成功Webhook
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            amount: 100,
            currency: 'jpy',
            metadata: {
              userId: 'user_123',
              gachaId: 'gacha_001',
              drawCount: '1'
            }
          } as Stripe.PaymentIntent
        },
        created: Date.now(),
        api_version: '2020-08-27',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // When: Webhook処理
      await paymentService.handleWebhook('webhook_payload', 'stripe_signature')

      // Then: イベントが構築される
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        'webhook_payload',
        'stripe_signature',
        expect.any(String) // webhook secret
      )
    })

    it('payment_intent.payment_failed イベントが処理されること', async () => {
      // Given: 決済失敗Webhook
      const mockEvent: Stripe.Event = {
        id: 'evt_test_456',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_456',
            amount: 100,
            currency: 'jpy',
            last_payment_error: {
              message: 'カードが拒否されました'
            }
          } as Stripe.PaymentIntent
        },
        created: Date.now(),
        api_version: '2020-08-27',
        livemode: false,
        object: 'event',
        pending_webhooks: 1,
        request: { id: 'req_test', idempotency_key: null }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // When: Webhook処理
      await expect(
        paymentService.handleWebhook('webhook_payload', 'stripe_signature')
      ).resolves.not.toThrow()
    })

    it('不正な署名でエラーが発生すること', async () => {
      // Given: 不正な署名
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      // When/Then: エラーが発生
      await expect(
        paymentService.handleWebhook('webhook_payload', 'invalid_signature')
      ).rejects.toThrow('Invalid signature')
    })
  })
})