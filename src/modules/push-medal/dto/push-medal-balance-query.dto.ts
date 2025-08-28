import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PushMedalBalanceQueryDto {
  @ApiProperty({
    description: 'VTuber ID to get balance for (optional - if not provided, returns all balances)',
    example: 'vtuber-001',
    required: false
  })
  @IsOptional()
  @IsUUID()
  vtuberId?: string;
}