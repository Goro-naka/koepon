import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CustomLoggerService } from './common/logger/logger.service';
import { HealthController } from './health.controller';
import { VTuberMockService } from './modules/vtuber/vtuber.mock.service';
import { VTuberMockController } from './modules/vtuber/vtuber.mock.controller';

@Module({
  imports: [
    // Serve static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/v1*'],
    }),
    
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.supabase'],
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
  controllers: [HealthController, VTuberMockController],
  providers: [
    CustomLoggerService,
    VTuberMockService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [CustomLoggerService],
})
export class AppModule {}