import { IsDateString, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminActionStatus, AdminActionType, AdminTargetType } from '../entities/admin-action.entity';
import { SystemMetricType } from '../entities/system-metrics.entity';

export class AdminQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  adminUserId?: string;

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

export class UserManagementDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'])
  status?: string;

  @IsOptional()
  @IsIn(['USER', 'VTUBER', 'ADMIN'])
  role?: string;

  @IsOptional()
  @IsDateString()
  registeredAfter?: string;

  @IsOptional()
  @IsDateString()
  registeredBefore?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}

export class VTuberManagementDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE'])
  status?: string;

  @IsOptional()
  @IsDateString()
  appliedAfter?: string;

  @IsOptional()
  @IsDateString()
  appliedBefore?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}

export class AuditLogQueryDto {
  @IsOptional()
  @IsEnum(AdminActionType)
  actionType?: AdminActionType;

  @IsOptional()
  @IsEnum(AdminTargetType)
  targetType?: AdminTargetType;

  @IsOptional()
  @IsUUID()
  adminUserId?: string;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsEnum(AdminActionStatus)
  status?: AdminActionStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 50;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}

export class SystemMetricsQueryDto {
  @IsOptional()
  @IsEnum(SystemMetricType)
  metricType?: SystemMetricType;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsIn(['NORMAL', 'WARNING', 'CRITICAL'])
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 100;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}

export class UserActionDto {
  @IsIn(['SUSPEND', 'UNSUSPEND', 'DELETE', 'CHANGE_ROLE'])
  action: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsIn(['USER', 'VTUBER', 'ADMIN'])
  newRole?: string;
}

export class VTuberActionDto {
  @IsIn(['APPROVE', 'REJECT', 'CHANGE_STATUS'])
  action: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  newStatus?: string;
}

export class ContentManagementDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'DRAFT'])
  status?: string;

  @IsOptional()
  @IsUUID()
  vtuberId?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;
}