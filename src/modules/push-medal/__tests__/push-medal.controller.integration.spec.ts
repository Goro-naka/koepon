import { Test, TestingModule } from '@nestjs/testing';
import { PushMedalController } from '../push-medal.controller';
import { PushMedalService } from '../push-medal.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';

describe('PushMedalController Integration Tests', () => {
  let controller: PushMedalController;
  let pushMedalService: PushMedalService;

  const mockRequest = {
    user: {
      sub: 'user-123',
      role: 'FAN'
    }
  };

  const mockAdminRequest = {
    user: {
      sub: 'admin-001',
      role: 'ADMIN'
    }
  };

  beforeEach(async () => {
    const mockPushMedalService = {
      getBalance: jest.fn().mockResolvedValue({
        userId: 'user-123',
        vtuberId: 'vtuber-001',
        balance: 100,
        lastUpdated: new Date()
      }),
      getPoolBalance: jest.fn().mockResolvedValue({
        userId: 'user-123',
        totalPoolBalance: 0,
        vtuberBalances: [
          { vtuberId: 'vtuber-001', balance: 100 }
        ]
      }),
      getTransactionHistory: jest.fn().mockResolvedValue({
        transactions: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          hasMore: false
        }
      }),
      transferFromPool: jest.fn().mockResolvedValue([]),
      adminAdjustBalance: jest.fn().mockResolvedValue({
        id: 'transaction-123',
        userId: 'user-123',
        vtuberId: 'vtuber-001',
        transactionType: 'ADMIN_ADJUSTMENT',
        amount: 50,
        balanceBefore: 100,
        balanceAfter: 150,
        createdAt: new Date()
      }),
      performIntegrityCheck: jest.fn().mockResolvedValue({
        totalChecked: 1,
        validBalances: 1,
        invalidBalances: 0,
        discrepancies: [],
        checkedAt: new Date()
      })
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PushMedalController],
      providers: [
        { provide: PushMedalService, useValue: mockPushMedalService },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .overrideGuard(RolesGuard)
    .useValue({ canActivate: jest.fn(() => true) })
    .compile();

    controller = module.get<PushMedalController>(PushMedalController);
    pushMedalService = module.get<PushMedalService>(PushMedalService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Endpoints', () => {
    it('should have all required endpoints implemented', async () => {
      // Test that methods exist and can be called
      expect(controller.getBalance).toBeDefined();
      expect(controller.getBalanceForVTuber).toBeDefined();
      expect(controller.getPoolBalance).toBeDefined();
      expect(controller.getTransactionHistory).toBeDefined();
      expect(controller.getTransactionHistoryForVTuber).toBeDefined();
      expect(controller.transferFromPool).toBeDefined();
      expect(controller.adminAdjustBalance).toBeDefined();
      expect(controller.adminIntegrityCheck).toBeDefined();

      // Test basic functionality works
      const result = await controller.getBalance(mockRequest, { vtuberId: 'vtuber-001' });
      expect(result).toBeDefined();
      expect(pushMedalService.getBalance).toHaveBeenCalledWith('user-123', 'vtuber-001');
    });
  });
});