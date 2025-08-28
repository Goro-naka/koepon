import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AppModule } from '../../../app.module';
import { Gacha } from '../entities/gacha.entity';
import { GachaItem } from '../entities/gacha-item.entity';
import { GachaResult } from '../entities/gacha-result.entity';
import { PaymentService } from '../../payment/payment.service';
import { PushMedalService } from '../../push-medal/push-medal.service';

describe('Gacha System Integration Tests', () => {
  let app: INestApplication;
  let gachaRepository: Repository<Gacha>;
  let gachaItemRepository: Repository<GachaItem>;
  let gachaResultRepository: Repository<GachaResult>;
  let paymentService: PaymentService;
  let pushMedalService: PushMedalService;

  const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
  const mockVTuberToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.vtuber.token';

  const testGacha = {
    id: 'gacha-test-001',
    vtuberId: 'vtuber-001',
    name: 'Integration Test Gacha',
    description: 'Test Gacha for Integration Tests',
    price: 1000,
    medalReward: 10,
    status: 'active' as const,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    maxDraws: 1000,
    totalDraws: 0,
  };

  const testGachaItems = [
    {
      id: 'item-test-001',
      gachaId: 'gacha-test-001',
      rewardId: 'reward-001',
      name: 'Common Test Item',
      description: 'Common item for testing',
      rarity: 'common' as const,
      dropRate: 0.7,
      maxCount: 1000,
      currentCount: 0,
    },
    {
      id: 'item-test-002',
      gachaId: 'gacha-test-001',
      rewardId: 'reward-002',
      name: 'Rare Test Item',
      description: 'Rare item for testing',
      rarity: 'rare' as const,
      dropRate: 0.3,
      maxCount: 100,
      currentCount: 0,
    },
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Gacha, GachaItem, GachaResult],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Gacha, GachaItem, GachaResult]),
      ],
    })
      .overrideProvider(PaymentService)
      .useValue({
        processPayment: jest.fn().mockResolvedValue({
          id: 'payment-test-001',
          status: 'completed',
        }),
        refundPayment: jest.fn().mockResolvedValue({ success: true }),
      })
      .overrideProvider(PushMedalService)
      .useValue({
        awardMedals: jest.fn().mockResolvedValue({
          success: true,
          newBalance: 100,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    gachaRepository = moduleFixture.get<Repository<Gacha>>(
      getRepositoryToken(Gacha)
    );
    gachaItemRepository = moduleFixture.get<Repository<GachaItem>>(
      getRepositoryToken(GachaItem)
    );
    gachaResultRepository = moduleFixture.get<Repository<GachaResult>>(
      getRepositoryToken(GachaResult)
    );
    paymentService = moduleFixture.get<PaymentService>(PaymentService);
    pushMedalService = moduleFixture.get<PushMedalService>(PushMedalService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await gachaResultRepository.clear();
    await gachaItemRepository.clear();
    await gachaRepository.clear();

    // Set up test gacha and items
    const savedGacha = await gachaRepository.save(testGacha);
    const itemsWithGachaId = testGachaItems.map(item => ({
      ...item,
      gachaId: savedGacha.id,
    }));
    await gachaItemRepository.save(itemsWithGachaId);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/gacha', () => {
    it('should return paginated gacha list', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .get('/api/v1/gacha')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.gacha).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.gacha.length).toBeGreaterThan(0);
    });

    it('should filter by vtuberId', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .get('/api/v1/gacha')
        .query({ vtuberId: 'vtuber-001' })
        .expect(200);

      expect(response.body.data.gacha).toHaveLength(1);
      expect(response.body.data.gacha[0].vtuberId).toBe('vtuber-001');
    });

    it('should filter by status', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .get('/api/v1/gacha')
        .query({ status: 'active' })
        .expect(200);

      response.body.data.gacha.forEach((gacha: any) => {
        expect(gacha.status).toBe('active');
      });
    });

    it('should handle empty results', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .get('/api/v1/gacha')
        .query({ vtuberId: 'non-existent-vtuber' })
        .expect(200);

      expect(response.body.data.gacha).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should validate query parameters', async () => {
      // This test should fail initially (Red phase)
      await request(app.getHttpServer())
        .get('/api/v1/gacha')
        .query({ page: -1, limit: 1000 })
        .expect(400);
    });
  });

  describe('GET /api/v1/gacha/:id', () => {
    it('should return gacha details with items', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .get(`/api/v1/gacha/${testGacha.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.gacha).toBeDefined();
      expect(response.body.data.gacha.id).toBe(testGacha.id);
      expect(response.body.data.gacha.items).toHaveLength(2);
    });

    it('should return 404 for non-existent gacha', async () => {
      // This test should fail initially (Red phase)
      await request(app.getHttpServer())
        .get('/api/v1/gacha/non-existent-id')
        .expect(404);
    });

    it('should validate UUID format', async () => {
      // This test should fail initially (Red phase)
      await request(app.getHttpServer())
        .get('/api/v1/gacha/invalid-uuid-format')
        .expect(400);
    });
  });

  describe('POST /api/v1/gacha/:id/draw', () => {
    it('should execute single draw with authentication', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .post(`/api/v1/gacha/${testGacha.id}/draw`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ drawCount: 1 })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(1);
      expect(response.body.data.executionTime).toBeDefined();
      expect(typeof response.body.data.executionTime).toBe('number');

      // Verify payment service was called
      expect(paymentService.processPayment).toHaveBeenCalledWith(
        expect.any(String),
        testGacha.price
      );

      // Verify medal service was called
      expect(pushMedalService.awardMedals).toHaveBeenCalledWith(
        expect.any(String),
        testGacha.vtuberId,
        testGacha.medalReward
      );
    });

    it('should execute multiple draws (up to 10)', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .post(`/api/v1/gacha/${testGacha.id}/draw`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ drawCount: 5 })
        .expect(201);

      expect(response.body.data.results).toHaveLength(5);

      // Verify payment for multiple draws
      expect(paymentService.processPayment).toHaveBeenCalledWith(
        expect.any(String),
        testGacha.price * 5
      );

      // Verify medal award for multiple draws
      expect(pushMedalService.awardMedals).toHaveBeenCalledWith(
        expect.any(String),
        testGacha.vtuberId,
        testGacha.medalReward * 5
      );
    });

    it('should require authentication', async () => {
      // This test should fail initially (Red phase)
      await request(app.getHttpServer())
        .post(`/api/v1/gacha/${testGacha.id}/draw`)
        .send({ drawCount: 1 })
        .expect(401);
    });

    it('should validate draw count limits', async () => {
      // This test should fail initially (Red phase)
      await request(app.getHttpServer())
        .post(`/api/v1/gacha/${testGacha.id}/draw`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ drawCount: 15 }) // exceeds max of 10
        .expect(400);
    });

    it('should return 404 for non-existent gacha', async () => {
      // This test should fail initially (Red phase)
      await request(app.getHttpServer())
        .post('/api/v1/gacha/non-existent-id/draw')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ drawCount: 1 })
        .expect(404);
    });

    it('should handle inactive gacha', async () => {
      // This test should fail initially (Red phase)
      // Update gacha to inactive
      await gachaRepository.update(testGacha.id, { status: 'inactive' });

      await request(app.getHttpServer())
        .post(`/api/v1/gacha/${testGacha.id}/draw`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ drawCount: 1 })
        .expect(400);
    });

    it('should handle payment failure with rollback', async () => {
      // This test should fail initially (Red phase)
      (paymentService.processPayment as jest.Mock).mockRejectedValueOnce(
        new Error('Payment failed')
      );

      await request(app.getHttpServer())
        .post(`/api/v1/gacha/${testGacha.id}/draw`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ drawCount: 1 })
        .expect(500);

      // Verify medal service was not called
      expect(pushMedalService.awardMedals).not.toHaveBeenCalled();

      // Verify no gacha results were saved
      const results = await gachaResultRepository.find();
      expect(results).toHaveLength(0);
    });

    it('should handle medal award failure with rollback', async () => {
      // This test should fail initially (Red phase)
      (pushMedalService.awardMedals as jest.Mock).mockRejectedValueOnce(
        new Error('Medal award failed')
      );

      await request(app.getHttpServer())
        .post(`/api/v1/gacha/${testGacha.id}/draw`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ drawCount: 1 })
        .expect(500);

      // Verify payment refund was called
      expect(paymentService.refundPayment).toHaveBeenCalled();

      // Verify no gacha results were saved
      const results = await gachaResultRepository.find();
      expect(results).toHaveLength(0);
    });

    it('should complete draw within 3 seconds', async () => {
      // This test should fail initially (Red phase)
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post(`/api/v1/gacha/${testGacha.id}/draw`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ drawCount: 10 });
      
      const totalTime = Date.now() - startTime;

      expect(response.status).toBe(201);
      expect(totalTime).toBeLessThan(3000);
      expect(response.body.data.executionTime).toBeLessThan(3000);
    });
  });

  describe('POST /api/v1/gacha', () => {
    const createGachaDto = {
      name: 'New Integration Test Gacha',
      description: 'Created via integration test',
      price: 1500,
      medalReward: 15,
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
      maxDraws: 500,
      items: [
        {
          rewardId: 'reward-new-001',
          name: 'New Test Item',
          description: 'New item for testing',
          rarity: 'common',
          dropRate: 1.0,
          maxCount: 100,
        },
      ],
    };

    it('should create gacha with VTuber authorization', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .post('/api/v1/gacha')
        .set('Authorization', `Bearer ${mockVTuberToken}`)
        .send(createGachaDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(createGachaDto.name);
      expect(response.body.data.price).toBe(createGachaDto.price);

      // Verify gacha was saved to database
      const savedGacha = await gachaRepository.findOne({
        where: { name: createGachaDto.name },
      });
      expect(savedGacha).toBeDefined();
    });

    it('should normalize item drop rates', async () => {
      // This test should fail initially (Red phase)
      const dtoWithUnnormalizedRates = {
        ...createGachaDto,
        items: [
          { ...createGachaDto.items[0], dropRate: 0.6 },
          { ...createGachaDto.items[0], dropRate: 0.7 }, // sum = 1.3
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/gacha')
        .set('Authorization', `Bearer ${mockVTuberToken}`)
        .send(dtoWithUnnormalizedRates)
        .expect(201);

      // Verify rates were normalized
      const savedItems = await gachaItemRepository.find({
        where: { gachaId: response.body.data.id },
      });
      
      const totalRate = savedItems.reduce(
        (sum, item) => sum + item.dropRate,
        0
      );
      expect(totalRate).toBeCloseTo(1.0, 5);
    });

    it('should require VTuber or Admin authorization', async () => {
      // This test should fail initially (Red phase)
      await request(app.getHttpServer())
        .post('/api/v1/gacha')
        .set('Authorization', `Bearer ${mockJwtToken}`) // regular user token
        .send(createGachaDto)
        .expect(403);
    });

    it('should validate required fields', async () => {
      // This test should fail initially (Red phase)
      const invalidDto = {
        ...createGachaDto,
        name: '', // empty name
        price: -100, // negative price
      };

      await request(app.getHttpServer())
        .post('/api/v1/gacha')
        .set('Authorization', `Bearer ${mockVTuberToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /api/v1/gacha/history', () => {
    beforeEach(async () => {
      // Create some test draw results
      const testResults = Array.from({ length: 5 }, (_, index) => ({
        id: `result-${index + 1}`,
        userId: 'test-user-001',
        gachaId: testGacha.id,
        itemId: testGachaItems[0].id,
        price: testGacha.price,
        medalReward: testGacha.medalReward,
        timestamp: new Date(),
      }));

      await gachaResultRepository.save(testResults);
    });

    it('should return user draw history', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .get('/api/v1/gacha/history')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.results.length).toBeGreaterThan(0);
    });

    it('should filter by gachaId', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .get('/api/v1/gacha/history')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .query({ gachaId: testGacha.id })
        .expect(200);

      response.body.data.results.forEach((result: any) => {
        expect(result.gachaId).toBe(testGacha.id);
      });
    });

    it('should require authentication', async () => {
      // This test should fail initially (Red phase)
      await request(app.getHttpServer())
        .get('/api/v1/gacha/history')
        .expect(401);
    });

    it('should paginate results correctly', async () => {
      // This test should fail initially (Red phase)
      const response = await request(app.getHttpServer())
        .get('/api/v1/gacha/history')
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body.data.results).toHaveLength(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(3);
    });
  });

  describe('Database Transaction Integrity', () => {
    it('should maintain ACID properties during concurrent draws', async () => {
      // This test should fail initially (Red phase)
      const concurrentDraws = Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post(`/api/v1/gacha/${testGacha.id}/draw`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send({ drawCount: 1 })
      );

      const responses = await Promise.allSettled(concurrentDraws);
      const successfulDraws = responses.filter(
        (response) => response.status === 'fulfilled'
      );

      expect(successfulDraws.length).toBeGreaterThan(0);

      // Verify database consistency
      const totalResults = await gachaResultRepository.count();
      const totalPaymentCalls = (paymentService.processPayment as jest.Mock)
        .mock.calls.length;
      const totalMedalCalls = (pushMedalService.awardMedals as jest.Mock)
        .mock.calls.length;

      expect(totalResults).toBe(totalPaymentCalls);
      expect(totalResults).toBe(totalMedalCalls);
    });

    it('should rollback all changes on transaction failure', async () => {
      // This test should fail initially (Red phase)
      // Mock medal service to fail after payment succeeds
      (pushMedalService.awardMedals as jest.Mock)
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Medal service down'));

      await request(app.getHttpServer())
        .post(`/api/v1/gacha/${testGacha.id}/draw`)
        .set('Authorization', `Bearer ${mockJwtToken}`)
        .send({ drawCount: 1 })
        .expect(500);

      // Verify no partial state was saved
      const results = await gachaResultRepository.find();
      expect(results).toHaveLength(0);

      // Verify refund was called
      expect(paymentService.refundPayment).toHaveBeenCalled();
    });
  });

  describe('Performance Requirements', () => {
    it('should handle 100 concurrent users drawing', async () => {
      // This test should fail initially (Red phase)
      const concurrentUsers = 100;
      const draws = Array.from({ length: concurrentUsers }, (_, index) =>
        request(app.getHttpServer())
          .post(`/api/v1/gacha/${testGacha.id}/draw`)
          .set('Authorization', `Bearer ${mockJwtToken}-${index}`)
          .send({ drawCount: 1 })
      );

      const startTime = Date.now();
      const responses = await Promise.allSettled(draws);
      const executionTime = Date.now() - startTime;

      const successfulResponses = responses.filter(
        (response) => response.status === 'fulfilled'
      ) as Array<PromiseFulfilledResult<any>>;

      expect(successfulResponses.length).toBeGreaterThan(concurrentUsers * 0.8);
      expect(executionTime).toBeLessThan(10000); // 10 seconds max for 100 users
    });

    it('should maintain response time under load', async () => {
      // This test should fail initially (Red phase)
      const responses = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/v1/gacha/${testGacha.id}/draw`)
          .set('Authorization', `Bearer ${mockJwtToken}`)
          .send({ drawCount: 10 }),
        request(app.getHttpServer())
          .get('/api/v1/gacha'),
        request(app.getHttpServer())
          .get(`/api/v1/gacha/${testGacha.id}`),
      ]);

      responses.forEach(response => {
        if (response.status === 200 || response.status === 201) {
          if (response.body.data?.executionTime) {
            expect(response.body.data.executionTime).toBeLessThan(3000);
          }
        }
      });
    });
  });
});