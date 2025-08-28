import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GachaService } from './gacha.service';
import { GachaController } from './gacha.controller';
import { Gacha } from './entities/gacha.entity';
import { GachaItem } from './entities/gacha-item.entity';
import { GachaResult } from './entities/gacha-result.entity';
import { DrawAlgorithm } from './algorithms/draw-algorithm';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';
import { PushMedalModule } from '../push-medal/push-medal.module';
import { RewardModule } from '../reward/reward.module';
import { VTuberModule } from '../vtuber/vtuber.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gacha, GachaItem, GachaResult]),
    AuthModule,
    PaymentModule,
    PushMedalModule,
    RewardModule,
    VTuberModule,
  ],
  providers: [GachaService, DrawAlgorithm],
  controllers: [GachaController],
  exports: [GachaService, DrawAlgorithm],
})
export class GachaModule {}