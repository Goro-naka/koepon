# TASK-202: 決済システム実装 - 要件定義

## 実装日時
- 開始日時: 2025-08-25T05:30:00Z
- タスクID: TASK-202

## 概要

VTuberファン向けプラットフォーム「こえポン！」において、ガチャ購入のための決済システムを実装する。Stripe決済サービスを利用し、安全で信頼性の高い決済フローを提供する。

## 要件詳細

### 機能要件

#### 1. Stripe決済連携

**1.1 決済フロー**
- クレジットカード決済対応（Visa、MasterCard、JCB、AMEX）
- PayPal決済対応（オプション）
- Apple Pay / Google Pay対応（モバイル向け）
- 3Dセキュア (SCA) 対応

**1.2 決済金額**
- 動的料金設定:
  - ガチャ作成時に管理者が料金を設定
  - 単発ガチャ料金: 設定可能範囲 ¥100 - ¥1,000 (税込)
  - 10連ガチャ料金: 単発ガチャ料金 × 10回分（割引設定可能）
  - 特別ガチャ料金: 管理者が任意設定
  - 最小料金: ¥100、最大料金: ¥10,000（法的制限考慮）

#### 2. 冪等性キー実装

**2.1 冪等性保証**
- 同一決済リクエストの重複実行防止
- UUID v4による一意キー生成
- Redis TTL: 24時間
- 決済状態の管理

**2.2 重複決済防止**
- ユーザーセッション単位での重複チェック
- 決済処理中状態の管理
- タイムアウト処理 (30秒)

#### 3. Webhook処理

**3.1 Stripe Webhookイベント処理**
- `payment_intent.succeeded` - 決済完了
- `payment_intent.payment_failed` - 決済失敗
- `payment_intent.canceled` - 決済キャンセル
- `charge.dispute.created` - チャージバック

**3.2 Webhook署名検証**
- Stripe署名の検証
- タイムスタンプ検証（5分以内）
- 不正なWebhook拒否

#### 4. 決済状態管理

**4.1 決済ステータス**
```typescript
enum PaymentStatus {
  PENDING = 'pending',           // 処理中
  COMPLETED = 'completed',       // 完了
  FAILED = 'failed',             // 失敗
  CANCELLED = 'cancelled',       // キャンセル
  REFUNDED = 'refunded'          // 返金
}
```

**4.2 状態遷移管理**
- pending → completed (決済成功)
- pending → failed (決済失敗)
- pending → cancelled (ユーザーキャンセル)
- completed → refunded (返金処理)

#### 5. 返金処理

**5.1 返金対象**
- ユーザー申請による返金
- システムエラーによる自動返金
- 不正利用による強制返金

**5.2 返金フロー**
- 返金申請受付
- 管理者承認
- Stripe API経由返金実行
- ガチャ履歴の巻き戻し処理
- 通知メール送信

### データベース設計

#### 5.1 paymentsテーブル
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  amount INTEGER NOT NULL,           -- 決済金額（円）
  gacha_id UUID NOT NULL REFERENCES gachas(id), -- 購入対象ガチャ
  gacha_count INTEGER NOT NULL,      -- ガチャ実行回数
  status payment_status NOT NULL DEFAULT 'pending',
  currency VARCHAR(3) NOT NULL DEFAULT 'jpy',
  payment_method VARCHAR(50),        -- card, paypal, apple_pay, etc.
  metadata JSONB,                    -- Stripe metadata
  failure_reason TEXT,               -- 失敗理由
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_payments_user_id (user_id),
  INDEX idx_payments_status (status),
  INDEX idx_payments_stripe_payment_intent (stripe_payment_intent_id),
  INDEX idx_payments_idempotency_key (idempotency_key)
);
```

#### 5.2 refundsテーブル
```sql
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  stripe_refund_id VARCHAR(255) NOT NULL UNIQUE,
  amount INTEGER NOT NULL,           -- 返金金額（円）
  medal_amount INTEGER NOT NULL,     -- 回収メダル数
  status refund_status NOT NULL DEFAULT 'pending',
  reason TEXT NOT NULL,              -- 返金理由
  admin_id UUID REFERENCES users(id), -- 承認管理者
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  INDEX idx_refunds_payment_id (payment_id),
  INDEX idx_refunds_status (status)
);
```

### API設計

#### 6.1 決済関連エンドポイント

**POST /api/v1/payments/create-intent**
```typescript
// Request
interface CreatePaymentIntentRequest {
  medalPackageId: string;        // メダルパッケージID
  paymentMethod?: string;        // 決済方法指定
  returnUrl?: string;           // 決済完了後リダイレクトURL
}

// Response
interface CreatePaymentIntentResponse {
  clientSecret: string;         // Stripe client secret
  paymentIntentId: string;      // PaymentIntent ID
  amount: number;              // 決済金額
  medalAmount: number;         // 獲得メダル数
}
```

**POST /api/v1/payments/confirm**
```typescript
// Request
interface ConfirmPaymentRequest {
  paymentIntentId: string;
  idempotencyKey: string;
}

