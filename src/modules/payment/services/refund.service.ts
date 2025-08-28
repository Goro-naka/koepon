import { Injectable } from '@nestjs/common';
import { RefundRequestDto } from '../dto/refund-request.dto';
import { PaymentStatus, Refund, RefundRequestResponse, RefundStatus } from '../interfaces/payment.interface';
import { StripeService } from './stripe.service';
import { DatabaseService } from '../../database/database.service';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import {
  InsufficientBalanceException,
  PaymentNotFoundException,
  RefundNotAllowedException
} from '../exceptions/payment.exceptions';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RefundService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly databaseService: DatabaseService,
    private readonly loggerService: CustomLoggerService
  ) {}
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

      this.loggerService.log(
        `Refund request created: ${refundId} for payment ${refundRequestDto.paymentId}`,
        'RefundService'
      );

      return {
        id: refundId,
        paymentId: refundRequestDto.paymentId,
        amount: refundAmount.amount,
        medalAmount: refundAmount.medalAmount,
        status: RefundStatus.PENDING,
        reason: refundRequestDto.reason
      };
    } catch (error) {
      this.loggerService.error(
        `Failed to create refund request: ${error.message}`,
        error.stack,
        'RefundService'
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
        throw new RefundNotAllowedException('Refund must be approved before processing');
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

      await adminClient
        .from('users')
        .update({
          medal_balance: adminClient.raw(`medal_balance - ${refund.medal_amount}`)
        })
        .eq('id', refund.user_id);

      this.loggerService.log(
        `Refund ${refundId} processed successfully by admin ${adminId}`,
        'RefundService'
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to process refund ${refundId}: ${error.message}`,
        error.stack,
        'RefundService'
      );
      throw error;
    }
  }

  async approveRefund(refundId: string, adminId: string): Promise<void> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: refund } = await adminClient
        .from('refunds')
        .select('*')
        .eq('id', refundId)
        .single();

      if (!refund) {
        throw new PaymentNotFoundException(`Refund ${refundId} not found`);
      }

      if (refund.status !== RefundStatus.PENDING) {
        throw new RefundNotAllowedException('Only pending refunds can be approved');
      }

      await adminClient
        .from('refunds')
        .update({
          status: RefundStatus.APPROVED,
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', refundId);

      this.loggerService.log(
        `Refund ${refundId} approved by admin ${adminId}`,
        'RefundService'
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to approve refund ${refundId}: ${error.message}`,
        error.stack,
        'RefundService'
      );
      throw error;
    }
  }

  async rejectRefund(refundId: string, adminId: string, reason: string): Promise<void> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: refund } = await adminClient
        .from('refunds')
        .select('*')
        .eq('id', refundId)
        .single();

      if (!refund) {
        throw new PaymentNotFoundException(`Refund ${refundId} not found`);
      }

      if (refund.status !== RefundStatus.PENDING) {
        throw new RefundNotAllowedException('Only pending refunds can be rejected');
      }

      await adminClient
        .from('refunds')
        .update({
          status: RefundStatus.REJECTED,
          rejected_by: adminId,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', refundId);

      this.loggerService.log(
        `Refund ${refundId} rejected by admin ${adminId}: ${reason}`,
        'RefundService'
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to reject refund ${refundId}: ${error.message}`,
        error.stack,
        'RefundService'
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
        amount: refund.amount,
        medalAmount: refund.medal_amount,
        reason: refund.reason,
        status: refund.status as RefundStatus,
        stripeRefundId: refund.stripe_refund_id,
        createdAt: new Date(refund.created_at),
        approvedBy: refund.approved_by,
        approvedAt: refund.approved_at ? new Date(refund.approved_at) : undefined,
        rejectedBy: refund.rejected_by,
        rejectedAt: refund.rejected_at ? new Date(refund.rejected_at) : undefined,
        rejectionReason: refund.rejection_reason,
        processedBy: refund.processed_by,
        processedAt: refund.processed_at ? new Date(refund.processed_at) : undefined
      };
    } catch (error) {
      this.loggerService.error(
        `Failed to get refund ${refundId}: ${error.message}`,
        error.stack,
        'RefundService'
      );
      throw error;
    }
  }

  async getRefundsByPayment(paymentId: string): Promise<Refund[]> {
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
        amount: refund.amount,
        medalAmount: refund.medal_amount,
        reason: refund.reason,
        status: refund.status as RefundStatus,
        stripeRefundId: refund.stripe_refund_id,
        createdAt: new Date(refund.created_at),
        approvedBy: refund.approved_by,
        approvedAt: refund.approved_at ? new Date(refund.approved_at) : undefined,
        rejectedBy: refund.rejected_by,
        rejectedAt: refund.rejected_at ? new Date(refund.rejected_at) : undefined,
        rejectionReason: refund.rejection_reason,
        processedBy: refund.processed_by,
        processedAt: refund.processed_at ? new Date(refund.processed_at) : undefined
      }));
    } catch (error) {
      this.loggerService.error(
        `Failed to get refunds for payment ${paymentId}: ${error.message}`,
        error.stack,
        'RefundService'
      );
      throw error;
    }
  }

  async getRefundsByUser(userId: string): Promise<Refund[]> {
    try {
      const adminClient = this.databaseService.getAdminClient();
      
      const { data: refunds } = await adminClient
        .from('refunds')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return (refunds || []).map(refund => ({
        id: refund.id,
        paymentId: refund.payment_id,
        userId: refund.user_id,
        amount: refund.amount,
        medalAmount: refund.medal_amount,
        reason: refund.reason,
        status: refund.status as RefundStatus,
        stripeRefundId: refund.stripe_refund_id,
        createdAt: new Date(refund.created_at),
        approvedBy: refund.approved_by,
        approvedAt: refund.approved_at ? new Date(refund.approved_at) : undefined,
        rejectedBy: refund.rejected_by,
        rejectedAt: refund.rejected_at ? new Date(refund.rejected_at) : undefined,
        rejectionReason: refund.rejection_reason,
        processedBy: refund.processed_by,
        processedAt: refund.processed_at ? new Date(refund.processed_at) : undefined
      }));
    } catch (error) {
      this.loggerService.error(
        `Failed to get refunds for user ${userId}: ${error.message}`,
        error.stack,
        'RefundService'
      );
      throw error;
    }
  }

  private async validateRefundRequest(
    userId: string,
    refundRequestDto: RefundRequestDto
  ): Promise<void> {
    const adminClient = this.databaseService.getAdminClient();
    
    const { data: payment } = await adminClient
      .from('payments')
      .select('*')
      .eq('id', refundRequestDto.paymentId)
      .single();
    
    if (!payment) {
      throw new PaymentNotFoundException(`Payment ${refundRequestDto.paymentId} not found`);
    }

    if (payment.user_id !== userId) {
      throw new RefundNotAllowedException('You can only request refunds for your own payments');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new RefundNotAllowedException('Only completed payments can be refunded');
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
          throw new RefundNotAllowedException(
            'Requested refund amount exceeds remaining refundable amount'
          );
        }
      } else {
        if (totalRefundedAmount >= payment.amount) {
          throw new RefundNotAllowedException('Payment has already been fully refunded');
        }
      }
    }

    if (refundRequestDto.reason && refundRequestDto.reason.length > 500) {
      throw new RefundNotAllowedException('Refund reason cannot exceed 500 characters');
    }

    if (refundRequestDto.amount && refundRequestDto.amount <= 0) {
      throw new RefundNotAllowedException('Refund amount must be positive');
    }
  }

  private async calculateRefundAmount(paymentId: string, requestedAmount?: number): Promise<{
    amount: number;
    medalAmount: number;
  }> {
    const adminClient = this.databaseService.getAdminClient();
    
    const { data: payment } = await adminClient
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
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
      refundMedalAmount = Math.floor(
        (payment.medal_amount * refundAmount) / payment.amount
      );
    } else {
      refundAmount = payment.amount - totalRefundedAmount;
      refundMedalAmount = payment.medal_amount - totalRefundedMedals;
    }

    if (refundAmount > payment.amount - totalRefundedAmount) {
      throw new InsufficientBalanceException(
        'Requested refund amount exceeds remaining refundable amount'
      );
    }

    return {
      amount: refundAmount,
      medalAmount: refundMedalAmount
    };
  }
}