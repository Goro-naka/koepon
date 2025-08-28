import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRewardDto {
  @ApiProperty({ description: 'Reward name', example: 'Exclusive Photo Set' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Reward description', example: 'Limited edition photo collection' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    description: 'Daily download limit', 
    example: 3,
    minimum: 1,
    maximum: 10,
    required: false 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  downloadLimit?: number;

  @ApiProperty({ description: 'VTuber ID (Admin only)', required: false })
  @IsOptional()
  @IsString()
  vtuberId?: string;
}