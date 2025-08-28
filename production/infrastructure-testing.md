# Infrastructure Testing Guide for Koepon

## Overview  
こえポン！の完全なインフラストラクチャのテスト・検証手順

## Testing Checklist

### ✅ Database Testing (Supabase)

#### Connection Testing
```bash
# Supabase接続テスト
curl -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2Nsc21hcmZnZmlkYm1jdWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ2MjQzNTcsImV4cCI6MjA0MDE5OTk1N30.hgL-NJhECr8OBXK5_aqd5FYvl1eNe7o2iH2nBYf2jnc" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2Nsc21hcmZnZmlkYm1jdWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ2MjQzNTcsImV4cCI6MjA0MDE5OTk1N30.hgL-NJhECr8OBXK5_aqd5FYvl1eNe7o2iH2nBYf2jnc" \
     https://rtwclsmarfgfidbmcudu.supabase.co/rest/v1/health_check
```

#### Database Schema Validation
```sql
-- 全テーブルの存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 期待されるテーブル一覧
-- gacha_campaigns, gacha_items, gacha_pulls, health_check, 
-- parental_consent_tokens, point_transactions, user_age_restrictions,
-- user_inventory, user_points, user_sessions, user_spending_history,
-- users, vtubers

-- RLS Policies確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- インデックス確認  
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

#### Test Data Creation
```sql
-- テストデータ作成実行
SELECT create_staging_test_data();

-- 作成されたテストデータ確認
SELECT 'users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'vtubers', count(*) FROM vtubers  
UNION ALL  
SELECT 'gacha_campaigns', count(*) FROM gacha_campaigns
UNION ALL
SELECT 'gacha_items', count(*) FROM gacha_items
UNION ALL
SELECT 'user_points', count(*) FROM user_points;
```

### ✅ Frontend Testing (Vercel + Next.js)

#### Deployment Verification
```bash
# デプロイメント状況確認
vercel ls

# 本番URL確認
curl -I https://koepon-earoutklv-goro-nakas-projects.vercel.app
# Expected: HTTP/2 200

# 環境変数確認（ローカル）
cd client && npm run build
# 期待: ビルドが成功し、Supabase接続エラーがないこと
```

#### Page Load Testing
```bash
# 主要ページの動作確認
pages=(
  "/"
  "/gacha"  
  "/exchange"
  "/auth/login"
  "/auth/register"
  "/legal/terms-of-service"
  "/legal/privacy-policy"
)

for page in "${pages[@]}"; do
  echo "Testing $page"
  curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" \
    "https://koepon-earoutklv-goro-nakas-projects.vercel.app$page"
done
```

#### API Routes Testing  
```bash
# Next.js API Routes テスト
curl -X GET https://koepon-earoutklv-goro-nakas-projects.vercel.app/api/health
# Expected: {"status":"ok","timestamp":"..."}

curl -X POST https://koepon-earoutklv-goro-nakas-projects.vercel.app/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"test-token"}'
# Expected: 認証エラーレスポンス
```

### ✅ Environment Variables Testing

#### Frontend Environment Variables
```typescript
// client/src/__tests__/env.test.ts
describe('Environment Variables', () => {
  test('Supabase URL is configured', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toContain('supabase.co')
  })

  test('Supabase Anon Key is configured', () => {
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toMatch(/^eyJ/)
  })
})
```

#### Supabase Connection Test
```typescript
// client/src/__tests__/supabase.test.ts  
import { createClient } from '@supabase/supabase-js'

describe('Supabase Connection', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  test('can connect to Supabase', async () => {
    const { data, error } = await supabase
      .from('health_check')
      .select('status')
      .limit(1)
    
    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data?.[0]?.status).toBe('healthy')
  })

  test('can create user session', async () => {
    // 匿名サインイン（テスト用）
    const { data, error } = await supabase.auth.signInAnonymously()
    
    expect(error).toBeNull()
    expect(data.user).toBeDefined()
    expect(data.session).toBeDefined()
  })
})
```

### ✅ Performance Testing

#### Load Testing Script
```javascript
// performance-tests/infrastructure-load.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '60s', target: 50 },  // Load test  
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%のリクエストが500ms以内
    http_req_failed: ['rate<0.1'],    // エラー率10%以下
  },
};

