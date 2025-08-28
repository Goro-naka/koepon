import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GachaQueryDto {
  @ApiProperty({ description: 'VTuber ID to filter by', required: false })
  @IsOptional()
  @IsString()
  vtuberId?: string;

  @ApiProperty({ 
    description: 'Gacha status to filter by', 
    enum: ['active', 'inactive', 'ended'],
    required: false 
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'ended'])
  status?: 'active' | 'inactive' | 'ended';

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
    maximum: 50,
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}