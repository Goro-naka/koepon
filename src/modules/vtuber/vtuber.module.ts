import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VTuber } from './entities/vtuber.entity';
import { VTuberService } from './vtuber.service';
import { VTuberController } from './vtuber.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VTuber])],
  providers: [VTuberService],
  controllers: [VTuberController],
  exports: [VTuberService],
})
export class VTuberModule {}