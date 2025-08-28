# TASK-102: 認証・認可システム - 要件定義

## 概要
Supabase Authと統合したJWT認証システムを実装し、セキュアな認証・認可機能を提供する。

## 機能要件

### 1. JWT認証システム
- Supabase Auth JWTトークンの検証
- アクセストークンの生成・検証
- リフレッシュトークンによるトークン更新
- トークン期限管理

### 2. パスワード認証
- bcryptによるパスワードハッシュ化
- パスワード強度チェック
- ログイン試行回数制限

### 3. セッション管理
- セッション作成・削除・検証
- 複数デバイスログイン対応
- セッション期限管理
- 強制ログアウト機能

### 4. 権限管理
- ロールベースアクセス制御（RBAC）
- ユーザーロール: FAN, VTUBER, ADMIN
- リソース別アクセス制御
- 階層的権限管理

### 5. 認証ミドルウェア
- JWTガード実装
- ロール認証ガード
- オプション認証（認証不要エンドポイント）

## 非機能要件

### セキュリティ要件
- JWT secret の安全な管理
- トークン漏洩対策
- CSRF攻撃対策
- パスワード総当たり攻撃対策
- セッションハイジャック対策

### パフォーマンス要件
- JWT検証: 10ms以内
- ログイン処理: 500ms以内
- パスワードハッシュ: 100ms以内

### 可用性要件
- 認証サービス稼働率: 99.9%
- Graceful degradation（Supabase障害時の対応）

## API仕様

### 認証エンドポイント
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/profile
```

### 認証ガード
```typescript
@UseGuards(JwtAuthGuard)
@UseGuards(RolesGuard)
@Roles('ADMIN', 'VTUBER')
```

## データモデル

### JWTペイロード
```typescript
interface JwtPayload {
  sub: string;        // user ID
  email: string;      // user email
  role: UserRole;     // user role
  iat: number;        // issued at
  exp: number;        // expires at
}
```

### セッション情報
```typescript
interface SessionInfo {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

## エラー処理

### 認証エラー
- 401 Unauthorized: 認証情報なし・無効
- 403 Forbidden: 権限不足
- 429 Too Many Requests: レート制限

### バリデーションエラー
- 400 Bad Request: 不正な入力値
- 422 Unprocessable Entity: バリデーション失敗

## テスト要件

### 単体テスト
- AuthService の各メソッド
- JwtStrategy の検証ロジック
- PasswordService のハッシュ化・検証
- RolesGuard の権限チェック

### 統合テスト
- ログインフロー全体
- トークンリフレッシュフロー
- 権限チェックフロー
- エラーハンドリング

### セキュリティテスト
- 無効トークンでのアクセス
- 期限切れトークン
- 権限不足でのアクセス
- SQLインジェクション耐性

## 受け入れ基準

### 必須機能
- [ ] Supabase Authとの正常な連携
- [ ] JWT認証の正常動作
- [ ] ロールベース認証の実装
- [ ] セッション管理機能
- [ ] セキュリティ要件の満足

### 品質基準
- [ ] テストカバレッジ90%以上
- [ ] セキュリティベストプラクティス準拠
- [ ] エラーハンドリング完備
- [ ] ログ・監査機能実装

### パフォーマンス基準
- [ ] JWT検証 < 10ms
- [ ] ログイン処理 < 500ms
- [ ] 同時100ユーザー対応

## 実装順序
1. AuthModule, AuthService基盤
2. JwtStrategy, JwtAuthGuard実装
3. PasswordService実装
4. RolesGuard, セッション管理
5. AuthController, エンドポイント
6. 統合テスト・エラーハンドリング