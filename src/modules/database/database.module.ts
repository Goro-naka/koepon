import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { HealthController } from '../../health.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('SUPABASE_HOST');
        const port = configService.get('SUPABASE_PORT', 5432);
        const username = configService.get('SUPABASE_USERNAME', 'postgres');
        const password = configService.get('SUPABASE_PASSWORD');
        const database = configService.get('SUPABASE_DATABASE', 'postgres');
        
        return {
          type: 'postgres',
          url: `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=require`,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get('NODE_ENV') === 'development',
          ssl: {
            rejectUnauthorized: false,
          },
          logging: configService.get('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [HealthController],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}