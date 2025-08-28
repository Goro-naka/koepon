import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  vtuberId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  includeInactive?: boolean;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}

export class GenerateReportDto {
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM'])
  reportType: string;

  @IsOptional()
  @IsUUID()
  vtuberId?: string;

  @IsIn(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'])
  periodType: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsIn(['PRIVATE', 'VTUBER_ONLY', 'ADMIN_ONLY', 'SHARED'])
  visibility?: string = 'PRIVATE';

  @IsOptional()
  @IsUUID('4', { each: true })
  sharedWith?: string[] = [];
}

export class RevenueAnalyticsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  vtuberId?: string;

  @IsOptional()
  @IsIn(['total', 'gacha', 'medal'])
  revenueType?: 'total' | 'gacha' | 'medal';

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: 'day' | 'week' | 'month' = 'day';
}

export class GachaAnalyticsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  vtuberId?: string;

  @IsOptional()
  @IsUUID()
  gachaId?: string;

  @IsOptional()
  @IsIn(['plays', 'revenue', 'users'])
  metricType?: 'plays' | 'revenue' | 'users' = 'plays';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  topN?: number = 10;
}

export class UserAnalyticsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  vtuberId?: string;

  @IsOptional()
  @IsIn(['retention', 'conversion', 'behavior', 'churn'])
  analysisType?: 'retention' | 'conversion' | 'behavior' | 'churn' = 'behavior';

  @IsOptional()
  @IsIn(['new', 'returning', 'all'])
  userSegment?: 'new' | 'returning' | 'all' = 'all';
}