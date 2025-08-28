import { validate } from 'class-validator';
import { CreateGachaDto, CreateGachaItemDto } from './create-gacha.dto';
import { DrawGachaDto } from './draw-gacha.dto';
import { GachaQueryDto } from './gacha-query.dto';

describe('Gacha DTOs Validation', () => {
  describe('CreateGachaDto', () => {
    it('should validate gacha creation with valid data', async () => {
      // Given: 有効なガチャ作成データ
      const dto = new CreateGachaDto();
      dto.name = 'Summer Special Gacha';
      dto.description = 'Limited summer themed gacha';
      dto.medalCost = 100;
      dto.startDate = '2025-06-01T00:00:00Z';
      dto.endDate = '2025-08-31T23:59:59Z';
      dto.maxDraws = 1000;
      
      const itemDto = new CreateGachaItemDto();
      itemDto.rewardId = 'reward-123';
      itemDto.name = 'Rare Card';
      itemDto.description = 'Limited edition card';
      itemDto.rarity = 'rare';
      itemDto.dropRate = 0.1;
      itemDto.maxCount = 100;
      
      dto.items = [itemDto];

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーがない
      expect(errors.length).toBe(0);
    });

    it('should validate required fields', async () => {
      // Given: 必須フィールドが欠けているデータ
      const dto = new CreateGachaDto();
      dto.name = '';  // 空の名前
      dto.description = '';  // 空の説明
      // medalCost を設定しない
      // startDate を設定しない
      dto.items = [];  // 空のアイテム配列

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーが発生
      expect(errors.length).toBeGreaterThan(0);
      
      const nameError = errors.find(err => err.property === 'name');
      const descriptionError = errors.find(err => err.property === 'description');
      const medalCostError = errors.find(err => err.property === 'medalCost');
      const startDateError = errors.find(err => err.property === 'startDate');
      const itemsError = errors.find(err => err.property === 'items');

      expect(nameError).toBeDefined();
      expect(descriptionError).toBeDefined();
      expect(medalCostError).toBeDefined();
      expect(startDateError).toBeDefined();
      expect(itemsError).toBeDefined();
    });

    it('should validate medal cost minimum value', async () => {
      // Given: 負のメダルコスト
      const dto = new CreateGachaDto();
      dto.name = 'Test Gacha';
      dto.description = 'Test Description';
      dto.medalCost = -10;  // 負の値
      dto.startDate = '2025-01-01T00:00:00Z';
      
      const itemDto = new CreateGachaItemDto();
      itemDto.rewardId = 'reward-1';
      itemDto.name = 'Test Item';
      itemDto.description = 'Test item';
      itemDto.rarity = 'common';
      itemDto.dropRate = 1.0;
      dto.items = [itemDto];

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: メダルコストのエラーが発生
      expect(errors.length).toBeGreaterThan(0);
      const medalCostError = errors.find(err => err.property === 'medalCost');
      expect(medalCostError).toBeDefined();
      expect(medalCostError?.constraints).toHaveProperty('min');
    });

    it('should validate date format', async () => {
      // Given: 無効な日付形式
      const dto = new CreateGachaDto();
      dto.name = 'Test Gacha';
      dto.description = 'Test Description';
      dto.medalCost = 100;
      dto.startDate = 'invalid-date';  // 無効な形式
      dto.endDate = '2025/12/31';  // 無効な形式
      
      const itemDto = new CreateGachaItemDto();
      itemDto.rewardId = 'reward-1';
      itemDto.name = 'Test Item';
      itemDto.description = 'Test item';
      itemDto.rarity = 'common';
      itemDto.dropRate = 1.0;
      dto.items = [itemDto];

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: 日付のバリデーションエラーが発生
      expect(errors.length).toBeGreaterThan(0);
      const startDateError = errors.find(err => err.property === 'startDate');
      const endDateError = errors.find(err => err.property === 'endDate');
      expect(startDateError).toBeDefined();
      expect(endDateError).toBeDefined();
    });
  });

  describe('CreateGachaItemDto', () => {
    it('should validate item creation with valid data', async () => {
      // Given: 有効なアイテムデータ
      const dto = new CreateGachaItemDto();
      dto.rewardId = 'reward-456';
      dto.name = 'Epic Weapon';
      dto.description = 'Legendary weapon with special abilities';
      dto.rarity = 'epic';
      dto.dropRate = 0.05;
      dto.maxCount = 50;
      dto.imageUrl = 'https://example.com/weapon.jpg';

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーがない
      expect(errors.length).toBe(0);
    });

    it('should validate drop rate constraints', async () => {
      // Given: 無効な排出率
      const dto = new CreateGachaItemDto();
      dto.rewardId = 'reward-1';
      dto.name = 'Test Item';
      dto.description = 'Test';
      dto.rarity = 'common';
      dto.dropRate = -0.1;  // 負の値
      dto.maxCount = -5;  // 負の値

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーが発生
      expect(errors.length).toBeGreaterThan(0);
      const dropRateError = errors.find(err => err.property === 'dropRate');
      const maxCountError = errors.find(err => err.property === 'maxCount');
      expect(dropRateError).toBeDefined();
      expect(maxCountError).toBeDefined();
    });

    it('should validate rarity enum', async () => {
      // Given: 無効なレアリティ
      const dto = new CreateGachaItemDto();
      dto.rewardId = 'reward-1';
      dto.name = 'Test Item';
      dto.description = 'Test';
      dto.rarity = 'invalid-rarity' as any;  // 無効な値
      dto.dropRate = 0.1;

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: レアリティのバリデーションエラーが発生
      expect(errors.length).toBeGreaterThan(0);
      // 実際には enum validation は TypeScript レベルでチェックされる
    });
  });

  describe('DrawGachaDto', () => {
    it('should validate draw request with valid data', async () => {
      // Given: 有効な抽選リクエスト
      const dto = new DrawGachaDto();
      dto.drawCount = 5;

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーがない
      expect(errors.length).toBe(0);
    });

    it('should use default draw count when not specified', async () => {
      // Given: 抽選回数未指定
      const dto = new DrawGachaDto();

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: デフォルト値が使用される
      expect(errors.length).toBe(0);
      expect(dto.drawCount).toBe(1);
    });

    it('should validate draw count limits', async () => {
      // Given: 制限を超える抽選回数
      const dto = new DrawGachaDto();
      dto.drawCount = 15;  // 上限超過

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: 上限エラーが発生
      expect(errors.length).toBeGreaterThan(0);
      const drawCountError = errors.find(err => err.property === 'drawCount');
      expect(drawCountError).toBeDefined();
    });

    it('should validate minimum draw count', async () => {
      // Given: 最小値未満の抽選回数
      const dto = new DrawGachaDto();
      dto.drawCount = 0;  // 最小値未満

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: 最小値エラーが発生
      expect(errors.length).toBeGreaterThan(0);
      const drawCountError = errors.find(err => err.property === 'drawCount');
      expect(drawCountError).toBeDefined();
    });
  });

  describe('GachaQueryDto', () => {
    it('should validate query with valid parameters', async () => {
      // Given: 有効なクエリパラメータ
      const dto = new GachaQueryDto();
      dto.vtuberId = 'vtuber-123';
      dto.status = 'active';
      dto.page = 2;
      dto.limit = 20;

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: バリデーションエラーがない
      expect(errors.length).toBe(0);
    });

    it('should use default values when not specified', async () => {
      // Given: パラメータ未指定
      const dto = new GachaQueryDto();

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: デフォルト値が使用される
      expect(errors.length).toBe(0);
      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });

    it('should validate page minimum value', async () => {
      // Given: 無効なページ番号
      const dto = new GachaQueryDto();
      dto.page = 0;  // 最小値未満

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: ページ番号エラーが発生
      expect(errors.length).toBeGreaterThan(0);
      const pageError = errors.find(err => err.property === 'page');
      expect(pageError).toBeDefined();
    });

    it('should validate status enum', async () => {
      // Given: 無効なステータス
      const dto = new GachaQueryDto();
      dto.status = 'invalid-status' as any;

      // When: バリデーションを実行
      const errors = await validate(dto);

      // Then: ステータスエラーが発生
      expect(errors.length).toBeGreaterThan(0);
      const statusError = errors.find(err => err.property === 'status');
      expect(statusError).toBeDefined();
    });
  });
});