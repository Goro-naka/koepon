# TASK-504: ステージング環境構築 - 設計仕様書

## 概要

こえポン！アプリケーションのステージング環境を構築し、本番環境リリース前の品質保証を行うための環境を整備する。develop→staging→productionの3段階デプロイパイプラインを実現する。

## ステージング環境の目的

### 1. 品質保証
- **統合テスト**: 本番同等環境でのエンドツーエンドテスト
- **パフォーマンステスト**: NFR要件の最終検証
- **セキュリティテスト**: OWASP基準でのセキュリティ監査
- **回帰テスト**: 既存機能への影響確認

### 2. ユーザー受け入れテスト (UAT)
- **ステークホルダー検証**: PO・デザイナーによる機能確認
- **ビジネス検証**: 実際の業務フローでの動作確認
- **UX検証**: 実環境でのユーザビリティテスト

### 3. 運用リハーサル
- **デプロイ手順検証**: 本番デプロイの事前確認
- **障害対応訓練**: 障害シミュレーション・復旧訓練
- **パフォーマンス調整**: 本番投入前の最終チューニング

## アーキテクチャ設計

### 1. インフラ構成 (AWS)

#### ネットワーク構成
```yaml
# Staging VPC Configuration
VPC: koepon-staging-vpc
CIDR: 10.1.0.0/16
Region: ap-northeast-1

Subnets:
  Public:
    koepon-staging-public-1a: 10.1.1.0/24
    koepon-staging-public-1c: 10.1.2.0/24
  Private:
    koepon-staging-private-1a: 10.1.11.0/24
    koepon-staging-private-1c: 10.1.12.0/24

Internet Gateway: koepon-staging-igw
NAT Gateway: koepon-staging-nat-1a
```

#### コンピュートリソース
```yaml
# EKS Cluster Configuration
EKS Cluster: koepon-staging
Version: 1.28
Endpoint: Private + Public
Node Groups:
  koepon-staging-app-nodes:
    Instance Type: t3.small (2vCPU, 2GB RAM) # 本番より小さくコスト削減
    Min Size: 1
    Max Size: 5
    Desired: 2
    Spot Instances: 50% # コスト最適化
```

#### データベース・キャッシュ
```yaml
# Supabase PostgreSQL (Staging)
Supabase Project: koepon-staging
  Database: PostgreSQL 15
  Region: ap-northeast-1 (Tokyo)
  Plan: Pro Plan (Staging用)
  Connection Pooling: Enabled
  Row Level Security: Enabled
  Real-time: Enabled for specific tables
  
# Upstash Redis (Staging)
Upstash Redis: 
  Instance: koepon-staging-redis
  Region: ap-northeast-1
  Plan: Pay as you Scale
  TLS: Enabled
  Connection Pooling: Enabled
```

### 2. CI/CD パイプライン設計

#### 3段階デプロイフロー
```yaml
# GitHub Branches Strategy
Branches:
  develop:
    Description: 開発ブランチ
    Deploy To: なし (ローカル開発のみ)
    
  staging:
    Description: ステージング環境用ブランチ
    Deploy To: Staging Environment
    Trigger: develop→staging PR マージ時
    
  main:
    Description: 本番環境用ブランチ  
    Deploy To: Production Environment
    Trigger: staging→main PR マージ時 (UAT承認後)
```

