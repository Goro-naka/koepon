import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ExchangeItem } from './entities/exchange-item.entity';
import { ExchangeTransaction } from './entities/exchange-transaction.entity';
import { UserExchangeItem } from './entities/user-exchange-item.entity';
import { PushMedalService } from '../push-medal/push-medal.service';
import { CustomLoggerService } from '../../common/logger/logger.service';
import { CreateExchangeItemDto } from './dto/create-exchange-item.dto';
import { UpdateExchangeItemDto } from './dto/update-exchange-item.dto';
import { PaginationDto, PaginationResult } from './dto/pagination.dto';
import {
  ExchangeItemNotFoundException,
  ExchangeItemOutOfStockException,
  ExchangeLimitExceededException,
  ExchangePeriodExpiredException,
  InsufficientMedalBalanceException,
} from './exceptions/exchange.exceptions';
import { TransactionStatus } from './enums/transaction-status.enum';

@Injectable()
export class ExchangeService {
  constructor(
    @InjectRepository(ExchangeItem)
    private exchangeItemRepository: Repository<ExchangeItem>,
    @InjectRepository(ExchangeTransaction)
    private exchangeTransactionRepository: Repository<ExchangeTransaction>,
    @InjectRepository(UserExchangeItem)
    private userExchangeItemRepository: Repository<UserExchangeItem>,
    private pushMedalService: PushMedalService,
    private logger: CustomLoggerService,
  ) {}

  async createExchangeItem(createDto: CreateExchangeItemDto): Promise<ExchangeItem> {
    const item = this.exchangeItemRepository.create({
      ...createDto,
      currentStock: createDto.totalStock,
      startDate: createDto.startDate || new Date(),
    });
    return await this.exchangeItemRepository.save(item);
  }

  async getExchangeItem(id: string): Promise<ExchangeItem> {
    const item = await this.exchangeItemRepository.findOne({
      where: { id, isActive: true }
    });
    
    if (!item) {
      throw new ExchangeItemNotFoundException(id);
    }
    
    return item;
  }

  async executeExchange(userId: string, itemId: string, quantity: number): Promise<ExchangeTransaction> {
    this.logger.log(`Starting exchange for user ${userId}, item ${itemId}, quantity ${quantity}`);
    
    try {
      // Get exchange item
      const item = await this.getExchangeItem(itemId);
      
      // Validate exchange
      await this.validateExchange(userId, item, quantity);
      
      // Execute transaction atomically
      const transaction = await this.processExchange(userId, item, quantity);
      
      this.logger.log(`Exchange completed successfully: transaction ${transaction.id}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Exchange failed for user ${userId}, item ${itemId}: ${error.message}`);
      throw error;
    }
  }

  private async validateExchange(userId: string, item: ExchangeItem, quantity: number): Promise<void> {
    const now = new Date();
    
    // Check if exchange period is valid
    if (now < item.startDate || (item.endDate && now > item.endDate)) {
      throw new ExchangePeriodExpiredException(item.id);
    }
    
    // Check stock availability
    if (item.currentStock < quantity) {
      throw new ExchangeItemOutOfStockException(item.id);
    }
    
    // Check user limits
    const [dailyCount, userItemCount] = await Promise.all([
      this.getUserDailyExchangeCount(userId, item.id),
      this.getUserItemCount(userId, item.id)
    ]);
    
    if (dailyCount >= item.dailyLimit) {
      throw new ExchangeLimitExceededException('daily', item.dailyLimit);
    }
    
    if (userItemCount >= item.userLimit) {
      throw new ExchangeLimitExceededException('user', item.userLimit);
    }
    
    // Check medal balance
    const totalCost = item.medalCost * quantity;
    const balance = await this.pushMedalService.getBalance(userId, item.vtuberId);
    if (balance.balance < totalCost) {
      throw new InsufficientMedalBalanceException(userId, totalCost, balance.balance);
    }
  }

