import { Module } from '@nestjs/common';
import { PushMedalService } from './push-medal.service';
import { PushMedalController } from './push-medal.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PushMedalController],
  providers: [PushMedalService],
  exports: [PushMedalService],
})
export class PushMedalModule {}