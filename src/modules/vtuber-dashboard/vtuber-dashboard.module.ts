import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VTuberDashboardController } from './vtuber-dashboard.controller';
import { VTuberDashboardService } from './vtuber-dashboard.service';
import { VTuberDashboard } from './entities/vtuber-dashboard.entity';
import { AnalyticsReport } from './entities/analytics-report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([VTuberDashboard, AnalyticsReport]),
  ],
  controllers: [VTuberDashboardController],
  providers: [VTuberDashboardService],
  exports: [VTuberDashboardService],
})
export class VTuberDashboardModule {}