import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { WebhookVerificationException } from '../exceptions/payment.exceptions';

export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, any>;
}

export interface StripeRefund {
  id: string;
  amount: number;
  payment_intent: string;
  status: string;
  reason?: string;
}

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly loggerService: CustomLoggerService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
    });
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
    payment_method_types?: string[];
  }): Promise<StripePaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency,
        payment_method_types: params.payment_method_types || ['card'],
        metadata: params.metadata || {},
      });

      this.loggerService.log(
        `Payment intent created: ${paymentIntent.id}`,
        'StripeService'
      );

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      this.loggerService.error(
        `Failed to create payment intent: ${error.message}`,
        error.stack,
        'StripeService'
      );
      throw error;
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      this.loggerService.debug(
        `Retrieved payment intent: ${paymentIntentId}`,
        'StripeService'
      );

      return {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      this.loggerService.error(
        `Failed to retrieve payment intent ${paymentIntentId}: ${error.message}`,
        error.stack,
        'StripeService'
      );
      throw error;
    }
  }

  async createRefund(params: {
    payment_intent: string;
    amount?: number;
    reason?: string;
  }): Promise<StripeRefund> {
    try {
      const refundOptions: Stripe.RefundCreateParams = {
        payment_intent: params.payment_intent,
      };

      if (params.amount) {
        refundOptions.amount = params.amount;
      }

      if (params.reason) {
        refundOptions.reason = 'requested_by_customer';
        refundOptions.metadata = { reason: params.reason };
      }

      const refund = await this.stripe.refunds.create(refundOptions);

      this.loggerService.log(
        `Refund created: ${refund.id} for payment intent ${params.payment_intent}`,
        'StripeService'
      );

      return {
        id: refund.id,
        amount: refund.amount,
        payment_intent: refund.payment_intent as string,
        status: refund.status,
        reason: refund.reason,
      };
    } catch (error) {
      this.loggerService.error(
        `Failed to create refund for payment intent ${params.payment_intent}: ${error.message}`,
        error.stack,
        'StripeService'
      );
      throw error;
    }
  }

  async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<any> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        secret || process.env.STRIPE_WEBHOOK_SECRET
      );

      this.loggerService.debug(
        `Webhook signature verified for event: ${event.id}`,
        'StripeService'
      );

      return event;
    } catch (error) {
      this.loggerService.error(
        `Webhook signature verification failed: ${error.message}`,
        error.stack,
        'StripeService'
      );
      throw new WebhookVerificationException(error.message);
    }
  }
}