import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { VTuberModule } from './modules/vtuber/vtuber.module';
import { GachaModule } from './modules/gacha/gacha.module';
import { RewardModule } from './modules/reward/reward.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PushMedalModule } from './modules/push-medal/push-medal.module';
import { VTuberDashboardModule } from './modules/vtuber-dashboard/vtuber-dashboard.module';
// import { AdminModule } from './modules/admin/admin.module';
import { CustomLoggerService } from './common/logger/logger.service';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Database module first
    DatabaseModule,
    
    // Authentication module
    AuthModule,
    
    // User management module
    UserModule,
    
    // VTuber module
    VTuberModule,
    
    // Reward system module (needed by Gacha)
    RewardModule,
    
    // Gacha system module
    GachaModule,
    
    // Payment system module
    PaymentModule,
    
    // Push medal system module
    PushMedalModule,
    
    // VTuber dashboard module
    VTuberDashboardModule,
    
    // Admin module - temporarily disabled
    // AdminModule,
    
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.vercel', '.env.local', '.env', '.env.supabase'],
      cache: true, // Enable configuration caching for performance
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000'), // 1 minute
        limit: parseInt(process.env.RATE_LIMIT_MAX ?? '1000'), // 1000 requests per minute
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
