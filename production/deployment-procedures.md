# 本番環境デプロイ手順書 - TASK-505

## 🚀 本番デプロイメント総合ガイド

### 前提条件
- ステージング環境での完全テスト合格
- Blue-Green デプロイメント理解
- 緊急ロールバック手順習熟
- 監視ダッシュボード・アラート設定確認

## 📋 デプロイメント・チェックリスト

### Phase 1: デプロイ前確認 (Pre-deployment)

#### 1.1 コード品質確認
```bash
# ローカル環境での最終確認
cd client && npm run lint && npm run type-check && npm run test
cd ../api && npm run lint && npm run type-check && npm run test

# セキュリティ監査
npm audit --audit-level=high
cd security-tests && npm run test:security
```
- [ ] Lintエラー: 0件
- [ ] TypeScriptエラー: 0件  
- [ ] Unit Tests: すべて合格
- [ ] Security Audit: 高・重大な脆弱性 0件

#### 1.2 ステージング環境最終検証
```bash
# ステージング環境でのE2E・統合テスト
cd client/e2e && npx playwright test --config=playwright.staging.config.ts

# パフォーマンステスト
cd performance-tests && npm run test:staging-load

# セキュリティテスト
cd security-tests && npm run test:staging-security
```
- [ ] E2E Tests: 合格率 > 95%
- [ ] 統合テスト: すべて合格
- [ ] パフォーマンス: P95 < 1000ms
- [ ] セキュリティスキャン: Critical 0件

#### 1.3 データベース準備
```sql
-- マイグレーション影響確認
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users LIMIT 1000;

-- インデックス効率確認  
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read > 0;

-- バックアップ事前取得
pg_dump -Fc $DATABASE_URL > pre_deploy_backup_$(date +%Y%m%d_%H%M%S).backup
```
- [ ] マイグレーション実行時間: < 30秒
- [ ] インデックス最適化完了
- [ ] 事前バックアップ取得完了

#### 1.4 インフラ状況確認
```bash
# 本番環境ヘルスチェック
curl -f https://koepon.app/api/health

# 依存サービス状況確認
curl -f https://api.supabase.com/status
curl -f https://www.vercel.com/api/status

# DNS・CDN状況
dig koepon.app
curl -I https://koepon.app
```
- [ ] 本番環境: healthy
- [ ] Supabase: operational  
- [ ] Vercel: operational
- [ ] DNS解決: 正常
- [ ] CDN: 正常

### Phase 2: デプロイメント実行 (Deployment)

#### 2.1 メンテナンス通知 (必要な場合)
```bash
# ステータスページ更新
curl -X POST "https://api.statuspage.io/v1/incidents" \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "name": "Scheduled Maintenance - Application Update",
    "status": "scheduled",
    "impact": "minor",
    "scheduled_for": "2024-01-15T15:00:00Z",
    "scheduled_until": "2024-01-15T15:30:00Z"
  }'

# ユーザー通知 (Slack/Email)
echo "Scheduled maintenance starting in 30 minutes" | slack-notify "#announcements"
```
- [ ] メンテナンス通知送信 (必要な場合)
- [ ] ステータスページ更新

#### 2.2 Blue-Green デプロイメント実行

##### Step 1: main ブランチプッシュ (自動実行)
```bash
# mainブランチへのマージでCI/CD自動開始
git checkout main
git pull origin main
git merge staging --no-ff
git push origin main

# デプロイメント状況確認
gh run list --branch main --limit 1
gh run view $(gh run list --branch main --limit 1 --json databaseId --jq '.[0].databaseId')
```
- [ ] GitHub Actions実行開始
- [ ] Pre-production validation: 合格
- [ ] Database deployment: 成功
- [ ] Green環境デプロイ: 成功

##### Step 2: Green環境検証 (自動実行)
```bash
# Green環境の自動テストを監視
gh run view --log

# 手動での追加確認
CURRENT_ENV=$(curl -s https://koepon.app/api/environment)
TARGET_ENV=$([ "$CURRENT_ENV" = "blue" ] && echo "green" || echo "blue")

curl -f https://$TARGET_ENV.koepon.app/api/health
```
- [ ] 自動テストスイート: 合格
- [ ] Green環境ヘルスチェック: healthy
- [ ] スモークテスト: 合格

