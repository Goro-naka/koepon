import { Injectable, Inject } from '@nestjs/common';
import { validate as uuidValidate, v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { CustomLoggerService } from '../../../common/logger/logger.service';

@Injectable()
export class IdempotencyService {
  private redis: Redis | null = null;
  private redisConnected = false;

  constructor(@Inject(CustomLoggerService) private readonly loggerService: CustomLoggerService) {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('error', (error) => {
        this.redisConnected = false;
        if (this.loggerService) {
          this.loggerService.warn(
            'Redis connection error - operating without Redis cache',
            'IdempotencyService'
          );
        }
      });

      this.redis.on('connect', () => {
        this.redisConnected = true;
        if (this.loggerService) {
          this.loggerService.log('Redis connected successfully', 'IdempotencyService');
        }
      });
    } catch (error) {
      this.redisConnected = false;
      if (this.loggerService) {
        this.loggerService.warn('Failed to initialize Redis - operating without Redis cache', 'IdempotencyService');
      }
    }
  }

  generateKey(): string {
    const key = uuidv4();
    this.loggerService.debug(`Generated idempotency key: ${key}`, 'IdempotencyService');
    return key;
  }

  async setCache(key: string, data: any, ttlSeconds: number = 86400): Promise<void> {
    if (!this.redis || !this.redisConnected) {
      this.loggerService.warn(`Cannot set cache for key ${key} - Redis not available`, 'IdempotencyService');
      return;
    }

    try {
      const serializedData = JSON.stringify(data);
      await this.redis.setex(`idempotency:${key}`, ttlSeconds, serializedData);
      
      this.loggerService.debug(
        `Cache set for key: ${key} with TTL: ${ttlSeconds}s`,
        'IdempotencyService'
      );
    } catch (error) {
      this.loggerService.warn(
        `Failed to set cache for key ${key}: ${error.message} - continuing without cache`,
        'IdempotencyService'
      );
      // Don't throw error, just log and continue
    }
  }

  async getCache<T>(key: string): Promise<T | null> {
    if (!this.redis || !this.redisConnected) {
      this.loggerService.debug(`Cannot get cache for key ${key} - Redis not available`, 'IdempotencyService');
      return null;
    }

    try {
      const cachedData = await this.redis.get(`idempotency:${key}`);
      
      if (!cachedData) {
        this.loggerService.debug(`Cache miss for key: ${key}`, 'IdempotencyService');
        return null;
      }

      const data = JSON.parse(cachedData) as T;
      this.loggerService.debug(`Cache hit for key: ${key}`, 'IdempotencyService');
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        this.loggerService.warn(
          `Invalid JSON in cache for key ${key}, returning null`,
          'IdempotencyService'
        );
        return null;
      }

      this.loggerService.error(
        `Failed to get cache for key ${key}: ${error.message}`,
        error.stack,
        'IdempotencyService'
      );
      throw error;
    }
  }

  async deleteCache(key: string): Promise<void> {
    try {
      const deletedCount = await this.redis.del(`idempotency:${key}`);
      
      this.loggerService.debug(
        `Cache deleted for key: ${key} (${deletedCount} keys removed)`,
        'IdempotencyService'
      );
    } catch (error) {
      this.loggerService.error(
        `Failed to delete cache for key ${key}: ${error.message}`,
        error.stack,
        'IdempotencyService'
      );
      throw error;
    }
  }

  async checkAndSetIdempotency(key: string, data: any): Promise<any> {
    try {
      const existingData = await this.getCache(key);
      
      if (existingData) {
        this.loggerService.log(
          `Idempotency key ${key} already exists, returning cached data`,
          'IdempotencyService'
        );
        return existingData;
      }

      await this.setCache(key, data);
      this.loggerService.log(
        `New idempotency key ${key} set with data`,
        'IdempotencyService'
      );
      
      return data;
    } catch (error) {
      this.loggerService.error(
        `Failed to check and set idempotency for key ${key}: ${error.message}`,
        error.stack,
        'IdempotencyService'
      );
      throw error;
    }
  }
}