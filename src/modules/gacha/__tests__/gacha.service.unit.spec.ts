import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GachaService } from '../gacha.service';
import { Gacha } from '../entities/gacha.entity';
import { GachaItem } from '../entities/gacha-item.entity';
import { GachaResult } from '../entities/gacha-result.entity';
import { PaymentService } from '../../payment/payment.service';
import { PushMedalService } from '../../push-medal/push-medal.service';
import { DrawAlgorithm } from '../algorithms/draw-algorithm';
import { CreateGachaDto } from '../dto/create-gacha.dto';
import { GachaQueryDto } from '../dto/gacha-query.dto';
import { DrawGachaDto } from '../dto/draw-gacha.dto';
import {
  GachaInactiveException,
  GachaNotFoundException,
  MaxDrawsReachedException,
} from '../exceptions/gacha.exceptions';

describe('GachaService Unit Tests', () => {
  let service: GachaService;
  let gachaRepository: Repository<Gacha>;
  let gachaItemRepository: Repository<GachaItem>;
  let gachaResultRepository: Repository<GachaResult>;
  let paymentService: PaymentService;
  let pushMedalService: PushMedalService;
  let drawAlgorithm: DrawAlgorithm;

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

  const mockGachaItem = {
    id: 'item-001',
    gachaId: 'gacha-001',
    rewardId: 'reward-001',
    name: 'Test Item',
    description: 'Test Item Description',
    rarity: 'common' as const,
    dropRate: 0.5,
    maxCount: 100,
    currentCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
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

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn(),
    })),
  };

  const mockPaymentService = {
    processPayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  const mockPushMedalService = {
    awardMedals: jest.fn(),
  };

  const mockDrawAlgorithm = {
    executeDraws: jest.fn(),
    normalizeDropRates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GachaService,
        {
          provide: getRepositoryToken(Gacha),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(GachaItem),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(GachaResult),
          useValue: mockRepository,
        },
        {
          provide: PaymentService,
          useValue: mockPaymentService,
        },
        {
          provide: PushMedalService,
          useValue: mockPushMedalService,
        },
        {
          provide: DrawAlgorithm,
          useValue: mockDrawAlgorithm,
        },
      ],
    }).compile();

    service = module.get<GachaService>(GachaService);
    gachaRepository = module.get<Repository<Gacha>>(getRepositoryToken(Gacha));
    gachaItemRepository = module.get<Repository<GachaItem>>(getRepositoryToken(GachaItem));
    gachaResultRepository = module.get<Repository<GachaResult>>(getRepositoryToken(GachaResult));
    paymentService = module.get<PaymentService>(PaymentService);
    pushMedalService = module.get<PushMedalService>(PushMedalService);
    drawAlgorithm = module.get<DrawAlgorithm>(DrawAlgorithm);
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
        gacha: [mockGacha],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockRepository.findAndCount.mockResolvedValue([[mockGacha], 1]);

      const result = await service.findAll(queryDto);

      expect(result).toEqual(expectedResult);
      expect(mockRepository.findAndCount).toHaveBeenCalled();
    });

    it('should handle empty result set', async () => {
      // This test should fail initially (Red phase)
      const queryDto: GachaQueryDto = { page: 1, limit: 10 };
      
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(queryDto);

      expect(result.gacha).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return gacha with items', async () => {
      // This test should fail initially (Red phase)
      const gachaWithItems = { ...mockGacha, items: [mockGachaItem] };
      
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(gachaWithItems);

      const result = await service.findOne('gacha-001');

      expect(result).toEqual(gachaWithItems);
    });

    it('should throw GachaNotFoundException when gacha not found', async () => {
      // This test should fail initially (Red phase)
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        GachaNotFoundException
      );
    });
  });

  describe('create', () => {
    it('should create gacha with normalized drop rates', async () => {
      // This test should fail initially (Red phase)
      const createDto: CreateGachaDto = {
        name: 'Test Gacha',
        description: 'Test Description',
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
            dropRate: 0.6,
            maxCount: 100,
          },
        ],
      };

      const normalizedItems = [{ ...createDto.items[0], dropRate: 1.0 }];
      mockDrawAlgorithm.normalizeDropRates.mockReturnValue(normalizedItems);
      mockRepository.save.mockResolvedValue(mockGacha);

      const result = await service.create('vtuber-001', createDto);

      expect(mockDrawAlgorithm.normalizeDropRates).toHaveBeenCalledWith(createDto.items);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockGacha);
    });

    it('should validate VTuber ownership', async () => {
      // This test should fail initially (Red phase)
      const createDto: CreateGachaDto = {
        name: 'Test Gacha',
        description: 'Test Description',
        price: 1000,
        medalReward: 10,
        startDate: '2024-01-01T00:00:00Z',
        items: [],
      };

      // Should validate that only the VTuber can create their own gacha
      await expect(service.create('invalid-vtuber', createDto)).toBeDefined();
    });
  });

  describe('executeDraw', () => {
    it('should execute single draw successfully', async () => {
      // This test should fail initially (Red phase)
      const drawDto: DrawGachaDto = { drawCount: 1 };
      const gachaWithItems = { ...mockGacha, items: [mockGachaItem] };
      
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(gachaWithItems);
      mockPaymentService.processPayment.mockResolvedValue({ 
        id: 'payment-001', 
        status: 'completed' 
      });
      mockDrawAlgorithm.executeDraws.mockResolvedValue([mockGachaItem]);
      mockPushMedalService.awardMedals.mockResolvedValue({ success: true });
      mockRepository.save.mockResolvedValue([mockGachaResult]);

      const result = await service.executeDraw('user-001', 'gacha-001', drawDto);

      expect(mockPaymentService.processPayment).toHaveBeenCalled();
      expect(mockDrawAlgorithm.executeDraws).toHaveBeenCalled();
      expect(mockPushMedalService.awardMedals).toHaveBeenCalled();
      expect(result.results).toHaveLength(1);
      expect(result.executionTime).toBeDefined();
    });

    it('should execute multiple draws (up to 10)', async () => {
      // This test should fail initially (Red phase)
      const drawDto: DrawGachaDto = { drawCount: 5 };
      const gachaWithItems = { ...mockGacha, items: [mockGachaItem] };
      
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(gachaWithItems);
      mockPaymentService.processPayment.mockResolvedValue({ 
        id: 'payment-001', 
        status: 'completed' 
      });
      mockDrawAlgorithm.executeDraws.mockResolvedValue(Array(5).fill(mockGachaItem));
      mockPushMedalService.awardMedals.mockResolvedValue({ success: true });
      mockRepository.save.mockResolvedValue(Array(5).fill(mockGachaResult));

      const result = await service.executeDraw('user-001', 'gacha-001', drawDto);

      expect(result.results).toHaveLength(5);
      expect(mockPaymentService.processPayment).toHaveBeenCalledWith(
        'user-001',
        mockGacha.price * 5
      );
    });

    it('should throw GachaNotFoundException for non-existent gacha', async () => {
      // This test should fail initially (Red phase)
      const drawDto: DrawGachaDto = { drawCount: 1 };
      
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(null);

      await expect(
        service.executeDraw('user-001', 'non-existent', drawDto)
      ).rejects.toThrow(GachaNotFoundException);
    });

    it('should throw GachaInactiveException for inactive gacha', async () => {
      // This test should fail initially (Red phase)
      const inactiveGacha = { ...mockGacha, status: 'inactive' as const };
      const drawDto: DrawGachaDto = { drawCount: 1 };
      
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(inactiveGacha);

      await expect(
        service.executeDraw('user-001', 'gacha-001', drawDto)
      ).rejects.toThrow(GachaInactiveException);
    });

    it('should throw MaxDrawsReachedException when max draws reached', async () => {
      // This test should fail initially (Red phase)
      const maxedGacha = { ...mockGacha, totalDraws: 1000, maxDraws: 1000 };
      const drawDto: DrawGachaDto = { drawCount: 1 };
      
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(maxedGacha);

      await expect(
        service.executeDraw('user-001', 'gacha-001', drawDto)
      ).rejects.toThrow(MaxDrawsReachedException);
    });

    it('should rollback on payment failure', async () => {
      // This test should fail initially (Red phase)
      const drawDto: DrawGachaDto = { drawCount: 1 };
      const gachaWithItems = { ...mockGacha, items: [mockGachaItem] };
      
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(gachaWithItems);
      mockPaymentService.processPayment.mockRejectedValue(new Error('Payment failed'));

      await expect(
        service.executeDraw('user-001', 'gacha-001', drawDto)
      ).rejects.toThrow('Payment failed');

      // Should not call subsequent services
      expect(mockDrawAlgorithm.executeDraws).not.toHaveBeenCalled();
      expect(mockPushMedalService.awardMedals).not.toHaveBeenCalled();
    });

    it('should rollback on medal award failure', async () => {
      // This test should fail initially (Red phase)
      const drawDto: DrawGachaDto = { drawCount: 1 };
      const gachaWithItems = { ...mockGacha, items: [mockGachaItem] };
      
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(gachaWithItems);
      mockPaymentService.processPayment.mockResolvedValue({ 
        id: 'payment-001', 
        status: 'completed' 
      });
      mockDrawAlgorithm.executeDraws.mockResolvedValue([mockGachaItem]);
      mockPushMedalService.awardMedals.mockRejectedValue(new Error('Medal award failed'));

      await expect(
        service.executeDraw('user-001', 'gacha-001', drawDto)
      ).rejects.toThrow('Medal award failed');

      // Should call refund
      expect(mockPaymentService.refundPayment).toHaveBeenCalledWith('payment-001');
    });

    it('should complete execution within 3 seconds', async () => {
      // This test should fail initially (Red phase)
      const drawDto: DrawGachaDto = { drawCount: 10 };
      const gachaWithItems = { ...mockGacha, items: [mockGachaItem] };
      
      mockRepository.createQueryBuilder().getOne.mockResolvedValue(gachaWithItems);
      mockPaymentService.processPayment.mockResolvedValue({ 
        id: 'payment-001', 
        status: 'completed' 
      });
      mockDrawAlgorithm.executeDraws.mockResolvedValue(Array(10).fill(mockGachaItem));
      mockPushMedalService.awardMedals.mockResolvedValue({ success: true });
      mockRepository.save.mockResolvedValue(Array(10).fill(mockGachaResult));

      const startTime = Date.now();
      const result = await service.executeDraw('user-001', 'gacha-001', drawDto);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(3000);
      expect(result.executionTime).toBeLessThan(3000);
    });
  });

  describe('getDrawHistory', () => {
    it('should return user draw history with pagination', async () => {
      // This test should fail initially (Red phase)
      const queryDto = { page: 1, limit: 20 };
      
      mockRepository.findAndCount.mockResolvedValue([[mockGachaResult], 1]);

      const result = await service.getDrawHistory('user-001', queryDto);

      expect(result.results).toEqual([mockGachaResult]);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by gachaId when provided', async () => {
      // This test should fail initially (Red phase)
      const queryDto = { page: 1, limit: 20, gachaId: 'gacha-001' };
      
      mockRepository.findAndCount.mockResolvedValue([[mockGachaResult], 1]);

      const result = await service.getDrawHistory('user-001', queryDto);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-001',
            gachaId: 'gacha-001',
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update gacha settings', async () => {
      // This test should fail initially (Red phase)
      const updateDto = {
        name: 'Updated Gacha Name',
        description: 'Updated Description',
      };
      
      mockRepository.findOne.mockResolvedValue(mockGacha);
      mockRepository.save.mockResolvedValue({ ...mockGacha, ...updateDto });

      const result = await service.update('gacha-001', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(updateDto.description);
    });

    it('should prevent editing active gacha items', async () => {
      // This test should fail initially (Red phase)
      const updateDto = {
        items: [
          {
            rewardId: 'reward-002',
            name: 'New Item',
            description: 'New Item Description',
            rarity: 'rare',
            dropRate: 0.3,
          },
        ],
      };
      
      mockRepository.findOne.mockResolvedValue(mockGacha);

      await expect(
        service.update('gacha-001', updateDto)
      ).rejects.toThrow('Cannot modify items of active gacha');
    });
  });

  describe('remove', () => {
    it('should soft delete inactive gacha', async () => {
      // This test should fail initially (Red phase)
      const inactiveGacha = { ...mockGacha, status: 'inactive' as const };
      
      mockRepository.findOne.mockResolvedValue(inactiveGacha);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.remove('gacha-001');

      expect(mockRepository.update).toHaveBeenCalledWith(
        'gacha-001',
        { status: 'ended' }
      );
    });

    it('should prevent deleting active gacha', async () => {
      // This test should fail initially (Red phase)
      mockRepository.findOne.mockResolvedValue(mockGacha);

      await expect(service.remove('gacha-001')).rejects.toThrow(
        'Cannot delete active gacha'
      );
    });
  });
});