# Stripe Elements決済システム - 要件定義

## 📋 要件概要

### 1. ビジネス要件
- **目的**: ガチャ購入時の決済処理をStripe Elementsで実装
- **対象**: ガチャ購入フロー（100円/1000円）
- **ユーザー**: 一般ユーザー（ガチャ購入者）
- **成功基準**: サイト内完結の決済体験を提供

### 2. 機能要件

#### 2.1 決済フロー
```
[ガチャ詳細] → [決済フォーム] → [Payment Intent] → [決済完了] → [ガチャ抽選]
```

#### 2.2 実装対象コンポーネント

**A. `StripeProvider.tsx`**
- Stripe Elementsのラッパーコンポーネント
- publishable keyの管理
- テーマ設定

**B. `PaymentForm.tsx`** 
- CardElementを含む決済フォーム
- バリデーション・エラーハンドリング
- ローディング状態管理

**C. `useStripePayment.ts`**
- 決済処理のカスタムフック
- Payment Intent作成・確認
- エラー状態管理

#### 2.3 決済手順
1. ガチャ選択（価格: 100円 or 1000円）
2. 決済フォーム表示（Card Element）
3. カード情報入力・バリデーション
4. Payment Intent作成（/api/payments/create-intent）
5. 決済確認・実行（stripe.confirmCardPayment）
6. 成功時: ガチャ抽選実行
7. 失敗時: エラー表示・再試行

### 3. 技術要件

#### 3.1 Stripe Elements設定
```typescript
// 必要なパッケージ
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// 設定
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
```

#### 3.2 API連携
- **POST** `/api/payments/create-intent` - Payment Intent作成
- **POST** `/api/payments/confirm` - 決済確認
- **POST** `/api/gacha/execute` - ガチャ抽選実行

#### 3.3 型定義
```typescript
interface PaymentData {
  gachaId: string
  amount: number // 100 or 1000
  pullType: 'single' | 'ten'
}

interface PaymentResult {
  success: boolean
  paymentIntentId: string
  error?: string
}
```

### 4. UX要件

#### 4.1 ローディング状態
- カード情報入力中: リアルタイムバリデーション表示
- 決済処理中: ボタン無効化 + スピナー表示
- Payment Intent作成中: 「決済準備中...」表示

#### 4.2 エラーハンドリング
- カード情報エラー: フィールド下にエラーメッセージ
- 決済失敗: Alert + 再試行ボタン
- ネットワークエラー: 「接続を確認してください」

#### 4.3 成功時の体験
- 決済完了: 「決済が完了しました」表示
- 即座にガチャ抽選画面に遷移
- 抽選アニメーション開始

### 5. セキュリティ要件

#### 5.1 PCI DSS準拠
- カード情報は直接サーバーに送信しない
- Stripe Elementsによる自動トークン化
- HTTPS必須

#### 5.2 CSP設定
```html
<meta http-equiv="Content-Security-Policy" 
      content="connect-src 'self' https://api.stripe.com;">
```

### 6. パフォーマンス要件

#### 6.1 読み込み時間
- Stripeスクリプト: 遅延読み込み
- Payment Intent作成: 2秒以内
- 決済完了: 3秒以内

#### 6.2 バンドルサイズ最適化
```typescript
// Tree shaking対応
import { loadStripe } from '@stripe/stripe-js'
// 必要な要素のみインポート
```

### 7. 既存実装との統合

#### 7.1 現在のモック実装 (src/lib/stripe.ts)
```typescript
// 削除対象: モック決済処理
export async function processStripePayment(data: StripePaymentData): Promise<StripePaymentResult> {
  // TODO: 実際のStripe決済処理を実装
  console.log('Processing Stripe payment:', data)
  
  // モック実装
  return {
    success: true,
    id: `pi_mock_${Date.now()}`
  }
}
```

#### 7.2 ガチャStore統合 (src/stores/gacha.ts)
```typescript
// 決済完了後の処理を実際のStripe結果に変更
const payment = await processStripePayment({
  gachaId,
  amount,
  pullType
})

if (payment.success) {
  // 抽選実行
  await executeGacha(payment.id)
}
```

### 8. 受け入れ基準

#### 8.1 機能テスト
- [ ] カード情報入力・バリデーション動作
- [ ] Payment Intent正常作成
- [ ] 決済成功時のガチャ実行
- [ ] 決済失敗時のエラー表示
- [ ] 再試行機能動作

#### 8.2 UXテスト  
- [ ] ローディング状態の適切な表示
- [ ] エラーメッセージの明確性
- [ ] モバイル対応（レスポンシブ）
- [ ] アクセシビリティ（ARIA属性）

#### 8.3 セキュリティテスト
- [ ] カード情報の非保存確認
- [ ] HTTPS通信確認
- [ ] CSP準拠確認

#### 8.4 パフォーマンステスト
- [ ] 決済フォーム表示速度（2秒以内）
- [ ] Payment Intent作成速度（2秒以内）
- [ ] 決済完了速度（3秒以内）

## 🎯 実装優先順位

1. **Phase 1**: 基本実装
   - StripeProvider.tsx
   - PaymentForm.tsx
   - useStripePayment.ts

2. **Phase 2**: 統合実装
   - ガチャStoreとの連携
   - モック実装の置き換え
   - エラーハンドリング

3. **Phase 3**: UX向上
   - ローディング最適化
   - エラーメッセージ改善
   - アクセシビリティ対応

## 📁 実装ファイル構成

```
client/
├── src/
│   ├── components/
│   │   └── payment/
│   │       ├── StripeProvider.tsx      # NEW
│   │       ├── PaymentForm.tsx         # NEW
│   │       └── PaymentButton.tsx       # NEW
│   ├── hooks/
│   │   └── useStripePayment.ts         # NEW
│   ├── lib/
│   │   └── stripe.ts                   # MODIFY
│   └── stores/
│       └── gacha.ts                    # MODIFY
```

---

**要件定義完了**: 次段階のテストケース設計に進みます。