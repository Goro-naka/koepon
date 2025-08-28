import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RefundRequestDto } from './dto/refund-request.dto';
import { PaymentHistoryQueryDto } from './dto/payment-history-query.dto';
import {
  CreatePaymentIntentResponse,
  Gacha,
  Payment,
  PaymentHistoryResponse,
  PaymentResult,
  PaymentStatus,
  Refund,
  RefundRequestResponse,
  RefundStatus
} from './interfaces/payment.interface';
import { StripeService } from './services/stripe.service';
import { IdempotencyService } from './services/idempotency.service';
import {
  InvalidGachaException,
  PaymentAlreadyConfirmedException,
  PaymentFailedException,
  PaymentNotFoundException
} from './exceptions/payment.exceptions';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: CustomLoggerService,
    private readonly stripeService: StripeService,
    private readonly idempotencyService: IdempotencyService
  ) {}

  async createPaymentIntent(
    userId: string,
    createPaymentIntentDto: CreatePaymentIntentDto
  ): Promise<CreatePaymentIntentResponse> {
    try {
      const gacha = await this.getGachaById(createPaymentIntentDto.gachaId);
      if (!gacha) {
        throw new InvalidGachaException(
          `Gacha ${createPaymentIntentDto.gachaId} not found or inactive`
        );
      }

      // Calculate gacha count and total amount based on gacha type
      const gachaCount = createPaymentIntentDto.gachaType === 'ten_pull' ? 10 : 1;
      const amount = createPaymentIntentDto.gachaType === 'ten_pull' 
        ? gacha.tenPullPrice || (gacha.singlePrice * 10)
        : gacha.singlePrice;

      const idempotencyKey = this.idempotencyService.generateKey();
      
      const stripePaymentIntent = await this.stripeService.createPaymentIntent({
        amount,
        currency: gacha.currency,
        metadata: {
          user_id: userId,
          gacha_id: gacha.id,
          gacha_count: gachaCount.toString(),
          vtuber_id: gacha.vtuberId
        },
        payment_method_types: createPaymentIntentDto.paymentMethod ? [createPaymentIntentDto.paymentMethod] : ['card']
      });

      const paymentId = uuidv4();
      const adminClient = this.databaseService.getAdminClient();

      await adminClient
        .from('payments')
        .insert({
          id: paymentId,
          user_id: userId,
          stripe_payment_intent_id: stripePaymentIntent.id,
          gacha_id: gacha.id,
          amount,
          gacha_count: gachaCount,
          currency: gacha.currency.toUpperCase(),
          status: PaymentStatus.PENDING,
          idempotency_key: idempotencyKey,
          created_at: new Date().toISOString()
        });

      this.logger.log(
        `Payment intent created: ${stripePaymentIntent.id} for user ${userId}, gacha: ${gacha.id}, count: ${gachaCount}`,
        'PaymentService'
      );

      return {
        paymentIntentId: stripePaymentIntent.id,
        clientSecret: stripePaymentIntent.client_secret,
        amount,
        gachaCount,
        idempotencyKey
      };
    } catch (error) {
      this.logger.error(
        `Failed to create payment intent: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }

  async confirmPayment(
    userId: string,
    confirmPaymentDto: ConfirmPaymentDto
  ): Promise<PaymentResult> {
    try {
      if (confirmPaymentDto.idempotencyKey) {
        const cachedResult = await this.idempotencyService.getCache(
          confirmPaymentDto.idempotencyKey
        );
        if (cachedResult) {
          this.logger.log(
            `Payment confirmation returned from cache: ${confirmPaymentDto.paymentIntentId}`,
            'PaymentService'
          );
          return cachedResult as PaymentResult;
        }
      }

      const adminClient = this.databaseService.getAdminClient();
      
      const { data: payment } = await adminClient
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', confirmPaymentDto.paymentIntentId)
        .eq('user_id', userId)
        .single();

      if (!payment) {
        throw new PaymentNotFoundException(
          `Payment ${confirmPaymentDto.paymentIntentId} not found for user ${userId}`
        );
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        throw new PaymentAlreadyConfirmedException(
          `Payment ${confirmPaymentDto.paymentIntentId} already confirmed`
        );
      }

      const stripePaymentIntent = await this.stripeService.retrievePaymentIntent(
        confirmPaymentDto.paymentIntentId
      );

      if (stripePaymentIntent.status !== 'succeeded') {
        throw new PaymentFailedException(
          `Payment ${confirmPaymentDto.paymentIntentId} failed or not completed in Stripe`
        );
      }

      await adminClient
        .from('payments')
        .update({
          status: PaymentStatus.COMPLETED,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', payment.id);

      // Note: Medal balance is now handled by push medal system
      // This payment confirmation triggers push medal award through webhook

      const result: PaymentResult = {
        paymentId: payment.id,
        status: PaymentStatus.COMPLETED,
        amount: payment.amount,
        gachaCount: payment.gacha_count,
        confirmedAt: new Date()
      };

      if (confirmPaymentDto.idempotencyKey) {
        await this.idempotencyService.setCache(
          confirmPaymentDto.idempotencyKey,
          result,
          3600 // 1 hour
        );
      }

      this.logger.log(
        `Payment confirmed: ${confirmPaymentDto.paymentIntentId} for user ${userId}`,
        'PaymentService'
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to confirm payment: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }

  async getPaymentHistory(
    userId: string,
    query: PaymentHistoryQueryDto
  ): Promise<PaymentHistoryResponse> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      let queryBuilder = adminClient
        .from('payments')
        .select('*, gachas(name, single_price, ten_pull_price, vtuber_id)', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (query.status) {
        queryBuilder = queryBuilder.eq('status', query.status);
      }

      if (query.from) {
        queryBuilder = queryBuilder.gte('created_at', query.from);
      }

      if (query.to) {
        queryBuilder = queryBuilder.lte('created_at', query.to);
      }

      const { data: payments, count } = await queryBuilder;

      const paymentHistory: Payment[] = (payments || []).map(payment => ({
        id: payment.id,
        userId: payment.user_id,
        stripePaymentIntentId: payment.stripe_payment_intent_id,
        idempotencyKey: payment.idempotency_key,
        amount: payment.amount,
        gachaId: payment.gacha_id,
        gachaCount: payment.gacha_count,
        status: payment.status as PaymentStatus,
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        metadata: payment.metadata,
        failureReason: payment.failure_reason,
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at),
        completedAt: payment.completed_at ? new Date(payment.completed_at) : undefined
      }));

      const totalPages = Math.ceil((count || 0) / limit);

      return {
        payments: paymentHistory,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        }
      };
    } catch (error) {
      this.logger.error(
        `Failed to get payment history for user ${userId}: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }

  async requestRefund(
    userId: string,
    refundRequestDto: RefundRequestDto
  ): Promise<RefundRequestResponse> {
    try {
      await this.validateRefundRequest(userId, refundRequestDto);

      const refundAmount = await this.calculateRefundAmount(
        refundRequestDto.paymentId,
        refundRequestDto.amount
      );

      const refundId = uuidv4();
      const adminClient = this.databaseService.getAdminClient();

      const { data: refund } = await adminClient
        .from('refunds')
        .insert({
          id: refundId,
          payment_id: refundRequestDto.paymentId,
          user_id: userId,
          amount: refundAmount.amount,
          medal_amount: refundAmount.medalAmount,
          reason: refundRequestDto.reason,
          status: RefundStatus.PENDING,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      this.logger.log(
        `Refund request created: ${refundId} for payment ${refundRequestDto.paymentId}`,
        'PaymentService'
      );

      return {
        refundId,
        status: RefundStatus.PENDING,
        estimatedProcessingTime: '3-5 business days'
      };
    } catch (error) {
      this.logger.error(
        `Failed to create refund request: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }

  async processRefund(refundId: string, adminId: string): Promise<void> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: refund } = await adminClient
        .from('refunds')
        .select('*, payments(*)')
        .eq('id', refundId)
        .single();

      if (!refund) {
        throw new PaymentNotFoundException(`Refund ${refundId} not found`);
      }

      if (refund.status !== RefundStatus.APPROVED) {
        throw new PaymentFailedException('Refund must be approved before processing');
      }

      const stripeRefund = await this.stripeService.createRefund({
        payment_intent: refund.payments.stripe_payment_intent_id,
        amount: refund.amount,
        reason: refund.reason
      });

      await adminClient
        .from('refunds')
        .update({
          status: RefundStatus.COMPLETED,
          stripe_refund_id: stripeRefund.id,
          processed_by: adminId,
          processed_at: new Date().toISOString()
        })
        .eq('id', refundId);

      // Note: Medal balance adjustment is handled by push medal system
      // The refund process will trigger medal balance adjustment through webhook

      this.logger.log(
        `Refund ${refundId} processed successfully by admin ${adminId}`,
        'PaymentService'
      );
    } catch (error) {
      this.logger.error(
        `Failed to process refund ${refundId}: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }

  async getGachas(): Promise<Gacha[]> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: gachas } = await adminClient
        .from('gachas')
        .select('*')
        .eq('is_active', true)
        .order('single_price', { ascending: true });

      return (gachas || []).map(gacha => ({
        id: gacha.id,
        name: gacha.name,
        description: gacha.description,
        vtuberId: gacha.vtuber_id,
        singlePrice: gacha.single_price,
        tenPullPrice: gacha.ten_pull_price,
        currency: gacha.currency,
        isActive: gacha.is_active,
        startDate: gacha.start_date ? new Date(gacha.start_date) : undefined,
        endDate: gacha.end_date ? new Date(gacha.end_date) : undefined,
        createdAt: new Date(gacha.created_at)
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get gachas: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }

  async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: payment } = await adminClient
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (!payment) {
        return null;
      }

      return {
        id: payment.id,
        userId: payment.user_id,
        stripePaymentIntentId: payment.stripe_payment_intent_id,
        idempotencyKey: payment.idempotency_key,
        amount: payment.amount,
        gachaId: payment.gacha_id,
        gachaCount: payment.gacha_count,
        status: payment.status as PaymentStatus,
        currency: payment.currency,
        paymentMethod: payment.payment_method,
        metadata: payment.metadata,
        failureReason: payment.failure_reason,
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at),
        completedAt: payment.completed_at ? new Date(payment.completed_at) : undefined
      };
    } catch (error) {
      this.logger.error(
        `Failed to get payment ${paymentId}: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }

  async getRefundById(refundId: string): Promise<Refund | null> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: refund } = await adminClient
        .from('refunds')
        .select('*, payments(*)')
        .eq('id', refundId)
        .single();

      if (!refund) {
        return null;
      }

      return {
        id: refund.id,
        paymentId: refund.payment_id,
        userId: refund.user_id,
        stripeRefundId: refund.stripe_refund_id,
        amount: refund.amount,
        medalAmount: refund.medal_amount,
        status: refund.status as RefundStatus,
        reason: refund.reason,
        approvedBy: refund.approved_by,
        approvedAt: refund.approved_at ? new Date(refund.approved_at) : undefined,
        rejectedBy: refund.rejected_by,
        rejectedAt: refund.rejected_at ? new Date(refund.rejected_at) : undefined,
        rejectionReason: refund.rejection_reason,
        processedBy: refund.processed_by,
        processedAt: refund.processed_at ? new Date(refund.processed_at) : undefined,
        createdAt: new Date(refund.created_at)
      };
    } catch (error) {
      this.logger.error(
        `Failed to get refund ${refundId}: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }

  private async getGachaById(gachaId: string): Promise<Gacha | null> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: gacha } = await adminClient
        .from('gachas')
        .select('*')
        .eq('id', gachaId)
        .eq('is_active', true)
        .single();

      if (!gacha) {
        return null;
      }

      // Check if gacha is within active period
      const now = new Date();
      if (gacha.start_date && new Date(gacha.start_date) > now) {
        return null; // Not started yet
      }
      if (gacha.end_date && new Date(gacha.end_date) < now) {
        return null; // Already ended
      }

      return {
        id: gacha.id,
        name: gacha.name,
        description: gacha.description,
        vtuberId: gacha.vtuber_id,
        singlePrice: gacha.single_price,
        tenPullPrice: gacha.ten_pull_price,
        currency: gacha.currency,
        isActive: gacha.is_active,
        startDate: gacha.start_date ? new Date(gacha.start_date) : undefined,
        endDate: gacha.end_date ? new Date(gacha.end_date) : undefined,
        createdAt: new Date(gacha.created_at)
      };
    } catch (error) {
      this.logger.error(
        `Failed to get gacha ${gachaId}: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      return null;
    }
  }

  private async validateRefundRequest(
    userId: string,
    refundRequestDto: RefundRequestDto
  ): Promise<void> {
    const payment = await this.getPaymentById(refundRequestDto.paymentId);
    
    if (!payment) {
      throw new PaymentNotFoundException(`Payment ${refundRequestDto.paymentId} not found`);
    }

    if (payment.userId !== userId) {
      throw new PaymentFailedException('You can only request refunds for your own payments');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new PaymentFailedException('Only completed payments can be refunded');
    }

    const existingRefunds = await this.getRefundsByPayment(refundRequestDto.paymentId);
    const completedRefunds = existingRefunds.filter(
      refund => refund.status === RefundStatus.COMPLETED
    );
    
    if (completedRefunds.length > 0) {
      const totalRefundedAmount = completedRefunds.reduce(
        (sum, refund) => sum + refund.amount,
        0
      );
      
      if (refundRequestDto.amount) {
        if (totalRefundedAmount + refundRequestDto.amount > payment.amount) {
          throw new PaymentFailedException(
            'Requested refund amount exceeds remaining refundable amount'
          );
        }
      } else {
        if (totalRefundedAmount >= payment.amount) {
          throw new PaymentFailedException('Payment has already been fully refunded');
        }
      }
    }

    if (refundRequestDto.reason && refundRequestDto.reason.length > 500) {
      throw new PaymentFailedException('Refund reason cannot exceed 500 characters');
    }

    if (refundRequestDto.amount && refundRequestDto.amount <= 0) {
      throw new PaymentFailedException('Refund amount must be positive');
    }
  }

  private async calculateRefundAmount(paymentId: string, requestedAmount?: number): Promise<{
    amount: number;
    medalAmount: number;
  }> {
    const payment = await this.getPaymentById(paymentId);
    
    if (!payment) {
      throw new PaymentNotFoundException(`Payment ${paymentId} not found`);
    }

    const existingRefunds = await this.getRefundsByPayment(paymentId);
    const completedRefunds = existingRefunds.filter(
      refund => refund.status === RefundStatus.COMPLETED
    );
    
    const totalRefundedAmount = completedRefunds.reduce(
      (sum, refund) => sum + refund.amount,
      0
    );
    const totalRefundedMedals = completedRefunds.reduce(
      (sum, refund) => sum + refund.medalAmount,
      0
    );

    let refundAmount: number;
    let refundMedalAmount: number;

    if (requestedAmount) {
      refundAmount = requestedAmount;
      // Calculate proportional medal amount for partial refund
      refundMedalAmount = Math.floor(
        (payment.gachaCount * refundAmount) / payment.amount
      );
    } else {
      refundAmount = payment.amount - totalRefundedAmount;
      refundMedalAmount = payment.gachaCount - totalRefundedMedals;
    }

    if (refundAmount > payment.amount - totalRefundedAmount) {
      throw new PaymentFailedException(
        'Requested refund amount exceeds remaining refundable amount'
      );
    }

    return {
      amount: refundAmount,
      medalAmount: refundMedalAmount
    };
  }

  private async getRefundsByPayment(paymentId: string): Promise<Refund[]> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: refunds } = await adminClient
        .from('refunds')
        .select('*')
        .eq('payment_id', paymentId)
        .order('created_at', { ascending: false });

      return (refunds || []).map(refund => ({
        id: refund.id,
        paymentId: refund.payment_id,
        userId: refund.user_id,
        stripeRefundId: refund.stripe_refund_id,
        amount: refund.amount,
        medalAmount: refund.medal_amount,
        status: refund.status as RefundStatus,
        reason: refund.reason,
        approvedBy: refund.approved_by,
        approvedAt: refund.approved_at ? new Date(refund.approved_at) : undefined,
        rejectedBy: refund.rejected_by,
        rejectedAt: refund.rejected_at ? new Date(refund.rejected_at) : undefined,
        rejectionReason: refund.rejection_reason,
        processedBy: refund.processed_by,
        processedAt: refund.processed_at ? new Date(refund.processed_at) : undefined,
        createdAt: new Date(refund.created_at)
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get refunds for payment ${paymentId}: ${error.message}`,
        error.stack,
        'PaymentService'
      );
      throw error;
    }
  }
}