# API エンドポイント仕様

## 基本情報

- **Base URL**: `https://api.koepon.jp/v1`
- **Authentication**: Bearer Token (JWT)
- **Content-Type**: `application/json`
- **Rate Limiting**: 100 requests/minute (認証済みユーザー), 20 requests/minute (未認証)

## 認証エンドポイント

### POST /auth/register
ユーザー登録

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "user123",
  "displayName": "ユーザー太郎"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "user123",
      "displayName": "ユーザー太郎",
      "role": "FAN"
    }
  }
}
```

### POST /auth/login
ログイン

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresIn": 3600,
    "user": { /* User object */ }
  }
}
```

### POST /auth/refresh
トークンリフレッシュ

**Request:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "expiresIn": 3600
  }
}
```

### POST /auth/logout
ログアウト

**Headers:** `Authorization: Bearer {token}`

**Response (204):** No content

## ユーザー管理エンドポイント

### GET /users/me
現在のユーザー情報取得

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "user123",
    "displayName": "ユーザー太郎",
    "role": "FAN",
    "profileImageUrl": "https://cdn.koepon.jp/profiles/uuid.jpg"
  }
}
```

### PUT /users/me
ユーザー情報更新

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "displayName": "新しい表示名",
  "profileImageUrl": "https://cdn.koepon.jp/profiles/new-uuid.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { /* Updated User object */ }
}
```

## ガチャエンドポイント

### GET /gachas
ガチャ一覧取得

**Query Parameters:**
- `vtuberId`: VTuber ID (optional)
- `status`: ガチャステータス (optional)
- `page`: ページ番号 (default: 1)
- `perPage`: 1ページあたりの件数 (default: 20, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "vtuber": {
        "id": "uuid",
        "channelName": "チャンネル名",
        "profileImageUrl": "https://cdn.koepon.jp/vtubers/uuid.jpg"
      },
      "name": "ガチャ名",
      "description": "ガチャ説明",
      "thumbnailUrl": "https://cdn.koepon.jp/gachas/uuid.jpg",
      "singlePrice": 500,
      "tenPullPrice": 4500,
      "medalPerPull": 1,
      "status": "PUBLISHED",
      "startAt": "2025-01-01T00:00:00Z",
      "endAt": "2025-01-31T23:59:59Z"
    }
  ],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /gachas/:id
ガチャ詳細取得

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "vtuber": { /* VTuber object */ },
    "name": "ガチャ名",
    "description": "ガチャ説明",
    "thumbnailUrl": "https://cdn.koepon.jp/gachas/uuid.jpg",
    "singlePrice": 500,
    "tenPullPrice": 4500,
    "medalPerPull": 1,
    "status": "PUBLISHED",
    "startAt": "2025-01-01T00:00:00Z",
    "endAt": "2025-01-31T23:59:59Z",
    "items": [
      {
        "id": "uuid",
        "name": "アイテム名",
        "description": "アイテム説明",
        "rarity": 5,
        "dropRate": 0.5,
        "thumbnailUrl": "https://cdn.koepon.jp/items/uuid.jpg",
        "rewards": [
          {
            "id": "uuid",
            "name": "特典名",
            "type": "VOICE",
            "fileSize": 1024000
          }
        ]
      }
    ]
  }
}
```

### POST /gachas/:id/purchase
ガチャ購入

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "pullCount": 10,
  "paymentMethodId": "pm_stripe_payment_method_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "pullId": "uuid",
    "results": [
      {
        "position": 1,
        "item": { /* GachaItem object */ },
        "rewards": [ /* GachaReward objects */ ]
      }
    ],
    "medalEarned": 10,
    "newMedalBalance": 25
  }
}
```

## 推しメダルエンドポイント

### GET /oshi-medals
推しメダル残高取得

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "vtuber": {
        "id": "uuid",
        "channelName": "チャンネル名",
        "profileImageUrl": "https://cdn.koepon.jp/vtubers/uuid.jpg"
      },
      "balance": 25,
      "totalEarned": 100,
      "totalSpent": 75
    }
  ]
}
```

