import { Injectable } from '@nestjs/common';
import { WebhookEvent } from '../interfaces/payment.interface';
import { StripeService } from './stripe.service';
import { IdempotencyService } from './idempotency.service';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { WebhookVerificationException } from '../exceptions/payment.exceptions';

@Injectable()
export class WebhookService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly idempotencyService: IdempotencyService,
    private readonly loggerService: CustomLoggerService
  ) {}

  async handleWebhookEvent(payload: string, signature: string): Promise<{ verified: boolean }> {
    try {
      const isSignatureValid = await this.verifySignature(payload, signature);
      if (!isSignatureValid) {
        throw new WebhookVerificationException('Invalid webhook signature');
      }

      let event: WebhookEvent;
      try {
        const parsedEvent = JSON.parse(payload);
        event = {
          id: parsedEvent.id,
          type: parsedEvent.type,
          data: parsedEvent.data,
          created: parsedEvent.created,
        };
      } catch (error) {
        this.loggerService.error(
          'Failed to parse webhook payload',
          error.stack,
          'WebhookService'
        );
        throw new Error('Invalid webhook payload format');
      }

      if (await this.isEventProcessed(event.id)) {
        this.loggerService.log(
          `Webhook event ${event.id} already processed, skipping`,
          'WebhookService'
        );
        return { verified: true };
      }

      await this.processWebhookEvent(event);
      await this.markEventProcessed(event.id);

      this.loggerService.log(
        `Webhook event ${event.id} processed successfully`,
        'WebhookService'
      );

      return { verified: true };
    } catch (error) {
      this.loggerService.error(
        `Failed to handle webhook event: ${error.message}`,
        error.stack,
        'WebhookService'
      );
      throw error;
    }
  }

  private async processWebhookEvent(event: WebhookEvent): Promise<void> {
    this.loggerService.log(
      `Processing webhook event: ${event.type}`,
      'WebhookService'
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.processPaymentIntentSucceeded(event);
        break;
      case 'payment_intent.payment_failed':
        await this.processPaymentIntentFailed(event);
        break;
      case 'payment_intent.canceled':
        await this.processPaymentIntentCanceled(event);
        break;
      default:
        this.loggerService.debug(
          `Unknown webhook event type: ${event.type}, ignoring`,
          'WebhookService'
        );
        break;
    }
  }

  private async processPaymentIntentSucceeded(event: WebhookEvent): Promise<void> {
    try {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata?.user_id;
      const medalAmount = parseInt(paymentIntent.metadata?.medal_amount || '0');

      if (!userId || !medalAmount) {
        this.loggerService.warn(
          `Missing metadata in payment intent ${paymentIntent.id}`,
          'WebhookService'
        );
        return;
      }

      this.loggerService.log(
        `Payment succeeded for user ${userId}: ${medalAmount} medals`,
        'WebhookService'
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to process payment_intent.succeeded: ${error.message}`,
        error.stack,
        'WebhookService'
      );
      throw error;
    }
  }

  private async processPaymentIntentFailed(event: WebhookEvent): Promise<void> {
    try {
      const paymentIntent = event.data.object;
      const errorMessage = paymentIntent.last_payment_error?.message || 'Unknown error';

      this.loggerService.warn(
        `Payment failed for intent ${paymentIntent.id}: ${errorMessage}`,
        'WebhookService'
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to process payment_intent.payment_failed: ${error.message}`,
        error.stack,
        'WebhookService'
      );
      throw error;
    }
  }

  private async processPaymentIntentCanceled(event: WebhookEvent): Promise<void> {
    try {
      const paymentIntent = event.data.object;

      this.loggerService.log(
        `Payment canceled for intent ${paymentIntent.id}`,
        'WebhookService'
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to process payment_intent.canceled: ${error.message}`,
        error.stack,
        'WebhookService'
      );
      throw error;
    }
  }

  private async verifySignature(payload: string, signature: string): Promise<boolean> {
    try {
      await this.stripeService.verifyWebhookSignature(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      return true;
    } catch (error) {
      this.loggerService.error(
        `Webhook signature verification failed: ${error.message}`,
        error.stack,
        'WebhookService'
      );
      return false;
    }
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    try {
      const cached = await this.idempotencyService.getCache(`webhook:${eventId}`);
      return cached !== null;
    } catch (error) {
      this.loggerService.error(
        `Failed to check if event ${eventId} was processed: ${error.message}`,
        error.stack,
        'WebhookService'
      );
      return false;
    }
  }

  private async markEventProcessed(eventId: string): Promise<void> {
    try {
      await this.idempotencyService.setCache(
        `webhook:${eventId}`,
        { processed: true, timestamp: new Date().toISOString() },
        86400 // 24 hours
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to mark event ${eventId} as processed: ${error.message}`,
        error.stack,
        'WebhookService'
      );
      throw error;
    }
  }
}