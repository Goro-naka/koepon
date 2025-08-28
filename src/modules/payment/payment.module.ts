import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { DatabaseModule } from '../database/database.module';
import { StripeService } from './services/stripe.service';
import { IdempotencyService } from './services/idempotency.service';
import { RefundService } from './services/refund.service';
import { WebhookService } from './services/webhook.service';
import { CustomLoggerService } from '../../common/logger/logger.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    StripeService,
    IdempotencyService,
    RefundService,
    WebhookService,
    CustomLoggerService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}