const BASE_URL = 'https://koepon-earoutklv-goro-nakas-projects.vercel.app';

export default function () {
  // Top page
  let response = http.get(BASE_URL);
  check(response, {
    'homepage loads': (r) => r.status === 200,
    'homepage has title': (r) => r.body.includes('こえポン'),
  });

  sleep(1);

  // Gacha page
  response = http.get(`${BASE_URL}/gacha`);
  check(response, {
    'gacha page loads': (r) => r.status === 200,
  });

  sleep(1);

  // API health check
  response = http.get(`${BASE_URL}/api/health`);
  check(response, {
    'API health check': (r) => r.status === 200,
    'API returns JSON': (r) => r.headers['Content-Type'].includes('application/json'),
  });

  sleep(2);
}
```

#### Database Performance Test
```sql
-- クエリパフォーマンステスト
EXPLAIN ANALYZE
SELECT u.username, v.channel_name, COUNT(gp.id) as gacha_count
FROM users u
JOIN vtubers v ON v.user_id = u.id
LEFT JOIN gacha_pulls gp ON gp.user_id = u.id
WHERE u.is_active = true
GROUP BY u.id, v.id
ORDER BY gacha_count DESC
LIMIT 10;

-- インデックス効果確認
EXPLAIN ANALYZE
SELECT * FROM gacha_items 
WHERE campaign_id = '20000000-0000-0000-0000-000000000001'
AND rarity = 'SSR';

-- 実行時間の期待値: < 50ms
```

### ✅ Security Testing

#### HTTPS/SSL Testing
```bash
# SSL証明書確認
echo | openssl s_client -servername koepon-earoutklv-goro-nakas-projects.vercel.app \
  -connect koepon-earoutklv-goro-nakas-projects.vercel.app:443 2>/dev/null \
  | openssl x509 -noout -dates

# Security Headers確認
curl -I https://koepon-earoutklv-goro-nakas-projects.vercel.app | grep -E "(X-|Content-Security|Strict-Transport)"
# 期待: X-Frame-Options, X-Content-Type-Options, CSP等のヘッダー
```

#### Authentication Testing
```typescript
// security-tests/auth.test.ts
describe('Authentication Security', () => {
  test('rejects invalid JWT tokens', async () => {
    const response = await fetch('/api/auth/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token' })
    })
    
    expect(response.status).toBe(401)
  })

  test('rate limits login attempts', async () => {
    const promises = Array.from({ length: 20 }, () =>
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
      })
    )
    
    const responses = await Promise.all(promises)
    const tooManyRequests = responses.filter(r => r.status === 429)
    expect(tooManyRequests.length).toBeGreaterThan(0)
  })
})
```

### ✅ Integration Testing

#### End-to-End User Flow
```typescript
// e2e/user-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete user registration and gacha flow', async ({ page }) => {
  // ホームページアクセス
  await page.goto('/')
  await expect(page).toHaveTitle(/こえポン/)

  // 会員登録
  await page.click('[data-testid="register-button"]')
  await page.fill('[data-testid="email-input"]', 'test@example.com')  
  await page.fill('[data-testid="password-input"]', 'SecurePass123!')
  await page.click('[data-testid="submit-register"]')

  // 登録成功の確認
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()

  // ガチャページへ移動
  await page.click('[data-testid="gacha-nav"]')
  await expect(page.url()).toContain('/gacha')

  // ガチャアイテム表示確認
  await expect(page.locator('[data-testid="gacha-item"]')).toBeVisible()
})
```

#### Database Integration Test
```typescript
// src/__tests__/integration/database.integration.test.ts
describe('Database Integration', () => {
  test('user registration creates all required records', async () => {
    const userData = {
      email: 'integration@test.com',
      username: 'integrationtest',
      password: 'Test123!'
    }

    // ユーザー作成
    const user = await userService.createUser(userData)
    expect(user.id).toBeDefined()

    // user_points レコード自動作成確認
    const points = await userPointsService.getUserPoints(user.id)
    expect(points.balance).toBe(0)

    // 年齢制限レコード確認（18歳未満の場合）
    if (user.age < 18) {
      const restrictions = await ageRestrictionService.getUserAgeRestrictions(user.id)
      expect(restrictions).toBeDefined()
    }
  })
})
```

## Automated Testing Pipeline

### GitHub Actions Test Configuration
```yaml
# .github/workflows/infrastructure-test.yml
name: Infrastructure Testing

