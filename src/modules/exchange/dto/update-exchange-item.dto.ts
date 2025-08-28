import { PartialType } from '@nestjs/mapped-types';
import { CreateExchangeItemDto } from './create-exchange-item.dto';
import { IsOptional } from 'class-validator';

export class UpdateExchangeItemDto extends PartialType(CreateExchangeItemDto) {
  @IsOptional()
  vtuberId?: string;
}