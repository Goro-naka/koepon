# TASK-507: 決済フロー修正 - TDD要件定義

## 1. 機能要件

### 1.1 概要
現在の間違った実装（メダルを購入してガチャを引く）を修正し、正しい仕様（ガチャを直接課金で購入し、メダルは結果として獲得）に変更する。

### 1.2 主要機能

#### A. ガチャ直接課金
- **単発ガチャ**: 100円で1回抽選
- **10連ガチャ**: 1,000円で10回抽選
- **決済方法**: Stripe/KOMOJU（クレジットカード、コンビニ決済等）
- **決済フロー**: 決済→抽選→アイテム獲得→メダル付与

#### B. 推しメダル獲得
- **獲得方法**: ガチャ結果として付与（購入不可）
- **獲得量**: VTuber設定により変動可能
- **用途**: 交換所でのアイテム交換のみ

#### C. 決済処理
- **冪等性**: 重複決済防止
- **エラーハンドリング**: 決済失敗時の適切な処理
- **Webhook**: Stripe/KOMOJU Webhookの処理

## 2. 技術要件

### 2.1 フロントエンド

#### ストア修正 (stores/gacha.ts)
```typescript
interface GachaStore {
  // 決済状態の追加
  paymentState: 'idle' | 'processing' | 'success' | 'error'
  paymentError: string | null
  
  // 修正が必要なメソッド
  executeDraw: (gachaId: string, count: number) => Promise<void>
  processPayment: (amount: number, gachaId: string) => Promise<PaymentIntent>
  
  // 削除が必要なプロパティ
  // medalCost: number  // 削除
  // checkMedalBalance: () => boolean  // 削除
}
```

#### ストア修正 (stores/medal.ts)
```typescript
interface MedalStore {
  // 削除が必要なメソッド
  // purchaseMedals: (amount: number) => Promise<void>  // 削除
  // useMedalsForGacha: (amount: number) => Promise<void>  // 削除
  
  // 追加が必要なメソッド
  earnMedals: (amount: number, source: 'gacha' | 'bonus') => Promise<void>
  exchangeMedals: (itemId: string, cost: number) => Promise<void>
}
```

#### 型定義修正 (types/gacha.ts)
```typescript
interface DrawResult {
  id: string
  gachaId: string
  items: DrawResultItem[]
  medalsEarned: number      // 追加
  paymentId: string         // 追加
  paymentAmount: number     // 追加（円）
  drawCount: number
  timestamp: string
  // medalUsed: number      // 削除
}
```

### 2.2 バックエンド

#### PaymentService
```typescript
class PaymentService {
  async createPaymentIntent(
    amount: number,
    currency: 'jpy',
    metadata: {
      userId: string
      gachaId: string
      drawCount: number
    }
  ): Promise<Stripe.PaymentIntent>
  
  async confirmPayment(paymentIntentId: string): Promise<boolean>
  
  async handleWebhook(event: Stripe.Event): Promise<void>
}
```

#### GachaService修正
```typescript
class GachaService {
  async executeDraw(
    gachaId: string,
    count: number,
    paymentIntentId: string  // 追加
  ): Promise<DrawResult> {
    // 1. 決済確認
    // 2. 抽選実行
    // 3. メダル付与
    // 4. 結果返却
  }
}
```

## 3. API仕様

### 3.1 ガチャ購入API

#### POST /api/gacha/purchase
**Request:**
```json
{
  "gachaId": "gacha_123",
  "drawCount": 1,  // 1 or 10
  "paymentMethodId": "pm_xxxxx"
}
```

**Response:**
```json
{
  "paymentIntentId": "pi_xxxxx",
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "amount": 100,
  "currency": "jpy"
}
```

### 3.2 ガチャ抽選API（修正）

#### POST /api/gacha/draw
**Request:**
```json
{
  "gachaId": "gacha_123",
  "drawCount": 1,
  "paymentIntentId": "pi_xxxxx"  // 追加
}
```

