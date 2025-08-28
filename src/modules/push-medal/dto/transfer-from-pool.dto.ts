import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferFromPoolDto {
  @ApiProperty({
    description: 'Source VTuber ID (if transferring between VTubers) or null for pool balance',
    example: 'vtuber-001',
    required: false
  })
  @IsOptional()
  @IsUUID()
  fromVtuberId?: string;

  @ApiProperty({
    description: 'Target VTuber ID to transfer push medals to',
    example: 'vtuber-002'
  })
  @IsUUID()
  toVtuberId: string;

  @ApiProperty({
    description: 'Amount of push medals to transfer',
    example: 100,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  amount: number;
}