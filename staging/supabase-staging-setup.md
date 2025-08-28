# Supabase ステージング環境セットアップ

## 概要
Supabaseを使用したステージング環境のセットアップ手順とドキュメント

## 1. Supabase プロジェクト作成手順

### ステップ1: ステージング プロジェクト作成
```bash
# Supabase CLI でステージング プロジェクト作成
supabase projects create koepon-staging --region ap-northeast-1

# 作成されるプロジェクト情報
# Project ID: koepon-staging-xxxxx
# API URL: https://koepon-staging-xxxxx.supabase.co
# Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### ステップ2: データベーススキーマのデプロイ
```bash
# ローカルの本番スキーマをステージングにデプロイ
supabase db push --project-ref koepon-staging-xxxxx
```

### ステップ3: RLS (Row Level Security) ポリシー設定
```sql
-- ステージング環境用のRLSポリシー
-- 本番より緩い設定でテストしやすくする

-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ステージング: テストユーザーは全データアクセス可能
CREATE POLICY "staging_users_full_access" ON users 
FOR ALL USING (
  auth.jwt() ->> 'email' LIKE '%@staging.test' 
  OR auth.jwt() ->> 'email' LIKE '%@example.com'
);

-- Production users: 自分のデータのみ
CREATE POLICY "users_own_data" ON users 
FOR ALL USING (auth.uid() = id);
```

## 2. ステージング専用設定

### データベース設定
```sql
-- ステージング環境の設定
ALTER DATABASE postgres SET timezone = 'Asia/Tokyo';
ALTER DATABASE postgres SET log_statement = 'all'; -- デバッグ用

