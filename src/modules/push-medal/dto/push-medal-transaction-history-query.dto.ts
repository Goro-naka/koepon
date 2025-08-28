import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PushMedalTransactionType } from '../interfaces/push-medal.interface';

export class PushMedalTransactionHistoryQueryDto {
  @ApiProperty({
    description: 'VTuber ID to filter transactions (optional)',
    example: 'vtuber-001',
    required: false
  })
  @IsOptional()
  @IsUUID()
  vtuberId?: string;

  @ApiProperty({
    description: 'Transaction type to filter by',
    example: 'GACHA_REWARD',
    enum: PushMedalTransactionType,
    required: false
  })
  @IsOptional()
  @IsEnum(PushMedalTransactionType)
  transactionType?: PushMedalTransactionType;

  @ApiProperty({
    description: 'Number of transactions to return',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Number of transactions to skip',
    example: 0,
    default: 0,
    minimum: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiProperty({
    description: 'Start date for filtering transactions (ISO format)',
    example: '2024-01-01T00:00:00.000Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    description: 'End date for filtering transactions (ISO format)',
    example: '2024-12-31T23:59:59.999Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}