on:
  schedule:
    - cron: '0 2 * * *'  # 毎日2AM JST
  workflow_dispatch:

jobs:
  health-checks:
    runs-on: ubuntu-latest
    steps:
      - name: Frontend Health Check
        run: |
          curl -f https://koepon-earoutklv-goro-nakas-projects.vercel.app/api/health
          
      - name: Database Health Check  
        run: |
          curl -f -H "apikey: ${{ secrets.SUPABASE_ANON_KEY_STAGING }}" \
            https://rtwclsmarfgfidbmcudu.supabase.co/rest/v1/health_check

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run K6 Load Tests
        uses: grafana/k6-action@v0.3.1
        with:
          filename: performance-tests/infrastructure-load.test.js

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run OWASP ZAP Scan
        run: |
          docker run -t owasp/zap2docker-stable zap-baseline.py \
            -t https://koepon-earoutklv-goro-nakas-projects.vercel.app
```

### Monitoring Setup
```typescript
// monitoring/infrastructure-monitor.ts
import { createClient } from '@supabase/supabase-js'

const monitors = [
  {
    name: 'Frontend Availability',
    url: 'https://koepon-earoutklv-goro-nakas-projects.vercel.app',
    expected: 200,
    timeout: 5000
  },
  {
    name: 'Database Connectivity', 
    check: async () => {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.from('health_check').select().limit(1)
      return !error
    }
  }
]

// 5分ごとの死活監視
setInterval(async () => {
  for (const monitor of monitors) {
    try {
      if ('url' in monitor) {
        const response = await fetch(monitor.url, { timeout: monitor.timeout })
        if (response.status !== monitor.expected) {
          await sendAlert(`${monitor.name} failed: HTTP ${response.status}`)
        }
      } else if ('check' in monitor) {
        const result = await monitor.check()
        if (!result) {
          await sendAlert(`${monitor.name} failed: Check returned false`)
        }
      }
    } catch (error) {
      await sendAlert(`${monitor.name} error: ${error.message}`)
    }
  }
}, 5 * 60 * 1000)
```

## Testing Commands Summary

```bash
# 完全なインフラテスト実行
npm run test:infrastructure

# パフォーマンステスト
npm run test:performance

# セキュリティテスト  
npm run test:security

# E2E テスト
npm run test:e2e

# 統合テスト
npm run test:integration

# 全テスト実行
npm run test:all
```

## Success Criteria

### ✅ 合格基準
1. **可用性**: 99.9% uptime (月間4.3分以内のダウンタイム)
2. **パフォーマンス**: ページロード時間 < 2秒、API レスポンス < 500ms
3. **セキュリティ**: HTTPS A+ rating, セキュリティヘッダー完備
4. **機能性**: 全主要機能が期待通りに動作
5. **スケーラビリティ**: 100同時ユーザーまで安定動作

### ❌ 要修正項目
- HTTP 5xx エラー率 > 0.1%
- ページロード時間 > 3秒
- データベース接続エラー
- SSL/TLS 設定不備
- 重要な機能の動作不良

## Next Steps After Testing

1. ✅ 全テスト合格確認
2. 📊 監視・アラート設定
3. 📝 運用手順書作成  
4. 🚀 本番環境準備
5. 🎯 ユーザー受け入れテスト計画