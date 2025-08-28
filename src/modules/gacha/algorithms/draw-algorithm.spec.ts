import { DrawAlgorithm } from './draw-algorithm';
import { GachaItem } from '../interfaces/gacha.interface';

describe('DrawAlgorithm', () => {
  let drawAlgorithm: DrawAlgorithm;

  beforeEach(() => {
    drawAlgorithm = new DrawAlgorithm();
  });

  describe('selectWeightedRandom', () => {
    it('should select items according to drop rates', async () => {
      // Given: 明確な排出率のアイテム
      const items: Partial<GachaItem>[] = [
        { id: 'common', dropRate: 0.9, name: 'Common Item', rarity: 'common' },
        { id: 'rare', dropRate: 0.1, name: 'Rare Item', rarity: 'rare' }
      ];
      const drawCount = 10000; // 大量サンプルでの統計テスト

      // When: 大量抽選を実行
      const results: string[] = [];
      for (let i = 0; i < drawCount; i++) {
        const result = drawAlgorithm.selectWeightedRandom(items as GachaItem[]);
        results.push(result.id);
      }

      // Then: 統計的に正しい分布になる
      const commonCount = results.filter(r => r === 'common').length;
      const rareCount = results.filter(r => r === 'rare').length;

      expect(commonCount / drawCount).toBeCloseTo(0.9, 1); // ±0.1の誤差
      expect(rareCount / drawCount).toBeCloseTo(0.1, 1);
    });

    it('should handle edge case with zero drop rate', async () => {
      // Given: 排出率0のアイテムを含む
      const items: Partial<GachaItem>[] = [
        { id: 'item1', dropRate: 0.5, name: 'Item 1', rarity: 'common' },
        { id: 'item2', dropRate: 0.5, name: 'Item 2', rarity: 'common' },
        { id: 'item3', dropRate: 0.0, name: 'Sold Out Item', rarity: 'rare' }
      ];

      // When: 多数回抽選
      const results: string[] = [];
      for (let i = 0; i < 1000; i++) {
        const result = drawAlgorithm.selectWeightedRandom(items as GachaItem[]);
        results.push(result.id);
      }

      // Then: 排出率0のアイテムは選ばれない
      expect(results).not.toContain('item3');
      
      const item1Count = results.filter(r => r === 'item1').length;
      const item2Count = results.filter(r => r === 'item2').length;
      
      // item1とitem2がほぼ均等に選ばれる
      expect(Math.abs(item1Count - item2Count)).toBeLessThan(100);
    });

    it('should throw error for invalid drop rates', async () => {
      // Given: 無効な排出率
      const invalidItems: Partial<GachaItem>[] = [
        { id: 'item1', dropRate: -0.1, name: 'Invalid Item', rarity: 'common' }
      ];

      // When & Then: エラーが発生
      expect(() => drawAlgorithm.selectWeightedRandom(invalidItems as GachaItem[]))
        .toThrow('Invalid drop rate');
    });

    it('should handle single item selection', async () => {
      // Given: 単一アイテム
      const items: Partial<GachaItem>[] = [
        { id: 'only-item', dropRate: 1.0, name: 'Only Item', rarity: 'common' }
      ];

      // When: 抽選を実行
      const result = drawAlgorithm.selectWeightedRandom(items as GachaItem[]);

      // Then: 唯一のアイテムが選択される
      expect(result.id).toBe('only-item');
    });

    it('should normalize weights correctly', async () => {
      // Given: 合計が1.0でない重み
      const items: Partial<GachaItem>[] = [
        { id: 'item1', dropRate: 2.0, name: 'Item 1', rarity: 'common' },
        { id: 'item2', dropRate: 8.0, name: 'Item 2', rarity: 'common' }
      ];

      // When: 多数回抽選
      const results: string[] = [];
      for (let i = 0; i < 10000; i++) {
        const result = drawAlgorithm.selectWeightedRandom(items as GachaItem[]);
        results.push(result.id);
      }

      // Then: 2:8の比率で選択される
      const item1Count = results.filter(r => r === 'item1').length;
      const item2Count = results.filter(r => r === 'item2').length;

      expect(item1Count / results.length).toBeCloseTo(0.2, 1); // 2/10
      expect(item2Count / results.length).toBeCloseTo(0.8, 1); // 8/10
    });
  });

  describe('normalizeDropRates', () => {
    it('should normalize drop rates to sum to 1.0', async () => {
      // Given: 正規化が必要な排出率
      const items: Partial<GachaItem>[] = [
        { id: 'item1', dropRate: 60, name: 'Item 1', rarity: 'common' },
        { id: 'item2', dropRate: 40, name: 'Item 2', rarity: 'rare' }
      ];

      // When: 正規化を実行
      const normalized = drawAlgorithm.normalizeDropRates(items as GachaItem[]);

      // Then: 合計が1.0になる
      const total = normalized.reduce((sum, item) => sum + item.dropRate, 0);
      expect(total).toBeCloseTo(1.0, 6);
      expect(normalized[0].dropRate).toBeCloseTo(0.6);
      expect(normalized[1].dropRate).toBeCloseTo(0.4);
    });

    it('should handle already normalized rates', async () => {
      // Given: 既に正規化済みの排出率
      const items: Partial<GachaItem>[] = [
        { id: 'item1', dropRate: 0.7, name: 'Item 1', rarity: 'common' },
        { id: 'item2', dropRate: 0.3, name: 'Item 2', rarity: 'rare' }
      ];

      // When: 正規化を実行
      const normalized = drawAlgorithm.normalizeDropRates(items as GachaItem[]);

      // Then: 値がほぼそのまま
      expect(normalized[0].dropRate).toBeCloseTo(0.7);
      expect(normalized[1].dropRate).toBeCloseTo(0.3);
    });

    it('should throw error for zero total drop rate', async () => {
      // Given: 全て排出率0のアイテム
      const items: Partial<GachaItem>[] = [
        { id: 'item1', dropRate: 0, name: 'Item 1', rarity: 'common' },
        { id: 'item2', dropRate: 0, name: 'Item 2', rarity: 'rare' }
      ];

      // When & Then: エラーが発生
      expect(() => drawAlgorithm.normalizeDropRates(items as GachaItem[]))
        .toThrow('Total drop rate cannot be zero');
    });
  });

  describe('performance', () => {
    it('should complete large draw operations within time limit', async () => {
      // Given: 大量のアイテム
      const items: Partial<GachaItem>[] = Array(1000).fill(null).map((_, index) => ({
        id: `item${index}`,
        dropRate: Math.random(),
        name: `Item ${index}`,
        rarity: 'common' as const
      }));

      const drawCount = 10000;

      // When: 大量抽選の実行時間を測定
      const startTime = process.hrtime.bigint();
      
      for (let i = 0; i < drawCount; i++) {
        drawAlgorithm.selectWeightedRandom(items as GachaItem[]);
      }
      
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1000000;

      // Then: 合理的な時間内で完了（10秒以内）
      expect(durationMs).toBeLessThan(10000);
    });

    it('should maintain consistent performance', async () => {
      // Given: 固定のアイテムセット
      const items: Partial<GachaItem>[] = [
        { id: 'common', dropRate: 0.7, name: 'Common', rarity: 'common' },
        { id: 'rare', dropRate: 0.25, name: 'Rare', rarity: 'rare' },
        { id: 'epic', dropRate: 0.04, name: 'Epic', rarity: 'epic' },
        { id: 'legendary', dropRate: 0.01, name: 'Legendary', rarity: 'legendary' }
      ];

      // When: 複数回パフォーマンステストを実行
      const times: number[] = [];
      const iterations = 1000;

      for (let test = 0; test < 5; test++) {
        const startTime = process.hrtime.bigint();
        
        for (let i = 0; i < iterations; i++) {
          drawAlgorithm.selectWeightedRandom(items as GachaItem[]);
        }
        
        const endTime = process.hrtime.bigint();
        times.push(Number(endTime - startTime) / 1000000);
      }

      // Then: パフォーマンスが安定している（標準偏差が小さい）
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / times.length;
      const standardDeviation = Math.sqrt(variance);

      expect(standardDeviation / average).toBeLessThan(0.5); // 変動係数50%未満
    });
  });
});