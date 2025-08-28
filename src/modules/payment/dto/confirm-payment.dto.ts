import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty({ 
    description: 'Stripe Payment Intent ID',
    example: 'pi_1234567890abcdef'
  })
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @ApiProperty({ 
    description: 'Idempotency key for duplicate prevention',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsString()
  @IsUUID()
  idempotencyKey: string;
}