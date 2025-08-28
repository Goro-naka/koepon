# TASK-203: 推しメダルシステム実装 - テストケース仕様

## テストケース概要

修正された要件定義に基づき、ガチャ実行回数による推しメダル付与システムのテストケースを定義する。

## 1. 単体テスト（Unit Tests）

### 1.1 PushMedalService テスト

#### 1.1.1 推しメダル付与機能テスト
```typescript
describe('PushMedalService - Medal Grant Tests', () => {
  describe('grantMedalFromGacha', () => {
    it('should grant medals based on gacha cost - 300円 gacha should grant 30 medals', async () => {
      // Given: 300円の単発ガチャ実行
      const gachaEvent = {
        userId: 'user-123',
        gachaId: 'gacha-300yen',
        vtuberId: 'vtuber-001',
        executionCount: 1,
        totalCost: 300
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.grantMedalFromGacha(gachaEvent))
        .rejects.toThrow('Not implemented');
    });

    it('should grant medals based on gacha cost - 500円 gacha should grant 50 medals', async () => {
      // Given: 500円の単発ガチャ実行
      const gachaEvent = {
        userId: 'user-123', 
        gachaId: 'gacha-500yen',
        vtuberId: 'vtuber-001',
        executionCount: 1,
        totalCost: 500
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.grantMedalFromGacha(gachaEvent))
        .rejects.toThrow('Not implemented');
    });

    it('should grant medals for 10-pull gacha - 3000円 10連 should grant 300 medals', async () => {
      // Given: 3000円の10連ガチャ実行
      const gachaEvent = {
        userId: 'user-123',
        gachaId: 'gacha-300yen',
        vtuberId: 'vtuber-001', 
        executionCount: 10,
        totalCost: 3000
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.grantMedalFromGacha(gachaEvent))
        .rejects.toThrow('Not implemented');
    });

    it('should grant minimum 10 medals for low-cost gacha', async () => {
      // Given: 100円の低価格ガチャ実行
      const gachaEvent = {
        userId: 'user-123',
        gachaId: 'gacha-100yen',
        vtuberId: 'vtuber-001',
        executionCount: 1,
        totalCost: 100
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.grantMedalFromGacha(gachaEvent))
        .rejects.toThrow('Not implemented');
    });

    it('should cap medals at maximum 1000 for high-cost gacha', async () => {
      // Given: 10000円の高価格ガチャ実行
      const gachaEvent = {
        userId: 'user-123',
        gachaId: 'gacha-10000yen',
        vtuberId: 'vtuber-001',
        executionCount: 1,
        totalCost: 10000
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.grantMedalFromGacha(gachaEvent))
        .rejects.toThrow('Not implemented');
    });

    it('should throw error for invalid gacha event', async () => {
      // Given: 無効なガチャイベント
      const invalidEvent = {
        userId: '',
        gachaId: 'gacha-001',
        vtuberId: 'vtuber-001',
        executionCount: 1,
        totalCost: 300
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.grantMedalFromGacha(invalidEvent))
        .rejects.toThrow('Not implemented');
    });

    it('should handle concurrent medal grants correctly', async () => {
      // Given: 同時実行される複数のガチャイベント
      const events = [
        { userId: 'user-123', gachaId: 'gacha-001', vtuberId: 'vtuber-001', executionCount: 1, totalCost: 300 },
        { userId: 'user-123', gachaId: 'gacha-002', vtuberId: 'vtuber-001', executionCount: 1, totalCost: 500 }
      ];

      // When & Then: 実装されていないのでエラー
      for (const event of events) {
        await expect(pushMedalService.grantMedalFromGacha(event))
          .rejects.toThrow('Not implemented');
      }
    });
  });
});
```

