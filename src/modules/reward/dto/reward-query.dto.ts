import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { RewardCategory } from '../enums/reward-category.enum';

export class RewardQueryDto {
  @ApiProperty({ description: 'Page number', required: false, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ description: 'Filter by VTuber ID', required: false })
  @IsOptional()
  @IsString()
  vtuberId?: string;

  @ApiProperty({ 
    description: 'Filter by category', 
    enum: RewardCategory,
    required: false 
  })
  @IsOptional()
  @IsEnum(RewardCategory)
  category?: RewardCategory;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class UserRewardQueryDto {
  @ApiProperty({ description: 'Page number', required: false, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ 
    description: 'Filter by category', 
    enum: RewardCategory,
    required: false 
  })
  @IsOptional()
  @IsEnum(RewardCategory)
  category?: RewardCategory;

  @ApiProperty({ description: 'Filter by VTuber ID', required: false })
  @IsOptional()
  @IsString()
  vtuberId?: string;

  @ApiProperty({ description: 'Search by reward name', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}