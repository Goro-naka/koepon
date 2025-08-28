import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentServiceException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class InvalidGachaException extends PaymentServiceException {
  constructor(gachaId: string) {
    super(`Invalid gacha: ${gachaId}`, HttpStatus.BAD_REQUEST);
  }
}

export class PaymentNotFoundException extends PaymentServiceException {
  constructor(paymentId: string) {
    super(`Payment not found: ${paymentId}`, HttpStatus.NOT_FOUND);
  }
}

export class PaymentAlreadyProcessedException extends PaymentServiceException {
  constructor(paymentId: string) {
    super(`Payment already processed: ${paymentId}`, HttpStatus.CONFLICT);
  }
}

export class PaymentAlreadyConfirmedException extends PaymentServiceException {
  constructor(paymentId: string) {
    super(`Payment already confirmed: ${paymentId}`, HttpStatus.CONFLICT);
  }
}

export class PaymentFailedException extends PaymentServiceException {
  constructor(message: string) {
    super(`Payment failed: ${message}`, HttpStatus.BAD_REQUEST);
  }
}

export class InsufficientBalanceException extends PaymentServiceException {
  constructor() {
    super('Insufficient medal balance for refund', HttpStatus.BAD_REQUEST);
  }
}

export class RefundNotAllowedException extends PaymentServiceException {
  constructor(reason: string) {
    super(`Refund not allowed: ${reason}`, HttpStatus.BAD_REQUEST);
  }
}

export class StripeServiceException extends PaymentServiceException {
  constructor(message: string) {
    super(`Payment service error: ${message}`, HttpStatus.SERVICE_UNAVAILABLE);
  }
}

export class WebhookVerificationException extends PaymentServiceException {
  constructor() {
    super('Invalid webhook signature', HttpStatus.FORBIDDEN);
  }
}

export class IdempotencyKeyException extends PaymentServiceException {
  constructor() {
    super('Duplicate request detected', HttpStatus.CONFLICT);
  }
}