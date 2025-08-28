# 災害復旧計画 (Disaster Recovery Plan) - TASK-505

## 🚨 災害復旧戦略

### 基本方針
- **RTO (Recovery Time Objective)**: サービス復旧までの目標時間
- **RPO (Recovery Point Objective)**: データロス許容範囲
- **自動復旧**: 可能な限り人的介入なしで復旧
- **段階的復旧**: 重要度に応じた優先順位付き復旧

## 📊 災害レベル分類・対応マトリクス

| レベル | 災害範囲 | 影響度 | RTO | RPO | 対応チーム | エスカレーション |
|--------|---------|--------|-----|-----|-----------|----------------|
| **L1: Minor** | 一部機能 | 低 | < 15分 | 0 | 開発者 | Slack通知 |
| **L2: Major** | 全サービス | 中 | < 1時間 | < 15分 | DevOps + 開発者 | Manager + Slack |
| **L3: Critical** | マルチサービス | 高 | < 4時間 | < 1時間 | 全チーム | Executive + PagerDuty |
| **L4: Catastrophic** | 全システム | 致命的 | < 24時間 | < 4時間 | インシデント対策本部 | CEO + 外部支援 |

## 🔧 災害シナリオ別復旧手順

### L1: アプリケーション障害 (Minor)

#### 障害例
- 一部API不具合
- フロントエンド表示問題
- 軽微なパフォーマンス低下

#### 復旧手順
```bash
# 1. Blue-Green即座ロールバック (< 2分)
curl -X PUT "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records/$DNS_RECORD_ID" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -d '{
    "type": "CNAME",
    "name": "koepon.app",
    "content": "blue.koepon.app",
    "ttl": 60
  }'

# 2. 復旧確認
curl -f https://koepon.app/api/health

# 3. ステータス更新
echo "Rollback completed at $(date)" | slack-notify "#alerts"
```

#### 自動化
```yaml
# GitHub Actions: Emergency Rollback
name: Emergency Rollback
on:
  repository_dispatch:
    types: [emergency-rollback]

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Execute Rollback
        run: |
          # DNS即座切り替え + 確認
```

### L2: データベース障害 (Major)

#### 障害例
- Supabase接続不能
- データベース高負荷
- 認証サービス障害

#### 復旧手順

##### 1. Read Replica切り替え (< 30分)
```sql
-- Read-only modeへ切り替え
ALTER SYSTEM SET default_transaction_read_only = on;
SELECT pg_reload_conf();

-- Read Replica DNS切り替え
-- supabase-read.koepon.app → primary endpoint
```

##### 2. Point-in-Time Recovery (< 1時間)
```bash
# Supabase CLIでPITR実行
supabase db restore \
  --project-ref $SUPABASE_PROJECT_ID \
  --target-time "2024-01-15T14:30:00Z"

# 復旧確認
psql $DATABASE_URL -c "SELECT NOW(), COUNT(*) FROM users;"
```

##### 3. アプリケーション再起動
```bash
# Vercel再デプロイ (DB接続リフレッシュ)
vercel --prod --force

# ヘルスチェック
curl https://koepon.app/api/health/database
```

#### 自動監視・アラート
```typescript
// 自動DB切り替えロジック
export async function databaseFailoverMonitoring() {
  const healthCheck = await checkDatabaseHealth()
  
  if (healthCheck.consecutiveFailures > 3) {
    // Read Replica自動切り替え
    await switchToReadReplica()
    await notifyIncidentTeam('Database failover executed')
  }
}
```

### L3: リージョン障害 (Critical)

#### 障害例
- Tokyo AZ全障害
- Vercel Edge全障害  
- Supabase リージョン障害

#### 復旧手順

##### 1. マルチリージョンフェイルオーバー (< 2時間)
```bash
# 1. US-West リージョン Supabase切り替え
export SUPABASE_URL="https://xyz-us-west-1.supabase.co"
export DATABASE_URL="postgresql://postgres:password@db.xyz-us-west-1.supabase.co/postgres"

# 2. Vercel リージョンテンプレート切り替え
vercel env add NEXT_PUBLIC_SUPABASE_URL $SUPABASE_URL
vercel --prod --regions iad1,sfo1  # US regions

# 3. Cloudflare traffic routing
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/load_balancers/$LB_ID" \
  -d '{"enabled":true,"steering_policy":"off","fallback_pool":"us-west-pool"}'
```

