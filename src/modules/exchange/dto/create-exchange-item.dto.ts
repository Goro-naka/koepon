import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUrl, Length, Matches, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ExchangeCategory } from '../enums/exchange-category.enum';

export class CreateExchangeItemDto {
  @IsString()
  @Length(1, 255)
  @Matches(/^[a-zA-Z0-9\-_]+$/, { message: 'VTuber ID must contain only alphanumeric characters, hyphens, and underscores' })
  vtuberId: string;

  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value.trim())
  name: string;

  @IsString()
  @Length(1, 2000)
  @Transform(({ value }) => value.trim())
  description: string;

  @IsEnum(ExchangeCategory)
  category: ExchangeCategory;

  @IsNumber()
  @Min(1)
  @Max(100000)
  @Type(() => Number)
  medalCost: number;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  @Type(() => Number)
  totalStock: number;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  dailyLimit: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  userLimit: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean = true;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsUrl()
  @Length(1, 500)
  imageUrl?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}