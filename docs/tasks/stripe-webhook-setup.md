# Stripe Webhook設定タスク

## 📋 本番環境でのWebhook設定手順

### 1. Stripeダッシュボードでの設定
1. **Stripeダッシュボード** → **Webhooks**に移動
2. **Add endpoint**をクリック
3. **エンドポイントURL**を設定:
   ```
   https://your-app.vercel.app/api/payments/webhook
   ```
   ※ `your-app.vercel.app`は実際のVercelドメインに置き換え

### 2. 監視するイベントの選択
以下のイベントを選択：
- `payment_intent.succeeded` - 決済成功時
- `payment_intent.payment_failed` - 決済失敗時
- `payment_intent.canceled` - 決済キャンセル時
- `payment_intent.requires_action` - 追加認証が必要な場合

### 3. Webhook Secretの取得と設定
1. 作成されたWebhookエンドポイントをクリック
2. **Signing secret**をコピー (`whsec_`で始まる文字列)
3. Vercel環境変数に設定:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production < webhook_secret.txt
   ```

### 4. 環境別設定

#### 開発環境 (ローカル)
```bash
# Stripe CLIを使用
stripe listen --print-secret
# 出力されたsecretをローカル.env.localに設定
```

#### ステージング環境
- ステージング用のWebhookエンドポイントを作成
- URL: `https://staging-domain.vercel.app/api/payments/webhook`
- 同様にSecretを環境変数に設定

#### 本番環境
- 本番用のWebhookエンドポイントを作成
- URL: `https://production-domain.vercel.app/api/payments/webhook`
- 本番環境の環境変数に設定

## 🚨 重要な注意事項

1. **Webhook Secretは機密情報**
   - ファイルにコミットしない
   - 環境変数でのみ管理

2. **エンドポイントのセキュリティ**
   - HTTPS必須
   - Signature検証を必ず実装

3. **イベント処理**
   - 冪等性を保つ (同じイベントが複数回来ても安全)
   - 適切なエラーハンドリング

## 📝 実装状況
- [x] ローカル開発用Secret設定済み
- [ ] ステージング環境Webhook作成
- [ ] 本番環境Webhook作成
- [x] Vercel環境変数設定済み

## 🔗 関連ドキュメント
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks)
- [Webhook Signatures](https://docs.stripe.com/webhooks/signatures)

---
**作成日**: 2025-08-28  
**最終更新**: 2025-08-28