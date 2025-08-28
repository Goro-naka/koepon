import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VTuberMockService } from './modules/vtuber/vtuber.mock.service';
import { VTuberMockController } from './modules/vtuber/vtuber.mock.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.supabase'],
      cache: true,
    }),
  ],
  controllers: [VTuberMockController],
  providers: [VTuberMockService],
})
export class AppMockModule {}