import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

export class GachaNotFoundException extends NotFoundException {
  constructor(gachaId: string) {
    super(`Gacha with ID ${gachaId} not found or not active`);
  }
}

export class InsufficientMedalsException extends BadRequestException {
  constructor(required: number, available: number) {
    super(`Insufficient medals: required ${required}, available ${available}`);
  }
}

export class GachaInactiveException extends ForbiddenException {
  constructor(gachaId?: string) {
    super(gachaId ? `Gacha ${gachaId} is not active` : 'Gacha is not active');
  }
}

export class MaxDrawsReachedException extends BadRequestException {
  constructor(gachaId?: string) {
    super(gachaId ? `Gacha ${gachaId} has reached maximum draws limit` : 'Maximum draws limit reached');
  }
}

export class GachaMaxDrawsReachedException extends BadRequestException {
  constructor(gachaId: string, maxDraws: number) {
    super(`Gacha ${gachaId} has reached maximum draws limit of ${maxDraws}`);
  }
}

export class InvalidDropRateException extends BadRequestException {
  constructor(message: string) {
    super(`Invalid drop rate configuration: ${message}`);
  }
}

export class GachaItemOutOfStockException extends BadRequestException {
  constructor(itemName: string) {
    super(`Gacha item '${itemName}' is out of stock`);
  }
}