import { ArrayMinSize, IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGachaItemDto {
  @ApiProperty({ description: 'Reward ID', example: 'reward-123' })
  @IsString()
  @IsNotEmpty()
  rewardId: string;

  @ApiProperty({ description: 'Item name', example: 'Rare Photo Card' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Item description', example: 'Limited edition photo card' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Item rarity', enum: ['common', 'rare', 'epic', 'legendary'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['common', 'rare', 'epic', 'legendary'])
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  @ApiProperty({ description: 'Drop rate (0.0-1.0)', example: 0.1 })
  @IsNumber()
  @Min(0)
  dropRate: number;

  @ApiProperty({ description: 'Maximum drop count', example: 100, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCount?: number;

  @ApiProperty({ description: 'Item image URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateGachaDto {
  @ApiProperty({ description: 'Gacha name', example: 'Summer Special Gacha' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Gacha description', example: 'Limited summer themed gacha with exclusive items' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Gacha price in yen', example: 1000 })
  @IsNumber()
  @Min(1)
  price: number;

  @ApiProperty({ description: 'Medal reward per draw', example: 10 })
  @IsNumber()
  @Min(1)
  medalReward: number;

  @ApiProperty({ description: 'Gacha start date', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Gacha end date', example: '2025-12-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Maximum total draws allowed', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxDraws?: number;

  @ApiProperty({ description: 'Gacha image URL', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'VTuber ID (Admin only)', required: false })
  @IsOptional()
  @IsString()
  vtuberId?: string;

  @ApiProperty({ description: 'Gacha items', type: [CreateGachaItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGachaItemDto)
  items: CreateGachaItemDto[];
}