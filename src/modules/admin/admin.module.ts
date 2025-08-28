import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAction } from './entities/admin-action.entity';
import { SystemMetrics } from './entities/system-metrics.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAction, SystemMetrics]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}