import { BadRequestException, NotFoundException } from '@nestjs/common';

export class ExchangeItemNotFoundException extends NotFoundException {
  constructor(itemId: string) {
    super(`Exchange item with ID ${itemId} not found`, 'EXCHANGE_ITEM_NOT_FOUND');
  }
}

export class InsufficientMedalBalanceException extends BadRequestException {
  constructor(userId: string, required: number, current: number) {
    super(
      `Insufficient medal balance for user ${userId}. Required: ${required}, Current: ${current}`,
      'INSUFFICIENT_MEDAL_BALANCE'
    );
  }
}

export class ExchangeItemOutOfStockException extends BadRequestException {
  constructor(itemId: string) {
    super(`Exchange item ${itemId} is out of stock`, 'EXCHANGE_ITEM_OUT_OF_STOCK');
  }
}

export class ExchangeLimitExceededException extends BadRequestException {
  constructor(limitType: string, limit: number) {
    super(`Exchange ${limitType} limit of ${limit} exceeded`, 'EXCHANGE_LIMIT_EXCEEDED');
  }
}

export class ExchangePeriodExpiredException extends BadRequestException {
  constructor(itemId: string) {
    super(`Exchange period for item ${itemId} has expired`, 'EXCHANGE_PERIOD_EXPIRED');
  }
}

export class DuplicateExchangeException extends BadRequestException {
  constructor(userId: string, itemId: string) {
    super(`Duplicate exchange attempt by user ${userId} for item ${itemId}`, 'DUPLICATE_EXCHANGE');
  }
}

export class ExchangeTransactionFailedException extends BadRequestException {
  constructor(reason: string) {
    super(`Exchange transaction failed: ${reason}`, 'EXCHANGE_TRANSACTION_FAILED');
  }
}

export class InvalidExchangeRequestException extends BadRequestException {
  constructor(reason: string) {
    super(`Invalid exchange request: ${reason}`, 'INVALID_EXCHANGE_REQUEST');
  }
}