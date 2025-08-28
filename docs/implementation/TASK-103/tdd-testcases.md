# TASK-103: ユーザー管理API - テストケース定義

## 単体テスト仕様

### UserService テストケース

#### registerUser メソッド
```typescript
describe('UserService.registerUser', () => {
  it('should create new user with valid data', async () => {
    // Given: 有効なユーザー登録データ
    // When: registerUser を実行
    // Then: ユーザーが作成され、認証トークンが返される
  });

  it('should throw ConflictException for duplicate email', async () => {
    // Given: 既に存在するメールアドレス
    // When: registerUser を実行
    // Then: ConflictException を投げる
  });

  it('should throw ConflictException for duplicate username', async () => {
    // Given: 既に存在するユーザー名
    // When: registerUser を実行
    // Then: ConflictException を投げる
  });

  it('should hash password before saving', async () => {
    // Given: 平文パスワード
    // When: registerUser を実行
    // Then: パスワードがハッシュ化されて保存される
  });

  it('should set default role as FAN', async () => {
    // Given: ロール指定なしの登録データ
    // When: registerUser を実行
    // Then: ロールが 'FAN' に設定される
  });

  it('should create session after registration', async () => {
    // Given: 有効な登録データ
    // When: registerUser を実行
    // Then: セッションが作成される
  });
});
```

#### getUserById メソッド
```typescript
describe('UserService.getUserById', () => {
  it('should return user data for valid ID', async () => {
    // Given: 存在するユーザーID
    // When: getUserById を実行
    // Then: ユーザー情報を返す
  });

  it('should return null for non-existent ID', async () => {
    // Given: 存在しないユーザーID
    // When: getUserById を実行
    // Then: null を返す
  });

  it('should not return password hash in response', async () => {
    // Given: 有効なユーザーID
    // When: getUserById を実行
    // Then: レスポンスにパスワードハッシュが含まれない
  });

  it('should return public fields only for other users', async () => {
    // Given: 他のユーザーのID、リクエストユーザー情報
    // When: getUserById を実行
    // Then: 公開情報のみを返す
  });

  it('should return all fields for own profile', async () => {
    // Given: 自分のユーザーID
    // When: getUserById を実行
    // Then: 全ての情報を返す
  });
});
```

#### updateUser メソッド
```typescript
describe('UserService.updateUser', () => {
  it('should update user profile successfully', async () => {
    // Given: 有効な更新データ
    // When: updateUser を実行
    // Then: ユーザー情報が更新される
  });

  it('should throw ConflictException for duplicate username', async () => {
    // Given: 既存のユーザー名に変更しようとするデータ
    // When: updateUser を実行
    // Then: ConflictException を投げる
  });

  it('should update only provided fields', async () => {
    // Given: 一部のフィールドのみの更新データ
    // When: updateUser を実行
    // Then: 指定フィールドのみ更新される
  });

  it('should throw NotFoundException for non-existent user', async () => {
    // Given: 存在しないユーザーID
    // When: updateUser を実行
    // Then: NotFoundException を投げる
  });

  it('should update timestamps', async () => {
    // Given: 更新データ
    // When: updateUser を実行
    // Then: updated_at が現在時刻に更新される
  });
});
```

#### changePassword メソッド
```typescript
describe('UserService.changePassword', () => {
  it('should change password with valid credentials', async () => {
    // Given: 正しい現在パスワードと新パスワード
    // When: changePassword を実行
    // Then: パスワードが変更される
  });

  it('should throw UnauthorizedException for wrong current password', async () => {
    // Given: 間違った現在パスワード
    // When: changePassword を実行
    // Then: UnauthorizedException を投げる
  });

  it('should hash new password', async () => {
    // Given: 平文の新パスワード
    // When: changePassword を実行
    // Then: 新パスワードがハッシュ化される
  });

  it('should invalidate all user sessions', async () => {
    // Given: パスワード変更データ
    // When: changePassword を実行
    // Then: ユーザーの全セッションが無効化される
  });

  it('should reject same password as current', async () => {
    // Given: 現在と同じパスワード
    // When: changePassword を実行
    // Then: BadRequestException を投げる
  });
});
```

#### uploadAvatar メソッド
```typescript
describe('UserService.uploadAvatar', () => {
  it('should upload valid image file', async () => {
    // Given: 有効な画像ファイル
    // When: uploadAvatar を実行
    // Then: 画像がアップロードされ、URLが返される
  });

  it('should throw BadRequestException for invalid file type', async () => {
    // Given: 無効なファイル形式
    // When: uploadAvatar を実行
    // Then: BadRequestException を投げる
  });

  it('should throw PayloadTooLargeException for large file', async () => {
    // Given: 5MBを超えるファイル
    // When: uploadAvatar を実行
    // Then: PayloadTooLargeException を投げる
  });

  it('should delete old avatar when uploading new one', async () => {
    // Given: 既にアバターが設定されているユーザー、新しいアバター
    // When: uploadAvatar を実行
    // Then: 古いアバターが削除され、新しいアバターが設定される
  });

  it('should resize image to 500x500', async () => {
    // Given: 500x500より大きな画像
    // When: uploadAvatar を実行
    // Then: 500x500にリサイズされる
  });
});
```

