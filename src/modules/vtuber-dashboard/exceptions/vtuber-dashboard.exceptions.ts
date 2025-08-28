import { 
  BadRequestException, 
  ConflictException, 
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException 
} from '@nestjs/common';

/**
 * Exception thrown when dashboard data is not found
 */
export class DashboardDataNotFoundException extends NotFoundException {
  constructor(vtuberId: string) {
    super(`Dashboard data not found for VTuber: ${vtuberId}`, 'DASHBOARD_DATA_NOT_FOUND');
  }
}

/**
 * Exception thrown when analytics data is unavailable
 */
export class AnalyticsDataUnavailableException extends BadRequestException {
  constructor(dataType: string) {
    super(`Analytics data unavailable: ${dataType}`, 'ANALYTICS_DATA_UNAVAILABLE');
  }
}

/**
 * Exception thrown when report generation fails
 */
export class ReportGenerationFailedException extends InternalServerErrorException {
  constructor(reason: string) {
    super(`Report generation failed: ${reason}`, 'REPORT_GENERATION_FAILED');
  }
}

/**
 * Exception thrown when data aggregation fails
 */
export class DataAggregationException extends InternalServerErrorException {
  constructor(operation: string, error?: string) {
    super(`Data aggregation failed during ${operation}${error ? `: ${error}` : ''}`, 'DATA_AGGREGATION_ERROR');
  }
}

/**
 * Exception thrown when user lacks dashboard access permissions
 */
export class InsufficientDashboardAccessException extends ForbiddenException {
  constructor(userId: string, resource: string) {
    super(`User ${userId} lacks access to dashboard resource: ${resource}`, 'INSUFFICIENT_DASHBOARD_ACCESS');
  }
}

/**
 * Exception thrown when report access is denied
 */
export class ReportAccessDeniedException extends ForbiddenException {
  constructor(reportId: string) {
    super(`Access denied to report: ${reportId}`, 'REPORT_ACCESS_DENIED');
  }
}

/**
 * Exception thrown when VTuber data access is not allowed
 */
export class VTuberDataAccessException extends ForbiddenException {
  constructor(userId: string, vtuberId: string) {
    super(`User ${userId} cannot access VTuber data: ${vtuberId}`, 'VTUBER_DATA_ACCESS_DENIED');
  }
}

/**
 * Exception thrown when dashboard service is unavailable
 */
export class DashboardServiceUnavailableException extends InternalServerErrorException {
  constructor(service: string) {
    super(`Dashboard service unavailable: ${service}`, 'DASHBOARD_SERVICE_UNAVAILABLE');
  }
}

/**
 * Exception thrown when analytics calculation fails
 */
export class AnalyticsCalculationException extends InternalServerErrorException {
  constructor(calculation: string, error?: string) {
    super(`Analytics calculation failed for ${calculation}${error ? `: ${error}` : ''}`, 'ANALYTICS_CALCULATION_ERROR');
  }
}

/**
 * Exception thrown when data synchronization fails
 */
export class DataSynchronizationException extends InternalServerErrorException {
  constructor(source: string, target: string) {
    super(`Data synchronization failed from ${source} to ${target}`, 'DATA_SYNCHRONIZATION_ERROR');
  }
}

/**
 * Exception thrown when dashboard cache operations fail
 */
export class DashboardCacheException extends InternalServerErrorException {
  constructor(operation: string) {
    super(`Dashboard cache operation failed: ${operation}`, 'DASHBOARD_CACHE_ERROR');
  }
}

/**
 * Exception thrown when report storage limit is exceeded
 */
export class ReportStorageLimitException extends ConflictException {
  constructor(userId: string, limit: number) {
    super(`Report storage limit exceeded for user ${userId}. Limit: ${limit}`, 'REPORT_STORAGE_LIMIT_EXCEEDED');
  }
}