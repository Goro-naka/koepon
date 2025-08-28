import { Test, TestingModule } from '@nestjs/testing';
import { createMockCustomLoggerService } from '../../../test/test-helpers';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { PushMedalService } from '../push-medal.service';
import { DatabaseService } from '../../database/database.service';
import { CustomLoggerService } from '../../../common/logger/logger.service';
import { GachaExecutedEvent, PaymentCompletedEvent, PushMedalTransactionType } from '../interfaces/push-medal.interface';

describe('PushMedalService Integration Tests', () => {
  let service: PushMedalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushMedalService,
        {
          provide: DatabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue({
              from: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ 
                      data: {
                        id: 'balance-123',
                        user_id: 'user-123',
                        vtuber_id: 'vtuber-001',
                        balance: 100,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      }
                    })
                  })
                })
              }),
              rpc: jest.fn().mockResolvedValue({ 
                data: 'transaction-123', 
                error: null 
              })
            })
          }
        },
        {
          provide: CustomLoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          }
        }
      ],
    }).compile();

    service = module.get<PushMedalService>(PushMedalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Medal Calculation', () => {
    it('should calculate correct medal amounts', () => {
      // Test private method through reflection for unit testing
      const calculateMedalAmount = (service as any).calculateMedalAmount.bind(service);
      
      expect(calculateMedalAmount(300, 1)).toBe(30); // 300円 single = 30 medals
      expect(calculateMedalAmount(500, 1)).toBe(50); // 500円 single = 50 medals
      expect(calculateMedalAmount(300, 10)).toBe(300); // 300円 * 10 = 300 medals
      expect(calculateMedalAmount(100, 1)).toBe(10); // Minimum 10 medals
      expect(calculateMedalAmount(12000, 1)).toBe(1000); // Maximum 1000 medals
    });
  });

  describe('Service Methods', () => {
    it('should have all required methods implemented', () => {
      expect(service.grantMedalFromGacha).toBeDefined();
      expect(service.grantMedalFromPayment).toBeDefined();
      expect(service.getBalance).toBeDefined();
      expect(service.getPoolBalance).toBeDefined();
      expect(service.getTransactionHistory).toBeDefined();
      expect(service.transferFromPool).toBeDefined();
      expect(service.adminAdjustBalance).toBeDefined();
      expect(service.performIntegrityCheck).toBeDefined();
    });
  });
});