### GET /oshi-medals/:vtuberId/transactions
推しメダル取引履歴

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page`: ページ番号
- `perPage`: 1ページあたりの件数

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "EARNED",
      "amount": 10,
      "balance": 25,
      "reason": "ガチャ購入",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": { /* pagination info */ }
}
```

## 交換所エンドポイント

### GET /exchange/:vtuberId/items
交換可能アイテム一覧

**Query Parameters:**
- `available`: 現在交換可能なもののみ (default: true)
- `page`: ページ番号
- `perPage`: 1ページあたりの件数

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "交換特典名",
      "description": "特典説明",
      "thumbnailUrl": "https://cdn.koepon.jp/exchange/uuid.jpg",
      "requiredMedals": 50,
      "maxExchangeCount": 1,
      "userExchangeCount": 0,
      "availableFrom": "2025-01-01T00:00:00Z",
      "availableTo": "2025-12-31T23:59:59Z",
      "rewards": [ /* ExchangeReward objects */ ]
    }
  ]
}
```

### POST /exchange/trade
アイテム交換

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "exchangeItemId": "uuid",
  "quantity": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "exchangeHistoryId": "uuid",
    "medalCost": 50,
    "newMedalBalance": 25,
    "rewards": [ /* ExchangeReward objects */ ]
  }
}
```

## 特典管理エンドポイント

### GET /rewards
ユーザーの特典一覧

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `type`: 特典タイプ ('GACHA' | 'EXCHANGE')
- `page`: ページ番号
- `perPage`: 1ページあたりの件数

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rewardType": "GACHA",
      "name": "特典名",
      "fileUrl": "masked-url",
      "downloadCount": 3,
      "lastDownloadedAt": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /rewards/:id/download-url
ダウンロードURL生成

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://cdn.koepon.jp/downloads/signed-url",
    "expiresAt": "2025-01-15T11:00:00Z",
    "fileName": "reward.zip",
    "fileSize": 1024000
  }
}
```

## ファイルアップロードエンドポイント

### POST /uploads/initiate
ファイルアップロード開始

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "fileName": "reward.zip",
  "fileSize": 1024000,
  "fileType": "ZIP",
  "contentType": "application/zip"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "uploadId": "uuid",
    "uploadUrl": "https://s3.amazonaws.com/presigned-url",
    "expiresAt": "2025-01-15T11:00:00Z"
  }
}
```

### POST /uploads/:id/complete
ファイルアップロード完了

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "fileId": "uuid",
    "fileUrl": "https://cdn.koepon.jp/files/uuid.zip",
    "thumbnailUrl": "https://cdn.koepon.jp/thumbnails/uuid.jpg"
  }
}
```

## VTuber管理エンドポイント

### POST /vtuber/application
VTuber申請

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "channelName": "チャンネル名",
  "channelUrl": "https://youtube.com/channel/xxx",
  "description": "チャンネル説明",
  "profileImageUrl": "https://cdn.koepon.jp/profiles/uuid.jpg"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "message": "申請を受け付けました。審査完了までお待ちください。"
  }
}
```

### GET /vtuber/me
VTuber情報取得

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "channelName": "チャンネル名",
    "status": "APPROVED",
    "totalRevenue": 50000,
    "totalPulls": 200,
    "activeMedals": 1500
  }
}
```

### POST /vtuber/gachas
ガチャ作成

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "name": "新春ガチャ",
  "description": "新春特別ガチャです",
  "singlePrice": 500,
  "tenPullPrice": 4500,
  "medalPerPull": 1,
  "startAt": "2025-01-01T00:00:00Z",
  "endAt": "2025-01-31T23:59:59Z",
  "items": [
    {
      "name": "レアボイス",
      "rarity": 5,
      "dropRate": 1.0,
      "rewards": [
        {
          "name": "新春ボイス",
          "type": "VOICE",
          "fileId": "uuid"
        }
      ]
    }
  ]
}
```

