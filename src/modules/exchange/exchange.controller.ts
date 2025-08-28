import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExchangeService } from './exchange.service';
import { CreateExchangeItemDto } from './dto/create-exchange-item.dto';
import { UpdateExchangeItemDto } from './dto/update-exchange-item.dto';
import { ExecuteExchangeDto } from './dto/execute-exchange.dto';
import { PaginationDto } from './dto/pagination.dto';

@Controller('api/v1/exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get('items')
  async getAvailableItems(@Query() pagination: PaginationDto) {
    const result = await this.exchangeService.getAvailableItems(pagination);
    return {
      success: true,
      data: result,
    };
  }

  @Get('items/:id')
  async getItemDetails(@Param('id') id: string) {
    const item = await this.exchangeService.getExchangeItem(id);
    return {
      success: true,
      data: { item },
    };
  }

  @Post('items/:id/exchange')
  @UseGuards(JwtAuthGuard)
  async executeExchange(
    @Request() req: any,
    @Param('id') itemId: string,
    @Body() executeDto: ExecuteExchangeDto
  ) {
    // Validate quantity
    if (executeDto.quantity <= 0 || executeDto.quantity > 10) {
      throw new BadRequestException('Invalid quantity. Must be between 1 and 10.');
    }
    
    const transaction = await this.exchangeService.executeExchange(
      req.user.sub,
      itemId,
      executeDto.quantity
    );
    
    return {
      success: true,
      data: { transaction },
    };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getUserHistory(@Request() req: any, @Query() pagination: PaginationDto) {
    const result = await this.exchangeService.getUserExchangeHistory(req.user.sub, pagination);
    return {
      success: true,
      data: result,
    };
  }

  @Get('inventory')
  @UseGuards(JwtAuthGuard)
  async getUserInventory(@Request() req: any, @Query() pagination: PaginationDto) {
    const result = await this.exchangeService.getUserInventory(req.user.sub, pagination);
    return {
      success: true,
      data: result,
    };
  }

  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VTUBER', 'ADMIN')
  async createExchangeItem(@Request() req: any, @Body() createDto: CreateExchangeItemDto) {
    // Check authorization
    if (req.user.role !== 'ADMIN' && req.user.role !== 'VTUBER') {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    // For VTubers, ensure they can only create items for themselves
    if (req.user.role === 'VTUBER') {
      createDto.vtuberId = req.user.vtuberId || req.user.sub;
    }
    
    // Validate input for XSS
    if (createDto.name && createDto.name.includes('<script>')) {
      throw new BadRequestException('Invalid input detected');
    }
    
    const item = await this.exchangeService.createExchangeItem(createDto);
    return {
      success: true,
      data: { item },
    };
  }

  @Put('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VTUBER', 'ADMIN')
  async updateExchangeItem(
    @Request() req: any,
    @Param('id') itemId: string,
    @Body() updateDto: UpdateExchangeItemDto
  ) {
    // Check if item exists and get permissions
    const existingItem = await this.exchangeService.getExchangeItem(itemId);
    
    // VTubers can only update their own items
    if (req.user.role === 'VTUBER' && existingItem.vtuberId !== req.user.vtuberId) {
      throw new ForbiddenException('You can only update your own items');
    }
    
    const item = await this.exchangeService.updateExchangeItem(itemId, updateDto);
    return {
      success: true,
      data: { item },
    };
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VTUBER', 'ADMIN')
  async deleteExchangeItem(@Request() req: any, @Param('id') itemId: string) {
    await this.exchangeService.deleteExchangeItem(itemId);
    return {
      success: true,
      message: 'Item deleted successfully',
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VTUBER', 'ADMIN')
  async getExchangeStatistics(@Request() req: any, @Query() query: any) {
    const vtuberId = req.user.role === 'ADMIN' ? query.vtuberId : req.user.vtuberId;
    const stats = await this.exchangeService.getExchangeStatistics(vtuberId);
    return {
      success: true,
      data: stats,
    };
  }
}