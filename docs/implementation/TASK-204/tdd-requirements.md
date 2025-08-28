# TASK-204: 特典管理システム実装 - TDD要件定義

## 🎯 タスク概要

**タスク**: 特典管理システム実装  
**タイプ**: TDD  
**依存タスク**: TASK-203（推しメダルシステム実装）  
**要件リンク**: REQ-005, REQ-006, REQ-010, REQ-403, NFR-003

## 📋 要件定義

### 1. 機能要件

#### 1.1 ファイルアップロード機能
- **ファイル形式**: 画像（JPG、PNG、GIF）、音声（MP3、WAV）、動画（MP4、MOV）、テキスト（TXT、PDF）
- **ファイルサイズ制限**: 最大50MB
- **ウイルススキャン**: アップロード時の自動検査
- **メタデータ管理**: ファイル名、サイズ、アップロード日時、作成者

#### 1.2 S3/R2連携
- **クラウドストレージ**: AWS S3またはCloudflare R2対応
- **署名付きURL**: 一時的なダウンロードURL生成（24時間有効）
- **CDN連携**: 高速配信のためのCDN統合
- **権限管理**: ユーザー別アクセス制御

#### 1.3 特典BOX実装
- **特典一覧**: ユーザーが獲得した特典の表示
- **カテゴリ分類**: 画像、音声、動画、テキストでの分類
- **検索・フィルタ**: 名前、日付、VTuberでの絞り込み
- **ダウンロード管理**: 再ダウンロード制限（1日3回まで）

#### 1.4 ダウンロード履歴管理
- **アクセスログ**: いつ、誰が、何をダウンロードしたか記録
- **制限管理**: ダウンロード回数制限の実装
- **統計情報**: VTuber別ダウンロード統計

### 2. パフォーマンス要件
- **アップロード時間**: 50MB以下なら5秒以内
- **ダウンロード時間**: 署名付きURL生成1秒以内
- **同時アップロード**: 100ファイル同時対応
- **ストレージ容量**: 無制限（クラウド連携）

### 3. セキュリティ要件
- **アクセス制御**: JWT認証必須
- **ファイル検証**: MIME type検証
- **悪意あるファイル**: ウイルススキャン、実行可能ファイル拒否
- **データ暗号化**: ストレージでの暗号化

### 4. データモデル

#### 4.1 Reward Entity
```typescript
interface Reward {
  id: string;                    // UUID
  vtuberId: string;              // VTuber ID
  name: string;                  // 特典名
  description: string;           // 特典説明
  category: RewardCategory;      // カテゴリ（image/audio/video/text）
  fileUrl: string;               // S3/R2上のファイルURL
  fileName: string;              // 元ファイル名
  fileSize: number;              // ファイルサイズ（bytes）
  mimeType: string;              // MIME type
  downloadLimit: number;         // ダウンロード制限（回/日）
  isActive: boolean;             // 配布状態
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### 4.2 UserReward Entity
```typescript
interface UserReward {
  id: string;                    // UUID
  userId: string;                // ユーザーID
  rewardId: string;              // 特典ID
  gachaResultId?: string;        // ガチャ結果ID（ガチャで獲得した場合）
  exchangeTransactionId?: string; // 交換取引ID（交換で獲得した場合）
  acquiredAt: Date;              // 獲得日時
  firstDownloadAt?: Date;        // 初回ダウンロード日時
  lastDownloadAt?: Date;         // 最新ダウンロード日時
  downloadCount: number;         // 累計ダウンロード回数
  dailyDownloadCount: number;    // 今日のダウンロード回数
  lastDownloadDate: Date;        // 最後にダウンロードした日付
}
```

#### 4.3 DownloadLog Entity
```typescript
interface DownloadLog {
  id: string;                    // UUID
  userId: string;                // ユーザーID
  rewardId: string;              // 特典ID
  userRewardId: string;          // ユーザー特典ID
  downloadUrl: string;           // ダウンロードURL
  userAgent: string;             // ユーザーエージェント
  ipAddress: string;             // IPアドレス
  downloadedAt: Date;            // ダウンロード日時
  fileSize: number;              // ダウンロードしたファイルサイズ
}
```

### 5. API エンドポイント

#### 5.1 特典管理（VTuber/Admin権限）
- `POST /api/v1/rewards` - 特典作成・ファイルアップロード
- `GET /api/v1/rewards` - 特典一覧取得
- `GET /api/v1/rewards/:id` - 特典詳細取得
- `PUT /api/v1/rewards/:id` - 特典更新
- `DELETE /api/v1/rewards/:id` - 特典削除

#### 5.2 特典BOX（ユーザー権限）
- `GET /api/v1/rewards/box` - ユーザー獲得特典一覧
- `POST /api/v1/rewards/:id/download` - ダウンロードURL生成
- `GET /api/v1/rewards/download-history` - ダウンロード履歴

#### 5.3 統計・管理（Admin権限）
- `GET /api/v1/rewards/stats` - ダウンロード統計
- `GET /api/v1/rewards/logs` - アクセスログ

### 6. エラーハンドリング

#### 6.1 ファイル関連エラー
- `InvalidFileFormatException`: 不正ファイル形式
- `FileSizeExceededException`: ファイルサイズ制限超過
- `VirusScanFailedException`: ウイルススキャン失敗
- `StorageServiceException`: ストレージサービスエラー

#### 6.2 アクセス関連エラー
- `RewardNotFoundException`: 特典が見つからない
- `RewardAccessDeniedException`: アクセス権限なし
- `DownloadLimitExceededException`: ダウンロード制限超過
- `ExpiredDownloadUrlException`: ダウンロードURL期限切れ

### 7. 外部サービス連携

#### 7.1 ストレージサービス
```typescript
interface StorageService {
  uploadFile(file: Buffer, key: string, metadata: FileMetadata): Promise<UploadResult>;
  generateSignedUrl(key: string, expirationTime: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getFileMetadata(key: string): Promise<FileMetadata>;
}
```

#### 7.2 ウイルススキャンサービス
```typescript
interface VirusScanService {
  scanFile(file: Buffer): Promise<ScanResult>;
  quarantineFile(key: string): Promise<void>;
}
```

## 🧪 テスト戦略

### 1. 単体テスト
- ファイル検証ロジック
- 署名付きURL生成
- ダウンロード制御ロジック
- エラーハンドリング

### 2. 統合テスト
- ファイルアップロードフロー
- ダウンロードフロー
- ストレージサービス連携
- データベース整合性

### 3. パフォーマンステスト
- 大容量ファイル処理（50MB）
- 同時アップロード負荷
- ダウンロード応答時間（5秒以内）

## 🔄 TDD実装フェーズ

### Phase 1: RED（失敗テスト作成）
1. RewardService単体テスト
2. RewardController統合テスト
3. ストレージ連携テスト

### Phase 2: GREEN（テスト通過実装）
1. エンティティ実装
2. サービス層実装
3. コントローラー実装
4. ストレージ連携実装

### Phase 3: REFACTOR（リファクタリング）
1. コード重複削除
2. パフォーマンス最適化
3. セキュリティ強化
4. エラーハンドリング改善