#### searchUsers メソッド
```typescript
describe('UserService.searchUsers', () => {
  it('should return users matching search query', async () => {
    // Given: 検索クエリ
    // When: searchUsers を実行
    // Then: マッチするユーザーのリストを返す
  });

  it('should search by username and display name', async () => {
    // Given: ユーザー名または表示名にマッチするクエリ
    // When: searchUsers を実行
    // Then: 該当するユーザーを返す
  });

  it('should respect limit parameter', async () => {
    // Given: limit パラメータ
    // When: searchUsers を実行
    // Then: 指定した件数以下でユーザーを返す
  });

  it('should respect offset parameter', async () => {
    // Given: offset パラメータ
    // When: searchUsers を実行
    // Then: 指定した位置からユーザーを返す
  });

  it('should return empty array for no matches', async () => {
    // Given: マッチしない検索クエリ
    // When: searchUsers を実行
    // Then: 空の配列を返す
  });
});
```

### ValidationPipe テストケース

#### User Registration Validation
```typescript
describe('User Registration Validation', () => {
  it('should validate email format', async () => {
    // Given: 無効なメールアドレス形式
    // When: バリデーションを実行
    // Then: バリデーションエラーを投げる
  });

  it('should validate password length', async () => {
    // Given: 8文字未満のパスワード
    // When: バリデーションを実行
    // Then: バリデーションエラーを投げる
  });

  it('should validate username length and format', async () => {
    // Given: 3文字未満または20文字超のユーザー名
    // When: バリデーションを実行
    // Then: バリデーションエラーを投げる
  });

  it('should validate display name length', async () => {
    // Given: 50文字を超える表示名
    // When: バリデーションを実行
    // Then: バリデーションエラーを投げる
  });

  it('should validate birth date format', async () => {
    // Given: YYYY-MM-DD以外の形式の生年月日
    // When: バリデーションを実行
    // Then: バリデーションエラーを投げる
  });
});
```

### XSS対策テスト
```typescript
describe('XSS Protection', () => {
  it('should sanitize HTML in display name', async () => {
    // Given: HTML タグを含む表示名
    // When: ユーザー情報を保存/取得
    // Then: HTML タグがサニタイズされる
  });

  it('should sanitize script tags in username', async () => {
    // Given: <script> タグを含むユーザー名
    // When: ユーザー情報を保存/取得
    // Then: スクリプトタグが除去される
  });

  it('should escape special characters', async () => {
    // Given: 特殊文字を含む入力
    // When: データベースに保存
    // Then: 特殊文字が適切にエスケープされる
  });
});
```

## 統合テスト仕様

### ユーザー登録フロー統合テスト
```typescript
describe('User Registration Flow Integration', () => {
  it('should complete full registration flow', async () => {
    // Given: 有効な登録データ
    // When: POST /api/v1/users/register
    // Then: 
    //   - 201 Created を返す
    //   - ユーザーがDBに作成される
    //   - セッションが作成される
    //   - アクセストークンとリフレッシュトークンが返される
  });

  it('should prevent duplicate email registration', async () => {
    // Given: 既に登録されたメールアドレス
    // When: POST /api/v1/users/register
    // Then:
    //   - 409 Conflict を返す
    //   - 適切なエラーメッセージを返す
  });

  it('should prevent duplicate username registration', async () => {
    // Given: 既に登録されたユーザー名
    // When: POST /api/v1/users/register
    // Then:
    //   - 409 Conflict を返す
    //   - 適切なエラーメッセージを返す
  });

  it('should enforce rate limiting', async () => {
    // Given: 短時間での複数回登録試行
    // When: POST /api/v1/users/register を連続実行
    // Then: 429 Too Many Requests を返す
  });
});
```

### プロフィール管理統合テスト
```typescript
describe('Profile Management Integration', () => {
  it('should get user profile with authentication', async () => {
    // Given: 有効な認証トークン
    // When: GET /api/v1/users/profile
    // Then: 200 OK でユーザー情報を返す
  });

  it('should reject unauthenticated profile access', async () => {
    // Given: 認証トークンなし
    // When: GET /api/v1/users/profile
    // Then: 401 Unauthorized を返す
  });

  it('should update profile successfully', async () => {
    // Given: 有効な認証トークンと更新データ
    // When: PUT /api/v1/users/profile
    // Then:
    //   - 200 OK を返す
    //   - データベースが更新される
    //   - 更新された情報を返す
  });

  it('should get other user public profile', async () => {
    // Given: 他のユーザーのID
    // When: GET /api/v1/users/:userId
    // Then: 200 OK で公開情報のみを返す
  });
});
```