// Response
interface ConfirmPaymentResponse {
  success: boolean;
  paymentId: string;
  medalBalance: number;        // 更新後メダル残高
}
```

**GET /api/v1/payments/history**
```typescript
// Query Parameters
interface PaymentHistoryQuery {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  from?: string;              // ISO date
  to?: string;                // ISO date
}

// Response
interface PaymentHistoryResponse {
  payments: Payment[];
  pagination: PaginationInfo;
}
```

**POST /api/v1/payments/webhook** (Stripe Webhook)
```typescript
// Stripeからのwebhook受信処理
// 署名検証 → イベント処理 → DB更新
```

#### 6.2 返金関連エンドポイント

**POST /api/v1/refunds/request**
```typescript
// Request
interface RefundRequestRequest {
  paymentId: string;
  reason: string;
  amount?: number;            // 部分返金の場合
}

// Response
interface RefundRequestResponse {
  refundId: string;
  status: 'pending';
  estimatedProcessingTime: string;
}
```

### セキュリティ要件

#### 7.1 PCI DSS準拠
- Stripeによるカード情報の安全な処理
- サーバーサイドでのカード情報非保持
- HTTPS通信強制

#### 7.2 不正利用対策
- 決済頻度制限（1ユーザー1時間10回まで）
- 異常な決済パターンの検知
- IP制限・地域制限機能

#### 7.3 データ保護
- 決済情報の暗号化保存
- ログの適切なマスキング
- GDPR対応データ削除機能

### パフォーマンス要件

#### 8.1 応答時間
- 決済Intent作成: 2秒以内
- 決済確認処理: 3秒以内
- Webhook処理: 1秒以内
- 履歴取得: 1秒以内

#### 8.2 可用性
- 決済システム稼働率: 99.9%以上
- Stripe障害時の適切なエラーハンドリング
- 決済データの整合性保証

#### 8.3 スケーラビリティ
- 同時決済処理: 100件/秒
- Webhook処理: 1000件/秒
- 決済履歴検索の最適化

### エラーハンドリング

#### 9.1 決済エラー
- カード情報エラー → ユーザーフレンドリーメッセージ
- 決済金額エラー → システムログ記録
- Stripe APIエラー → 自動リトライ（最大3回）

#### 9.2 システムエラー
- DB接続エラー → 決済処理停止
- Redis接続エラー → 冪等性チェック無効化警告
- メール送信エラー → 非同期リトライ

#### 9.3 Webhookエラー
- 署名検証失敗 → 403エラー返却
- 処理タイムアウト → 202返却後非同期処理
- 重複イベント → 冪等性チェックで無視

### 監視・ログ

#### 10.1 メトリクス監視
- 決済成功率
- 決済処理時間
- エラー率
- Webhook処理率

#### 10.2 アラート設定
- 決済成功率 < 95%
- 平均処理時間 > 5秒
- エラー率 > 5%
- Webhook失敗率 > 1%

#### 10.3 ログ要件
- 決済開始・完了ログ
- エラー詳細ログ
- セキュリティイベントログ
- 監査ログ（変更履歴）

## 技術仕様

### 使用技術
- **決済サービス**: Stripe API v2023-10-16
- **認証**: JWT Bearer Token
- **データベース**: PostgreSQL (Supabase)
- **キャッシュ**: Redis
- **ファイル**: TypeScript + NestJS
- **バリデーション**: class-validator
- **テスト**: Jest + Supertest

### 外部依存
- Stripe API
- Supabase Database
- Redis Cache
- SMTP Mail Service

## 受入基準

### 機能要件
- [ ] Stripe決済連携が正常に動作する
- [ ] 冪等性キーによる重複決済防止が機能する
- [ ] Webhook処理が正確に実行される
- [ ] 決済状態管理が適切に行われる
- [ ] 返金処理が正常に動作する

### 非機能要件
- [ ] 決済処理が3秒以内に完了する
- [ ] Webhook処理が1秒以内に完了する
- [ ] セキュリティ要件を満たす
- [ ] エラーハンドリングが適切に実装される

### テスト要件
- [ ] 単体テストカバレッジ >= 90%
- [ ] 統合テストで主要フロー検証
- [ ] E2Eテストで決済フロー検証
- [ ] セキュリティテストで脆弱性がない

### 運用要件
- [ ] 監視・アラート設定完了
- [ ] ログ設定完了
- [ ] ドキュメント作成完了
- [ ] 運用手順書作成完了

## 実装計画

### Phase 1: 基盤実装
1. データベーススキーマ作成
2. 基本エンティティ・DTOクラス実装
3. Stripe API連携基盤実装

### Phase 2: 決済フロー実装
1. 決済Intent作成API
2. 決済確認API
3. 決済状態管理

### Phase 3: Webhook実装
1. Webhook署名検証
2. イベント処理ハンドラー
3. 冪等性キー管理

### Phase 4: 返金機能実装
1. 返金申請API
2. 返金処理ロジック
3. 管理者承認フロー

### Phase 5: 品質向上
1. エラーハンドリング強化
2. パフォーマンス最適化
3. セキュリティ強化
4. 監視・ログ強化

## 実装メモ

- Stripe Test環境での開発・テスト実施
- PCI DSS要件を常に意識した実装
- 決済データの適切な暗号化
- 非同期処理でのパフォーマンス最適化
- 徹底的なエラーハンドリング