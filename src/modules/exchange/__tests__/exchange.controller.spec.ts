import { Test, TestingModule } from '@nestjs/testing';
import { ExchangeController } from '../exchange.controller';
import { ExchangeService } from '../exchange.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  InsufficientMedalBalanceException,
} from '../exceptions/exchange.exceptions';
import { ExchangeCategory } from '../enums/exchange-category.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

describe('ExchangeController', () => {
  let controller: ExchangeController;
  let service: ExchangeService;

  const mockExchangeService = {
    getAvailableItems: jest.fn(),
    getExchangeItem: jest.fn(),
    executeExchange: jest.fn(),
    getUserExchangeHistory: jest.fn(),
    getUserInventory: jest.fn(),
    createExchangeItem: jest.fn(),
    updateExchangeItem: jest.fn(),
    deleteExchangeItem: jest.fn(),
    getExchangeStatistics: jest.fn(),
  };

  const mockUser = {
    sub: 'user-123',
    role: 'USER',
  };

  const mockVTuberUser = {
    sub: 'vtuber-123',
    role: 'VTUBER',
    vtuberId: 'vtuber-123',
  };

  const mockAdminUser = {
    sub: 'admin-123',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExchangeController],
      providers: [
        {
          provide: ExchangeService,
          useValue: mockExchangeService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ExchangeController>(ExchangeController);
    service = module.get<ExchangeService>(ExchangeService);
  });

  describe('Exchange API', () => {
    it('should return available exchange items list', async () => {
      const mockItems = {
        items: [
          {
            id: 'item-123',
            name: 'Test Item',
            category: ExchangeCategory.DIGITAL,
            medalCost: 100,
            currentStock: 50,
            isActive: true,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockExchangeService.getAvailableItems.mockResolvedValue(mockItems);

      const result = await controller.getAvailableItems({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockItems);
    });

    it('should return item details with stock information', async () => {
      const mockItem = {
        id: 'item-123',
        name: 'Test Item',
        description: 'Test Description',
        category: ExchangeCategory.DIGITAL,
        medalCost: 100,
        currentStock: 50,
        dailyLimit: 5,
        userLimit: 2,
        isActive: true,
      };

      mockExchangeService.getExchangeItem.mockResolvedValue(mockItem);

      const result = await controller.getItemDetails('item-123');

      expect(result.success).toBe(true);
      expect(result.data.item).toEqual(mockItem);
    });

    it('should execute item exchange successfully', async () => {
      const mockTransaction = {
        id: 'tx-123',
        userId: 'user-123',
        exchangeItemId: 'item-123',
        medalCost: 100,
        quantity: 1,
        status: TransactionStatus.COMPLETED,
        executedAt: new Date(),
      };

      mockExchangeService.executeExchange.mockResolvedValue(mockTransaction);

      const result = await controller.executeExchange(
        { user: mockUser },
        'item-123',
        { quantity: 1 }
      );

      expect(result.success).toBe(true);
      expect(result.data.transaction).toEqual(mockTransaction);
      expect(service.executeExchange).toHaveBeenCalledWith('user-123', 'item-123', 1);
    });

    it('should return appropriate error for invalid exchange', async () => {
      mockExchangeService.executeExchange.mockRejectedValue(
        new InsufficientMedalBalanceException('user-123', 100, 50)
      );

      await expect(
        controller.executeExchange({ user: mockUser }, 'item-123', { quantity: 1 })
      ).rejects.toThrow(InsufficientMedalBalanceException);
    });

    it('should validate quantity parameter', async () => {
      await expect(
        controller.executeExchange(
          { user: mockUser }, 
          'item-123', 
          { quantity: 0 } // Invalid quantity
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('User History & Inventory', () => {
    it('should return user exchange history', async () => {
      const mockHistory = {
        transactions: [
          {
            id: 'tx-123',
            exchangeItemId: 'item-123',
            medalCost: 100,
            status: TransactionStatus.COMPLETED,
            executedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockExchangeService.getUserExchangeHistory.mockResolvedValue(mockHistory);

      const result = await controller.getUserHistory(
        { user: mockUser },
        { page: 1, limit: 20 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockHistory);
    });

    it('should return user inventory', async () => {
      const mockInventory = {
        items: [
          {
            id: 'user-item-123',
            exchangeItemId: 'item-123',
            acquiredAt: new Date(),
            isActive: true,
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      mockExchangeService.getUserInventory.mockResolvedValue(mockInventory);

      const result = await controller.getUserInventory(
        { user: mockUser },
        { page: 1, limit: 20 }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInventory);
    });
  });

  describe('Management API', () => {
    it('should allow VTuber to create exchange item', async () => {
      const createDto = {
        name: 'Test Item',
        description: 'Test Description',
        category: ExchangeCategory.DIGITAL,
        medalCost: 100,
        totalStock: 50,
        dailyLimit: 5,
        userLimit: 2,
      };

      const mockItem = {
        id: 'item-123',
        vtuberId: 'vtuber-123',
        ...createDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockExchangeService.createExchangeItem.mockResolvedValue(mockItem);

      const result = await controller.createExchangeItem(
        { user: mockVTuberUser },
        { ...createDto, vtuberId: 'vtuber-123' }
      );

      expect(result.success).toBe(true);
      expect(result.data.item).toEqual(mockItem);
      expect(service.createExchangeItem).toHaveBeenCalledWith({
        ...createDto,
        vtuberId: 'vtuber-123',
      });
    });

    it('should deny unauthorized access to management endpoints', async () => {
      const createDto = {
        name: 'Test Item',
        description: 'Test Description',
        category: ExchangeCategory.DIGITAL,
        medalCost: 100,
        totalStock: 50,
        dailyLimit: 5,
        userLimit: 2,
      };

      await expect(
        controller.createExchangeItem({ user: mockUser }, { ...createDto, vtuberId: 'vtuber-123' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow Admin to manage all items', async () => {
      const mockStats = {
        totalExchanges: 100,
        totalMedalsSpent: 10000,
        popularItems: [],
      };

      mockExchangeService.getExchangeStatistics.mockResolvedValue(mockStats);

      const result = await controller.getExchangeStatistics(
        { user: mockAdminUser },
        { vtuberId: 'any-vtuber' }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
    });

    it('should validate VTuber permissions for own items only', async () => {
      const updateDto = {
        name: 'Updated Item',
        medalCost: 150,
      };

      // Mock item belonging to different VTuber
      mockExchangeService.getExchangeItem.mockResolvedValue({
        id: 'item-123',
        vtuberId: 'different-vtuber',
        name: 'Test Item',
      });

      await expect(
        controller.updateExchangeItem(
          { user: mockVTuberUser },
          'item-123',
          updateDto
        )
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Input Validation', () => {
    it('should validate exchange quantity limits', async () => {
      await expect(
        controller.executeExchange(
          { user: mockUser },
          'item-123',
          { quantity: -1 }
        )
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.executeExchange(
          { user: mockUser },
          'item-123',
          { quantity: 100 }
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should sanitize input parameters', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>',
        description: 'Normal description',
        category: ExchangeCategory.DIGITAL,
        medalCost: 100,
        totalStock: 50,
      };

      await expect(
        controller.createExchangeItem({ user: mockVTuberUser }, { ...maliciousInput, vtuberId: 'vtuber-123' })
      ).rejects.toThrow(BadRequestException);
    });
  });
});