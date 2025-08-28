import { HttpException, HttpStatus } from '@nestjs/common';

export class PushMedalServiceException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class InsufficientPushMedalBalanceException extends PushMedalServiceException {
  constructor(requested: number, available: number) {
    super(
      `Insufficient push medal balance. Requested: ${requested}, Available: ${available}`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class PushMedalBalanceNotFoundException extends PushMedalServiceException {
  constructor(userId: string, vtuberId?: string) {
    const vtuberInfo = vtuberId ? ` for VTuber ${vtuberId}` : ' (pool balance)';
    super(`Push medal balance not found for user ${userId}${vtuberInfo}`, HttpStatus.NOT_FOUND);
  }
}

export class InvalidPushMedalAmountException extends PushMedalServiceException {
  constructor(amount: number) {
    super(`Invalid push medal amount: ${amount}. Amount must be positive.`, HttpStatus.BAD_REQUEST);
  }
}

export class PushMedalTransactionFailedException extends PushMedalServiceException {
  constructor(reason: string) {
    super(`Push medal transaction failed: ${reason}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class VTuberNotFoundException extends PushMedalServiceException {
  constructor(vtuberId: string) {
    super(`VTuber ${vtuberId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedPushMedalOperationException extends PushMedalServiceException {
  constructor(operation: string) {
    super(`Unauthorized push medal operation: ${operation}`, HttpStatus.FORBIDDEN);
  }
}