### ファイルアップロード統合テスト
```typescript
describe('File Upload Integration', () => {
  it('should upload profile image successfully', async () => {
    // Given: 有効な認証トークンと画像ファイル
    // When: POST /api/v1/users/profile/avatar
    // Then:
    //   - 200 OK を返す
    //   - ストレージにファイルが保存される
    //   - profile_image_url が更新される
  });

  it('should reject invalid file types', async () => {
    // Given: 無効なファイル形式（.txt等）
    // When: POST /api/v1/users/profile/avatar
    // Then: 400 Bad Request を返す
  });

  it('should reject oversized files', async () => {
    // Given: 5MBを超えるファイル
    // When: POST /api/v1/users/profile/avatar
    // Then: 413 Payload Too Large を返す
  });

  it('should delete profile image', async () => {
    // Given: プロフィール画像が設定されているユーザー
    // When: DELETE /api/v1/users/profile/avatar
    // Then:
    //   - 200 OK を返す
    //   - ストレージからファイルが削除される
    //   - profile_image_url が null に更新される
  });
});
```

### パスワード管理統合テスト
```typescript
describe('Password Management Integration', () => {
  it('should change password successfully', async () => {
    // Given: 有効な現在パスワードと新パスワード
    // When: PUT /api/v1/users/password
    // Then:
    //   - 200 OK を返す
    //   - パスワードハッシュが更新される
    //   - 全セッションが無効化される
  });

  it('should reject wrong current password', async () => {
    // Given: 間違った現在パスワード
    // When: PUT /api/v1/users/password
    // Then: 401 Unauthorized を返す
  });

  it('should enforce password change rate limiting', async () => {
    // Given: 短時間での複数回パスワード変更試行
    // When: PUT /api/v1/users/password を連続実行
    // Then: 429 Too Many Requests を返す
  });
});
```

### ユーザー検索統合テスト
```typescript
describe('User Search Integration', () => {
  it('should search users successfully', async () => {
    // Given: 検索クエリ
    // When: GET /api/v1/users/search?q=keyword
    // Then:
    //   - 200 OK を返す
    //   - マッチするユーザー情報を返す
    //   - ページネーション情報を返す
  });

  it('should respect search limits', async () => {
    // Given: limit パラメータ
    // When: GET /api/v1/users/search?q=keyword&limit=5
    // Then: 指定した件数以下でユーザーを返す
  });

  it('should handle empty search results', async () => {
    // Given: マッチしない検索クエリ
    // When: GET /api/v1/users/search?q=nonexistent
    // Then: 200 OK で空の結果を返す
  });

  it('should enforce search rate limiting', async () => {
    // Given: 短時間での大量検索リクエスト
    // When: GET /api/v1/users/search を大量実行
    // Then: 429 Too Many Requests を返す
  });
});
```

## エラーハンドリングテスト

### バリデーションエラー
```typescript
describe('Validation Error Handling', () => {
  it('should return detailed validation errors', async () => {
    // Given: 複数のバリデーションエラーがある入力
    // When: API を実行
    // Then: 422 Unprocessable Entity で詳細なエラー情報を返す
  });

  it('should not expose sensitive information in errors', async () => {
    // Given: システムエラーが発生
    // When: エラーが発生
    // Then: 内部エラー詳細を含まない汎用メッセージを返す
  });
});
```

### セキュリティエラー
```typescript
describe('Security Error Handling', () => {
  it('should log security events', async () => {
    // Given: 不正なアクセス試行
    // When: セキュリティエラーが発生
    // Then: セキュリティログが記録される
  });

  it('should handle malicious file upload attempts', async () => {
    // Given: 悪意のあるファイル
    // When: ファイルアップロード
    // Then: 適切にブロックしエラーを返す
  });
});
```

## パフォーマンステスト

### レスポンス時間テスト
```typescript
describe('Performance Tests', () => {
  it('should respond to profile get within 200ms', async () => {
    // Given: ユーザー情報取得リクエスト
    // When: GET /api/v1/users/profile
    // Then: 200ms以内で応答する
  });

  it('should complete registration within 500ms', async () => {
    // Given: ユーザー登録リクエスト
    // When: POST /api/v1/users/register
    // Then: 500ms以内で完了する
  });

  it('should handle 100 concurrent profile updates', async () => {
    // Given: 100個の同時プロフィール更新リクエスト
    // When: 並行処理を実行
    // Then: 全て成功し、データ整合性を保つ
  });

  it('should complete image upload within 10 seconds', async () => {
    // Given: 画像ファイルアップロード
    // When: POST /api/v1/users/profile/avatar
    // Then: 10秒以内で完了する
  });
});
```

## テスト実行順序

1. **PasswordService** 単体テスト（認証システムから既存）
2. **UserService** 単体テスト
3. **ValidationPipe** テスト
4. **XSS対策** テスト
5. **ユーザー登録フロー** 統合テスト
6. **プロフィール管理** 統合テスト
7. **ファイルアップロード** 統合テスト
8. **パスワード管理** 統合テスト
9. **ユーザー検索** 統合テスト
10. **エラーハンドリング** テスト
11. **パフォーマンス** テスト

## テスト環境要件

- テスト用Supabaseプロジェクト
- テスト用ストレージバケット
- テスト用JWT設定
- モックファイルアップロード機能
- テスト用画像ファイル準備