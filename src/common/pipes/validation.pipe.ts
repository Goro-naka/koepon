import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class CustomValidationPipe implements PipeTransform<unknown> {
  constructor(private readonly logger: CustomLoggerService) {}

  async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      transform: true, // Transform to class instance
      validateCustomDecorators: true,
    });

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        const constraints = error.constraints;
        return constraints ? Object.values(constraints).join(', ') : '';
      }).filter(msg => msg);

      // Log validation errors for security monitoring
      this.logger.logSecurityEvent('VALIDATION_ERROR', {
        errors: errorMessages,
        value: this.sanitizeValue(value),
      });

      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
        statusCode: 400,
      });
    }

    return object;
  }

  private toValidate(metatype: Function | undefined): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'object' && value !== null) {
      const sanitized = { ...value };
      // Remove sensitive fields from logs
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      return sanitized;
    }
    return value;
  }
}