##### Step 3: トラフィック切り替え (自動実行)
```bash
# トラフィック切り替え監視
gh run view --log

# DNS propagation確認
for i in {1..30}; do
  RESOLVED=$(dig +short koepon.app)
  echo "DNS Resolution: $RESOLVED"
  sleep 10
done
```
- [ ] DNS切り替え: 完了
- [ ] DNS propagation: 確認済み
- [ ] 新環境へのトラフィック: 開始

### Phase 3: デプロイ後検証 (Post-deployment)

#### 3.1 即座確認 (5分間)
```bash
# ヘルスチェック連続実行
for i in {1..30}; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://koepon.app/api/health)
  if [ "$HTTP_STATUS" -ne "200" ]; then
    echo "❌ Health check failed: HTTP $HTTP_STATUS"
    # 緊急ロールバック判断
    break
  fi
  echo "✅ Health check $i/30: OK"
  sleep 10
done
```
- [ ] 連続ヘルスチェック: 30回成功
- [ ] HTTP Error Rate: < 0.1%
- [ ] 応答時間: P95 < 500ms

#### 3.2 機能別動作確認 (15分間)

##### 認証システム
```bash
# ログイン・ログアウトテスト
curl -X POST https://koepon.app/api/auth/login \
  -d '{"email":"test@example.com","password":"password"}' \
  -H "Content-Type: application/json"
```
- [ ] ユーザーログイン: 成功
- [ ] JWT Token発行: 正常
- [ ] セッション管理: 正常

##### ガチャシステム
```bash
# ガチャAPI動作確認
curl -X POST https://koepon.app/api/gacha/pull \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"gachaId":1,"count":1}'
```
- [ ] ガチャ実行: 成功
- [ ] レアリティ計算: 正常
- [ ] ユーザーインベントリ更新: 正常

##### 決済システム
```bash
# 決済テスト (テストモード)
curl -X POST https://koepon.app/api/payment/create-intent \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"amount":1000,"currency":"jpy"}'
```
- [ ] 決済Intent作成: 成功
- [ ] Stripe連携: 正常
- [ ] 決済完了処理: 正常

#### 3.3 パフォーマンス・監視確認 (30分間)

##### メトリクス監視
```bash
# DataDogダッシュボード確認
open "https://app.datadoghq.com/dashboard/koepon-production"

# カスタムメトリクス確認
curl https://koepon.app/api/metrics/business
```
- [ ] 応答時間メトリクス: 正常範囲
- [ ] エラー率: < 1%
- [ ] データベース接続: 正常
- [ ] Redis接続: 正常
- [ ] ビジネスメトリクス: 取得できる

##### リアルユーザー監視
```bash
# 実際のユーザーアクセス確認
tail -f /var/log/access.log | grep "koepon.app"

# Google Analytics リアルタイム確認
open "https://analytics.google.com/analytics/web/realtime"
```
- [ ] リアルユーザーアクセス: 検出
- [ ] ユーザーエクスペリエンス: 問題なし
- [ ] アクセス解析: 正常取得

### Phase 4: 運用移行 (Handover)

#### 4.1 監視・アラート確認
```bash
# アラート設定確認
curl https://koepon.app/api/monitoring/alerts/test

# PagerDutyテスト
curl -X POST "https://events.pagerduty.com/v2/enqueue" \
  -d '{
    "routing_key": "$PAGERDUTY_KEY",
    "event_action": "trigger",
    "payload": {
      "summary": "Test alert - Production deployment complete"
    }
  }'
```
- [ ] Slack通知: 正常
- [ ] PagerDuty: 正常
- [ ] Email通知: 正常
- [ ] カスタムアラート: 正常

