import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ 
    description: 'Gacha ID to purchase',
    example: 'gacha-vtuber-001-special'
  })
  @IsString()
  @IsNotEmpty()
  gachaId: string;

  @ApiProperty({ 
    description: 'Gacha type - single pull or ten pull',
    example: 'single',
    enum: ['single', 'ten_pull']
  })
  @IsEnum(['single', 'ten_pull'])
  gachaType: 'single' | 'ten_pull';

  @ApiProperty({ 
    description: 'Preferred payment method',
    example: 'card',
    required: false 
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ 
    description: 'Return URL after payment completion',
    example: 'https://koepon.com/gacha/result',
    required: false 
  })
  @IsOptional()
  @IsUrl()
  returnUrl?: string;
}