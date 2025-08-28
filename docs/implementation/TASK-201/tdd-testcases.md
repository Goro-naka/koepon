# TASK-201: ガチャシステム実装 - TDDテストケース仕様

## 🧪 テストケース概要

ガチャシステムの全機能に対する包括的なテストスイートを定義します。TDD手法に基づき、実装前にテストケースを明確化します。

## 📊 テストカテゴリ

### A. 単体テスト (Unit Tests)
### B. 統合テスト (Integration Tests)
### C. E2Eテスト (End-to-End Tests)
### D. パフォーマンステスト (Performance Tests)
### E. セキュリティテスト (Security Tests)

---

## A. 単体テスト (Unit Tests)

### A1. GachaService テスト

#### A1.1 ガチャ作成 (createGacha)
```typescript
describe('GachaService - createGacha', () => {
  it('should create gacha with valid data', async () => {
    // Given: 有効なガチャデータ
    const createGachaDto = {
      name: 'Test Gacha',
      description: 'Test Description',
      medalCost: 100,
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-12-31T23:59:59Z',
      items: [
        { rewardId: 'reward1', name: 'Common Item', rarity: 'common', dropRate: 0.7 },
        { rewardId: 'reward2', name: 'Rare Item', rarity: 'rare', dropRate: 0.3 }
      ]
    };
    
    // When: ガチャを作成
    const result = await gachaService.createGacha('vtuber1', createGachaDto);
    
    // Then: ガチャが正常に作成される
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('Test Gacha');
    expect(result.items).toHaveLength(2);
    expect(result.status).toBe('active');
  });

  it('should throw BadRequestException for invalid drop rates', async () => {
    // Given: 排出率合計が1.0でないガチャデータ
    const invalidGachaDto = {
      name: 'Invalid Gacha',
      description: 'Invalid Description',
      medalCost: 100,
      startDate: '2025-01-01T00:00:00Z',
      items: [
        { rewardId: 'reward1', name: 'Item1', rarity: 'common', dropRate: 0.8 },
        { rewardId: 'reward2', name: 'Item2', rarity: 'rare', dropRate: 0.5 } // 合計1.3
      ]
    };
    
    // When & Then: バリデーションエラーが発生
    await expect(gachaService.createGacha('vtuber1', invalidGachaDto))
      .rejects.toThrow(BadRequestException);
  });

  it('should normalize drop rates automatically', async () => {
    // Given: 合計が1.0でない排出率（正規化対象）
    const gachaDto = {
      name: 'Normalize Test Gacha',
      description: 'Test',
      medalCost: 100,
      startDate: '2025-01-01T00:00:00Z',
      items: [
        { rewardId: 'reward1', name: 'Item1', rarity: 'common', dropRate: 60 },
        { rewardId: 'reward2', name: 'Item2', rarity: 'rare', dropRate: 40 }
      ]
    };
    
    // When: ガチャを作成
    const result = await gachaService.createGacha('vtuber1', gachaDto);
    
    // Then: 排出率が正規化される
    expect(result.items[0].dropRate).toBe(0.6);
    expect(result.items[1].dropRate).toBe(0.4);
  });
});
```

