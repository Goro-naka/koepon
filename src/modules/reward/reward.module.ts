import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { StorageService } from './services/storage.service';
import { VirusScanService } from './services/virus-scan.service';
import { Reward } from './entities/reward.entity';
import { UserReward } from './entities/user-reward.entity';
import { DownloadLog } from './entities/download-log.entity';
import { CustomLoggerService } from '../../common/logger/logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reward, UserReward, DownloadLog]),
  ],
  controllers: [RewardController],
  providers: [RewardService, StorageService, VirusScanService, CustomLoggerService],
  exports: [RewardService],
})
export class RewardModule {}