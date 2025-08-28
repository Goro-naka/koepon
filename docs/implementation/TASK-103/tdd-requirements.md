# TASK-103: ユーザー管理API - 要件定義

## 概要
認証システム（TASK-102）を基盤として、ユーザーの登録・管理・プロフィール機能を提供するAPIシステムを実装する。

## 機能要件

### 1. ユーザー登録API

#### POST /api/v1/users/register
- **目的**: 新規ユーザーアカウント作成
- **入力**:
  ```typescript
  {
    email: string;           // メールアドレス
    password: string;        // パスワード（8文字以上）
    username: string;        // ユーザー名（3-20文字）
    displayName: string;     // 表示名（1-50文字）
    birthDate?: string;      // 生年月日（YYYY-MM-DD形式）
  }
  ```
- **出力**:
  ```typescript
  {
    user: {
      id: string;
      email: string;
      username: string;
      displayName: string;
      role: 'FAN';
      createdAt: string;
    };
    accessToken: string;
    refreshToken: string;
  }
  ```
- **ビジネスルール**:
  - メールアドレスは一意である必要がある
  - ユーザー名は一意である必要がある
  - パスワードはbcryptでハッシュ化する
  - 新規ユーザーのデフォルトロールは'FAN'
  - 登録完了後、自動的にログイン状態にする

### 2. ユーザー情報取得API

#### GET /api/v1/users/profile
- **認証**: JWT認証必須
- **目的**: 現在ログイン中のユーザー情報取得
- **出力**:
  ```typescript
  {
    id: string;
    email: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    role: string;
    birthDate?: string;
    createdAt: string;
    updatedAt: string;
  }
  ```

#### GET /api/v1/users/:userId
- **認証**: JWT認証必須
- **目的**: 指定ユーザーの公開情報取得
- **出力**:
  ```typescript
  {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl?: string;
    createdAt: string;
  }
  ```
- **権限制御**:
  - 自分の情報: 全情報表示
  - 他人の情報: 公開情報のみ表示

### 3. ユーザー情報更新API

#### PUT /api/v1/users/profile
- **認証**: JWT認証必須
- **目的**: ユーザーのプロフィール情報更新
- **入力**:
  ```typescript
  {
    username?: string;        // ユーザー名（3-20文字）
    displayName?: string;     // 表示名（1-50文字）
    birthDate?: string;       // 生年月日（YYYY-MM-DD形式）
  }
  ```
- **出力**: 更新後のユーザー情報
- **ビジネスルール**:
  - メールアドレスは更新不可（別途専用API必要）
  - ユーザー名変更時は重複チェック必要
  - パスワード変更は別途専用API

### 4. プロフィール画像管理API

#### POST /api/v1/users/profile/avatar
- **認証**: JWT認証必須
- **目的**: プロフィール画像のアップロード
- **入力**: FormData with file
  ```typescript
  {
    avatar: File; // 画像ファイル
  }
  ```
- **出力**:
  ```typescript
  {
    profileImageUrl: string;
  }
  ```
- **ビジネスルール**:
  - ファイル形式: JPEG, PNG, WebPのみ
  - ファイルサイズ: 最大5MB
  - 自動リサイズ: 500x500px
  - 既存画像は自動削除
  - CloudflareまたはSupabase Storageに保存

#### DELETE /api/v1/users/profile/avatar
- **認証**: JWT認証必須
- **目的**: プロフィール画像の削除
- **出力**: 削除成功メッセージ

### 5. パスワード管理API

#### PUT /api/v1/users/password
- **認証**: JWT認証必須
- **目的**: パスワード変更
- **入力**:
  ```typescript
  {
    currentPassword: string; // 現在のパスワード
    newPassword: string;     // 新しいパスワード（8文字以上）
  }
  ```
- **出力**: 成功メッセージ
- **ビジネスルール**:
  - 現在のパスワード検証必須
  - 新パスワードは現在のものと異なる必要
  - パスワード変更後、全セッション無効化

### 6. ユーザー検索API

