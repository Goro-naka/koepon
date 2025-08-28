import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../interfaces/payment.interface';

export class PaymentHistoryQueryDto {
  @ApiProperty({ description: 'Page number', example: 1, minimum: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Items per page', 
    example: 10, 
    minimum: 1, 
    maximum: 100,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ 
    description: 'Payment status to filter by', 
    enum: PaymentStatus,
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(Object.values(PaymentStatus))
  status?: PaymentStatus;

  @ApiProperty({ 
    description: 'Start date for filtering (ISO format)',
    example: '2025-01-01T00:00:00Z',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ 
    description: 'End date for filtering (ISO format)',
    example: '2025-12-31T23:59:59Z',
    required: false 
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}