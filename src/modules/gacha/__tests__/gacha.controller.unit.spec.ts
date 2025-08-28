import { Test, TestingModule } from '@nestjs/testing';
import { GachaController } from '../gacha.controller';
import { GachaService } from '../gacha.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { CreateGachaDto } from '../dto/create-gacha.dto';
import { GachaQueryDto } from '../dto/gacha-query.dto';
import { DrawGachaDto } from '../dto/draw-gacha.dto';
import {
  GachaInactiveException,
  GachaNotFoundException,
  MaxDrawsReachedException,
} from '../exceptions/gacha.exceptions';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('GachaController Unit Tests', () => {
  let controller: GachaController;
  let gachaService: GachaService;

  const mockGacha = {
    id: 'gacha-001',
    vtuberId: 'vtuber-001',
    name: 'Test Gacha',
    description: 'Test Description',
    price: 1000,
    medalReward: 10,
    status: 'active' as const,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    maxDraws: 1000,
    totalDraws: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };

  const mockGachaResult = {
    id: 'result-001',
    userId: 'user-001',
    gachaId: 'gacha-001',
    itemId: 'item-001',
    price: 1000,
    medalReward: 10,
    timestamp: new Date(),
  };

  const mockRequest = {
    user: {
      sub: 'user-001',
      role: 'FAN',
    },
  };

  const mockVTuberRequest = {
    user: {
      sub: 'vtuber-001',
      role: 'VTUBER',
    },
  };

  const mockAdminRequest = {
    user: {
      sub: 'admin-001',
      role: 'ADMIN',
    },
  };

  const mockGachaService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    executeDraw: jest.fn(),
    getDrawHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GachaController],
      providers: [
        {
          provide: GachaService,
          useValue: mockGachaService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<GachaController>(GachaController);
    gachaService = module.get<GachaService>(GachaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated gacha list', async () => {
      // This test should fail initially (Red phase)
      const queryDto: GachaQueryDto = {
        page: 1,
        limit: 10,
        vtuberId: 'vtuber-001',
        status: 'active',
      };

      const expectedResult = {
        success: true,
        data: {
          gacha: [mockGacha],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
      };

      mockGachaService.findAll.mockResolvedValue(expectedResult.data);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(expectedResult);
      expect(mockGachaService.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should apply default pagination parameters', async () => {
      // This test should fail initially (Red phase)
      const queryDto: GachaQueryDto = {};

      mockGachaService.findAll.mockResolvedValue({
        gacha: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await controller.findAll(queryDto);

      expect(mockGachaService.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should validate pagination limits', async () => {
      // This test should fail initially (Red phase)
      const queryDto: GachaQueryDto = {
        page: -1,
        limit: 100, // exceeds max limit
      };

      await expect(controller.findAll(queryDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findOne', () => {
    it('should return gacha details', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';
      const expectedResult = {
        success: true,
        data: { gacha: mockGacha },
      };

      mockGachaService.findOne.mockResolvedValue(mockGacha);

      const result = await controller.findOne(gachaId);

      expect(result).toEqual(expectedResult);
      expect(mockGachaService.findOne).toHaveBeenCalledWith(gachaId);
    });

    it('should handle non-existent gacha', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'non-existent';

      mockGachaService.findOne.mockRejectedValue(
        new GachaNotFoundException(gachaId)
      );

      await expect(controller.findOne(gachaId)).rejects.toThrow(
        GachaNotFoundException
      );
    });
  });

  describe('create', () => {
    const createDto: CreateGachaDto = {
      name: 'New Gacha',
      description: 'New Description',
      price: 1000,
      medalReward: 10,
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      maxDraws: 1000,
      items: [
        {
          rewardId: 'reward-001',
          name: 'Test Item',
          description: 'Test Item Description',
          rarity: 'common',
          dropRate: 1.0,
          maxCount: 100,
        },
      ],
    };

    it('should create gacha with VTuber authorization', async () => {
      // This test should fail initially (Red phase)
      const expectedResult = {
        success: true,
        data: mockGacha,
      };

      mockGachaService.create.mockResolvedValue(mockGacha);

      const result = await controller.create(mockVTuberRequest, createDto);

      expect(result).toEqual(expectedResult);
      expect(mockGachaService.create).toHaveBeenCalledWith(
        'vtuber-001',
        createDto
      );
    });

    it('should allow admin to create gacha for any VTuber', async () => {
      // This test should fail initially (Red phase)
      const createDtoWithVTuber = { ...createDto, vtuberId: 'other-vtuber' };

      mockGachaService.create.mockResolvedValue(mockGacha);

      await controller.create(mockAdminRequest, createDtoWithVTuber);

      expect(mockGachaService.create).toHaveBeenCalledWith(
        'other-vtuber',
        createDtoWithVTuber
      );
    });

    it('should prevent non-VTuber from creating gacha', async () => {
      // This test should fail initially (Red phase)
      await expect(
        controller.create(mockRequest, createDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should validate create DTO', async () => {
      // This test should fail initially (Red phase)
      const invalidDto = {
        ...createDto,
        price: -100, // invalid price
      };

      await expect(
        controller.create(mockVTuberRequest, invalidDto as CreateGachaDto)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('executeDraw', () => {
    const drawDto: DrawGachaDto = { drawCount: 1 };

    it('should execute single draw successfully', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';
      const expectedResult = {
        success: true,
        data: {
          results: [mockGachaResult],
          remainingMedals: 90,
          executionTime: 150,
        },
      };

      mockGachaService.executeDraw.mockResolvedValue(expectedResult.data);

      const result = await controller.executeDraw(
        mockRequest,
        gachaId,
        drawDto
      );

      expect(result).toEqual(expectedResult);
      expect(mockGachaService.executeDraw).toHaveBeenCalledWith(
        'user-001',
        gachaId,
        drawDto
      );
    });

    it('should execute multiple draws', async () => {
      // This test should fail initially (Red phase)
      const multiDrawDto: DrawGachaDto = { drawCount: 5 };
      const gachaId = 'gacha-001';

      const expectedResult = {
        results: Array(5).fill(mockGachaResult),
        remainingMedals: 50,
        executionTime: 300,
      };

      mockGachaService.executeDraw.mockResolvedValue(expectedResult);

      const result = await controller.executeDraw(
        mockRequest,
        gachaId,
        multiDrawDto
      );

      expect(result.data.results).toHaveLength(5);
      expect(mockGachaService.executeDraw).toHaveBeenCalledWith(
        'user-001',
        gachaId,
        multiDrawDto
      );
    });

    it('should validate draw count limits', async () => {
      // This test should fail initially (Red phase)
      const invalidDrawDto: DrawGachaDto = { drawCount: 15 }; // exceeds max of 10
      const gachaId = 'gacha-001';

      await expect(
        controller.executeDraw(mockRequest, gachaId, invalidDrawDto)
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle inactive gacha', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';

      mockGachaService.executeDraw.mockRejectedValue(
        new GachaInactiveException()
      );

      await expect(
        controller.executeDraw(mockRequest, gachaId, drawDto)
      ).rejects.toThrow(GachaInactiveException);
    });

    it('should handle max draws reached', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';

      mockGachaService.executeDraw.mockRejectedValue(
        new MaxDrawsReachedException()
      );

      await expect(
        controller.executeDraw(mockRequest, gachaId, drawDto)
      ).rejects.toThrow(MaxDrawsReachedException);
    });

    it('should require authentication', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';
      const unauthenticatedRequest = { user: null };

      await expect(
        controller.executeDraw(unauthenticatedRequest as any, gachaId, drawDto)
      ).rejects.toThrow();
    });

    it('should include execution time in response', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';
      const expectedResult = {
        results: [mockGachaResult],
        remainingMedals: 90,
        executionTime: 250,
      };

      mockGachaService.executeDraw.mockResolvedValue(expectedResult);

      const result = await controller.executeDraw(
        mockRequest,
        gachaId,
        drawDto
      );

      expect(result.data.executionTime).toBeDefined();
      expect(typeof result.data.executionTime).toBe('number');
    });
  });

  describe('getDrawHistory', () => {
    it('should return user draw history', async () => {
      // This test should fail initially (Red phase)
      const queryDto = { page: 1, limit: 20 };
      const expectedResult = {
        success: true,
        data: {
          results: [mockGachaResult],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
      };

      mockGachaService.getDrawHistory.mockResolvedValue(expectedResult.data);

      const result = await controller.getDrawHistory(mockRequest, queryDto);

      expect(result).toEqual(expectedResult);
      expect(mockGachaService.getDrawHistory).toHaveBeenCalledWith(
        'user-001',
        queryDto
      );
    });

    it('should filter by gachaId when provided', async () => {
      // This test should fail initially (Red phase)
      const queryDto = { page: 1, limit: 20, gachaId: 'gacha-001' };

      mockGachaService.getDrawHistory.mockResolvedValue({
        results: [mockGachaResult],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      await controller.getDrawHistory(mockRequest, queryDto);

      expect(mockGachaService.getDrawHistory).toHaveBeenCalledWith(
        'user-001',
        queryDto
      );
    });

    it('should require authentication', async () => {
      // This test should fail initially (Red phase)
      const queryDto = { page: 1, limit: 20 };
      const unauthenticatedRequest = { user: null };

      await expect(
        controller.getDrawHistory(unauthenticatedRequest as any, queryDto)
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Gacha',
      description: 'Updated Description',
    };

    it('should update gacha with proper authorization', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';
      const updatedGacha = { ...mockGacha, ...updateDto };

      mockGachaService.update.mockResolvedValue(updatedGacha);

      const result = await controller.update(
        mockVTuberRequest,
        gachaId,
        updateDto
      );

      expect(result.data).toEqual(updatedGacha);
      expect(mockGachaService.update).toHaveBeenCalledWith(gachaId, updateDto);
    });

    it('should prevent unauthorized updates', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';

      await expect(
        controller.update(mockRequest, gachaId, updateDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete gacha with proper authorization', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';

      mockGachaService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockVTuberRequest, gachaId);

      expect(result.success).toBe(true);
      expect(mockGachaService.remove).toHaveBeenCalledWith(gachaId);
    });

    it('should prevent unauthorized deletions', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';

      await expect(
        controller.remove(mockRequest, gachaId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to draw endpoints', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';
      const drawDto: DrawGachaDto = { drawCount: 1 };

      // Simulate rapid successive calls
      const promises = Array(100).fill(null).map(() =>
        controller.executeDraw(mockRequest, gachaId, drawDto)
      );

      mockGachaService.executeDraw.mockResolvedValue({
        results: [mockGachaResult],
        remainingMedals: 90,
        executionTime: 150,
      });

      // Should eventually hit rate limit
      await expect(Promise.all(promises)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'gacha-001';

      mockGachaService.findOne.mockRejectedValue(new Error('Database error'));

      await expect(controller.findOne(gachaId)).rejects.toThrow(
        'Database error'
      );
    });

    it('should return proper HTTP status codes', async () => {
      // This test should fail initially (Red phase)
      const gachaId = 'non-existent';

      mockGachaService.findOne.mockRejectedValue(
        new GachaNotFoundException(gachaId)
      );

      try {
        await controller.findOne(gachaId);
      } catch (error) {
        expect(error).toBeInstanceOf(GachaNotFoundException);
      }
    });
  });

  describe('Input Validation', () => {
    it('should validate UUID format for gacha ID', async () => {
      // This test should fail initially (Red phase)  
      const invalidGachaId = 'invalid-id-format';

      mockGachaService.findOne.mockRejectedValue(
        new GachaNotFoundException(invalidGachaId)
      );

      await expect(controller.findOne(invalidGachaId)).rejects.toThrow(
        GachaNotFoundException
      );
    });

    it('should sanitize input parameters', async () => {
      // This test should fail initially (Red phase)
      const maliciousQuery: GachaQueryDto = {
        page: 1,
        limit: 10,
        vtuberId: '<script>alert("xss")</script>',
      };

      // Should sanitize the vtuberId and not execute script
      await controller.findAll(maliciousQuery);

      expect(mockGachaService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          vtuberId: expect.not.stringContaining('<script>'),
        })
      );
    });
  });
});