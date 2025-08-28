# TASK-503: パフォーマンステスト - テストケース設計

## TDD フェーズ: Test Case Design (2/6)

## 概要

このドキュメントではTDDのRed-Green-Refactorサイクルに基づいて、パフォーマンステストの具体的なテストケースを設計する。

### テスト戦略
- **Red Phase**: 失敗するテストから開始
- **Green Phase**: 最小限の実装で通過
- **Refactor Phase**: パフォーマンス最適化

## 負荷テストケース (Load Testing)

### LT-001: 通常負荷テスト
```javascript
// performance-tests/load/normal-load.test.js
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests below 3s
    http_req_failed: ['rate<0.1'],     // Error rate below 10%
  },
};

export default function() {
  // Test cases to be implemented
  let response = http.get('http://localhost:3000/');
  check(response, {
    'トップページレスポンス時間 < 3秒': (r) => r.timings.duration < 3000,
    'ステータスコード200': (r) => r.status === 200,
  });
}
```

### LT-002: ピーク負荷テスト
```javascript
// performance-tests/load/peak-load.test.js
export let options = {
  stages: [
    { duration: '3m', target: 500 },   
    { duration: '10m', target: 1000 }, // Peak load: 1000 users
    { duration: '3m', target: 0 },     
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // Degraded but acceptable
    http_req_failed: ['rate<0.05'],    // 5% error rate acceptable
  },
};
```

### LT-003: 継続負荷テスト (エンデュランス)
```javascript
// performance-tests/endurance/long-running.test.js
export let options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '24h', target: 100 }, // 24-hour continuous test
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
    memory_usage: ['value<85%'],       // Memory leak detection
  },
};
```

## スパイクテストケース (Spike Testing)

### ST-001: 急激な負荷増加テスト
```javascript
// performance-tests/spike/sudden-spike.test.js
export let options = {
  stages: [
    { duration: '30s', target: 0 },
    { duration: '30s', target: 2000 }, // Sudden spike
    { duration: '1m', target: 2000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // Higher threshold for spike
    http_req_failed: ['rate<0.2'],      // 20% error acceptable during spike
  },
};
```

### ST-002: ガチャ集中アクセステスト
```javascript
// performance-tests/spike/gacha-spike.test.js
export default function() {
  const gachaResponse = http.post('http://localhost:3000/api/gacha/draw', {
    gachaId: 'popular-gacha-001'
  });
  
  check(gachaResponse, {
    'ガチャAPIレスポンス < 3秒': (r) => r.timings.duration < 3000,
    'ガチャ成功': (r) => r.status === 200,
  });
}
```

## APIパフォーマンステストケース

### API-001: 認証APIテスト
```javascript
// performance-tests/api/auth-performance.test.js
export default function() {
  const loginResponse = http.post('http://localhost:3000/api/auth/login', {
    email: 'test@example.com',
    password: 'testpass123'
  });
  
  check(loginResponse, {
    '認証API < 500ms': (r) => r.timings.duration < 500,
    '認証成功': (r) => r.status === 200,
  });
}
```

### API-002: ガチャ抽選APIテスト
```javascript
// performance-tests/api/gacha-performance.test.js
export default function() {
  const drawResponse = http.post('http://localhost:3000/api/gacha/draw');
  
  check(drawResponse, {
    'ガチャ抽選 < 3秒': (r) => r.timings.duration < 3000,
    'ガチャ成功': (r) => r.status === 200,
  });
}
```

### API-003: メダル残高取得テスト
```javascript
// performance-tests/api/medal-balance.test.js
export default function() {
  const balanceResponse = http.get('http://localhost:3000/api/medals/balance');
  
  check(balanceResponse, {
    'メダル残高取得 < 200ms': (r) => r.timings.duration < 200,
    'バランス取得成功': (r) => r.status === 200,
  });
}
```

## データベースパフォーマンステストケース

### DB-001: 単純SELECTクエリテスト
```javascript
// performance-tests/database/simple-select.test.js
import sql from 'k6/x/sql';

export default function() {
  const db = sql.open('postgres', 'postgresql://koepon:secure_pass@localhost/koepon_test');
  
  const result = sql.query(db, 'SELECT id, name FROM users WHERE id = ?', [1]);
  
  check(result, {
    '単純SELECT < 100ms': (r) => r.duration < 100,
    'クエリ成功': (r) => r.length > 0,
  });
  
  sql.close(db);
}
```

### DB-002: JOINクエリテスト
```javascript
// performance-tests/database/join-query.test.js
export default function() {
  const db = sql.open('postgres', process.env.DATABASE_URL);
  
  const query = `
    SELECT u.name, g.title, gr.result 
    FROM users u 
    JOIN gacha_results gr ON u.id = gr.user_id 
    JOIN gachas g ON gr.gacha_id = g.id 
    WHERE u.id = ?
  `;
  
  const result = sql.query(db, query, [1]);
  
  check(result, {
    'JOINクエリ < 300ms': (r) => r.duration < 300,
    'データ取得成功': (r) => r.length >= 0,
  });
  
  sql.close(db);
}
```

### DB-003: 集計クエリテスト
```javascript
// performance-tests/database/aggregation.test.js
export default function() {
  const db = sql.open('postgres', process.env.DATABASE_URL);
  
  const query = `
    SELECT 
      COUNT(*) as total_draws,
      AVG(medal_cost) as avg_cost,
      SUM(medal_cost) as total_cost
    FROM gacha_results 
    WHERE created_at >= NOW() - INTERVAL '30 days'
  `;
  
  const result = sql.query(db, query);
  
  check(result, {
    '集計クエリ < 1秒': (r) => r.duration < 1000,
    '集計データ取得': (r) => r.length > 0,
  });
  
  sql.close(db);
}
```