#### A1.2 抽選実行 (executeDraws)
```typescript
describe('GachaService - executeDraws', () => {
  it('should execute single draw successfully', async () => {
    // Given: アクティブなガチャと十分な推しメダル
    const userId = 'user1';
    const gachaId = 'gacha1';
    const drawCount = 1;
    
    // Mock setup
    jest.spyOn(gachaService, 'getActiveGacha').mockResolvedValue(mockGacha);
    jest.spyOn(medalService, 'getUserMedals').mockResolvedValue(500);
    jest.spyOn(drawAlgorithm, 'executeDraw').mockReturnValue(mockDrawResult);
    
    // When: 抽選を実行
    const result = await gachaService.executeDraws(userId, gachaId, drawCount);
    
    // Then: 抽選結果が返される
    expect(result).toHaveProperty('results');
    expect(result.results).toHaveLength(1);
    expect(result.remainingMedals).toBe(400); // 500 - 100
    expect(result.executionTime).toBeLessThan(3000);
  });

  it('should execute multiple draws successfully', async () => {
    // Given: 10連ガチャの実行
    const userId = 'user1';
    const gachaId = 'gacha1';
    const drawCount = 10;
    
    // Mock setup
    jest.spyOn(gachaService, 'getActiveGacha').mockResolvedValue(mockGacha);
    jest.spyOn(medalService, 'getUserMedals').mockResolvedValue(1500);
    
    // When: 10連抽選を実行
    const result = await gachaService.executeDraws(userId, gachaId, drawCount);
    
    // Then: 10個の結果が返される
    expect(result.results).toHaveLength(10);
    expect(result.remainingMedals).toBe(500); // 1500 - 1000
  });

  it('should throw InsufficientFundsException for insufficient medals', async () => {
    // Given: 推しメダルが不足している状況
    const userId = 'user1';
    const gachaId = 'gacha1';
    const drawCount = 1;
    
    jest.spyOn(gachaService, 'getActiveGacha').mockResolvedValue(mockGacha);
    jest.spyOn(medalService, 'getUserMedals').mockResolvedValue(50); // 不足
    
    // When & Then: 残高不足エラーが発生
    await expect(gachaService.executeDraws(userId, gachaId, drawCount))
      .rejects.toThrow(InsufficientFundsException);
  });

  it('should throw GachaNotFoundException for inactive gacha', async () => {
    // Given: 非アクティブなガチャ
    const userId = 'user1';
    const gachaId = 'inactive-gacha';
    
    jest.spyOn(gachaService, 'getActiveGacha').mockResolvedValue(null);
    
    // When & Then: ガチャ未発見エラーが発生
    await expect(gachaService.executeDraws(userId, gachaId, 1))
      .rejects.toThrow(GachaNotFoundException);
  });

  it('should complete draws within performance requirement', async () => {
    // Given: パフォーマンステスト用の設定
    const userId = 'user1';
    const gachaId = 'gacha1';
    const drawCount = 10;
    
    // When: 抽選実行時間を測定
    const startTime = Date.now();
    const result = await gachaService.executeDraws(userId, gachaId, drawCount);
    const endTime = Date.now();
    
    // Then: 3秒以内で完了
    expect(endTime - startTime).toBeLessThan(3000);
    expect(result.executionTime).toBeLessThan(3000);
  });
});
```

### A2. DrawAlgorithm テスト

#### A2.1 加重ランダム選択
```typescript
describe('DrawAlgorithm - weighted random selection', () => {
  it('should select items according to drop rates', async () => {
    // Given: 明確な排出率のアイテム
    const items = [
      { id: 'common', dropRate: 0.9, name: 'Common Item' },
      { id: 'rare', dropRate: 0.1, name: 'Rare Item' }
    ];
    const drawCount = 10000; // 大量サンプルでの統計テスト
    
    // When: 大量抽選を実行
    const results = [];
    for (let i = 0; i < drawCount; i++) {
      const result = drawAlgorithm.selectWeightedRandom(items);
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
    const items = [
      { id: 'item1', dropRate: 0.5, name: 'Item 1' },
      { id: 'item2', dropRate: 0.5, name: 'Item 2' },
      { id: 'item3', dropRate: 0.0, name: 'Sold Out Item' }
    ];
    
    // When: 多数回抽選
    const results = [];
    for (let i = 0; i < 1000; i++) {
      const result = drawAlgorithm.selectWeightedRandom(items);
      results.push(result.id);
    }
    
    // Then: 排出率0のアイテムは選ばれない
    expect(results).not.toContain('item3');
  });

  it('should throw error for invalid drop rates', async () => {
    // Given: 無効な排出率
    const invalidItems = [
      { id: 'item1', dropRate: -0.1, name: 'Invalid Item' }
    ];
    
    // When & Then: エラーが発生
    expect(() => drawAlgorithm.selectWeightedRandom(invalidItems))
      .toThrow('Invalid drop rate');
  });
});
```

### A3. GachaController テスト

