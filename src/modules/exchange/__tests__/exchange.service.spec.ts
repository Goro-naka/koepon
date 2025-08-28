import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../../test/test-helpers';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExchangeService } from '../exchange.service';
import { ExchangeItem } from '../entities/exchange-item.entity';
import { ExchangeTransaction } from '../entities/exchange-transaction.entity';
import { UserExchangeItem } from '../entities/user-exchange-item.entity';
import { PushMedalService } from '../../push-medal/push-medal.service';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import {
  ExchangeItemNotFoundException,
  ExchangeItemOutOfStockException,
  ExchangeLimitExceededException,
  ExchangePeriodExpiredException,
  InsufficientMedalBalanceException,
} from '../exceptions/exchange.exceptions';
import { ExchangeCategory } from '../enums/exchange-category.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

describe('ExchangeService', () => {
  let service: ExchangeService;
  let exchangeItemRepository: Repository<ExchangeItem>;
  let exchangeTransactionRepository: Repository<ExchangeTransaction>;
  let userExchangeItemRepository: Repository<UserExchangeItem>;
  let pushMedalService: PushMedalService;
  let logger: CustomLoggerService;

  const mockExchangeItem = {
    id: 'item-123',
    vtuberId: 'vtuber-123',
    name: 'Test Item',
    description: 'Test Description',
    category: ExchangeCategory.DIGITAL,
    medalCost: 100,
    totalStock: 50,
    dailyLimit: 5,
    userLimit: 2,
    isActive: true,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    currentStock: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeService,
        {
          provide: getRepositoryToken(ExchangeItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ExchangeTransaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserExchangeItem),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: PushMedalService,
          useValue: {
            getBalance: jest.fn(),
            deductMedals: jest.fn(),
          },
        },
        {
          provide: CustomLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExchangeService>(ExchangeService);
    exchangeItemRepository = module.get<Repository<ExchangeItem>>(getRepositoryToken(ExchangeItem));
    exchangeTransactionRepository = module.get<Repository<ExchangeTransaction>>(getRepositoryToken(ExchangeTransaction));
    userExchangeItemRepository = module.get<Repository<UserExchangeItem>>(getRepositoryToken(UserExchangeItem));
    pushMedalService = module.get<PushMedalService>(PushMedalService);
    logger = module.get<CustomLoggerService>(CustomLoggerService);
  });

  describe('Item Management', () => {
    it('should create exchange item successfully', async () => {
      const createDto = {
        vtuberId: 'vtuber-123',
        name: 'Test Item',
        description: 'Test Description',
        category: ExchangeCategory.DIGITAL,
        medalCost: 100,
        totalStock: 50,
        dailyLimit: 5,
        userLimit: 2,
      };

      jest.spyOn(exchangeItemRepository, 'create').mockReturnValue(mockExchangeItem as any);
      jest.spyOn(exchangeItemRepository, 'save').mockResolvedValue(mockExchangeItem as any);

      const result = await service.createExchangeItem(createDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createDto.name);
      expect(exchangeItemRepository.create).toHaveBeenCalledWith(expect.objectContaining(createDto));
    });

    it('should retrieve exchange item by ID', async () => {
      jest.spyOn(exchangeItemRepository, 'findOne').mockResolvedValue(mockExchangeItem as any);

      const result = await service.getExchangeItem('item-123');

      expect(result).toEqual(mockExchangeItem);
      expect(exchangeItemRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'item-123', isActive: true }
      });
    });

    it('should throw error for non-existent item', async () => {
      jest.spyOn(exchangeItemRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getExchangeItem('non-existent'))
        .rejects.toThrow(ExchangeItemNotFoundException);
    });
  });

  describe('Exchange Process', () => {
    it('should reject exchange with insufficient medal balance', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';
      
      jest.spyOn(exchangeItemRepository, 'findOne').mockResolvedValue(mockExchangeItem as any);
      jest.spyOn(pushMedalService, 'getBalance').mockResolvedValue({
        userId,
        vtuberId: mockExchangeItem.vtuberId,
        balance: 50, // Less than required 100
        lastUpdated: new Date(),
      });

      await expect(service.executeExchange(userId, itemId, 1))
        .rejects.toThrow(InsufficientMedalBalanceException);
    });

    it('should reject exchange when item is out of stock', async () => {
      const outOfStockItem = { ...mockExchangeItem, currentStock: 0 };
      
      jest.spyOn(exchangeItemRepository, 'findOne').mockResolvedValue(outOfStockItem as any);

      await expect(service.executeExchange('user-123', 'item-123', 1))
        .rejects.toThrow(ExchangeItemOutOfStockException);
    });

    it('should reject exchange outside valid period', async () => {
      const expiredItem = {
        ...mockExchangeItem,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };
      
      jest.spyOn(exchangeItemRepository, 'findOne').mockResolvedValue(expiredItem as any);

      await expect(service.executeExchange('user-123', 'item-123', 1))
        .rejects.toThrow(ExchangePeriodExpiredException);
    });

    it('should reject exchange exceeding daily limit', async () => {
      const userId = 'user-123';
      
      jest.spyOn(exchangeItemRepository, 'findOne').mockResolvedValue(mockExchangeItem as any);
      jest.spyOn(service, 'getUserDailyExchangeCount').mockResolvedValue(5); // At daily limit
      
      await expect(service.executeExchange(userId, 'item-123', 1))
        .rejects.toThrow(ExchangeLimitExceededException);
    });

    it('should execute exchange successfully with sufficient medals', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';
      const quantity = 1;

      jest.spyOn(exchangeItemRepository, 'findOne').mockResolvedValue(mockExchangeItem as any);
      jest.spyOn(pushMedalService, 'getBalance').mockResolvedValue({
        userId,
        vtuberId: mockExchangeItem.vtuberId,
        balance: 200,
        lastUpdated: new Date(),
      });
      jest.spyOn(service, 'getUserDailyExchangeCount').mockResolvedValue(2);
      jest.spyOn(service, 'getUserItemCount').mockResolvedValue(1);
      
      const mockTransaction = {
        id: 'tx-123',
        userId,
        exchangeItemId: itemId,
        medalCost: 100,
        quantity,
        status: TransactionStatus.COMPLETED,
        executedAt: new Date(),
      };

      jest.spyOn(exchangeTransactionRepository, 'create').mockReturnValue(mockTransaction as any);
      jest.spyOn(exchangeTransactionRepository, 'save').mockResolvedValue(mockTransaction as any);
      jest.spyOn(pushMedalService, 'deductMedals').mockResolvedValue({} as any);
      jest.spyOn(exchangeItemRepository, 'update').mockResolvedValue({} as any);
      jest.spyOn(userExchangeItemRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(userExchangeItemRepository, 'save').mockResolvedValue({} as any);

      const result = await service.executeExchange(userId, itemId, quantity);

      expect(result).toBeDefined();
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(pushMedalService.deductMedals).toHaveBeenCalledWith(
        userId, 
        mockExchangeItem.vtuberId, 
        100
      );
    });
  });

  describe('Stock & Limit Management', () => {
    it('should track daily exchange count per user', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';
      const today = new Date();
      
      jest.spyOn(exchangeTransactionRepository, 'count').mockResolvedValue(3);

      const count = await service.getUserDailyExchangeCount(userId, itemId);

      expect(count).toBe(3);
      expect(exchangeTransactionRepository.count).toHaveBeenCalledWith({
        where: {
          userId,
          exchangeItemId: itemId,
          status: TransactionStatus.COMPLETED,
          executedAt: expect.any(Object), // Between clause
        }
      });
    });

    it('should enforce user possession limits', async () => {
      const userId = 'user-123';
      const itemId = 'item-123';
      
      jest.spyOn(userExchangeItemRepository, 'count').mockResolvedValue(2);

      const count = await service.getUserItemCount(userId, itemId);

      expect(count).toBe(2);
      expect(userExchangeItemRepository.count).toHaveBeenCalledWith({
        where: {
          userId,
          exchangeItemId: itemId,
          isActive: true,
        }
      });
    });
  });

  describe('History & Analytics', () => {
    it('should retrieve user exchange history', async () => {
      const userId = 'user-123';
      const mockTransactions = [
        { id: 'tx-1', userId, status: TransactionStatus.COMPLETED },
        { id: 'tx-2', userId, status: TransactionStatus.COMPLETED },
      ];

      jest.spyOn(exchangeTransactionRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockTransactions, 2]),
      } as any);

      const result = await service.getUserExchangeHistory(userId, { page: 1, limit: 10 });

      expect(result.transactions).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should calculate exchange statistics', async () => {
      const mockStats = {
        totalExchanges: 100,
        totalMedalsSpent: 10000,
        popularItems: [
          { itemId: 'item-1', exchangeCount: 20 },
          { itemId: 'item-2', exchangeCount: 15 },
        ]
      };

      jest.spyOn(service, 'getExchangeStatistics').mockResolvedValue(mockStats);

      const result = await service.getExchangeStatistics('vtuber-123');

      expect(result.totalExchanges).toBe(100);
      expect(result.popularItems).toHaveLength(2);
    });
  });
});