# TASK-203: 推しメダルシステム実装 - 要件定義

## 概要

推しメダルシステムは、ユーザーがガチャを実行した際に、そのガチャ実行回数に応じて特定のVTuberに推しメダル（ポイント）を付与するシステムです。このシステムにより、ユーザーの推し活動を定量化し、VTuber別の推し活動状況を管理します。

## 機能要件

### 1. 推しメダル付与システム

#### 1.1 ガチャ実行回数による付与
- **REQ-PushMedal-001**: ガチャを実行した際、実行回数に応じて推しメダルを自動付与
- **REQ-PushMedal-002**: ガチャ料金に基づく動的付与量算出
  - 基本計算式: ガチャ料金（円） ÷ 10 = 推しメダル数
  - 例: 300円ガチャ → 30推しメダル、500円ガチャ → 50推しメダル
  - 10連ガチャは実行回数分を付与（10回分）
  - 最小付与: 10推しメダル、最大付与: 1,000推しメダル
- **REQ-PushMedal-003**: ガチャ対象のVTuberに推しメダルを付与

#### 1.2 VTuber指定機能
- **REQ-PushMedal-004**: ユーザーが推しVTuberを事前設定可能
- **REQ-PushMedal-005**: 推しVTuber未設定時はガチャ対象VTuberに自動付与
- **REQ-PushMedal-006**: 推し設定変更時の既存残高保持

### 2. 推しメダル残高管理

#### 2.1 VTuber別残高管理
- **REQ-PushMedal-007**: ユーザーごと・VTuberごとの推しメダル残高を管理
- **REQ-PushMedal-008**: 残高の増減履歴をトランザクション形式で記録
- **REQ-PushMedal-009**: 残高確認APIの提供（ユーザー別・VTuber別・総合）

#### 2.2 特典交換機能
- **REQ-PushMedal-010**: 推しメダルを消費して特典と交換
- **REQ-PushMedal-011**: VTuber別の特典ラインナップ管理
- **REQ-PushMedal-012**: 交換履歴の記録と管理

### 3. トランザクション管理

#### 3.1 取引記録
- **REQ-PushMedal-013**: 全ての推しメダル増減をトランザクションとして記録
- **REQ-PushMedal-014**: トランザクションタイプの分類
  - `GACHA_REWARD`: ガチャ実行による獲得
  - `SPECIAL_BONUS`: 特別イベントボーナス
  - `EXCHANGE_CONSUMPTION`: 特典交換による消費
  - `ADMIN_ADJUSTMENT`: 管理者による調整
- **REQ-PushMedal-015**: トランザクション履歴の参照API提供

#### 3.2 整合性管理
- **REQ-PushMedal-016**: 残高とトランザクション履歴の整合性チェック
- **REQ-PushMedal-017**: 並行処理時のデータ整合性保証（楽観ロック）
- **REQ-PushMedal-018**: 不整合検出時のアラート機能

### 4. API仕様

#### 4.1 残高確認API
```
GET /api/push-medals/balance
GET /api/push-medals/balance/:vtuberId
GET /api/push-medals/pool-balance
```

#### 4.2 履歴確認API
```
GET /api/push-medals/transactions
GET /api/push-medals/transactions/:vtuberId
```

#### 4.3 管理機能API
```
POST /api/push-medals/transfer-from-pool
POST /api/push-medals/admin/adjust-balance
GET /api/push-medals/admin/integrity-check
```

## 非機能要件

### 1. パフォーマンス要件
- **NFR-PushMedal-001**: 残高更新処理は100ms以内で完了
- **NFR-PushMedal-002**: 同時ユーザー数1000人での安定動作
- **NFR-PushMedal-003**: トランザクション履歴検索は1秒以内で結果返却

### 2. 可用性要件
- **NFR-PushMedal-004**: 推しメダルシステムの可用性99.9%以上
- **NFR-PushMedal-005**: ガチャ・決済システムとの連携障害時の適切なフォールバック