#### 1.1.2 残高管理機能テスト
```typescript
describe('PushMedalService - Balance Management Tests', () => {
  describe('getBalance', () => {
    it('should return user balance for specific VTuber', async () => {
      // Given: 特定ユーザー・VTuberの残高照会
      const userId = 'user-123';
      const vtuberId = 'vtuber-001';

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.getBalance(userId, vtuberId))
        .rejects.toThrow('Not implemented');
    });

    it('should return all balances for user', async () => {
      // Given: ユーザーの全VTuber別残高照会
      const userId = 'user-123';

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.getAllBalances(userId))
        .rejects.toThrow('Not implemented');
    });

    it('should return 0 for user with no medals', async () => {
      // Given: メダルを持たないユーザーの残高照会
      const userId = 'new-user';
      const vtuberId = 'vtuber-001';

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.getBalance(userId, vtuberId))
        .rejects.toThrow('Not implemented');
    });

    it('should throw error for non-existent VTuber', async () => {
      // Given: 存在しないVTuberの残高照会
      const userId = 'user-123';
      const invalidVtuberId = 'invalid-vtuber';

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.getBalance(userId, invalidVtuberId))
        .rejects.toThrow('Not implemented');
    });
  });

  describe('consumeMedals', () => {
    it('should consume medals for privilege exchange', async () => {
      // Given: 特典交換によるメダル消費
      const consumptionData = {
        userId: 'user-123',
        vtuberId: 'vtuber-001',
        amount: 100,
        reason: 'privilege_exchange',
        referenceId: 'privilege-001'
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.consumeMedals(consumptionData))
        .rejects.toThrow('Not implemented');
    });

    it('should throw error when insufficient balance', async () => {
      // Given: 残高不足でのメダル消費試行
      const consumptionData = {
        userId: 'user-123',
        vtuberId: 'vtuber-001',
        amount: 10000, // 残高以上の消費
        reason: 'privilege_exchange',
        referenceId: 'privilege-001'
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.consumeMedals(consumptionData))
        .rejects.toThrow('Not implemented');
    });

    it('should validate consumption amount is positive', async () => {
      // Given: 負の値でのメダル消費試行
      const consumptionData = {
        userId: 'user-123',
        vtuberId: 'vtuber-001', 
        amount: -50,
        reason: 'invalid_consumption',
        referenceId: 'test-001'
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.consumeMedals(consumptionData))
        .rejects.toThrow('Not implemented');
    });
  });
});
```

#### 1.1.3 トランザクション管理テスト
```typescript
describe('PushMedalService - Transaction Management Tests', () => {
  describe('getTransactionHistory', () => {
    it('should return transaction history for user and VTuber', async () => {
      // Given: ユーザー・VTuber別取引履歴の照会
      const userId = 'user-123';
      const vtuberId = 'vtuber-001';
      const query = { page: 1, limit: 10 };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.getTransactionHistory(userId, vtuberId, query))
        .rejects.toThrow('Not implemented');
    });

    it('should return paginated transaction history', async () => {
      // Given: ページネーション付き取引履歴照会
      const userId = 'user-123';
      const query = { page: 2, limit: 5 };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.getTransactionHistory(userId, undefined, query))
        .rejects.toThrow('Not implemented');
    });

    it('should filter transactions by type', async () => {
      // Given: トランザクションタイプでのフィルター
      const userId = 'user-123';
      const query = { 
        transactionType: 'GACHA_REWARD',
        page: 1, 
        limit: 10 
      };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.getTransactionHistory(userId, undefined, query))
        .rejects.toThrow('Not implemented');
    });

    it('should return empty array for user with no transactions', async () => {
      // Given: 取引履歴のないユーザー
      const newUserId = 'new-user';
      const query = { page: 1, limit: 10 };

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.getTransactionHistory(newUserId, undefined, query))
        .rejects.toThrow('Not implemented');
    });
  });

  describe('verifyBalanceIntegrity', () => {
    it('should verify balance matches transaction history', async () => {
      // Given: 残高と取引履歴の整合性チェック
      const userId = 'user-123';
      const vtuberId = 'vtuber-001';

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.verifyBalanceIntegrity(userId, vtuberId))
        .rejects.toThrow('Not implemented');
    });

    it('should detect balance inconsistencies', async () => {
      // Given: 不整合のある残高データ
      const userId = 'user-with-inconsistency';
      const vtuberId = 'vtuber-001';

      // When & Then: 実装されていないのでエラー
      await expect(pushMedalService.verifyBalanceIntegrity(userId, vtuberId))
        .rejects.toThrow('Not implemented');
    });
  });
});
```

### 1.2 PushMedalController テスト

