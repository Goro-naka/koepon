import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CustomLoggerService } from './common/logger/logger.service';
import { HealthController } from './health.controller';

// Import implemented modules
import { AdminSupabaseModule } from './modules/admin/admin-supabase.module';
import { AdminSupabaseService } from './modules/admin/admin-supabase.service';
import { SupabaseService } from './common/supabase/supabase.service';

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
    
    // Application modules (Using Supabase modules)
    AdminSupabaseModule,  // Supabase-based admin functionality
    // AdminModule,    // TODO: Fix TypeORM dependency injection
    // AuthModule,  // TODO: Fix Supabase types
    // UserModule,  // TODO: Fix Supabase types
    // VTuberModule,   // TODO: Fix TypeORM entities
    // GachaModule,    // TODO: Fix service dependencies
    // PaymentModule,  // TODO: Fix TypeORM dependencies temporarily disabled
    // PushMedalModule, // TODO: Fix service dependencies
    // RewardModule,    // TODO: Fix dependencies
    // ExchangeModule,  // TODO: Fix TypeORM entity error
  ],
  controllers: [HealthController],
  providers: [
    CustomLoggerService,
    SupabaseService,
    AdminSupabaseService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [CustomLoggerService],
})
export class AppModule {}