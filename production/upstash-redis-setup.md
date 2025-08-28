# Upstash Redis Setup for Koepon

## Overview
セットアップ手順：Upstash Redis（無料枠）をkoeponのセッション管理・キャッシュ用に設定

## 手動セットアップ手順

### 1. Upstash アカウント作成
1. [Upstash Console](https://console.upstash.com/) にアクセス
2. GitHub/Google アカウントでサインアップ
3. 無料プランを選択（30,000 requests/month）

### 2. Redis Database 作成
#### Staging Environment
- **名前**: `koepon-staging-redis`
- **リージョン**: `us-east-1` (東京に最も近い無料リージョン)
- **タイプ**: Global Database (無料枠内)
- **用途**: セッション管理、ガチャキャッシュ、レート制限

#### Production Environment (将来)
- **名前**: `koepon-prod-redis`
- **リージョン**: `ap-northeast-1` (東京) - 有料プランで利用
- **タイプ**: Regional Database (低レイテンシ)

### 3. 接続情報の取得

各データベース作成後、以下の情報をコピー：

#### Staging Redis
```bash
# Redis REST URL (for @upstash/redis client)
UPSTASH_REDIS_REST_URL=https://[database-id].upstash.io

# Redis REST Token
UPSTASH_REDIS_REST_TOKEN=[your-token]

# Redis Connection URL (for ioredis client)  
REDIS_URL=rediss://default:[password]@[host]:6379
```

### 4. Vercel 環境変数設定

```bash
# Staging用環境変数を設定
vercel env add UPSTASH_REDIS_REST_URL production
# https://[staging-db-id].upstash.io を入力

vercel env add UPSTASH_REDIS_REST_TOKEN production  
# [staging-token] を入力

# Development環境にも同じ値を設定
vercel env add UPSTASH_REDIS_REST_URL development
vercel env add UPSTASH_REDIS_REST_TOKEN development
```

### 5. NestJS API での接続設定

`api/src/config/redis.config.ts`:
```typescript
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// セッション管理用設定
export const redisConfig = {
  session: {
    prefix: 'koepon:session:',
    ttl: 24 * 60 * 60, // 24時間
  },
  gacha: {
    prefix: 'koepon:gacha:',
    ttl: 60 * 60, // 1時間
  },
  rateLimit: {
    prefix: 'koepon:limit:',
    ttl: 60, // 1分
  }
}
```

### 6. 使用例

#### セッション管理
```typescript
// セッション保存
await redis.setex(
  `${redisConfig.session.prefix}${userId}`,
  redisConfig.session.ttl,
  JSON.stringify(sessionData)
)

// セッション取得
const session = await redis.get(`${redisConfig.session.prefix}${userId}`)
```

#### ガチャレート制限
```typescript
// レート制限チェック
const key = `${redisConfig.rateLimit.prefix}${userId}`
const current = await redis.incr(key)
if (current === 1) {
  await redis.expire(key, redisConfig.rateLimit.ttl)
}
if (current > 10) { // 1分間に10回まで
  throw new Error('Rate limit exceeded')
}
```

## 無料枠制限

### Upstash Redis 無料プラン
- **月間リクエスト**: 30,000回
- **データサイズ**: 256MB
- **同時接続**: 100
- **地域**: 限定的（US/EU）

### 推定使用量（Staging）
- セッション管理: ~5,000 requests/month
- ガチャキャッシュ: ~10,000 requests/month
- レート制限: ~15,000 requests/month
- **合計**: ~30,000 requests/month（上限ギリギリ）

## モニタリング

Upstash Console で以下を監視：
- 月間リクエスト数使用量
- データベースサイズ
- エラーレート
- レスポンス時間

## Next Steps

1. Upstash アカウント作成・Redis インスタンス作成
2. 接続情報をVercel環境変数に設定
3. NestJS APIにRedis接続実装
4. セッション管理・キャッシュ機能をテスト
5. 本番環境用Redis（有料プラン）の準備

## 参考リンク
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [@upstash/redis SDK](https://github.com/upstash/upstash-redis)
- [Vercel + Upstash Integration](https://vercel.com/integrations/upstash)