# TASK-201: ガチャシステム実装 - TDD要件定義

## 📋 概要

VTuber向けこえポンアプリのコア機能となるガチャシステムを実装します。ユーザーが決済を通じて直接ガチャを購入し、特典を獲得できるシステムです。ガチャ実行により推しメダルも同時に獲得します。

## 🎯 実装対象

### 1. ガチャ管理システム
- ガチャ作成・編集・削除機能
- ガチャ設定（排出率、価格、期間等）管理
- ガチャ状態管理（アクティブ/非アクティブ）
- VTuber別ガチャ管理

### 2. 抽選システム
- 確率的抽選アルゴリズム実装
- 排出率に基づく正確な抽選処理
- 抽選結果の記録・履歴管理
- リアルタイム抽選実行（3秒以内の応答時間）

### 3. ガチャAPI
- ガチャ一覧取得API
- ガチャ詳細情報API
- 抽選実行API
- 抽選履歴取得API
- ガチャ管理API（VTuber用）

## 📊 詳細要件

### A. ガチャエンティティ設計

```typescript
interface Gacha {
  id: string;                    // ガチャID
  vtuberId: string;             // VTuberID
  name: string;                 // ガチャ名
  description: string;          // ガチャ説明
  imageUrl?: string;            // ガチャ画像URL
  price: number;               // ガチャ価格（円）
  medalReward: number;         // 付与推しメダル数
  status: 'active' | 'inactive' | 'ended'; // ガチャ状態
  startDate: Date;             // 開始日時
  endDate?: Date;              // 終了日時
  maxDraws?: number;           // 最大抽選回数
  totalDraws: number;          // 現在の抽選回数
  items: GachaItem[];          // 排出アイテム一覧
  createdAt: Date;
  updatedAt: Date;
}

interface GachaItem {
  id: string;                  // アイテムID
  gachaId: string;            // ガチャID
  rewardId: string;           // 特典ID
  name: string;               // アイテム名
  description: string;        // アイテム説明
  rarity: 'common' | 'rare' | 'epic' | 'legendary'; // レアリティ
  dropRate: number;          // 排出率（0.0-1.0）
  maxCount?: number;         // 排出上限数
  currentCount: number;      // 現在排出数
  imageUrl?: string;         // アイテム画像URL
  createdAt: Date;
  updatedAt: Date;
}

interface GachaResult {
  id: string;                 // 結果ID
  userId: string;            // ユーザーID
  gachaId: string;          // ガチャID
  itemId: string;           // 獲得アイテムID
  price: number;           // 支払い金額（円）
  medalReward: number;     // 獲得推しメダル数
  timestamp: Date;          // 抽選実行時刻
}
```

### B. ガチャ管理API仕様

#### 1. ガチャ一覧取得
```
GET /api/v1/gacha
Query Parameters:
- vtuberId?: string        // VTuber IDでフィルタ
- status?: string          // ステータスでフィルタ
- page?: number           // ページ番号（デフォルト: 1）
- limit?: number          // 取得件数（デフォルト: 10, 最大: 50）

Response:
{
  success: true,
  data: {
    gacha: Gacha[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      totalPages: number
    }
  }
}
```

#### 2. ガチャ詳細取得
```
GET /api/v1/gacha/:id

Response:
{
  success: true,
  data: {
    gacha: Gacha & {
      items: GachaItem[]
    }
  }
}
```

#### 3. 抽選実行
```
POST /api/v1/gacha/:id/draw
Headers:
- Authorization: Bearer <JWT_TOKEN>

Request Body:
{
  drawCount?: number     // 抽選回数（デフォルト: 1, 最大: 10）
}

Response:
{
  success: true,
  data: {
    results: GachaResult[],
    remainingMedals: number,
    executionTime: number  // 処理時間（ms）
  }
}
```

#### 4. ガチャ作成（VTuber権限）
```
POST /api/v1/gacha
Headers:
- Authorization: Bearer <JWT_TOKEN>

Request Body:
{
  name: string,
  description: string,
  price: number,
  medalReward: number,
  startDate: string,
  endDate?: string,
  maxDraws?: number,
  items: {
    rewardId: string,
    name: string,
    description: string,
    rarity: string,
    dropRate: number,
    maxCount?: number
  }[]
}

Response:
{
  success: true,
  data: Gacha
}
```

#### 5. 抽選履歴取得
```
GET /api/v1/gacha/history
Headers:
- Authorization: Bearer <JWT_TOKEN>
Query Parameters:
- gachaId?: string
- page?: number
- limit?: number

Response:
{
  success: true,
  data: {
    results: GachaResult[],
    pagination: PaginationInfo
  }
}
```

### C. 抽選アルゴリズム要件

