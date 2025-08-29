# Stripe Elements 決済実装ドキュメント

## 📋 実装決定事項

**決済方式**: **Stripe Elements** を選択
**決定日**: 2025-08-28
**理由**: こえポン！のガチャ購入フローに最適なUX・技術的柔軟性を提供

## 🎯 選択根拠

### こえポン！の決済要件
- ガチャ購入（100円/1000円）の即座決済
- ユーザーがサイト内で完結する体験
- 複数回の連続購入が発生する可能性
- ユーザー情報・購入履歴の管理が必要

### 3つの選択肢比較結果

| 方式 | 適合度 | 理由 |
|------|--------|------|
| **Payment Links** | ❌ 不適合 | リンク共有型でガチャの即時購入に不向き |
| **Checkout (リダイレクト)** | ❌ 不適合 | UX断絶、外部ページ遷移 |
| **Checkout (埋め込み)** | ⚠️ 部分適合 | 埋め込み可能だが柔軟性に限界 |
| **Elements** | ✅ **最適** | サイト内完結、フルカスタマイズ対応 |

## 🚀 実装方針

### アーキテクチャ
```
[ガチャ詳細ページ] → [Stripe Elements] → [Payment Intent] → [ガチャ抽選]
       ↓                    ↓                    ↓            ↓
   UIカスタム設計      決済フォーム埋め込み    バックエンド連携   結果表示
```

### 技術スタック
- **フロントエンド**: `@stripe/stripe-js` + `@stripe/react-stripe-js`
- **バックエンド**: 既存のStripe PaymentService (NestJS)
- **決済フロー**: Payment Intent方式

## 📦 必要なパッケージ

### フロントエンド
```bash
cd client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### バックエンド
```bash
# 既にインストール済み
npm list stripe  # stripe@^18.4.0
```

## 🛠️ 実装プラン

### Phase 1: 基本実装
1. Stripe Elements コンポーネント作成
2. Payment Intent API連携
3. 決済成功時のガチャ抽選連携

### Phase 2: UX向上
1. ローディング状態の最適化
2. エラーハンドリングの改善
3. 複数決済手段対応（Apple Pay等）

### Phase 3: 本番対応
1. Webhookイベント処理
2. セキュリティ検証
3. パフォーマンス最適化

## 💡 実装の優位性

### 1. UX面での優位性
```jsx
// ガチャ詳細画面内で完結
<GachaDetail>
  <GachaPriceCard>
    <StripeElements>
      <CardElement />
      <PaymentButton>¥100で購入</PaymentButton>
    </StripeElements>
  </GachaPriceCard>
</GachaDetail>
```

### 2. 技術面での柔軟性
- ✅ カスタムデザイン完全対応
- ✅ リアルタイムバリデーション  
- ✅ 複数決済手段対応（カード・Apple Pay・Google Pay）
- ✅ ワンクリック決済（保存済みカード）

### 3. ビジネス要件への適合
- ✅ **連続購入**: 同じページで10連→単発が可能
- ✅ **履歴管理**: 決済とガチャ結果の紐付けが容易
- ✅ **エラー処理**: きめ細かいエラーハンドリング
- ✅ **ローディング**: 決済中・抽選中の状態表示

## 🔄 既存実装との統合

### 現在の状況
```typescript
// src/stores/gacha.ts (モック実装)
// モック決済処理（高速化）
await new Promise(resolve => setTimeout(resolve, 200))
const payment = {
  success: true,
  id: `pi_mock_${Date.now()}`
}
```

### 実装後
```typescript
// Stripe Elements実装
const handlePayment = async () => {
  const { error, paymentIntent } = await stripe.confirmCardPayment(
    clientSecret,
    { payment_method: { card: elements.getElement(CardElement) } }
  )
  
  if (!error) {
    // ガチャ抽選実行
    await executeGacha(paymentIntent.id)
  }
}
```

## 🔐 セキュリティ考慮事項

### PCI DSS準拠
- Stripe Elementsによる自動PCI準拠
- カード情報は直接サーバーに送信されない
- トークン化による安全な処理

### CSP対応
```html
<meta http-equiv="Content-Security-Policy" 
      content="connect-src 'self' https://api.stripe.com;">
```

## 📊 パフォーマンス考慮事項

### 遅延読み込み
```typescript
// Stripeスクリプトの動的読み込み
const stripePromise = loadStripe(publishableKey)
```

### バンドルサイズ最適化
- Elements必要分のみインポート
- Tree shaking対応

## 🧪 テスト戦略

### 単体テスト
- Elements コンポーネントのレンダリング
- 決済フロー状態管理
- エラーハンドリング

### 統合テスト  
- 決済→抽選→結果表示の完全フロー
- Webhook処理の検証

### E2Eテスト
- 実際の決済フロー（テストモード）
- 複数ブラウザでの動作確認

## 🚀 デプロイメント

### 環境変数
```bash
# フロントエンド
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# バックエンド  
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 本番チェックリスト
- [ ] Stripeアカウント本番モード設定
- [ ] Webhook エンドポイント設定
- [ ] CSP ヘッダー設定
- [ ] SSL証明書確認
- [ ] 決済テスト実行

## 📈 将来の拡張性

### 追加決済手段
- Apple Pay / Google Pay
- JCB / Amex 対応
- コンビニ決済（将来検討）

### 国際化対応
- 多通貨対応
- 地域別決済手段

### サブスクリプション
- 月額課金の可能性
- 定期購入機能

## 📞 サポート・トラブルシューティング

### よくある問題
1. **Payment Intent作成失敗** → API KEY確認
2. **決済完了後にガチャが実行されない** → Webhook設定確認  
3. **カード情報入力エラー** → Elements設定確認

### デバッグ方法
```typescript
// Stripe Elements デバッグ
elements.getElement(CardElement)?.on('ready', () => {
  console.log('Stripe Elements ready')
})
```

## 📝 関連ドキュメント

- [Stripe Elements 公式ドキュメント](https://stripe.com/docs/payments/elements)
- [React Stripe.js ガイド](https://stripe.com/docs/stripe-js/react)
- [Payment Intents API](https://stripe.com/docs/api/payment_intents)

---

**実装担当**: 開発チーム  
**最終更新**: 2025-08-28  
**ステータス**: 実装予定