  private async processExchange(userId: string, item: ExchangeItem, quantity: number): Promise<ExchangeTransaction> {
    const now = new Date();
    const totalCost = item.medalCost * quantity;
    
    // Create transaction
    const transaction = this.exchangeTransactionRepository.create({
      userId,
      exchangeItemId: item.id,
      medalCost: totalCost,
      quantity,
      status: TransactionStatus.COMPLETED,
      executedAt: now,
      completedAt: now,
    });
    
    await this.exchangeTransactionRepository.save(transaction);
    
    // Execute all operations
    await Promise.all([
      this.pushMedalService.deductMedals(userId, item.vtuberId, totalCost),
      this.exchangeItemRepository.update(item.id, {
        currentStock: item.currentStock - quantity,
      }),
      this.createUserExchangeItem(userId, item.id, transaction.id, now)
    ]);
    
    return transaction;
  }

  private async createUserExchangeItem(userId: string, itemId: string, transactionId: string, acquiredAt: Date): Promise<void> {
    const userItem = this.userExchangeItemRepository.create({
      userId,
      exchangeItemId: itemId,
      transactionId,
      acquiredAt,
      isActive: true,
    });
    await this.userExchangeItemRepository.save(userItem);
  }

  async getUserDailyExchangeCount(userId: string, itemId: string): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    return await this.exchangeTransactionRepository.count({
      where: {
        userId,
        exchangeItemId: itemId,
        status: TransactionStatus.COMPLETED,
        executedAt: Between(startOfDay, endOfDay),
      }
    });
  }

  async getUserItemCount(userId: string, itemId: string): Promise<number> {
    return await this.userExchangeItemRepository.count({
      where: {
        userId,
        exchangeItemId: itemId,
        isActive: true,
      }
    });
  }

  async getUserExchangeHistory(userId: string, pagination: PaginationDto): Promise<{ transactions: ExchangeTransaction[], pagination: PaginationResult }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    
    const [transactions, total] = await this.exchangeTransactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.exchangeItem', 'item')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.executedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getUserInventory(userId: string, pagination: PaginationDto): Promise<{ items: UserExchangeItem[], pagination: PaginationResult }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    
    const [items, total] = await this.userExchangeItemRepository.createQueryBuilder('userItem')
      .leftJoinAndSelect('userItem.exchangeItem', 'item')
      .where('userItem.userId = :userId AND userItem.isActive = :isActive', { userId, isActive: true })
      .orderBy('userItem.acquiredAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async updateExchangeItem(id: string, updateDto: UpdateExchangeItemDto): Promise<ExchangeItem> {
    const item = await this.getExchangeItem(id);
    Object.assign(item, updateDto);
    return await this.exchangeItemRepository.save(item);
  }

  async deleteExchangeItem(id: string): Promise<void> {
    await this.exchangeItemRepository.update(id, { isActive: false });
  }

  async getAvailableItems(pagination: PaginationDto): Promise<{ items: ExchangeItem[], pagination: PaginationResult }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    const now = new Date();
    
    const [items, total] = await this.exchangeItemRepository.createQueryBuilder('item')
      .where('item.isActive = :isActive', { isActive: true })
      .andWhere('item.startDate <= :now', { now })
      .andWhere('(item.endDate IS NULL OR item.endDate >= :now)', { now })
      .andWhere('item.currentStock > 0')
      .orderBy('item.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getExchangeStatistics(vtuberId?: string): Promise<{ totalExchanges: number, totalMedalsSpent: number, popularItems: any[] }> {
    const query = this.exchangeTransactionRepository.createQueryBuilder('transaction')
      .leftJoin('transaction.exchangeItem', 'item')
      .where('transaction.status = :status', { status: TransactionStatus.COMPLETED });
    
    if (vtuberId) {
      query.andWhere('item.vtuberId = :vtuberId', { vtuberId });
    }
    
    const [{ totalExchanges, totalMedalsSpent }] = await query
      .select('COUNT(*) as totalExchanges')
      .addSelect('SUM(transaction.medalCost) as totalMedalsSpent')
      .getRawMany();
    
    const popularItems = await query
      .select('transaction.exchangeItemId as itemId')
      .addSelect('COUNT(*) as exchangeCount')
      .groupBy('transaction.exchangeItemId')
      .orderBy('exchangeCount', 'DESC')
      .limit(5)
      .getRawMany();
    
    return {
      totalExchanges: parseInt(totalExchanges) || 0,
      totalMedalsSpent: parseInt(totalMedalsSpent) || 0,
      popularItems: popularItems.map(item => ({
        itemId: item.itemId,
        exchangeCount: parseInt(item.exchangeCount)
      }))
    };
  }
}