#### 1. 基本抽選ロジック
- **加重ランダム選択**: 各アイテムの排出率に基づく確率的選択
- **排出率正規化**: 全アイテムの排出率合計が1.0になるよう正規化
- **レアリティ保証**: 一定回数引いた場合のレアアイテム保証システム
- **重複制御**: 排出上限に達したアイテムの除外処理

#### 2. パフォーマンス要件
- **応答時間**: 抽選処理は3秒以内に完了
- **同時処理**: 1000ユーザーの同時抽選に対応
- **データ整合性**: 推しメダル残高の正確な管理
- **トランザクション**: 抽選処理全体のACID特性保証

#### 3. セキュリティ要件
- **不正防止**: クライアントサイドでの抽選結果改ざん防止
- **レート制限**: 過度な連続抽選の制限
- **認証認可**: JWT認証によるユーザー確認
- **監査ログ**: 全抽選処理のログ記録

### D. 統合要件

#### 1. 決済システム連携
- 決済前の価格確認
- ガチャ実行時の決済処理
- 決済失敗時のエラーハンドリング
- 決済トランザクション処理による整合性保証

#### 2. 推しメダルシステム連携
- ガチャ実行時の推しメダル付与
- メダル付与履歴の記録
- メダル残高の更新

#### 3. 特典システム連携
- 獲得特典の自動付与
- 特典BOXへの追加
- 特典の重複管理
- 特典配布履歴の記録

#### 4. 通知システム連携
- 抽選結果通知
- レアアイテム獲得通知
- ガチャ開始/終了通知

## 🧪 テスト要件

### 1. 単体テスト
- **抽選アルゴリズムテスト**: 確率分布の正確性検証
- **排出率計算テスト**: 正規化処理の正確性検証
- **バリデーションテスト**: 入力値検証の網羅テスト
- **エラーハンドリングテスト**: 異常系シナリオの網羅テスト

### 2. 統合テスト
- **API エンドポイントテスト**: 全APIの正常動作確認
- **データベーステスト**: CRUD操作の整合性確認
- **認証認可テスト**: アクセス制御の正確性確認
- **外部連携テスト**: 他システムとの連携動作確認

### 3. パフォーマンステスト
- **負荷テスト**: 1000同時ユーザーでの動作確認
- **応答時間テスト**: 3秒以内の応答時間確認
- **メモリ使用量テスト**: メモリリークの確認
- **データベース性能テスト**: クエリ実行時間の確認

## 🚨 エラーハンドリング

### 1. ビジネスロジックエラー
- **決済失敗**: 決済処理が失敗した場合
- **ガチャ終了**: 終了したガチャへの抽選試行
- **抽選上限**: 最大抽選回数に達した場合
- **アイテム在庫切れ**: 排出上限に達したアイテム

### 2. 技術的エラー
- **データベースエラー**: 接続失敗やクエリエラー
- **外部API エラー**: 決済システム連携エラー
- **認証エラー**: JWT トークンの無効性
- **バリデーションエラー**: 不正な入力値

### 3. システムエラー
- **サーバーエラー**: 内部システム障害
- **タイムアウト**: 処理時間超過
- **レート制限**: API呼び出し制限超過
- **メンテナンスモード**: システムメンテナンス中

## 📈 成功基準

### 1. 機能要件
- ✅ 全API エンドポイントが正常動作
- ✅ 抽選アルゴリズムが指定確率で動作
- ✅ 決済システムとの正確な連携
- ✅ 推しメダルシステムとの正確な連携
- ✅ 特典システムとの正確な連携

### 2. 非機能要件
- ✅ 抽選処理が3秒以内で完了
- ✅ 1000同時ユーザーに対応
- ✅ 99.9%のデータ整合性維持
- ✅ 全エラーシナリオの適切な処理

### 3. 品質要件
- ✅ 単体テストカバレッジ95%以上
- ✅ 統合テスト全パス
- ✅ セキュリティテスト全パス
- ✅ パフォーマンステスト基準クリア

## 🔄 実装段階

### Phase 1: 基盤実装
1. ガチャエンティティ・DTOの作成
2. データベーステーブル設計・作成
3. 基本CRUD API実装

### Phase 2: 抽選システム実装  
1. 抽選アルゴリズム実装
2. 確率計算・正規化処理
3. 抽選実行API実装

### Phase 3: 統合・最適化
1. 推しメダルシステム連携
2. 特典システム連携  
3. パフォーマンス最適化

### Phase 4: テスト・検証
1. 全体テストスイート実行
2. パフォーマンステスト実行
3. セキュリティテスト実行
4. 受け入れテスト実行

---

**実装開始準備完了**: 上記要件に基づいてTDDプロセスを開始します。