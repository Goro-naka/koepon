# GitHub Secrets Configuration for Koepon CI/CD

## Overview
こえポン！プロジェクトのCI/CDパイプライン用にGitHub Secretsを設定する手順

## 前提条件
1. GitHubリポジトリが作成済み
2. Supabase staging/production プロジェクトが設定済み
3. Vercel プロジェクトが設定済み

## GitHub Repository Setup

### 1. GitHubリポジトリ作成
```bash
# GitHubでkoeponリポジトリを作成後、リモートを追加
git remote add origin https://github.com/[username]/koepon.git
git branch -M main
git push -u origin main
```

## Required GitHub Secrets

### Database & Backend Secrets

#### SUPABASE_URL_STAGING
```
https://rtwclsmarfgfidbmcudu.supabase.co
```

#### SUPABASE_SERVICE_ROLE_KEY_STAGING
```
[Supabaseコンソールから取得したサービスロールキー]
```

#### SUPABASE_ANON_KEY_STAGING  
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2Nsc21hcmZnZmlkYm1jdWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ2MjQzNTcsImV4cCI6MjA0MDE5OTk1N30.hgL-NJhECr8OBXK5_aqd5FYvl1eNe7o2iH2nBYf2jnc
```

### Deployment Secrets

#### VERCEL_ORG_ID
```bash
# Vercel設定から取得
cat .vercel/project.json | grep orgId
```

#### VERCEL_PROJECT_ID
```bash
# Vercel設定から取得  
cat .vercel/project.json | grep projectId
```

#### VERCEL_TOKEN
```
# Vercelダッシュボードから生成
# Settings > Tokens > Create Token
```

### Redis Secrets (Upstash)

#### UPSTASH_REDIS_REST_URL_STAGING
```
# Upstashコンソールから取得
https://[redis-id].upstash.io
```

#### UPSTASH_REDIS_REST_TOKEN_STAGING
```
# Upstashコンソールから取得
[redis-rest-token]
```

### Security & Monitoring

#### JWT_SECRET
```bash
# 暗号化されたランダム文字列生成
openssl rand -base64 32
```

#### DATABASE_ENCRYPTION_KEY
```bash
# データベース暗号化用キー  
openssl rand -base64 32
```

## GitHub Secrets 設定コマンド

### GitHub CLI使用（推奨）
```bash
# GitHub CLI インストール・認証
gh auth login

# Secrets一括設定
gh secret set SUPABASE_URL_STAGING --body "https://rtwclsmarfgfidbmcudu.supabase.co"
gh secret set SUPABASE_ANON_KEY_STAGING --body "[anon-key]"
gh secret set SUPABASE_SERVICE_ROLE_KEY_STAGING --body "[service-role-key]"

gh secret set VERCEL_ORG_ID --body "[org-id]"  
gh secret set VERCEL_PROJECT_ID --body "[project-id]"
gh secret set VERCEL_TOKEN --body "[vercel-token]"

gh secret set UPSTASH_REDIS_REST_URL_STAGING --body "[redis-url]"
gh secret set UPSTASH_REDIS_REST_TOKEN_STAGING --body "[redis-token]"

gh secret set JWT_SECRET --body "$(openssl rand -base64 32)"
gh secret set DATABASE_ENCRYPTION_KEY --body "$(openssl rand -base64 32)"
```

### Web Interface 設定手順
1. GitHubリポジトリの Settings > Secrets and variables > Actions
2. 「New repository secret」をクリック  
3. 上記のSecret名・値を一つずつ追加

## CI/CD Workflow Configuration

### `.github/workflows/staging.yml`
```yaml
name: Deploy to Staging

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      # Backend Tests
      - name: Install API Dependencies
        run: npm ci
        
      - name: Run API Tests
        run: npm test
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL_STAGING }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY_STAGING }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

      # Frontend Tests  
      - name: Install Client Dependencies
        run: npm ci
        working-directory: ./client
        
      - name: Run Client Tests
        run: npm test
        working-directory: ./client

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy API to Railway/Render
        # API デプロイ設定（将来実装）
        
  deploy-frontend:
    needs: test  
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./client
```

### `.github/workflows/production.yml`
```yaml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  # プロダクション用デプロイ（将来実装）
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      # プロダクション環境へのデプロイ処理
```

## Security Best Practices

### Secret Rotation Schedule
- **毎月**: JWT_SECRET, DATABASE_ENCRYPTION_KEY
- **四半期**: Vercel Token, Supabase Keys  
- **年次**: Redis Keys, Service Role Keys

### Access Control
- Production secrets: Admin only
- Staging secrets: Developer team
- Repository secrets: Write access以上

### Monitoring & Alerts
```yaml
# .github/workflows/secret-audit.yml
name: Security Audit
on:
  schedule:
    - cron: '0 0 * * 1' # 毎週月曜日
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - name: Check Secret Expiry
        run: |
          # Secret有効期限チェック
          # 期限切れ近くの場合はSlack通知
```

## Environment Variables Summary

| Environment | Supabase Project | Vercel Project | Redis Instance |
|-------------|------------------|----------------|----------------|
| Development | koepon-staging   | koepon (dev)   | koepon-staging-redis |
| Staging     | koepon-staging   | koepon (staging) | koepon-staging-redis |
| Production  | koepon-prod      | koepon (prod)  | koepon-prod-redis |

## Next Steps

1. ✅ GitHub リポジトリ作成・プッシュ
2. 🔄 GitHub Secrets設定
3. 📋 CI/CDワークフロー実装
4. 🧪 デプロイメントテスト
5. 📊 監視・アラート設定

## Troubleshooting

### よくある問題
1. **Secret値の改行**: GitHub Secretsは改行を含むと正しく動作しない場合がある
2. **Vercel Token権限**: 適切なScope（read:project, write:project）が必要  
3. **Supabase RLS**: CI環境からのアクセスにはサービスロールキーが必要

### デバッグコマンド
```bash
# Secret値の確認（ローカル）
echo $SUPABASE_URL_STAGING

# GitHub Actions ログで Secret使用確認
echo "Using Supabase URL: ${SUPABASE_URL_STAGING:0:10}..."
```