#### A3.1 APIエンドポイントテスト
```typescript
describe('GachaController', () => {
  it('should get gacha list with pagination', async () => {
    // Given: ガチャ一覧取得リクエスト
    const query = { page: 1, limit: 10, vtuberId: 'vtuber1' };
    
    // When: APIを呼び出し
    const result = await gachaController.getGachaList(query);
    
    // Then: ページネーション付きでガチャ一覧が返される
    expect(result).toHaveProperty('success', true);
    expect(result.data).toHaveProperty('gacha');
    expect(result.data).toHaveProperty('pagination');
    expect(result.data.pagination.page).toBe(1);
  });

  it('should get gacha details with items', async () => {
    // Given: ガチャ詳細取得リクエスト
    const gachaId = 'gacha1';
    
    // When: ガチャ詳細を取得
    const result = await gachaController.getGachaDetails(gachaId);
    
    // Then: アイテム情報込みでガチャ詳細が返される
    expect(result.success).toBe(true);
    expect(result.data.gacha).toHaveProperty('items');
    expect(Array.isArray(result.data.gacha.items)).toBe(true);
  });

  it('should execute draw with authentication', async () => {
    // Given: 認証済みユーザーの抽選リクエスト
    const user = { sub: 'user1', email: 'test@example.com' };
    const gachaId = 'gacha1';
    const drawRequest = { drawCount: 1 };
    
    // When: 抽選を実行
    const result = await gachaController.executeDraw(
      { user }, 
      gachaId, 
      drawRequest
    );
    
    // Then: 抽選結果が返される
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('results');
    expect(result.data).toHaveProperty('remainingMedals');
  });
});
```

---

## B. 統合テスト (Integration Tests)

### B1. データベース統合テスト
```typescript
describe('Gacha Database Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should persist gacha data correctly', async () => {
    // Given: ガチャデータ
    const gachaData = createTestGachaData();
    
    // When: データベースに保存
    const savedGacha = await gachaRepository.save(gachaData);
    
    // Then: データが正確に永続化される
    const retrievedGacha = await gachaRepository.findById(savedGacha.id);
    expect(retrievedGacha).toEqual(savedGacha);
  });

  it('should maintain referential integrity', async () => {
    // Given: ガチャとアイテムの関連データ
    const gacha = await createTestGacha();
    const items = await createTestGachaItems(gacha.id);
    
    // When: ガチャを削除
    await gachaRepository.delete(gacha.id);
    
    // Then: 関連アイテムも削除される（CASCADE）
    const remainingItems = await gachaItemRepository.findByGachaId(gacha.id);
    expect(remainingItems).toHaveLength(0);
  });

  it('should handle concurrent draw transactions', async () => {
    // Given: 同じユーザーが同時に抽選実行
    const userId = 'user1';
    const gachaId = 'gacha1';
    
    // When: 並行して抽選実行
    const promises = Array(10).fill(null).map(() => 
      gachaService.executeDraws(userId, gachaId, 1)
    );
    
    // Then: 全て正常に処理され、メダル残高が正確
    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
    
    const finalBalance = await medalService.getUserMedals(userId);
    expect(finalBalance).toBe(initialBalance - (100 * 10));
  });
});
```

### B2. 外部システム統合テスト
```typescript
describe('External System Integration', () => {
  it('should integrate with medal system correctly', async () => {
    // Given: ユーザーの推しメダル残高
    const userId = 'user1';
    const initialBalance = 1000;
    await medalService.setUserMedals(userId, initialBalance);
    
    // When: ガチャを実行
    await gachaService.executeDraws(userId, 'gacha1', 5);
    
    // Then: メダル残高が正確に減少
    const remainingBalance = await medalService.getUserMedals(userId);
    expect(remainingBalance).toBe(initialBalance - 500);
  });

  it('should integrate with reward system correctly', async () => {
    // Given: 特典付きのガチャアイテム
    const userId = 'user1';
    const gachaId = 'gacha1';
    
    // When: 抽選実行で特典アイテムを獲得
    const result = await gachaService.executeDraws(userId, gachaId, 1);
    
    // Then: 特典BOXに特典が追加される
    const userRewards = await rewardService.getUserRewards(userId);
    expect(userRewards.length).toBeGreaterThan(0);
  });
});
```

---

## C. E2Eテスト (End-to-End Tests)