#### Staging デプロイパイプライン
```yaml
# .github/workflows/staging-deploy.yml
name: Staging Deployment

on:
  push:
    branches: [staging]
  pull_request:
    branches: [staging]

jobs:
  test-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Unit Tests
        run: cd client && npm run test
        
      - name: Security Tests
        run: cd security-tests && npm run test:security
        
      - name: Performance Tests (Light)
        run: cd performance-tests && npm run test:api
        
  deploy-to-staging:
    needs: test-suite
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    
    steps:
      - name: Deploy to Staging EKS
        run: |
          aws eks update-kubeconfig --region ap-northeast-1 --name koepon-staging
          
          # Deploy application
          kubectl set image deployment/koepon-app koepon-app=$ECR_REGISTRY/$ECR_REPOSITORY:staging-${{ github.sha }} -n staging
          kubectl rollout status deployment/koepon-app -n staging --timeout=300s
          
          # Run smoke tests
          curl -f https://staging.koepon.com/api/health || exit 1
          
  integration-tests:
    needs: deploy-to-staging
    runs-on: ubuntu-latest
    
    steps:
      - name: Run E2E Tests
        run: |
          cd client/e2e
          npx playwright test --config=playwright.staging.config.ts
          
      - name: Run Performance Tests (Full)
        run: |
          cd performance-tests  
          node staging-performance-validation.js
          
      - name: Run Security Scan
        run: |
          cd security-tests
          npm run test:staging-security
          
  notify-stakeholders:
    needs: integration-tests
    runs-on: ubuntu-latest
    if: success()
    
    steps:
      - name: Notify Staging Ready
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: "🎉 Staging deployment successful! Ready for UAT: https://staging.koepon.com"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. ステージング専用設定

#### 環境変数・設定
```yaml
# Staging Environment Variables
Environment Variables:
  NODE_ENV: staging
  BASE_URL: https://staging.koepon.com
  NEXT_PUBLIC_SUPABASE_URL: https://koepon-staging.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  REDIS_URL: rediss://default:password@koepon-staging-redis.upstash.io:6379
  
  # Feature Flags for Testing
  FEATURE_NEW_GACHA_UI: true
  FEATURE_ENHANCED_MEDALS: true
  DEBUG_MODE: true
  LOG_LEVEL: debug
  
  # Test Data Settings
  SEED_TEST_DATA: true
  ALLOW_TEST_USERS: true
  MOCK_PAYMENT: true # 実際の決済は行わない
```

#### テストデータ設定
```yaml
# Staging Test Data
Test Users:
  - email: staging-admin@example.com
    role: admin
    medals: 100000
    
  - email: staging-vtuber@example.com  
    role: vtuber
    medals: 50000
    
  - email: staging-user@example.com
    role: user
    medals: 5000

Test Gachas:
  - id: staging-basic-gacha
    name: ステージングテスト基本ガチャ
    cost: 100
    items: [test voice packs...]
    
Test VTubers:
  - name: テスト VTuber A
    status: approved
    files: [test audio files...]
```

### 4. 監視・品質管理

#### ステージング専用監視
```yaml
# CloudWatch Alarms (Staging)
Staging Alarms:
  - Name: staging-app-errors
    Threshold: 5 # 本番より緩い基準
    Actions: [Slack notification]
    
  - Name: staging-response-time
    Threshold: 5000ms # 本番より緩い
    Actions: [Slack notification]
    
# Grafana Dashboards
Staging Dashboards:
  - staging-application-health
  - staging-performance-metrics
  - staging-test-results
```

#### 品質ゲート
```yaml
# Quality Gates for Staging→Production
Quality Gates:
  Performance:
    API Response P95: <3000ms
    Page Load P95: <5000ms
    Error Rate: <1%
    
  Security:
    OWASP ZAP: No High/Critical findings
    Dependency Scan: No High/Critical CVEs
    
  Functionality:
    E2E Test Pass Rate: >98%
    Unit Test Coverage: >85%
    Integration Test Pass Rate: >95%
    
  UAT Approval:
    PO Sign-off: Required
    Design Review: Required
    Business Logic Validation: Required
```

### 5. UAT (ユーザー受け入れテスト) 支援

#### UAT環境設定
```yaml
# UAT Access Configuration  
UAT Users:
  Stakeholders:
    - Product Owner
    - UI/UX Designer
    - Business Analyst
    - QA Lead
    
Access Control:
  Authentication: Azure AD/Google OAuth
  Session Duration: 8 hours
  IP Restrictions: Office network + VPN
  
UAT Tools:
  - Test Case Management: TestRail integration
  - Bug Reporting: Jira integration
  - Feedback Collection: Built-in feedback widget
  - Screen Recording: Loom/CloudApp integration
```

#### UAT支援機能
```yaml
# Built-in UAT Support Features
UAT Features:
  Debug Panel:
    - Current user information
    - Feature flags status
    - API response times
    - Database query logs
    
  Test Data Management:
    - Reset user data
    - Generate test scenarios
    - Mock external services
    
  Feedback System:
    - Visual bug reporting (screenshot + annotation)
    - Feature feedback forms
    - Performance issue reporting
    
  Testing Utilities:
    - Time travel (simulate different dates)
    - User role switching
    - API response simulation
```

## コスト最適化

### ステージング環境コスト削減策
```yaml
# Cost Optimization Strategies
Compute Optimization:
  Spot Instances: 70% of EKS compute resources  
  Scheduled Scaling: Auto-stop outside business hours (21:00-09:00)
  Right-sizing: t3.small/micro instances
  