### 3. セキュリティ要件
- **NFR-PushMedal-006**: 推しメダル残高の不正操作防止
- **NFR-PushMedal-007**: 管理者権限による残高調整の監査ログ
- **NFR-PushMedal-008**: ユーザー認証・認可の徹底

## データベース設計

### 1. push_medal_balances テーブル
```sql
CREATE TABLE push_medal_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  vtuber_id UUID REFERENCES vtubers(id), -- NULLの場合はプール残高
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, vtuber_id),
  CHECK (balance >= 0)
);
```

### 2. push_medal_transactions テーブル
```sql
CREATE TABLE push_medal_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  vtuber_id UUID REFERENCES vtubers(id),
  transaction_type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id UUID, -- ガチャID、決済ID等の参照
  reference_type VARCHAR(50), -- 'gacha', 'payment', 'transfer'等
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (amount != 0),
  CHECK (balance_before >= 0),
  CHECK (balance_after >= 0)
);
```

### 3. インデックス設計
```sql
-- 残高検索用
CREATE INDEX idx_push_medal_balances_user_vtuber ON push_medal_balances(user_id, vtuber_id);
CREATE INDEX idx_push_medal_balances_user ON push_medal_balances(user_id);

-- トランザクション検索用
CREATE INDEX idx_push_medal_transactions_user_created ON push_medal_transactions(user_id, created_at DESC);
CREATE INDEX idx_push_medal_transactions_vtuber_created ON push_medal_transactions(vtuber_id, created_at DESC);
CREATE INDEX idx_push_medal_transactions_reference ON push_medal_transactions(reference_id, reference_type);
```

## 統合仕様

### 1. ガチャシステム連携
```typescript
// ガチャ実行時のWebhook
interface GachaExecutedEvent {
  userId: string;
  gachaId: string;
  vtuberId: string;
  executionCount: number;    // 実行回数（1回 or 10回）
  totalCost: number;         // 支払い総額（円）
  timestamp: string;
}
```

### 2. 決済システム連携
```typescript
// 決済完了時のWebhook
interface PaymentCompletedEvent {
  userId: string;
  paymentId: string;
  gachaId: string;
  gachaCount: number;        // ガチャ実行回数
  amount: number;            // 決済金額
}
```

## エラーハンドリング

### 1. ビジネスロジックエラー
- **不正な残高操作**: 残高不足時の適切なエラーレスポンス
- **存在しないVTuber指定**: 404エラーと適切なメッセージ
- **権限エラー**: 他ユーザーの残高操作試行時の403エラー

### 2. システムエラー
- **データベース接続エラー**: リトライ機構と適切なフォールバック
- **整合性エラー**: 残高とトランザクション履歴の不整合検出時のアラート
- **並行処理競合**: 楽観ロックによる競合解決

## 受け入れ基準

### 1. 機能面
- [ ] ガチャ獲得時に適切な推しメダルが付与される
- [ ] 決済完了時に適切な推しメダルボーナスが付与される  
- [ ] VTuber別の残高管理が正確に行われる
- [ ] プール残高から特定VTuberへの振り分けが正常動作する
- [ ] トランザクション履歴が正確に記録される

### 2. 性能面
- [ ] 残高更新処理が100ms以内で完了する
- [ ] 同時アクセス時にデータ整合性が保持される
- [ ] 履歴検索が1秒以内で結果を返す

### 3. 品質面
- [ ] 全ての単体テストが合格する（カバレッジ90%以上）
- [ ] 統合テストが合格する
- [ ] エラーハンドリングが適切に実装される
- [ ] セキュリティ要件が満たされる

## 実装優先度

### Phase 1: コア機能（必須）
1. 推しメダル残高管理システム
2. トランザクション記録システム
3. ガチャ連携による自動付与
4. 基本的なAPI（残高確認・履歴）

### Phase 2: 拡張機能
1. 決済連携による付与
2. プール残高管理
3. 管理者機能
4. 整合性チェック機能

### Phase 3: 最適化
1. パフォーマンス最適化
2. 監視・アラート機能
3. レポート機能