-- テストデータ作成用の関数
CREATE OR REPLACE FUNCTION create_staging_test_data()
RETURNS void AS $$
BEGIN
  -- テストユーザー作成
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES 
    (gen_random_uuid(), 'staging-admin@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
    (gen_random_uuid(), 'staging-vtuber@example.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
    (gen_random_uuid(), 'staging-user@example.com', crypt('password123', gen_salt('bf')), now(), now(), now());
    
  -- テストVTuber作成
  INSERT INTO vtubers (name, description, status, created_at)
  VALUES 
    ('ステージングテストVTuber A', 'テスト用VTuber', 'approved', now()),
    ('ステージングテストVTuber B', 'テスト用VTuber', 'pending', now());
    
  -- テストガチャ作成  
  INSERT INTO gachas (name, description, cost, vtuber_id, status, created_at)
  VALUES 
    ('ステージング基本ガチャ', 'テスト用ガチャ', 100, 1, 'active', now()),
    ('ステージングプレミアムガチャ', 'テスト用プレミアムガチャ', 500, 2, 'active', now());
END;
$$ LANGUAGE plpgsql;
```

### 環境変数設定
```bash
# staging/.env.staging
NODE_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://koepon-staging-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ステージング固有の設定
DEBUG_MODE=true
LOG_LEVEL=debug
SEED_TEST_DATA=true
ALLOW_TEST_USERS=true
MOCK_PAYMENT=true

# Redis (Upstash)
REDIS_URL=rediss://default:password@koepon-staging-redis.upstash.io:6379
UPSTASH_REDIS_REST_URL=https://koepon-staging-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

## 3. CI/CD統合

### GitHub Actions ワークフロー
```yaml
# .github/workflows/staging-supabase-deploy.yml
name: Supabase Staging Deploy

on:
  push:
    branches: [staging]
    paths: [supabase/**]

jobs:
  deploy-supabase:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
          
      - name: Deploy to Staging
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_STAGING_PROJECT_ID }}
          supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          
      - name: Run Database Tests
        run: |
          supabase test db --project-ref ${{ secrets.SUPABASE_STAGING_PROJECT_ID }}
          
      - name: Seed Test Data  
        run: |
          supabase db reset --project-ref ${{ secrets.SUPABASE_STAGING_PROJECT_ID }}
          psql $SUPABASE_DB_URL -c "SELECT create_staging_test_data();"
        env:
          SUPABASE_DB_URL: ${{ secrets.SUPABASE_STAGING_DB_URL }}
```

## 4. 監視・ヘルスチェック

### Supabase 監視設定
```typescript
// monitoring/supabase-health-check.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function checkSupabaseHealth() {
  const results = {
    database: false,
    auth: false,
    storage: false,
    timestamp: new Date().toISOString()
  }

  try {
    // Database health check
    const { error: dbError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    results.database = !dbError

    // Auth health check  
    const { error: authError } = await supabase.auth.getUser()
    results.auth = !authError

    // Storage health check
    const { error: storageError } = await supabase.storage
      .from('staging-files')
      .list('', { limit: 1 })
    results.storage = !storageError

  } catch (error) {
    console.error('Supabase health check failed:', error)
  }

  return results
}
```

## 5. テスト統合

### E2E テスト設定
```typescript
// e2e/config/supabase-staging.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '../tests',
  baseURL: 'https://staging.koepon.com',
  use: {
    extraHTTPHeaders: {
      'Authorization': `Bearer ${process.env.SUPABASE_STAGING_SERVICE_KEY}`
    }
  },
  projects: [
    {
      name: 'staging-auth',
      testMatch: '**/auth/*.spec.ts'
    },
    {
      name: 'staging-gacha',
      testMatch: '**/gacha/*.spec.ts'
    }
  ]
})
```

## 6. データバックアップ・復元

### ステージングデータ管理
```bash
#!/bin/bash
# scripts/staging-data-management.sh

# バックアップ作成
backup_staging() {
    supabase db dump --project-ref $SUPABASE_STAGING_PROJECT_ID > staging-backup-$(date +%Y%m%d).sql
}

# テストデータリセット
reset_staging_data() {
    supabase db reset --project-ref $SUPABASE_STAGING_PROJECT_ID
    psql $SUPABASE_STAGING_DB_URL -c "SELECT create_staging_test_data();"
}

# 本番データの一部をコピー（匿名化）
sync_production_sample() {
    # 本番データの匿名化サンプルをステージングにコピー
    # 個人情報を除いてテスト用に変換
    pg_dump $PRODUCTION_DB_URL --table=gachas --table=vtubers | \
    sed 's/@[^,]*/staging.test/g' | \
    psql $SUPABASE_STAGING_DB_URL
}
```

## 7. セキュリティ設定

### ステージング固有セキュリティ
```sql
-- IP制限（開発チームのオフィス + VPN）
CREATE OR REPLACE FUNCTION check_staging_access()
RETURNS boolean AS $$
BEGIN
  -- ステージング環境では開発チーム IP のみ許可
  RETURN current_setting('request.headers')::json ->> 'x-forwarded-for' ~ '^(192\.168\..*|10\..*|172\.(1[6-9]|2[0-9]|3[0-1])\..*|203\.0\.113\..*)$';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ステージング専用認証ポリシー
CREATE POLICY "staging_ip_restriction" ON users
FOR ALL USING (
  check_staging_access() OR 
  auth.jwt() ->> 'email' LIKE '%@example.com'
);
```

## 完了チェックリスト

### 基本設定
- [ ] Supabase ステージングプロジェクト作成
- [ ] データベーススキーマデプロイ
- [ ] RLS ポリシー設定
- [ ] テストデータ投入

### CI/CD統合
- [ ] GitHub Actions ワークフロー作成
- [ ] 環境変数・シークレット設定
- [ ] 自動デプロイ確認
- [ ] データベーステスト統合

### 監視・運用
- [ ] ヘルスチェック実装
- [ ] ログ設定
- [ ] バックアップ設定
- [ ] アラート設定

### セキュリティ
- [ ] IP制限設定
- [ ] 認証ポリシー適用
- [ ] データ暗号化確認
- [ ] アクセス制御テスト

このSetupが完了すると、Supabase ベースのステージング環境が本格運用可能になります。