```typescript
describe('PushMedalController', () => {
  describe('getBalance', () => {
    it('should return user balance for VTuber', async () => {
      // Given: 認証済みユーザーの残高照会リクエスト
      const mockRequest = {
        user: { sub: 'user-123' }
      };
      const vtuberId = 'vtuber-001';

      // When & Then: 実装されていないのでエラー
      await expect(controller.getBalance(mockRequest, vtuberId))
        .rejects.toThrow('Not implemented');
    });

    it('should return all balances when no VTuber specified', async () => {
      // Given: VTuber未指定での残高照会
      const mockRequest = {
        user: { sub: 'user-123' }
      };

      // When & Then: 実装されていないのでエラー
      await expect(controller.getAllBalances(mockRequest))
        .rejects.toThrow('Not implemented');
    });

    it('should require authentication', async () => {
      // Given: 未認証リクエスト
      const vtuberId = 'vtuber-001';

      // When & Then: JwtAuthGuardにより認証が必要
      // 実装されていないのでエラー
      expect(controller.getBalance).toBeDefined();
    });

    it('should validate VTuber ID format', async () => {
      // Given: 無効なVTuber ID形式
      const mockRequest = {
        user: { sub: 'user-123' }
      };
      const invalidVtuberId = 'invalid-uuid';

      // When & Then: 実装されていないのでエラー
      await expect(controller.getBalance(mockRequest, invalidVtuberId))
        .rejects.toThrow('Not implemented');
    });
  });

  describe('getTransactionHistory', () => {
    it('should return paginated transaction history', async () => {
      // Given: 取引履歴照会リクエスト
      const mockRequest = {
        user: { sub: 'user-123' }
      };
      const query = {
        page: 1,
        limit: 10,
        vtuberId: 'vtuber-001'
      };

      // When & Then: 実装されていないのでエラー
      await expect(controller.getTransactionHistory(mockRequest, query))
        .rejects.toThrow('Not implemented');
    });

    it('should filter by transaction type', async () => {
      // Given: トランザクションタイプフィルター付きリクエスト
      const mockRequest = {
        user: { sub: 'user-123' }
      };
      const query = {
        page: 1,
        limit: 10,
        transactionType: 'GACHA_REWARD'
      };

      // When & Then: 実装されていないのでエラー
      await expect(controller.getTransactionHistory(mockRequest, query))
        .rejects.toThrow('Not implemented');
    });

    it('should validate pagination parameters', async () => {
      // Given: 無効なページネーションパラメータ
      const mockRequest = {
        user: { sub: 'user-123' }
      };
      const invalidQuery = {
        page: 0,  // 無効なページ番号
        limit: -1 // 無効なリミット
      };

      // When & Then: 実装されていないのでエラー
      await expect(controller.getTransactionHistory(mockRequest, invalidQuery))
        .rejects.toThrow('Not implemented');
    });
  });

  describe('handleGachaWebhook', () => {
    it('should process gacha executed webhook', async () => {
      // Given: ガチャ実行Webhookイベント
      const webhookPayload = {
        userId: 'user-123',
        gachaId: 'gacha-001',
        vtuberId: 'vtuber-001',
        executionCount: 1,
        totalCost: 300,
        timestamp: new Date().toISOString()
      };

      // When & Then: 実装されていないのでエラー
      await expect(controller.handleGachaWebhook(webhookPayload))
        .rejects.toThrow('Not implemented');
    });

    it('should validate webhook payload', async () => {
      // Given: 無効なWebhookペイロード
      const invalidPayload = {
        userId: '', // 空のユーザーID
        gachaId: 'gacha-001',
        vtuberId: 'vtuber-001',
        executionCount: 1,
        totalCost: 300
      };

      // When & Then: 実装されていないのでエラー
      await expect(controller.handleGachaWebhook(invalidPayload))
        .rejects.toThrow('Not implemented');
    });

    it('should handle webhook processing errors gracefully', async () => {
      // Given: 処理エラーを引き起こすWebhookペイロード
      const errorPayload = {
        userId: 'user-123',
        gachaId: 'non-existent-gacha',
        vtuberId: 'vtuber-001',
        executionCount: 1,
        totalCost: 300,
        timestamp: new Date().toISOString()
      };

      // When & Then: 実装されていないのでエラー
      await expect(controller.handleGachaWebhook(errorPayload))
        .rejects.toThrow('Not implemented');
    });
  });
});
```

