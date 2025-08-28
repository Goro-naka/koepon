import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { StripeServiceException } from '../exceptions/payment.exceptions';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { createMockCustomLoggerService } from '../../../test/test-helpers';

// Mock Stripe module
const mockStripePaymentIntents = {
  create: jest.fn(),
  retrieve: jest.fn(),
};

const mockStripeRefunds = {
  create: jest.fn(),
};

const mockStripeWebhooks = {
  constructEvent: jest.fn(),
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: mockStripePaymentIntents,
    refunds: mockStripeRefunds,
    webhooks: mockStripeWebhooks,
  }));
});

describe('StripeService', () => {
  let service: StripeService;
  let mockLoggerService: ReturnType<typeof createMockCustomLoggerService>;

  beforeEach(async () => {
    mockLoggerService = createMockCustomLoggerService();

    // Set test environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_testing';

    // Reset all mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: CustomLoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent with valid parameters', async () => {
      // Given: 有効な決済パラメータ
      const params = {
        amount: 12000,
        currency: 'jpy',
        metadata: { user_id: 'test-user', medal_amount: '1200' },
        payment_method_types: ['card']
      };

      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 12000,
        currency: 'jpy',
        status: 'requires_payment_method',
        metadata: { user_id: 'test-user', medal_amount: '1200' },
      };

      mockStripePaymentIntents.create.mockResolvedValue(mockPaymentIntent);

      // When: createPaymentIntent を実行
      const result = await service.createPaymentIntent(params);

      // Then: 正しい結果が返される
      expect(result).toEqual({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 12000,
        currency: 'jpy',
        status: 'requires_payment_method',
        metadata: { user_id: 'test-user', medal_amount: '1200' },
      });

      // And: Stripeのcreateが呼ばれる
      expect(mockStripePaymentIntents.create).toHaveBeenCalledWith({
        amount: 12000,
        currency: 'jpy',
        payment_method_types: ['card'],
        metadata: { user_id: 'test-user', medal_amount: '1200' },
      });

      // And: ログが出力される
      expect(mockLoggerService.log).toHaveBeenCalledWith(
        'Payment intent created: pi_test_123',
        'StripeService'
      );
    });

    it('should handle Stripe API errors', async () => {
      // Given: APIエラーを引き起こすパラメータ
      const params = {
        amount: -100, // 無効な金額
        currency: 'jpy'
      };

      // When & Then: 実装されていないのでエラー
      await expect(service.createPaymentIntent(params))
        .rejects.toThrow('Not implemented');
    });

    it('should set correct metadata', async () => {
      // Given: メタデータ付きパラメータ
      const params = {
        amount: 12000,
        currency: 'jpy',
        metadata: { 
          user_id: 'test-user',
          medal_amount: '1200',
          package_id: '1200-medals'
        }
      };

      // When & Then: 実装されていないのでエラー
      await expect(service.createPaymentIntent(params))
        .rejects.toThrow('Not implemented');
    });
  });

  describe('retrievePaymentIntent', () => {
    it('should retrieve existing payment intent', async () => {
      // Given: 存在するPaymentIntent ID
      const paymentIntentId = 'pi_test_12345';

      // When & Then: 実装されていないのでエラー
      await expect(service.retrievePaymentIntent(paymentIntentId))
        .rejects.toThrow('Not implemented');
    });

    it('should throw error for non-existent payment intent', async () => {
      // Given: 存在しないPaymentIntent ID
      const nonExistentId = 'pi_nonexistent';

      // When & Then: 実装されていないのでエラー
      await expect(service.retrievePaymentIntent(nonExistentId))
        .rejects.toThrow('Not implemented');
    });

    it('should return payment intent with correct status', async () => {
      // Given: 成功したPaymentIntent ID
      const successfulPaymentId = 'pi_test_succeeded';

      // When & Then: 実装されていないのでエラー
      await expect(service.retrievePaymentIntent(successfulPaymentId))
        .rejects.toThrow('Not implemented');
    });
  });

  describe('createRefund', () => {
    it('should create full refund', async () => {
      // Given: 完全返金パラメータ
      const params = {
        payment_intent: 'pi_test_12345',
        reason: 'requested_by_customer'
      };

      // When & Then: 実装されていないのでエラー
      await expect(service.createRefund(params))
        .rejects.toThrow('Not implemented');
    });

    it('should create partial refund', async () => {
      // Given: 部分返金パラメータ
      const params = {
        payment_intent: 'pi_test_12345',
        amount: 6000, // 半額返金
        reason: 'requested_by_customer'
      };

      // When & Then: 実装されていないのでエラー
      await expect(service.createRefund(params))
        .rejects.toThrow('Not implemented');
    });

    it('should handle refund errors', async () => {
      // Given: エラーを引き起こすパラメータ
      const params = {
        payment_intent: 'pi_cannot_refund',
        reason: 'requested_by_customer'
      };

      // When & Then: 実装されていないのでエラー
      await expect(service.createRefund(params))
        .rejects.toThrow('Not implemented');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', async () => {
      // Given: 有効なWebhookペイロードと署名
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const signature = 'valid_signature';
      const secret = 'webhook_secret';

      // When & Then: 実装されていないのでエラー
      await expect(service.verifyWebhookSignature(payload, signature, secret))
        .rejects.toThrow('Not implemented');
    });

    it('should reject invalid webhook signature', async () => {
      // Given: 無効な署名
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const invalidSignature = 'invalid_signature';
      const secret = 'webhook_secret';

      // When & Then: 実装されていないのでエラー
      await expect(service.verifyWebhookSignature(payload, invalidSignature, secret))
        .rejects.toThrow('Not implemented');
    });

    it('should handle webhook signature verification errors', async () => {
      // Given: エラーを引き起こすパラメータ
      const payload = 'invalid_json';
      const signature = 'signature';
      const secret = 'webhook_secret';

      // When & Then: 実装されていないのでエラー
      await expect(service.verifyWebhookSignature(payload, signature, secret))
        .rejects.toThrow('Not implemented');
    });
  });
});