# TASK-204: 特典管理システム - テストケース設計

## 🧪 テストケース一覧

### 1. 単体テスト（RewardService）

#### 1.1 ファイルアップロードテスト
```typescript
describe('RewardService - File Upload', () => {
  it('should upload valid image file successfully');
  it('should upload valid audio file successfully');
  it('should upload valid video file successfully');
  it('should upload valid text file successfully');
  it('should reject invalid file format');
  it('should reject oversized files (>50MB)');
  it('should reject files with malicious content');
  it('should generate unique file keys');
  it('should save file metadata correctly');
});
```

#### 1.2 署名付きURL生成テスト
```typescript
describe('RewardService - Signed URL Generation', () => {
  it('should generate signed URL with 24h expiration');
  it('should generate unique URLs for each request');
  it('should handle storage service errors gracefully');
  it('should validate reward access permissions');
  it('should reject expired rewards');
});
```

#### 1.3 ダウンロード制御テスト
```typescript
describe('RewardService - Download Control', () => {
  it('should allow download within daily limit');
  it('should reject downloads exceeding daily limit');
  it('should reset daily counter at midnight');
  it('should track download history correctly');
  it('should handle concurrent download requests');
});
```

#### 1.4 特典BOX管理テスト
```typescript
describe('RewardService - Reward Box Management', () => {
  it('should list user rewards with pagination');
  it('should filter rewards by category');
  it('should filter rewards by VTuber');
  it('should filter rewards by date range');
  it('should search rewards by name');
  it('should handle empty reward box');
});
```

### 2. 統合テスト（RewardController）

#### 2.1 API認証・認可テスト
```typescript
describe('RewardController - Authentication & Authorization', () => {
  it('should require JWT token for protected endpoints');
  it('should allow VTuber to manage own rewards');
  it('should allow Admin to manage all rewards');
  it('should deny unauthorized access');
  it('should validate user permissions for download');
});
```

#### 2.2 ファイルアップロードAPIテスト
```typescript
describe('RewardController - File Upload API', () => {
  it('should handle multipart file upload');
  it('should validate file format and size');
  it('should return reward creation response');
  it('should handle upload errors gracefully');
  it('should validate required metadata fields');
});
```

#### 2.3 特典BOX APIテスト
```typescript
describe('RewardController - Reward Box API', () => {
  it('should return user reward list');
  it('should handle pagination parameters');
  it('should apply filters correctly');
  it('should return empty list for new users');
  it('should handle invalid query parameters');
});
```

#### 2.4 ダウンロードAPIテスト
```typescript
describe('RewardController - Download API', () => {
  it('should generate download URL for owned reward');
  it('should reject download for unowned reward');
  it('should respect daily download limits');
  it('should log download attempts');
  it('should handle storage service failures');
});
```

### 3. ストレージ連携テスト

#### 3.1 S3/R2連携テスト
```typescript
describe('StorageService Integration', () => {
  it('should upload file to S3/R2 successfully');
  it('should generate valid signed URLs');
  it('should delete files when reward is removed');
  it('should handle storage service outages');
  it('should validate file integrity after upload');
});
```

#### 3.2 CDN連携テスト
```typescript
describe('CDN Integration', () => {
  it('should serve files through CDN');
  it('should handle CDN cache invalidation');
  it('should fallback to origin on CDN failure');
});
```

### 4. パフォーマンステスト

#### 4.1 アップロード性能テスト
```typescript
describe('Upload Performance', () => {
  it('should upload 50MB file within 5 seconds');
  it('should handle 100 concurrent uploads');
  it('should maintain performance under load');
});
```

#### 4.2 ダウンロード性能テスト
```typescript
describe('Download Performance', () => {
  it('should generate signed URL within 1 second');
  it('should handle 1000 concurrent download requests');
  it('should maintain CDN performance');
});
```

### 5. セキュリティテスト

#### 5.1 ファイルセキュリティテスト
```typescript
describe('File Security', () => {
  it('should detect and reject malicious files');
  it('should validate MIME types correctly');
  it('should prevent path traversal attacks');
  it('should sanitize file names');
});
```

#### 5.2 アクセスセキュリティテスト
```typescript
describe('Access Security', () => {
  it('should prevent unauthorized file access');
  it('should validate JWT tokens properly');
  it('should prevent reward enumeration attacks');
  it('should log all access attempts');
});
```

### 6. エラーハンドリングテスト

#### 6.1 ストレージエラーテスト
```typescript
describe('Storage Error Handling', () => {
  it('should handle S3/R2 service outages');
  it('should handle network timeouts');
  it('should handle storage quota exceeded');
  it('should handle corrupted file scenarios');
});
```

#### 6.2 データベースエラーテスト
```typescript
describe('Database Error Handling', () => {
  it('should handle database connection failures');
  it('should handle transaction rollbacks');
  it('should handle constraint violations');
  it('should handle concurrent access conflicts');
});
```

## 📊 成功基準

### 1. 機能テスト
- 全API エンドポイントが正常動作
- ファイルアップロード・ダウンロードが完全動作
- 制限・権限管理が適切に機能

### 2. パフォーマンステスト
- 50MBファイルのアップロード5秒以内
- 署名付きURL生成1秒以内
- 100同時アップロード対応

### 3. セキュリティテスト
- 悪意あるファイルの検出・拒否
- 未認証アクセスの完全ブロック
- ダウンロード制限の確実な実行

### 4. 統合テスト
- ガチャシステムとの連携動作
- 推しメダルシステムとの連携動作
- データベース整合性の維持