## 2. 統合テスト（Integration Tests）

### 2.1 ガチャシステム連携テスト

```typescript
describe('Push Medal Integration - Gacha System', () => {
  it('should grant medals when gacha is executed', async () => {
    // Given: ガチャ実行による推しメダル付与の統合フロー
    const gachaExecutionData = {
      userId: 'integration-user',
      gachaId: 'gacha-300yen',
      vtuberId: 'vtuber-001',
      executionCount: 1,
      totalCost: 300
    };

    // When & Then: 実装されていないのでエラー
    await expect(async () => {
      // ガチャ実行シミュレーション
      await gachaService.executeGacha(gachaExecutionData);
      
      // 推しメダル付与確認
      const balance = await pushMedalService.getBalance(
        gachaExecutionData.userId, 
        gachaExecutionData.vtuberId
      );
      
      return balance;
    }).rejects.toThrow('Not implemented');
  });

  it('should handle multiple concurrent gacha executions', async () => {
    // Given: 複数同時ガチャ実行
    const concurrentExecutions = [
      { userId: 'user-1', gachaId: 'gacha-300yen', vtuberId: 'vtuber-001', executionCount: 1, totalCost: 300 },
      { userId: 'user-2', gachaId: 'gacha-500yen', vtuberId: 'vtuber-002', executionCount: 1, totalCost: 500 },
      { userId: 'user-1', gachaId: 'gacha-300yen', vtuberId: 'vtuber-001', executionCount: 10, totalCost: 3000 }
    ];

    // When & Then: 実装されていないのでエラー
    for (const execution of concurrentExecutions) {
      await expect(pushMedalService.grantMedalFromGacha(execution))
        .rejects.toThrow('Not implemented');
    }
  });
});
```

### 2.2 データベース整合性テスト

```typescript
describe('Push Medal Integration - Database Integrity', () => {
  it('should maintain balance and transaction consistency', async () => {
    // Given: 残高とトランザクション履歴の整合性確認
    const userId = 'integrity-test-user';
    const vtuberId = 'vtuber-001';

    // When & Then: 実装されていないのでエラー
    await expect(pushMedalService.verifyBalanceIntegrity(userId, vtuberId))
      .rejects.toThrow('Not implemented');
  });

  it('should handle concurrent balance updates correctly', async () => {
    // Given: 同時残高更新の整合性テスト
    const userId = 'concurrent-user';
    const vtuberId = 'vtuber-001';
    
    const operations = [
      { type: 'grant', amount: 50 },
      { type: 'consume', amount: 20 },
      { type: 'grant', amount: 100 }
    ];

    // When & Then: 実装されていないのでエラー
    for (const operation of operations) {
      if (operation.type === 'grant') {
        await expect(pushMedalService.grantMedalFromGacha({
          userId, vtuberId, executionCount: 1, totalCost: operation.amount * 10, 
          gachaId: 'test-gacha'
        })).rejects.toThrow('Not implemented');
      } else {
        await expect(pushMedalService.consumeMedals({
          userId, vtuberId, amount: operation.amount, 
          reason: 'test_consumption', referenceId: 'test-ref'
        })).rejects.toThrow('Not implemented');
      }
    }
  });
});
```

## 3. エンドツーエンドテスト（E2E Tests）

### 3.1 完全なユーザーフロー

```typescript
describe('Push Medal E2E Tests', () => {
  it('should complete full user medal flow', async () => {
    // Given: 完全なユーザーフロー
    const userId = 'e2e-test-user';
    const vtuberId = 'vtuber-001';

    // When & Then: 実装されていないのでエラー
    await expect(async () => {
      // 1. ガチャ実行→推しメダル付与
      await gachaService.executeGacha({
        userId, gachaId: 'gacha-300yen', vtuberId, executionCount: 1, totalCost: 300
      });

      // 2. 残高確認
      const balance = await pushMedalService.getBalance(userId, vtuberId);

      // 3. 取引履歴確認  
      const history = await pushMedalService.getTransactionHistory(userId, vtuberId, { page: 1, limit: 10 });

      // 4. 特典交換（メダル消費）
      await pushMedalService.consumeMedals({
        userId, vtuberId, amount: 15, reason: 'privilege_exchange', referenceId: 'privilege-001'
      });

      // 5. 最終残高確認
      const finalBalance = await pushMedalService.getBalance(userId, vtuberId);

      return { balance, history, finalBalance };
    }).rejects.toThrow('Not implemented');
  });

  it('should handle error scenarios gracefully', async () => {
    // Given: エラーシナリオのテスト
    const userId = 'error-test-user';
    const vtuberId = 'non-existent-vtuber';

    // When & Then: 実装されていないのでエラー
    await expect(pushMedalService.getBalance(userId, vtuberId))
      .rejects.toThrow('Not implemented');
  });
});
```

