import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundRequestDto {
  @ApiProperty({ 
    description: 'Payment ID to refund',
    example: 'pay_1234567890'
  })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiProperty({ 
    description: 'Reason for refund',
    example: 'Product not as described',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;

  @ApiProperty({ 
    description: 'Refund amount in cents (optional for partial refund)',
    example: 12000,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}