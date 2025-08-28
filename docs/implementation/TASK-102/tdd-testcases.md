# TASK-102: 認証・認可システム - テストケース定義

## 単体テスト仕様

### AuthService テストケース

#### validateUser メソッド
```typescript
describe('AuthService.validateUser', () => {
  it('should return user when credentials are valid', async () => {
    // Given: 有効なメール・パスワード
    // When: validateUser を実行
    // Then: ユーザー情報を返す
  });

  it('should return null when email not found', async () => {
    // Given: 存在しないメール
    // When: validateUser を実行  
    // Then: null を返す
  });

  it('should return null when password is incorrect', async () => {
    // Given: 正しいメール、間違ったパスワード
    // When: validateUser を実行
    // Then: null を返す
  });

  it('should handle database errors gracefully', async () => {
    // Given: データベースエラーが発生
    // When: validateUser を実行
    // Then: 適切な例外を投げる
  });
});
```

#### login メソッド
```typescript
describe('AuthService.login', () => {
  it('should return access and refresh tokens for valid credentials', async () => {
    // Given: 有効な認証情報
    // When: login を実行
    // Then: { accessToken, refreshToken, user } を返す
  });

  it('should create session record in database', async () => {
    // Given: 有効な認証情報
    // When: login を実行
    // Then: sessions テーブルにレコードが作成される
  });

  it('should throw UnauthorizedException for invalid credentials', async () => {
    // Given: 無効な認証情報
    // When: login を実行
    // Then: UnauthorizedException を投げる
  });

  it('should log security event on failed login', async () => {
    // Given: 無効な認証情報
    // When: login を実行
    // Then: セキュリティログが記録される
  });
});
```

#### refreshToken メソッド
```typescript
describe('AuthService.refreshToken', () => {
  it('should return new access token for valid refresh token', async () => {
    // Given: 有効なリフレッシュトークン
    // When: refreshToken を実行
    // Then: 新しいアクセストークンを返す
  });

  it('should throw UnauthorizedException for invalid refresh token', async () => {
    // Given: 無効なリフレッシュトークン
    // When: refreshToken を実行
    // Then: UnauthorizedException を投げる
  });

  it('should throw UnauthorizedException for expired refresh token', async () => {
    // Given: 期限切れのリフレッシュトークン
    // When: refreshToken を実行
    // Then: UnauthorizedException を投げる
  });
});
```

#### logout メソッド
```typescript
describe('AuthService.logout', () => {
  it('should remove session from database', async () => {
    // Given: 有効なセッション
    // When: logout を実行
    // Then: sessions テーブルからレコードが削除される
  });

  it('should handle non-existent session gracefully', async () => {
    // Given: 存在しないセッション
    // When: logout を実行
    // Then: エラーを投げずに完了する
  });
});
```

### PasswordService テストケース

#### hashPassword メソッド
```typescript
describe('PasswordService.hashPassword', () => {
  it('should return hashed password', async () => {
    // Given: 平文パスワード
    // When: hashPassword を実行
    // Then: ハッシュ化されたパスワードを返す
  });

  it('should generate different hashes for same password', async () => {
    // Given: 同じ平文パスワード
    // When: hashPassword を複数回実行
    // Then: 異なるハッシュを生成する（ソルト効果）
  });

  it('should take reasonable time to hash', async () => {
    // Given: パスワード
    // When: hashPassword を実行
    // Then: 100ms以内で完了する
  });
});
```

#### validatePassword メソッド
```typescript
describe('PasswordService.validatePassword', () => {
  it('should return true for correct password', async () => {
    // Given: 正しいパスワードとハッシュ
    // When: validatePassword を実行
    // Then: true を返す
  });

  it('should return false for incorrect password', async () => {
    // Given: 間違ったパスワードと正しいハッシュ
    // When: validatePassword を実行
    // Then: false を返す
  });

  it('should handle invalid hash format', async () => {
    // Given: 無効な形式のハッシュ
    // When: validatePassword を実行
    // Then: false を返す
  });
});
```

### JwtStrategy テストケース

```typescript
describe('JwtStrategy', () => {
  it('should validate valid JWT payload', async () => {
    // Given: 有効なJWTペイロード
    // When: validate を実行
    // Then: ユーザー情報を返す
  });

  it('should reject payload with invalid user ID', async () => {
    // Given: 無効なユーザーIDのペイロード
    // When: validate を実行
    // Then: UnauthorizedException を投げる
  });

  it('should reject payload from deleted user', async () => {
    // Given: 削除済みユーザーのペイロード
    // When: validate を実行
    // Then: UnauthorizedException を投げる
  });
});
```

### RolesGuard テストケース