### C1. ガチャ利用フロー
```typescript
describe('Gacha E2E Flow', () => {
  it('should complete full gacha flow', async () => {
    // Given: ログイン済みユーザー
    const accessToken = await loginUser('test@example.com', 'password');
    
    // When: ガチャ一覧を取得
    const gachaListResponse = await request(app)
      .get('/api/v1/gacha')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(gachaListResponse.status).toBe(200);
    const gachaId = gachaListResponse.body.data.gacha[0].id;
    
    // And: ガチャ詳細を取得
    const detailResponse = await request(app)
      .get(`/api/v1/gacha/${gachaId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(detailResponse.status).toBe(200);
    
    // And: 抽選を実行
    const drawResponse = await request(app)
      .post(`/api/v1/gacha/${gachaId}/draw`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ drawCount: 1 });
    
    expect(drawResponse.status).toBe(200);
    expect(drawResponse.body.success).toBe(true);
    
    // Then: 抽選履歴を確認
    const historyResponse = await request(app)
      .get('/api/v1/gacha/history')
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.data.results.length).toBeGreaterThan(0);
  });
});
```

---

## D. パフォーマンステスト (Performance Tests)

### D1. 応答時間テスト
```typescript
describe('Gacha Performance Tests', () => {
  it('should complete draws within 3 seconds', async () => {
    // Given: パフォーマンステスト環境
    const userId = 'user1';
    const gachaId = 'gacha1';
    const drawCount = 10;
    
    // When: 抽選実行時間を測定
    const startTime = process.hrtime.bigint();
    await gachaService.executeDraws(userId, gachaId, drawCount);
    const endTime = process.hrtime.bigint();
    
    // Then: 3秒以内で完了
    const durationMs = Number(endTime - startTime) / 1000000;
    expect(durationMs).toBeLessThan(3000);
  });

  it('should handle 1000 concurrent users', async () => {
    // Given: 1000ユーザーの同時アクセス
    const userCount = 1000;
    const promises = [];
    
    for (let i = 0; i < userCount; i++) {
      const userId = `user${i}`;
      promises.push(gachaService.executeDraws(userId, 'gacha1', 1));
    }
    
    // When: 同時実行
    const startTime = Date.now();
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    
    // Then: 全て5秒以内で処理完了
    expect(endTime - startTime).toBeLessThan(5000);
    
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    expect(successCount).toBe(userCount);
  });
});
```

---

## E. セキュリティテスト (Security Tests)

### E1. 認証・認可テスト
```typescript
describe('Gacha Security Tests', () => {
  it('should require authentication for draw execution', async () => {
    // When: 未認証でガチャ実行を試行
    const response = await request(app)
      .post('/api/v1/gacha/gacha1/draw')
      .send({ drawCount: 1 });
    
    // Then: 認証エラーが返される
    expect(response.status).toBe(401);
  });

  it('should prevent unauthorized gacha creation', async () => {
    // Given: 一般ユーザーのトークン
    const userToken = await loginUser('user@example.com', 'password');
    
    // When: ガチャ作成を試行
    const response = await request(app)
      .post('/api/v1/gacha')
      .set('Authorization', `Bearer ${userToken}`)
      .send(createTestGachaData());
    
    // Then: 権限不足エラーが返される
    expect(response.status).toBe(403);
  });

  it('should validate input to prevent injection attacks', async () => {
    // Given: 悪意のある入力
    const maliciousInput = {
      name: '<script>alert("XSS")</script>',
      description: "'; DROP TABLE gacha; --",
      medalCost: 'invalid'
    };
    
    // When: ガチャ作成を試行
    const response = await request(app)
      .post('/api/v1/gacha')
      .set('Authorization', `Bearer ${vtuberToken}`)
      .send(maliciousInput);
    
    // Then: バリデーションエラーが返される
    expect(response.status).toBe(400);
  });

  it('should implement rate limiting', async () => {
    // Given: 短時間での大量リクエスト
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app)
          .get('/api/v1/gacha')
          .set('Authorization', `Bearer ${accessToken}`)
      );
    }
    
    // When: 大量リクエスト実行
    const results = await Promise.allSettled(promises);
    
    // Then: 一部がレート制限でブロック
    const rateLimitedCount = results.filter(r => 
      r.status === 'fulfilled' && r.value.status === 429
    ).length;
    
    expect(rateLimitedCount).toBeGreaterThan(0);
  });
});
```

---

## 📊 テスト実行指標

### 目標カバレッジ
- **単体テスト**: 95%以上のコードカバレッジ
- **分岐カバレッジ**: 90%以上
- **機能カバレッジ**: 100%（全API エンドポイント）

### パフォーマンス基準
- **単一抽選**: 500ms以内
- **10連抽選**: 3秒以内  
- **同時接続**: 1000ユーザーまで対応
- **データベースクエリ**: 平均100ms以内

### セキュリティ基準
- **認証テスト**: 100%パス
- **入力検証テスト**: 100%パス
- **レート制限テスト**: 正常動作確認
- **SQLインジェクション対策**: 検証済み

---

**テストケース定義完了**: 上記テストケースに基づいてRed Phase（失敗するテスト実装）を開始します。