**Response:**
```json
{
  "drawId": "draw_xxxxx",
  "items": [...],
  "medalsEarned": 10,  // 追加
  "paymentAmount": 100,  // 追加
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### 3.3 Webhook処理

#### POST /api/webhook/stripe
- payment_intent.succeeded
- payment_intent.payment_failed
- charge.refunded

## 4. UI/UX要件

### 4.1 価格表示
- **Before**: "単発: 100メダル" / "10連: 1000メダル"
- **After**: "単発: ¥100" / "10連: ¥1,000"

### 4.2 購入ボタン
- **Before**: "メダルで購入"
- **After**: "¥100で購入" / "¥1,000で10連購入"

### 4.3 決済フロー
1. ガチャ選択
2. 購入確認（価格を円で表示）
3. Stripe決済画面
4. 決済処理中表示
5. 抽選アニメーション
6. 結果表示（獲得メダル含む）

### 4.4 エラー表示
- 決済失敗: "決済に失敗しました。もう一度お試しください。"
- ネットワークエラー: "通信エラーが発生しました。"
- 在庫切れ: "このガチャは終了しました。"

## 5. データベース変更

### 5.1 gacha_drawsテーブル
```sql
ALTER TABLE gacha_draws 
ADD COLUMN payment_intent_id VARCHAR(255),
ADD COLUMN payment_amount INTEGER,
ADD COLUMN medals_earned INTEGER,
DROP COLUMN medals_used;  -- 削除

CREATE INDEX idx_payment_intent ON gacha_draws(payment_intent_id);
```

### 5.2 medal_transactionsテーブル
```sql
-- typeカラムの値を変更
-- 'purchase' を削除
-- 'gacha_reward' を追加
UPDATE medal_transactions 
SET type = 'gacha_reward' 
WHERE type = 'purchase';
```

## 6. テスト要件

### 6.1 単体テスト
- [ ] Stripe PaymentIntent作成
- [ ] 決済確認処理
- [ ] メダル付与計算
- [ ] 重複決済防止

### 6.2 統合テスト
- [ ] 決済→抽選→メダル付与の一連フロー
- [ ] Webhook処理
- [ ] エラー時のロールバック

### 6.3 E2Eテスト
- [ ] ユーザー視点での購入フロー
- [ ] 決済キャンセル
- [ ] 獲得メダルの交換所での使用

## 7. 受け入れ基準

### 7.1 機能要件
- [ ] ガチャが100円/1000円で直接購入できる
- [ ] 決済完了後に自動で抽選が実行される
- [ ] 抽選結果としてメダルが付与される
- [ ] メダルは購入できない（ガチャ結果のみ）
- [ ] 獲得メダルは交換所で使用できる

### 7.2 非機能要件
- [ ] 決済処理は3秒以内に完了
- [ ] 重複決済が防止される
- [ ] Webhookが正しく処理される
- [ ] エラー時に適切なメッセージが表示される

### 7.3 セキュリティ要件
- [ ] Webhook署名検証
- [ ] 決済情報の暗号化
- [ ] CSRFトークン検証
- [ ] 冪等性キーによる重複防止

## 8. リスクと対策

### 8.1 データ移行
- **リスク**: 既存のメダル購入履歴の扱い
- **対策**: 購入済みメダルは残高として保持し、交換所で使用可能にする

### 8.2 後方互換性
- **リスク**: 旧APIを使用しているクライアント
- **対策**: 一定期間は旧APIも動作させ、段階的に移行

### 8.3 決済エラー
- **リスク**: 決済後の抽選失敗
- **対策**: トランザクション管理と適切なロールバック処理

## 9. 実装優先順位

1. **Phase 1**: バックエンド決済処理
   - PaymentService実装
   - Stripe統合
   - Webhook処理

2. **Phase 2**: API修正
   - ガチャ購入API
   - 抽選API修正
   - メダル付与ロジック

3. **Phase 3**: フロントエンド修正
   - ストア修正
   - UI更新
   - エラーハンドリング

4. **Phase 4**: テストと検証
   - 単体テスト
   - 統合テスト
   - 本番環境テスト