import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PushMedalService } from './push-medal.service';
import { PushMedalBalanceQueryDto } from './dto/push-medal-balance-query.dto';
import { PushMedalTransactionHistoryQueryDto } from './dto/push-medal-transaction-history-query.dto';
import { TransferFromPoolDto } from './dto/transfer-from-pool.dto';
import { AdminAdjustBalanceDto } from './dto/admin-adjust-balance.dto';

@ApiTags('Push Medal')
@Controller('push-medals')
export class PushMedalController {
  constructor(private readonly pushMedalService: PushMedalService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user push medal balance for specific VTuber or all balances' })
  @ApiResponse({ status: 200, description: 'Push medal balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Balance not found' })
  async getBalance(
    @Request() req,
    @Query(ValidationPipe) query: PushMedalBalanceQueryDto
  ) {
    return this.pushMedalService.getBalance(req.user.sub, query.vtuberId);
  }

  @Get('balance/:vtuberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user push medal balance for specific VTuber' })
  @ApiResponse({ status: 200, description: 'Push medal balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Balance not found' })
  async getBalanceForVTuber(
    @Request() req,
    @Param('vtuberId', ParseUUIDPipe) vtuberId: string
  ) {
    return this.pushMedalService.getBalance(req.user.sub, vtuberId);
  }

  @Get('pool-balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user total pool balance across all VTubers' })
  @ApiResponse({ status: 200, description: 'Pool balance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPoolBalance(@Request() req) {
    return this.pushMedalService.getPoolBalance(req.user.sub);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user push medal transaction history' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactionHistory(
    @Request() req,
    @Query(ValidationPipe) query: PushMedalTransactionHistoryQueryDto
  ) {
    const historyQuery = {
      userId: req.user.sub,
      vtuberId: query.vtuberId,
      transactionType: query.transactionType,
      limit: query.limit,
      offset: query.offset,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined
    };
    
    return this.pushMedalService.getTransactionHistory(historyQuery);
  }

  @Get('transactions/:vtuberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user push medal transaction history for specific VTuber' })
  @ApiResponse({ status: 200, description: 'Transaction history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTransactionHistoryForVTuber(
    @Request() req,
    @Param('vtuberId', ParseUUIDPipe) vtuberId: string,
    @Query(ValidationPipe) query: Omit<PushMedalTransactionHistoryQueryDto, 'vtuberId'>
  ) {
    const historyQuery = {
      userId: req.user.sub,
      vtuberId,
      transactionType: query.transactionType,
      limit: query.limit,
      offset: query.offset,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined
    };
    
    return this.pushMedalService.getTransactionHistory(historyQuery);
  }

  @Post('transfer-from-pool')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer push medals from pool to specific VTuber' })
  @ApiResponse({ status: 200, description: 'Transfer completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transfer request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async transferFromPool(
    @Request() req,
    @Body(ValidationPipe) transferDto: TransferFromPoolDto
  ) {
    const transferRequest = {
      userId: req.user.sub,
      fromVtuberId: transferDto.fromVtuberId,
      toVtuberId: transferDto.toVtuberId,
      amount: transferDto.amount
    };
    
    return this.pushMedalService.transferFromPool(transferRequest);
  }

  @Post('admin/adjust-balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Adjust user push medal balance' })
  @ApiResponse({ status: 200, description: 'Balance adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @HttpCode(HttpStatus.OK)
  async adminAdjustBalance(
    @Request() req,
    @Body(ValidationPipe) adjustBalanceDto: AdminAdjustBalanceDto
  ) {
    const adjustRequest = {
      userId: adjustBalanceDto.userId,
      vtuberId: adjustBalanceDto.vtuberId,
      amount: adjustBalanceDto.amount,
      reason: adjustBalanceDto.reason,
      adminId: req.user.sub
    };
    
    return this.pushMedalService.adminAdjustBalance(adjustRequest);
  }

  @Get('admin/integrity-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Run integrity check on push medal balances' })
  @ApiResponse({ status: 200, description: 'Integrity check completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  @ApiQuery({ name: 'userId', required: false, description: 'Check specific user (optional)' })
  async adminIntegrityCheck(
    @Query('userId') userId?: string
  ) {
    return this.pushMedalService.performIntegrityCheck(userId);
  }
}