import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomLoggerService } from './common/logger/logger.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.vercel', '.env.local', '.env', '.env.supabase'],
      cache: true,
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'),
        limit: parseInt(process.env.RATE_LIMIT_MAX ?? '1000'),
      },
    ]),
  ],
  controllers: [HealthController],
  providers: [
    CustomLoggerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [CustomLoggerService],
})
export class AppModule {}