### GET /vtuber/dashboard/stats
VTuberダッシュボード統計

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `period`: 集計期間 ('7d' | '30d' | '90d' | '1y')

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 50000,
    "totalPulls": 200,
    "totalUsers": 150,
    "activeMedals": 1500,
    "topItems": [
      {
        "item": { /* GachaItem */ },
        "pullCount": 50
      }
    ],
    "revenueHistory": [
      {
        "date": "2025-01-15",
        "revenue": 5000
      }
    ]
  }
}
```

## 管理者エンドポイント

### GET /admin/vtubers/pending
承認待ちVTuber一覧

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "channelName": "チャンネル名",
      "channelUrl": "https://youtube.com/channel/xxx",
      "user": {
        "email": "vtuber@example.com",
        "username": "vtuber123"
      },
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST /admin/vtubers/:id/approve
VTuber承認

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Request:**
```json
{
  "notes": "承認理由"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "VTuberを承認しました"
  }
}
```

### POST /admin/vtubers/:id/reject
VTuber拒否

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Request:**
```json
{
  "reason": "拒否理由"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "VTuber申請を拒否しました"
  }
}
```

### GET /admin/dashboard/stats
管理者ダッシュボード統計

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalUsers": 10000,
    "totalVTubers": 50,
    "totalGachas": 200,
    "totalRevenue": 5000000,
    "dailyActiveUsers": 500,
    "pendingVTuberApprovals": 3
  }
}
```

## エラーレスポンス

### 一般的なエラー形式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラーが発生しました",
    "details": {
      "field": "email",
      "reason": "有効なメールアドレスを入力してください"
    }
  }
}
```

### 主要エラーコード

| HTTPステータス | エラーコード | 説明 |
|---------------|-------------|------|
| 400 | VALIDATION_ERROR | リクエストバリデーションエラー |
| 401 | UNAUTHORIZED | 認証が必要です |
| 403 | FORBIDDEN | アクセス権限がありません |
| 404 | NOT_FOUND | リソースが見つかりません |
| 409 | CONFLICT | データの競合が発生しました |
| 412 | PRECONDITION_FAILED | 前提条件が満たされていません |
| 429 | RATE_LIMIT_EXCEEDED | レート制限に達しました |
| 500 | INTERNAL_ERROR | サーバー内部エラー |
| 502 | BAD_GATEWAY | 外部サービスエラー |
| 503 | SERVICE_UNAVAILABLE | サービス利用不可 |

## WebSocket イベント

### 接続
**URL:** `wss://api.koepon.jp/v1/ws`
**Authentication:** Query parameter `token={jwt-token}`

### ガチャプル開始
```json
{
  "type": "GACHA_PULL_START",
  "payload": {
    "pullId": "uuid",
    "pullCount": 10
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### ガチャプル結果（各アイテムごと）
```json
{
  "type": "GACHA_PULL_RESULT",
  "payload": {
    "pullId": "uuid",
    "position": 1,
    "item": { /* GachaItem */ },
    "rewards": [ /* GachaReward[] */ ]
  },
  "timestamp": "2025-01-15T10:30:01Z"
}
```

### ガチャプル完了
```json
{
  "type": "GACHA_PULL_COMPLETE",
  "payload": {
    "pullId": "uuid",
    "medalEarned": 10,
    "newMedalBalance": 35
  },
  "timestamp": "2025-01-15T10:30:05Z"
}
```

## セキュリティ要件

### 認証
- JWTトークンは1時間で期限切れ
- Refresh tokenは30日で期限切れ
- トークンはHTTPOnly Cookieでも送信可能

### レート制限
- 認証済み: 100 req/min
- 未認証: 20 req/min
- ガチャ購入: 5 req/min
- ファイルアップロード: 10 req/hour

### CORS
- 許可オリジン: `https://koepon.jp`, `https://*.koepon.jp`
- 許可メソッド: GET, POST, PUT, DELETE, OPTIONS
- 許可ヘッダー: Authorization, Content-Type

### Content Security Policy
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://js.stripe.com;
style-src 'self' 'unsafe-inline';
img-src 'self' https://cdn.koepon.jp;
media-src 'self' https://cdn.koepon.jp;
connect-src 'self' https://api.koepon.jp wss://api.koepon.jp;
```