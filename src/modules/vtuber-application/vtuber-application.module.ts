import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VTuberApplicationController } from './vtuber-application.controller';
import { VTuberApplicationService } from './vtuber-application.service';
import { VTuberApplication } from './entities/vtuber-application.entity';
import { ApplicationReview } from './entities/application-review.entity';
import { ApplicationNotification } from './entities/application-notification.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VTuberApplication,
      ApplicationReview,
      ApplicationNotification,
    ]),
    CommonModule,
  ],
  controllers: [VTuberApplicationController],
  providers: [VTuberApplicationService],
  exports: [VTuberApplicationService],
})
export class VTuberApplicationModule {}