import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminAdjustBalanceDto {
  @ApiProperty({
    description: 'User ID whose balance to adjust',
    example: 'user-123'
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'VTuber ID for specific balance, or null for pool balance',
    example: 'vtuber-001',
    required: false
  })
  @IsOptional()
  @IsUUID()
  vtuberId?: string;

  @ApiProperty({
    description: 'Amount to adjust (positive to add, negative to subtract)',
    example: 50
  })
  @IsInt()
  amount: number;

  @ApiProperty({
    description: 'Reason for balance adjustment',
    example: 'Compensation for system error'
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}