## 4. パフォーマンステスト

### 4.1 負荷テスト

```typescript
describe('Push Medal Performance Tests', () => {
  it('should handle 100 concurrent medal grants within 5 seconds', async () => {
    // Given: 100件の同時推しメダル付与
    const concurrentGrants = Array.from({ length: 100 }, (_, i) => ({
      userId: `load-test-user-${i}`,
      gachaId: 'gacha-300yen', 
      vtuberId: 'vtuber-001',
      executionCount: 1,
      totalCost: 300
    }));

    // When & Then: 実装されていないのでエラー
    for (const grant of concurrentGrants) {
      await expect(pushMedalService.grantMedalFromGacha(grant))
        .rejects.toThrow('Not implemented');
    }
  });

  it('should retrieve balance within 100ms', async () => {
    // Given: 残高照会のパフォーマンステスト
    const userId = 'perf-test-user';
    const vtuberId = 'vtuber-001';

    // When & Then: 実装されていないのでエラー
    await expect(pushMedalService.getBalance(userId, vtuberId))
      .rejects.toThrow('Not implemented');
  });
});
```

## 5. セキュリティテスト

### 5.1 認証・認可テスト

```typescript
describe('Push Medal Security Tests', () => {
  it('should prevent unauthorized balance access', async () => {
    // Given: 未認証でのAPIアクセス試行
    const vtuberId = 'vtuber-001';

    // When & Then: JwtAuthGuardによりアクセス拒否される
    expect(controller.getBalance).toBeDefined();
    // 実際の認証テストはJwtAuthGuardのテストで実施
  });

  it('should prevent cross-user data access', async () => {
    // Given: 他ユーザーのデータアクセス試行
    const mockRequest = {
      user: { sub: 'user-123' }
    };
    
    // When & Then: 実装されていないのでエラー
    // 実装時は自分のデータのみアクセス可能を検証
    await expect(controller.getBalance(mockRequest, 'vtuber-001'))
      .rejects.toThrow('Not implemented');
  });
});
```

## テスト実行環境

### 前提条件
- Node.js 18.x以上
- PostgreSQL 15.x (テスト用DB)
- Redis 7.x (キャッシュ/セッション管理)
- Jest テストフレームワーク
- Supertest (HTTP テスト)

### テスト実行コマンド
```bash
# 全てのテスト実行
npm test

# 単体テストのみ
npm test -- --testPathPattern="unit"

# 統合テストのみ  
npm test -- --testPathPattern="integration"

# E2Eテストのみ
npm test -- --testPathPattern="e2e"

# カバレッジ付きテスト実行
npm test -- --coverage

# 特定のテストファイル実行
npm test -- push-medal.service.spec.ts
```

### テスト成功基準
- **単体テスト**: 全テストケース合格、カバレッジ90%以上
- **統合テスト**: ガチャシステム連携が正常動作
- **E2Eテスト**: 完全なユーザーフローが成功
- **パフォーマンス**: 指定された時間内での処理完了
- **セキュリティ**: 認証・認可が適切に機能

## 注意事項

1. **実装順序**: 単体テスト → 統合テスト → E2Eテスト の順で実装
2. **データクリーンアップ**: 各テスト後にテストデータを適切にクリーンアップ
3. **モック使用**: 外部サービス（Stripe等）は適切にモック化
4. **並行処理**: 同時実行テストでデータ競合がないことを確認
5. **エラーハンドリング**: 全ての例外ケースをテストでカバー