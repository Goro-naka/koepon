import { DrawAlgorithm } from '../algorithms/draw-algorithm';
import { GachaItem } from '../entities/gacha-item.entity';

describe('DrawAlgorithm Unit Tests', () => {
  let drawAlgorithm: DrawAlgorithm;

  const mockGachaItems: GachaItem[] = [
    {
      id: 'item-001',
      gachaId: 'gacha-001',
      rewardId: 'reward-001',
      name: 'Common Item',
      description: 'Common Item Description',
      rarity: 'common',
      dropRate: 0.6,
      maxCount: 1000,
      currentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'item-002',
      gachaId: 'gacha-001',
      rewardId: 'reward-002',
      name: 'Rare Item',
      description: 'Rare Item Description',
      rarity: 'rare',
      dropRate: 0.3,
      maxCount: 100,
      currentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'item-003',
      gachaId: 'gacha-001',
      rewardId: 'reward-003',
      name: 'Epic Item',
      description: 'Epic Item Description',
      rarity: 'epic',
      dropRate: 0.09,
      maxCount: 10,
      currentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'item-004',
      gachaId: 'gacha-001',
      rewardId: 'reward-004',
      name: 'Legendary Item',
      description: 'Legendary Item Description',
      rarity: 'legendary',
      dropRate: 0.01,
      maxCount: 1,
      currentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    drawAlgorithm = new DrawAlgorithm();
  });

  describe('normalizeDropRates', () => {
    it('should normalize drop rates to sum to 1.0', () => {
      // This test should fail initially (Red phase)
      const items = [
        { dropRate: 0.6, name: 'Item 1' },
        { dropRate: 0.3, name: 'Item 2' },
        { dropRate: 0.2, name: 'Item 3' }, // Sum = 1.1
      ];

      const result = drawAlgorithm.normalizeDropRates(items);
      const sum = result.reduce((acc, item) => acc + item.dropRate, 0);

      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('should handle single item normalization', () => {
      // This test should fail initially (Red phase)
      const items = [{ dropRate: 0.5, name: 'Single Item' }];

      const result = drawAlgorithm.normalizeDropRates(items);

      expect(result[0].dropRate).toBe(1.0);
    });

    it('should handle zero drop rates', () => {
      // This test should fail initially (Red phase)
      const items = [
        { dropRate: 0, name: 'Zero Item' },
        { dropRate: 0.5, name: 'Normal Item' },
      ];

      const result = drawAlgorithm.normalizeDropRates(items);
      const sum = result.reduce((acc, item) => acc + item.dropRate, 0);

      expect(sum).toBeCloseTo(1.0, 5);
      expect(result[0].dropRate).toBe(0);
      expect(result[1].dropRate).toBe(1.0);
    });

    it('should preserve original objects except dropRate', () => {
      // This test should fail initially (Red phase)
      const items = [
        { dropRate: 0.3, name: 'Item 1', id: 'item-1' },
        { dropRate: 0.7, name: 'Item 2', id: 'item-2' },
      ];

      const result = drawAlgorithm.normalizeDropRates(items);

      expect(result[0].name).toBe('Item 1');
      expect(result[0].id).toBe('item-1');
      expect(result[1].name).toBe('Item 2');
      expect(result[1].id).toBe('item-2');
    });
  });

  describe('executeDraws', () => {
    it('should execute single draw', async () => {
      // This test should fail initially (Red phase)
      const userId = 'user-001';
      const drawCount = 1;

      const result = await drawAlgorithm.executeDraws(
        mockGachaItems,
        userId,
        drawCount
      );

      expect(result).toHaveLength(1);
      expect(mockGachaItems.some(item => item.id === result[0].id)).toBe(true);
    });

    it('should execute multiple draws (up to 10)', async () => {
      // This test should fail initially (Red phase)
      const userId = 'user-001';
      const drawCount = 5;

      const result = await drawAlgorithm.executeDraws(
        mockGachaItems,
        userId,
        drawCount
      );

      expect(result).toHaveLength(5);
      result.forEach(item => {
        expect(mockGachaItems.some(gachaItem => gachaItem.id === item.id)).toBe(true);
      });
    });

    it('should respect drop rates in large sample', async () => {
      // This test should fail initially (Red phase)
      const userId = 'user-001';
      const drawCount = 10000;
      const tolerance = 0.02; // 2% tolerance

      const result = await drawAlgorithm.executeDraws(
        mockGachaItems,
        userId,
        drawCount
      );

      // Count occurrences of each rarity
      const commonCount = result.filter(item => item.rarity === 'common').length;
      const rareCount = result.filter(item => item.rarity === 'rare').length;
      const epicCount = result.filter(item => item.rarity === 'epic').length;
      const legendaryCount = result.filter(item => item.rarity === 'legendary').length;

      // Check if distributions are close to expected rates
      expect(commonCount / drawCount).toBeCloseTo(0.6, 1);
      expect(rareCount / drawCount).toBeCloseTo(0.3, 1);
      expect(epicCount / drawCount).toBeCloseTo(0.09, 1);
      expect(legendaryCount / drawCount).toBeCloseTo(0.01, 1);
    });

    it('should exclude items that reached max count', async () => {
      // This test should fail initially (Red phase)
      const itemsWithMaxCount = mockGachaItems.map(item => ({
        ...item,
        maxCount: item.rarity === 'legendary' ? 1 : item.maxCount,
        currentCount: item.rarity === 'legendary' ? 1 : 0, // Legendary item is maxed out
      }));

      const userId = 'user-001';
      const drawCount = 100;

      const result = await drawAlgorithm.executeDraws(
        itemsWithMaxCount,
        userId,
        drawCount
      );

      // Should not contain any legendary items
      const legendaryItems = result.filter(item => item.rarity === 'legendary');
      expect(legendaryItems).toHaveLength(0);
    });

    it('should recalculate probabilities after exclusion', async () => {
      // This test should fail initially (Red phase)
      const itemsWithExclusions = [
        { ...mockGachaItems[0], dropRate: 0.5 }, // common
        { ...mockGachaItems[1], dropRate: 0.5 }, // rare
        { ...mockGachaItems[2], dropRate: 0.0, maxCount: 1, currentCount: 1 }, // epic - excluded
      ];

      const userId = 'user-001';
      const drawCount = 1000;

      const result = await drawAlgorithm.executeDraws(
        itemsWithExclusions,
        userId,
        drawCount
      );

      const commonCount = result.filter(item => item.rarity === 'common').length;
      const rareCount = result.filter(item => item.rarity === 'rare').length;
      const epicCount = result.filter(item => item.rarity === 'epic').length;

      // Should redistribute probabilities between common and rare (50/50)
      expect(commonCount / drawCount).toBeCloseTo(0.5, 1);
      expect(rareCount / drawCount).toBeCloseTo(0.5, 1);
      expect(epicCount).toBe(0);
    });

    it('should handle all items reaching max count', async () => {
      // This test should fail initially (Red phase)
      const allMaxedItems = mockGachaItems.map(item => ({
        ...item,
        maxCount: 1,
        currentCount: 1,
      }));

      const userId = 'user-001';
      const drawCount = 1;

      await expect(
        drawAlgorithm.executeDraws(allMaxedItems, userId, drawCount)
      ).rejects.toThrow('No available items for draw');
    });

    it('should implement rarity guarantee system', async () => {
      // This test should fail initially (Red phase)
      const userId = 'user-001';
      const guaranteeThreshold = 50; // After 50 draws without rare+, guarantee rare
      
      // Mock user draw history with 49 common items
      const previousDraws = Array(49).fill({ rarity: 'common' });
      
      const result = await drawAlgorithm.executeDraws(
        mockGachaItems,
        userId,
        1,
        previousDraws
      );

      // 50th draw should guarantee rare or better
      expect(['rare', 'epic', 'legendary']).toContain(result[0].rarity);
    });

    it('should reset guarantee counter after rare draw', async () => {
      // This test should fail initially (Red phase)
      const userId = 'user-001';
      
      // Mock user draw history with rare item in recent draws
      const previousDraws = [
        ...Array(30).fill({ rarity: 'common' }),
        { rarity: 'rare' },
        ...Array(10).fill({ rarity: 'common' }),
      ];
      
      const result = await drawAlgorithm.executeDraws(
        mockGachaItems,
        userId,
        1,
        previousDraws
      );

      // Should not guarantee rare since counter was reset
      expect(result).toHaveLength(1);
    });

    it('should complete draws within performance threshold', async () => {
      // This test should fail initially (Red phase)
      const userId = 'user-001';
      const drawCount = 10;
      const maxExecutionTime = 100; // 100ms for 10 draws

      const startTime = Date.now();
      const result = await drawAlgorithm.executeDraws(
        mockGachaItems,
        userId,
        drawCount
      );
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(maxExecutionTime);
      expect(result).toHaveLength(drawCount);
    });

    it('should handle concurrent draws without race conditions', async () => {
      // This test should fail initially (Red phase)
      const userId1 = 'user-001';
      const userId2 = 'user-002';
      const drawCount = 5;

      const [result1, result2] = await Promise.all([
        drawAlgorithm.executeDraws(mockGachaItems, userId1, drawCount),
        drawAlgorithm.executeDraws(mockGachaItems, userId2, drawCount),
      ]);

      expect(result1).toHaveLength(drawCount);
      expect(result2).toHaveLength(drawCount);
      
      // Results should be independent
      expect(result1).not.toEqual(result2);
    });
  });

  describe('validateItems', () => {
    it('should validate proper item structure', () => {
      // This test should fail initially (Red phase)
      const validItems = mockGachaItems;

      expect(() => drawAlgorithm.validateItems(validItems)).not.toThrow();
    });

    it('should reject items with invalid drop rates', () => {
      // This test should fail initially (Red phase)
      const invalidItems = [
        { ...mockGachaItems[0], dropRate: -0.1 }, // negative rate
        { ...mockGachaItems[1], dropRate: 1.5 },  // rate > 1
      ];

      expect(() => drawAlgorithm.validateItems(invalidItems)).toThrow(
        'Invalid drop rate'
      );
    });

    it('should reject items with invalid counts', () => {
      // This test should fail initially (Red phase)
      const invalidItems = [
        { ...mockGachaItems[0], maxCount: -1 },      // negative maxCount
        { ...mockGachaItems[1], currentCount: -1 },   // negative currentCount
      ];

      expect(() => drawAlgorithm.validateItems(invalidItems)).toThrow(
        'Invalid count values'
      );
    });

    it('should reject empty item list', () => {
      // This test should fail initially (Red phase)
      const emptyItems: GachaItem[] = [];

      expect(() => drawAlgorithm.validateItems(emptyItems)).toThrow(
        'No items provided'
      );
    });
  });

  describe('calculateWeightedRandom', () => {
    it('should select items according to weights', () => {
      // This test should fail initially (Red phase)
      const items = [
        { id: '1', weight: 0.8 },
        { id: '2', weight: 0.2 },
      ];

      let selection1Count = 0;
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const selected = drawAlgorithm.calculateWeightedRandom(items);
        if (selected.id === '1') selection1Count++;
      }

      const actualRatio = selection1Count / iterations;
      expect(actualRatio).toBeCloseTo(0.8, 1);
    });

    it('should handle single item selection', () => {
      // This test should fail initially (Red phase)
      const items = [{ id: '1', weight: 1.0 }];

      const selected = drawAlgorithm.calculateWeightedRandom(items);

      expect(selected.id).toBe('1');
    });

    it('should throw error for empty items', () => {
      // This test should fail initially (Red phase)
      const emptyItems: any[] = [];

      expect(() => drawAlgorithm.calculateWeightedRandom(emptyItems)).toThrow(
        'No items available for selection'
      );
    });
  });
});