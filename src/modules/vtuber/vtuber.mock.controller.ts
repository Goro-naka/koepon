import { Controller, Get, Param, Query } from '@nestjs/common';
import { VTuberMockService } from './vtuber.mock.service';

@Controller('api/v1')
export class VTuberMockController {
  constructor(private readonly vtuberMockService: VTuberMockService) {}

  @Get('vtubers')
  async findAllVTubers(@Query() query: any) {
    return await this.vtuberMockService.findAllVTubers(query);
  }

  @Get('vtubers/popular')
  async getPopularVTubers(@Query('limit') limit: string = '10') {
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50);
    const vtubers = await this.vtuberMockService.getPopularVTubers(limitNumber);
    return {
      vtubers,
      count: vtubers.length,
    };
  }

  @Get('vtubers/:id')
  async findOneVTuber(@Param('id') id: string) {
    return await this.vtuberMockService.findOneVTuber(id);
  }

  @Get('vtubers/:id/gachas')
  async getActiveGachas(@Param('id') id: string) {
    const gachas = await this.vtuberMockService.getActiveGachasByVTuber(id);
    return {
      vtuber_id: id,
      gachas,
      count: gachas.length,
    };
  }

  @Get('gacha')
  async findAllGachas(@Query() query: any) {
    return await this.vtuberMockService.findAllGachas(query);
  }

  @Get('gacha/:id')
  async findOneGacha(@Param('id') id: string) {
    return await this.vtuberMockService.findOneGacha(id);
  }
}