## フロントエンドパフォーマンステストケース

### FE-001: ページ読み込み時間テスト
```javascript
// performance-tests/frontend/page-load.test.js
import { chromium } from 'k6/x/browser';

export default async function() {
  const browser = chromium.launch();
  const page = browser.newPage();
  
  const startTime = Date.now();
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;
  
  check(loadTime, {
    'トップページ読み込み < 3秒': (t) => t < 3000,
  });
  
  browser.close();
}
```

### FE-002: JavaScript実行時間テスト
```javascript
// performance-tests/frontend/js-performance.test.js
export default async function() {
  const browser = chromium.launch();
  const page = browser.newPage();
  
  await page.goto('http://localhost:3000/gacha');
  
  const jsStartTime = Date.now();
  await page.click('[data-testid="gacha-draw-button"]');
  await page.waitForSelector('[data-testid="gacha-result"]');
  const jsExecutionTime = Date.now() - jsStartTime;
  
  check(jsExecutionTime, {
    'ガチャJavaScript実行 < 1秒': (t) => t < 1000,
  });
  
  browser.close();
}
```

## ストレステストケース

### STR-001: 限界値テスト
```javascript
// performance-tests/stress/limit-test.test.js
export let options = {
  stages: [
    { duration: '5m', target: 500 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 1500 },
    { duration: '5m', target: 2000 },
    { duration: '5m', target: 2500 }, // Finding the breaking point
  ],
  thresholds: {
    http_req_duration: ['p(95)<15000'],
    http_req_failed: ['rate<0.5'], // High error rate acceptable in stress test
  },
};
```

### STR-002: リソース枯渇テスト
```javascript
// performance-tests/stress/resource-exhaustion.test.js
export let options = {
  scenarios: {
    memory_stress: {
      executor: 'constant-vus',
      vus: 100,
      duration: '10m',
      tags: { test_type: 'memory_stress' },
    },
    cpu_stress: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      stages: [
        { duration: '5m', target: 100 },
        { duration: '10m', target: 200 },
      ],
      tags: { test_type: 'cpu_stress' },
    },
  },
};
```

## モニタリング・監視テストケース

### MON-001: リソース使用率監視
```javascript
// performance-tests/monitoring/resource-monitoring.test.js
import { Trend, Counter } from 'k6/metrics';

const cpuUsage = new Trend('cpu_usage_percent');
const memoryUsage = new Trend('memory_usage_percent');
const diskUsage = new Trend('disk_usage_percent');

export default function() {
  // Collect system metrics during test
  const systemStats = http.get('http://localhost:3000/api/system/stats');
  
  if (systemStats.status === 200) {
    const stats = JSON.parse(systemStats.body);
    cpuUsage.add(stats.cpu);
    memoryUsage.add(stats.memory);
    diskUsage.add(stats.disk);
    
    check(stats, {
      'CPU使用率 < 90%': (s) => s.cpu < 90,
      'メモリ使用率 < 85%': (s) => s.memory < 85,
      'ディスク使用率 < 80%': (s) => s.disk < 80,
    });
  }
}
```

### MON-002: エラー率監視
```javascript
// performance-tests/monitoring/error-rate.test.js
import { Rate } from 'k6/metrics';

const errorRate = new Rate('error_rate');

export default function() {
  const response = http.get('http://localhost:3000/api/health');
  errorRate.add(response.status !== 200);
  
  check(response, {
    'エラー率 < 5%': () => errorRate.rate < 0.05,
    'ヘルスチェック成功': (r) => r.status === 200,
  });
}
```

## テスト実行順序

### Phase 1: 基本機能テスト
1. API-001: 認証APIテスト
2. API-002: ガチャ抽選APIテスト
3. API-003: メダル残高取得テスト
4. DB-001: 単純SELECTクエリテスト

### Phase 2: 負荷テスト
1. LT-001: 通常負荷テスト
2. LT-002: ピーク負荷テスト
3. DB-002: JOINクエリテスト
4. DB-003: 集計クエリテスト

### Phase 3: ストレステスト
1. STR-001: 限界値テスト
2. STR-002: リソース枯渇テスト
3. ST-001: 急激な負荷増加テスト
4. ST-002: ガチャ集中アクセステスト

### Phase 4: 継続テスト
1. LT-003: 継続負荷テスト (24時間)
2. MON-001: リソース使用率監視
3. MON-002: エラー率監視

### Phase 5: フロントエンドテスト
1. FE-001: ページ読み込み時間テスト
2. FE-002: JavaScript実行時間テスト

## 成功基準

### 必須要件 (Must Have)
- ✅ 全APIレスポンス時間が要件値以内
- ✅ 1,000同時ユーザー時のエラー率 < 5%
- ✅ データベースクエリパフォーマンス要件達成
- ✅ システムリソース使用率が制限内

### 推奨要件 (Should Have)
- ✅ 2,000同時ユーザー対応（性能劣化許容）
- ✅ 24時間継続テスト成功
- ✅ メモリリーク検出なし
- ✅ 自動パフォーマンス監視稼働

### 期待要件 (Nice to Have)
- ✅ フロントエンドJavaScript最適化
- ✅ CDN効果測定
- ✅ データベース自動最適化
- ✅ 予測スケーリング機能

## 次のステップ

Red Phase (Step 3/6) で以下を実装予定:
1. k6 パフォーマンステストスクリプト作成
2. テストデータ準備スクリプト
3. Docker テスト環境構築
4. 初回実行（失敗確認）

---

**注意**: このテストケース設計は TDD の Red-Green-Refactor サイクルに従い、まず失敗するテストを作成してから段階的に実装していく方針です。