#### GET /api/v1/users/search
- **認証**: JWT認証必須
- **目的**: ユーザー検索機能
- **クエリパラメータ**:
  - `q`: 検索キーワード（ユーザー名・表示名）
  - `limit`: 取得件数（デフォルト: 20、最大: 100）
  - `offset`: オフセット
- **出力**:
  ```typescript
  {
    users: Array<{
      id: string;
      username: string;
      displayName: string;
      profileImageUrl?: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  }
  ```

## 非機能要件

### セキュリティ要件
- **入力値サニタイゼーション**: XSS攻撃対策
- **SQLインジェクション対策**: パラメータ化クエリ使用
- **レート制限**: 
  - 登録API: 5回/時間/IP
  - パスワード変更: 3回/時間/ユーザー
  - 検索API: 100回/分/ユーザー
- **データマスキング**: ログにパスワードを記録しない
- **HTTPS必須**: 本番環境では全通信暗号化

### パフォーマンス要件
- **レスポンス時間**: 
  - 情報取得系API: 200ms以内
  - 更新系API: 500ms以内
  - ファイルアップロード: 10秒以内
- **同時接続**: 1000ユーザー対応
- **データベース最適化**: インデックス設定

### データ整合性
- **トランザクション管理**: 複数テーブル操作時
- **外部キー制約**: リレーション整合性保証
- **データバリデーション**: アプリケーションレベルとDB制約の両方

## API仕様

### 共通ヘッダー
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN> (認証必須API)
```

### 共通レスポンス形式

#### 成功時
```typescript
{
  success: true;
  data: <実際のデータ>;
  message?: string;
}
```

#### エラー時
```typescript
{
  success: false;
  error: {
    code: string;     // エラーコード
    message: string;  // エラーメッセージ
    details?: any;    // 詳細情報（バリデーションエラーなど）
  };
}
```

### エラーコード定義

| コード | メッセージ | HTTPステータス |
|--------|------------|----------------|
| USER_EMAIL_EXISTS | Email already exists | 409 |
| USER_USERNAME_EXISTS | Username already exists | 409 |
| USER_NOT_FOUND | User not found | 404 |
| INVALID_CREDENTIALS | Invalid credentials | 401 |
| FILE_TOO_LARGE | File size too large | 413 |
| INVALID_FILE_TYPE | Invalid file type | 400 |
| VALIDATION_ERROR | Validation failed | 422 |
| RATE_LIMIT_EXCEEDED | Too many requests | 429 |

## データモデル

### Users テーブル拡張
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'FAN',
  profile_image_url TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- インデックス
  INDEX idx_users_email (email),
  INDEX idx_users_username (username),
  INDEX idx_users_role (role),
  INDEX idx_users_created_at (created_at)
);
```

### User Profiles テーブル（将来拡張用）
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  website_url TEXT,
  twitter_handle VARCHAR(50),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## テスト要件

### 単体テスト
- [ ] ユーザーCRUD操作テスト
- [ ] バリデーション機能テスト
- [ ] XSS対策テスト
- [ ] ファイルアップロード処理テスト
- [ ] パスワードハッシュ化テスト

### 統合テスト
- [ ] ユーザー登録フローテスト
- [ ] プロフィール更新フローテスト
- [ ] 認証連携テスト

### E2Eテスト
- [ ] ブラウザでの登録フロー
- [ ] ファイルアップロード機能
- [ ] エラーハンドリング確認

## 受け入れ基準

### 必須機能
- [ ] ユーザー登録機能の正常動作
- [ ] 認証システムとの連携
- [ ] プロフィール画像アップロード
- [ ] 入力値バリデーション実装
- [ ] XSS対策実装

### 品質基準
- [ ] テストカバレッジ90%以上
- [ ] セキュリティベストプラクティス準拠
- [ ] エラーハンドリング完備
- [ ] API仕様書完備

### パフォーマンス基準
- [ ] 情報取得API < 200ms
- [ ] 更新系API < 500ms
- [ ] ファイルアップロード < 10秒

## 実装順序
1. UserService基盤実装
2. ユーザー登録・情報取得API
3. プロフィール更新API
4. ファイルアップロード機能
5. パスワード管理API
6. ユーザー検索API
7. バリデーション・セキュリティ強化
8. 統合テスト・エラーハンドリング