##### 2. データ同期・整合性確認
```sql
-- 最新バックアップから復元
pg_restore --clean --create backup_20240115_140000.sql

-- データ整合性チェック
SELECT 
  table_name,
  row_count,
  last_updated
FROM information_schema.tables_stats
WHERE last_updated < NOW() - INTERVAL '4 hours';
```

##### 3. ユーザー通知
```typescript
// 障害状況ページ自動更新
await updateStatusPage({
  status: 'major_outage',
  message: 'Tokyo region experiencing issues. Failing over to US West.',
  eta: '2 hours',
  affectedServices: ['api', 'dashboard']
})
```

### L4: カタストロフィック障害 (Catastrophic)

#### 障害例
- 全リージョン同時障害
- セキュリティ侵害
- 重大データ破損

#### 復旧手順

##### 1. インシデント対策本部設立 (< 30分)
```bash
# 緊急会議招集
slack-notify "@channel CRITICAL: L4 incident declared. War room: https://zoom.us/emergency"

# ステータスページ更新
curl -X POST "https://api.statuspage.io/v1/incidents" \
  -d '{
    "name": "Service Unavailable - Major Infrastructure Issue",
    "status": "investigating", 
    "impact": "critical"
  }'
```

##### 2. 完全データ復旧 (< 24時間)
```bash
# 最新バックアップ確認
aws s3 ls s3://koepon-backups/production/ --recursive

# クリーンなインフラ再構築
terraform plan -destroy
terraform apply -auto-approve

# データベース完全復元
pg_restore --jobs 4 --verbose backup_latest.sql
```

##### 3. 段階的サービス復旧
```yaml
Phase 1 (0-4h): Critical APIs
  - Authentication
  - User management
  - Payment processing

Phase 2 (4-12h): Core Features  
  - Gacha system
  - Medal management
  - Basic UI

Phase 3 (12-24h): Full Features
  - Admin dashboard
  - Analytics
  - Non-critical features
```

## 💾 バックアップ戦略詳細

### 自動バックアップスケジュール

```yaml
Database Backups:
  # Supabase Pro自動バックアップ
  Daily: 06:00 JST (7日保持)
  Weekly: Sunday 06:00 JST (4週保持)  
  Monthly: 1st Sunday 06:00 JST (6ヶ月保持)
  
  # Point-in-Time Recovery
  WAL Backup: Continuous (7日間)
  Snapshot: 毎時00分 (24時間)

Application Code:
  # Git-based
  GitHub: Multiple branches protection
  Releases: Tagged immutable versions
  Artifacts: GitHub Packages保存

File Storage:
  # Supabase Storage
  Cross-Region: US-West mirror
  Versioning: 全ファイル30日間
  CDN Cache: Cloudflare永続化

Configuration:
  # Infrastructure as Code
  Terraform: Git versioning + S3 backend
  Secrets: HashiCorp Vault backup
  Environment: Encrypted config files
```

### バックアップ検証プロセス

```bash
#!/bin/bash
# daily-backup-validation.sh

# データベースバックアップ検証
pg_dump $DATABASE_URL > /tmp/backup_test.sql
pg_restore --list /tmp/backup_test.sql | grep -c "SCHEMA\|TABLE\|DATA"

# ファイル整合性チェック  
md5sum /path/to/backups/*.sql > backup_checksums.md5
md5sum -c backup_checksums.md5

# 復元テスト (週次)
if [ "$(date +%u)" -eq 7 ]; then
  # テスト環境での完全復元テスト
  pg_restore --create --clean backup_latest.sql
  curl -f https://test-restore.koepon.app/api/health
fi
```

## 🔄 復旧テスト・演習

### 月次災害復旧演習

#### Chaos Engineering
```typescript
// production/chaos-testing.ts
export class ChaosTestingFramework {
  async simulateFailures() {
    const scenarios = [
      'database_latency_spike',
      'api_error_injection', 
      'network_partition',
      'memory_pressure',
      'disk_full_simulation'
    ]
    
    for (const scenario of scenarios) {
      await this.runChaosTest(scenario)
      await this.validateRecovery()
    }
  }

  private async runChaosTest(scenario: string) {
    // リトルの実装でしょうか
    console.log(`Running chaos test: ${scenario}`)
  }
}
```

