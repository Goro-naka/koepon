import { Inject, Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject('THROTTLER_OPTIONS') options: ThrottlerOptions,
    private readonly logger: CustomLoggerService
  ) {
    super(options);
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    
    // Log rate limiting event for security monitoring
    this.logger.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: request.ip,
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    await super.throwThrottlingException(context);
  }
}