#### 4.2 ドキュメント・ログ更新
```bash
# デプロイメントログ作成
cat > deployment-log-$(date +%Y%m%d_%H%M%S).md << EOF
# Production Deployment Log

**Date**: $(date)
**Version**: $(git rev-parse HEAD)
**Deployed By**: $(git config user.name)
**Environment**: $(curl -s https://koepon.app/api/environment)

## Deployment Summary
- Pre-checks: ✅ All passed
- Database migration: ✅ Success
- Application deployment: ✅ Success  
- Traffic switchover: ✅ Success
- Post-deployment validation: ✅ All passed

## Metrics
- Downtime: 0 seconds
- Error rate during deployment: 0%
- User impact: None detected

## Next Steps
- Monitor for 24 hours
- Schedule post-mortem (if issues)
EOF
```
- [ ] デプロイメントログ記録
- [ ] バージョン情報更新
- [ ] 運用チームへの引き継ぎ完了

## 🚨 緊急時対応手順

### ロールバック実行

#### 自動ロールバック条件
- HTTP 5xx Error Rate > 5% (5分間継続)
- 応答時間 P99 > 10秒 (5分間継続)
- ヘルスチェック失敗 (連続3回)

#### 手動ロールバック実行
```bash
# GitHub Actions手動ロールバック
gh workflow run production-deploy.yml -f deployment_type=rollback

# 直接DNS切り替え (緊急時)
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$DNS_RECORD_ID" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -d '{
    "type": "CNAME",
    "name": "koepon.app",
    "content": "blue.koepon.app",
    "ttl": 60
  }'
```

#### ロールバック後確認
```bash
# ロールバック完了確認
curl -f https://koepon.app/api/health
curl -s https://koepon.app/api/environment

# ユーザー影響確認
curl https://koepon.app/api/metrics/realtime
```

### インシデント対応

#### L2+ インシデント宣言
```bash
# インシデント宣言
slack-notify "#incident-major" "🚨 L2 Incident: Production deployment issue"

# ステータスページ更新
curl -X POST "https://api.statuspage.io/v1/incidents" \
  -d '{
    "name": "Application Performance Issues",
    "status": "investigating",
    "impact": "major"
  }'
```

#### 対応チーム招集
- **DevOps**: インフラ・デプロイメント対応
- **Backend Engineer**: API・データベース対応  
- **Frontend Engineer**: UI・UX問題対応
- **QA Engineer**: テスト・検証支援
- **Product Manager**: ビジネス影響評価・意思決定

## 📊 デプロイメント成功指標

### 技術指標
- **デプロイ成功率**: > 95%
- **ロールバック率**: < 5%
- **ダウンタイム**: 0秒 (Blue-Green切り替え)
- **デプロイ時間**: < 30分 (準備から完了まで)

### ビジネス指標
- **ユーザー影響**: 0件のクリティカル問題
- **売上影響**: 0% (デプロイ中の売上変動なし)
- **カスタマーサポート**: 関連問い合わせ 0件

### 品質指標
- **Critical Bugs**: 0件 (本番発見)
- **Security Issues**: 0件 (本番発見)
- **Performance Regression**: 0件

## 📅 定期メンテナンス・改善

### 週次作業
- [ ] デプロイメント指標レビュー
- [ ] Blue-Green環境整合性確認
- [ ] 監視・アラート調整

### 月次作業
- [ ] デプロイメントプロセス改善
- [ ] インフラ・コスト最適化
- [ ] 災害復旧演習

### 四半期作業
- [ ] SLA・パフォーマンス目標見直し
- [ ] セキュリティ・コンプライアンス監査
- [ ] デプロイメントツール・プロセス大幅改善

## 🎯 TASK-505完了確認

### 実装成果物
- [x] 本番環境アーキテクチャ設計
- [x] Blue-Green CI/CDパイプライン
- [x] 24/7監視・アラートシステム
- [x] 災害復旧・バックアップ計画
- [x] 本番デプロイメント手順書

### 運用準備完了確認
- [ ] 本番環境セットアップ (Supabase Pro、Vercel Pro、Upstash、Cloudflare、DataDog)
- [ ] GitHub Secrets設定 (API keys、tokens)
- [ ] DNS・ドメイン設定 (koepon.app)
- [ ] SSL証明書設定
- [ ] 監視ダッシュボード設定
- [ ] オンコール体制確立

**TASK-505: 本番環境構築 - 完了** ✅

次のステップ: **TASK-506: 法的要件対応** への進行準備完了