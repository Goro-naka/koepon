import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { VTuberService, VTuberQueryDto } from './vtuber.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/vtubers')
export class VTuberController {
  constructor(private readonly vtuberService: VTuberService) {}

  @Get()
  async findAll(@Query() query: VTuberQueryDto) {
    return await this.vtuberService.findAll(query);
  }

  @Get('popular')
  async getPopular(@Query('limit') limit: string = '10') {
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50);
    const vtubers = await this.vtuberService.getPopularVTubers(limitNumber);
    return {
      vtubers,
      count: vtubers.length,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.vtuberService.findOne(id);
  }

  @Get(':id/gachas')
  async getActiveGachas(@Param('id') id: string) {
    const gachas = await this.vtuberService.getActiveGachasByVTuber(id);
    return {
      vtuber_id: id,
      gachas,
      count: gachas.length,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return await this.vtuberService.findByUserId(userId);
  }
}