Database Optimization (Supabase):
  Plan: Pro Plan ($25/month) - Staging用
  Connection pooling: Enabled for efficiency
  Automated backups: 7 days retention
  
Cache Optimization (Upstash):
  Plan: Pay as you Scale ($0.2/100K requests)
  Auto-scaling: Based on usage
  
Storage Optimization:
  S3 Intelligent Tiering: Automatic cost optimization
  Log retention: 14 days (vs 30 days in production)
  
Estimated Monthly Cost: $150-300
  - EKS: $100-200
  - Supabase: $25
  - Upstash Redis: $10-30  
  - S3 + CloudFront: $15-45
(vs Production estimated: $500-800)
```

## セキュリティ設定

### ステージング専用セキュリティ
```yaml
# Security Configuration
Network Security:
  WAF: AWS WAF with OWASP rules
  SSL/TLS: Let's Encrypt certificate
  VPC Peering: Connection to shared services
  
Access Control:
  IAM Roles: Staging-specific permissions
  Service Accounts: Limited to staging resources
  Secrets: AWS Parameter Store (staging namespace)
  
Data Protection:
  Database Encryption: At rest + in transit
  Backups: Encrypted with staging keys
  Log Encryption: CloudWatch Logs encryption
```

## 運用手順

### 1. デプロイ手順
```bash
# 1. Feature開発完了後
git checkout develop
git pull origin develop

# 2. Staging向けPR作成
git checkout -b feature/staging-release-v1.x
git push origin feature/staging-release-v1.x

# 3. develop→staging PR マージ
# (自動的にステージング環境にデプロイ)

# 4. UAT実施・承認

# 5. staging→main PR作成・マージ
# (本番環境へのデプロイ)
```

### 2. UAT実施手順
```yaml
# UAT Process
Phase 1: Functional Testing (1-2 days)
  - Feature acceptance testing
  - Regression testing
  - Cross-browser testing
  
Phase 2: Performance Testing (1 day)  
  - Load testing execution
  - Performance regression check
  - Database performance validation
  
Phase 3: Security Testing (1 day)
  - Security scan execution
  - Penetration testing
  - Compliance check
  
Phase 4: Business Validation (1 day)
  - Business logic validation
  - Workflow testing
  - Data integrity check
  
Phase 5: Sign-off (0.5 day)
  - Stakeholder approval
  - Production deployment approval
```

### 3. 障害対応手順
```yaml
# Staging Issue Response
Issue Types:
  P1 (Critical): UAT blocking, data corruption
    Response: 1 hour
    Resolution: 4 hours
    
  P2 (High): Feature not working, performance issue
    Response: 4 hours  
    Resolution: 1 business day
    
  P3 (Medium): Minor bugs, UI issues
    Response: 1 business day
    Resolution: 3 business days
```

## 受け入れ基準

### 機能要件
- ✅ ステージング環境が正常にデプロイされる
- ✅ 本番同等の機能がすべて動作する
- ✅ テストデータが正常に投入される
- ✅ UAT用アカウントでアクセス可能
- ✅ CI/CDパイプラインが正常動作する

### 非機能要件
- ✅ パフォーマンス要件の95%以上を満たす
- ✅ セキュリティスキャンに合格する
- ✅ 可用性95%以上を確保する
- ✅ モニタリングが正常に機能する

### 運用要件
- ✅ UAT環境として利用可能
- ✅ ステークホルダーがアクセス可能
- ✅ 品質ゲートが適切に機能する
- ✅ 本番デプロイ承認フローが確立される

## 実装スケジュール

### Day 1: インフラ構築
- AWS VPC・ネットワーク作成
- EKS クラスター構築  
- RDS・Redis セットアップ
- S3・CloudFront 設定

### Day 2: CI/CD・アプリケーション
- GitHub Actions ワークフロー設定
- Docker イメージビルド・デプロイ
- アプリケーション設定・環境変数
- テストデータ投入

### Day 3: 監視・UAT設定  
- CloudWatch・Grafana 監視設定
- UAT アカウント・アクセス設定
- 品質ゲート設定
- ドキュメント・手順書作成

## 次のステップ
ステージング環境構築完了後、TASK-505 本番環境構築へ進み、staging→production のデプロイパイプラインを完成させます。