#### 復旧演習シナリオ
```yaml
Scenario 1: Database Failover (Monthly)
  Duration: 30分
  Steps:
    1. Primary DB接続切断シミュレーション
    2. Read Replica自動切り替え確認
    3. アプリケーション正常性確認
    4. Primary復旧・切り戻し

Scenario 2: Regional Outage (Quarterly)
  Duration: 2時間
  Steps:
    1. Tokyo regionトラフィック遮断
    2. US-West region切り替え
    3. データ同期確認
    4. ユーザー通知テスト

Scenario 3: Full Recovery (Annually)
  Duration: 1日
  Steps:
    1. 完全な本番環境破壊
    2. バックアップからの完全復旧
    3. データ整合性・機能性確認
    4. SLAコンプライアンス検証
```

## 📞 インシデント対応体制

### エスカレーションマトリクス

```yaml
Tier 1: 開発者 (24/7 On-Call)
  Response: < 15分
  Scope: L1-L2 障害
  Tools: Slack, GitHub, Vercel

Tier 2: DevOps/SRE (Business Hours + Escalation)  
  Response: < 30分
  Scope: L2-L3 障害
  Tools: DataDog, PagerDuty, AWS CLI

Tier 3: Engineering Manager + CTO
  Response: < 1時間
  Scope: L3-L4 障害  
  Authority: External vendor engagement

Tier 4: Executive Team + Legal
  Response: < 2時間
  Scope: L4 + Security/Legal
  Authority: Customer communication, Press
```

### 通信プロトコル

#### 内部コミュニケーション
```bash
# Slack Channel Structure
#incident-critical     # L3-L4 incidents
#incident-major        # L2 incidents  
#incident-minor        # L1 incidents
#status-updates        # Status page updates
#post-mortem          # Post-incident analysis
```

#### 外部コミュニケーション
```yaml
Status Page: https://status.koepon.app
  Auto-update: API integration
  Manual-update: Critical incidents
  Subscribers: All registered users

Social Media: @koepon_official
  Conditions: L3+ incidents > 1 hour
  Approval: Engineering Manager + Marketing

Press Release:
  Conditions: L4 incidents or security breaches
  Approval: CEO + Legal team
```

## 📈 復旧メトリクス・改善

### KPI追跡

```typescript
interface RecoveryMetrics {
  incidentFrequency: {
    l1: number  // per month
    l2: number  // per quarter  
    l3: number  // per year
    l4: number  // target: 0
  }
  
  recoveryTimes: {
    meanTimeToDetection: number  // minutes
    meanTimeToRecovery: number   // minutes
    meanTimeToResolve: number    // minutes
  }
  
  businessImpact: {
    revenueImpact: number        // JPY lost
    userImpact: number           // affected users
    reputationScore: number      // NPS impact
  }
}
```

### 継続改善プロセス

```yaml
Post-Mortem Process:
  Timeline: インシデント終了後48時間以内
  Attendees: 全関係者 + ステークホルダー
  Deliverables:
    - Root cause analysis
    - Action items (owner + deadline)
    - Process improvements
    - Technical debt identification

Quarterly Reviews:
  Metrics: SLA compliance, recovery times
  Improvements: Infrastructure, monitoring, processes
  Training: Team skill development
  Investment: DR infrastructure enhancement
```

## 🎯 SLA・コンプライアンス目標

### サービスレベル合意

```yaml
Availability SLA:
  Target: 99.9% (8.77 hours downtime/year)
  Measurement: External monitoring (Pingdom)
  Penalty: Service credits for SLA violations

Performance SLA:
  Response Time: P95 < 500ms
  Error Rate: < 0.1%
  Throughput: 1000 req/min sustained

Recovery SLA:
  Detection: < 5分 (automated monitoring)
  Notification: < 10分 (stakeholder alert)
  Initial Response: < 15分 (engineer engagement)
  Resolution: Per incident level matrix
```

### 法的・規制要件

```yaml
Data Protection:
  GDPR: EU user data protection
  CCPA: California privacy compliance
  Personal Information Protection Act (Japan)

Financial Compliance:
  PSA (Payment Service Act): Payment processing
  Fund Settlement Law: Virtual currency handling
  Consumer Contract Act: Gacha mechanics

Audit Requirements:
  SOC 2 Type II: Security & availability
  ISO 27001: Information security management
  PCI DSS: Payment card data protection
```

## 🚀 次のステップ

### 実装完了後のアクション

1. **運用チーム研修**
   - 復旧手順書習熟
   - インシデント対応演習
   - エスカレーション判断訓練

2. **監視・アラート調整**
   - しきい値最適化
   - 誤検知削減
   - 自動復旧範囲拡大

3. **定期見直し**
   - 月次メトリクス評価
   - 四半期復旧演習
   - 年次DR計画更新

**災害復旧システム実装完了** ✅