```typescript
describe('RolesGuard', () => {
  it('should allow access for correct role', () => {
    // Given: ADMIN ロールが必要、ユーザーが ADMIN
    // When: canActivate を実行
    // Then: true を返す
  });

  it('should deny access for insufficient role', () => {
    // Given: ADMIN ロールが必要、ユーザーが FAN
    // When: canActivate を実行
    // Then: false を返す
  });

  it('should allow access for multiple valid roles', () => {
    // Given: ADMIN または VTUBER が必要、ユーザーが VTUBER
    // When: canActivate を実行
    // Then: true を返す
  });

  it('should allow access when no roles required', () => {
    // Given: ロール指定なし
    // When: canActivate を実行
    // Then: true を返す
  });
});
```

## 統合テスト仕様

### ログインフロー統合テスト

```typescript
describe('Login Flow Integration', () => {
  it('should complete full login flow successfully', async () => {
    // Given: 有効なユーザー認証情報
    // When: POST /auth/login
    // Then: 
    //   - 200 OK を返す
    //   - アクセストークンとリフレッシュトークンを返す
    //   - セッションがDBに保存される
    //   - ログが記録される
  });

  it('should handle invalid credentials properly', async () => {
    // Given: 無効な認証情報
    // When: POST /auth/login
    // Then:
    //   - 401 Unauthorized を返す
    //   - エラーメッセージを返す
    //   - セキュリティログが記録される
  });

  it('should enforce rate limiting', async () => {
    // Given: 連続した多数のログイン試行
    // When: POST /auth/login を連続実行
    // Then: 429 Too Many Requests を返す
  });
});
```

### 認証ガード統合テスト

```typescript
describe('Authentication Guard Integration', () => {
  it('should protect endpoint with valid token', async () => {
    // Given: 有効なJWTトークン
    // When: GET /protected-endpoint (Authorization: Bearer token)
    // Then: 200 OK でレスポンスを返す
  });

  it('should reject request without token', async () => {
    // Given: トークンなし
    // When: GET /protected-endpoint
    // Then: 401 Unauthorized を返す
  });

  it('should reject request with invalid token', async () => {
    // Given: 無効なJWTトークン
    // When: GET /protected-endpoint
    // Then: 401 Unauthorized を返す
  });

  it('should reject request with expired token', async () => {
    // Given: 期限切れのJWTトークン
    // When: GET /protected-endpoint
    // Then: 401 Unauthorized を返す
  });
});
```

### ロール認証統合テスト

```typescript
describe('Role-based Authorization Integration', () => {
  it('should allow admin access to admin endpoint', async () => {
    // Given: ADMIN ロールのユーザートークン
    // When: GET /admin/users
    // Then: 200 OK でレスポンスを返す
  });

  it('should deny fan access to admin endpoint', async () => {
    // Given: FAN ロールのユーザートークン
    // When: GET /admin/users
    // Then: 403 Forbidden を返す
  });

  it('should allow vtuber access to vtuber endpoint', async () => {
    // Given: VTUBER ロールのユーザートークン
    // When: GET /vtuber/dashboard
    // Then: 200 OK でレスポンスを返す
  });
});
```

### トークンリフレッシュ統合テスト

```typescript
describe('Token Refresh Integration', () => {
  it('should refresh token successfully', async () => {
    // Given: 有効なリフレッシュトークン
    // When: POST /auth/refresh
    // Then:
    //   - 200 OK を返す
    //   - 新しいアクセストークンを返す
    //   - セッション期限が更新される
  });

  it('should reject invalid refresh token', async () => {
    // Given: 無効なリフレッシュトークン
    // When: POST /auth/refresh
    // Then: 401 Unauthorized を返す
  });
});
```

## エラーハンドリングテスト

### セキュリティエラー
```typescript
describe('Security Error Handling', () => {
  it('should not expose sensitive information in error messages', async () => {
    // Given: 認証エラー状況
    // When: 認証が失敗
    // Then: 詳細なエラー情報を含まない汎用メッセージを返す
  });

  it('should log security events', async () => {
    // Given: セキュリティ関連のエラー
    // When: エラーが発生
    // Then: 適切なセキュリティログが記録される
  });
});
```

### パフォーマンステスト

```typescript
describe('Performance Tests', () => {
  it('should validate JWT within 10ms', async () => {
    // Given: 有効なJWTトークン
    // When: JWT検証を実行
    // Then: 10ms以内で完了する
  });

  it('should hash password within 100ms', async () => {
    // Given: パスワード
    // When: パスワードハッシュ化を実行
    // Then: 100ms以内で完了する
  });

  it('should handle 100 concurrent login requests', async () => {
    // Given: 100個の同時ログインリクエスト
    // When: 並行処理を実行
    // Then: すべて500ms以内で応答する
  });
});
```

## テスト実行順序

1. **PasswordService** 単体テスト
2. **AuthService** 単体テスト  
3. **JwtStrategy** 単体テスト
4. **RolesGuard** 単体テスト
5. **ログインフロー** 統合テスト
6. **認証ガード** 統合テスト
7. **ロール認証** 統合テスト
8. **エラーハンドリング** テスト
9. **パフォーマンス** テスト

## テスト環境要件

- テスト用Supabaseプロジェクト
- テスト用データベース（独立）
- テスト用JWT設定
- モックデータ準備