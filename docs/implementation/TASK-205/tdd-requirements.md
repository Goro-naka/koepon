# TASK-205: 交換所システム実装 - TDD要件定義

## 🎯 タスク概要

**タスク**: 交換所システム実装  
**タイプ**: TDD  
**依存タスク**: TASK-204（特典管理システム実装）  
**要件リンク**: REQ-004, REQ-105, REQ-203

## 📋 要件定義

### 1. 機能要件

#### 1.1 交換アイテム管理
- **交換可能アイテム**: 推しメダルで交換できるアイテム一覧
- **アイテムタイプ**: デジタル特典、物理商品、限定コンテンツ
- **在庫管理**: 交換上限数の管理（日次・総数）
- **価格設定**: 推しメダルでの価格設定
- **期間制限**: 交換期間の設定（開始日・終了日）

#### 1.2 交換処理実装
- **推しメダル残高確認**: 交換前の残高チェック
- **原子的取引**: 残高減算とアイテム付与の同時処理
- **重複防止**: 同一アイテムの重複交換制御
- **トランザクション管理**: 失敗時のロールバック処理

#### 1.3 制限・バリデーション
- **日次上限**: 1日あたりの交換回数制限
- **総数上限**: アイテムごとの総交換数制限
- **ユーザー上限**: ユーザーごとのアイテム所有数制限
- **期間チェック**: 交換可能期間内での処理のみ許可

#### 1.4 交換履歴管理
- **取引記録**: 全交換取引の履歴保存
- **状態管理**: 交換状態（成功・失敗・保留）
- **監査ログ**: 不正取引の検出・追跡
- **統計データ**: 交換傾向の分析データ

### 2. データモデル

#### 2.1 ExchangeItem Entity
```typescript
interface ExchangeItem {
  id: string;                    // UUID
  vtuberId: string;              // VTuber ID
  name: string;                  // アイテム名
  description: string;           // アイテム説明
  category: ExchangeCategory;    // カテゴリ（digital/physical/content）
  medalCost: number;             // 必要推しメダル数
  totalStock: number;            // 総在庫数
  dailyLimit: number;            // 日次交換上限
  userLimit: number;             // ユーザー交換上限
  isActive: boolean;             // 交換可能状態
  startDate: Date;               // 交換開始日
  endDate?: Date;                // 交換終了日
  imageUrl?: string;             // アイテム画像URL
  metadata?: Record<string, any>; // 追加メタデータ
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 2.2 ExchangeTransaction Entity
```typescript
interface ExchangeTransaction {
  id: string;                    // UUID
  userId: string;                // ユーザーID
  exchangeItemId: string;        // 交換アイテムID
  medalCost: number;             // 消費メダル数
  quantity: number;              // 交換数量
  status: TransactionStatus;     // 取引状態
  failureReason?: string;        // 失敗理由
  executedAt: Date;              // 実行日時
  completedAt?: Date;            // 完了日時
  metadata?: Record<string, any>; // 追加情報
}
```

#### 2.3 UserExchangeItem Entity
```typescript
interface UserExchangeItem {
  id: string;                    // UUID
  userId: string;                // ユーザーID
  exchangeItemId: string;        // 交換アイテムID
  transactionId: string;         // 取引ID
  acquiredAt: Date;              // 獲得日時
  usedAt?: Date;                 // 使用日時
  isActive: boolean;             // 有効状態
  metadata?: Record<string, any>; // アイテム固有データ
}
```

### 3. API エンドポイント

#### 3.1 交換所機能（ユーザー権限）
- `GET /api/v1/exchange/items` - 交換可能アイテム一覧
- `GET /api/v1/exchange/items/:id` - アイテム詳細取得
- `POST /api/v1/exchange/items/:id/exchange` - アイテム交換実行
- `GET /api/v1/exchange/history` - ユーザー交換履歴
- `GET /api/v1/exchange/inventory` - ユーザー所持アイテム

#### 3.2 アイテム管理（VTuber/Admin権限）
- `POST /api/v1/exchange/items` - 交換アイテム作成
- `PUT /api/v1/exchange/items/:id` - アイテム更新
- `DELETE /api/v1/exchange/items/:id` - アイテム削除
- `GET /api/v1/exchange/stats` - 交換統計データ

### 4. ビジネスルール

#### 4.1 交換制限
- **残高不足**: 推しメダル残高が不足している場合は交換不可
- **在庫切れ**: 在庫数が0の場合は交換不可
- **期間外**: 交換期間外の場合は交換不可
- **上限達成**: 日次・ユーザー上限に達している場合は交換不可

#### 4.2 価格計算
- **基本価格**: アイテムごとに設定された固定価格
- **動的価格**: 需要に応じた価格変動（将来拡張）
- **割引適用**: キャンペーン期間中の割引（将来拡張）

#### 4.3 アイテム配布
- **即座配布**: デジタルアイテムは即座にユーザーインベントリに追加
- **手動配布**: 物理商品は管理者による手動配布
- **期限付き**: 一部アイテムは使用期限を設定

### 5. セキュリティ要件

#### 5.1 認証・認可
- **JWT認証**: 全保護エンドポイントでの認証
- **ロールベース**: VTuber/Admin権限の適切な制御
- **操作権限**: 自身のアイテムのみ管理可能

#### 5.2 不正防止
- **重複防止**: 同一リクエストの重複実行防止
- **レート制限**: API呼び出し回数制限
- **監査ログ**: 全取引の記録・追跡

### 6. パフォーマンス要件

#### 6.1 応答時間
- **アイテム一覧**: 2秒以内での表示
- **交換実行**: 3秒以内での完了
- **履歴取得**: 1秒以内での表示

#### 6.2 同時処理
- **在庫管理**: 同時交換時の在庫整合性保証
- **残高管理**: 推しメダル残高の正確な管理
- **ロック制御**: 適切な排他制御の実装

### 7. エラーハンドリング

#### 7.1 交換エラー
- `InsufficientMedalBalanceException`: 推しメダル残高不足
- `ExchangeItemOutOfStockException`: アイテム在庫切れ
- `ExchangeLimitExceededException`: 交換上限超過
- `ExchangePeriodExpiredException`: 交換期間外
- `DuplicateExchangeException`: 重複交換

#### 7.2 システムエラー
- `ExchangeTransactionFailedException`: 取引処理失敗
- `ExchangeItemNotFoundException`: アイテムが見つからない
- `InvalidExchangeRequestException`: 無効な交換リクエスト

## 🧪 テスト戦略

### 1. 単体テスト
- 交換ロジックの検証
- 制限チェック機能
- 価格計算ロジック
- エラーハンドリング

### 2. 統合テスト
- API エンドポイント
- データベース整合性
- 推しメダルシステム連携
- 特典管理システム連携

### 3. パフォーマンステスト
- 同時交換処理
- 大量データ処理
- 応答時間測定

## 🔄 実装フェーズ

### Phase 1: 基盤実装
1. エンティティ定義
2. 基本的なCRUD操作
3. データベースマイグレーション

### Phase 2: ビジネスロジック
1. 交換処理の実装
2. 制限チェック機能
3. 履歴管理機能

### Phase 3: 統合・最適化
1. 他システムとの連携
2. パフォーマンス最適化
3. エラーハンドリング強化