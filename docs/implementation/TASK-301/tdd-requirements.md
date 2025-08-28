# TASK-301: VTuber申請・審査システム実装 - TDD要件定義

## 🎯 タスク概要

**タスク**: VTuber申請・審査システム実装  
**タイプ**: TDD  
**依存タスク**: TASK-301（交換所システム実装）  
**要件リンク**: REQ-205, REQ-009

## 📋 要件定義

### 1. 機能要件

#### 1.1 VTuber申請管理
- **申請受付**: 新規VTuberの申請受付
- **申請情報**: プロフィール、活動情報、配信計画の管理
- **書類管理**: 必要書類のアップロード・管理
- **申請ステータス**: 申請進行状況の追跡・管理
- **申請履歴**: 過去の申請履歴の参照

#### 1.2 審査プロセス管理
- **審査フロー**: 段階的審査プロセスの実装
- **審査者割当**: 審査担当者の自動/手動割当
- **審査結果**: 承認/却下/保留の判定管理
- **審査コメント**: 各段階での審査コメント記録
- **審査期限**: 審査期限の設定・監視

#### 1.3 ステータス管理
- **申請ステータス**: 受付中、審査中、承認済み、却下など
- **審査ステータス**: 一次審査、二次審査、最終審査など
- **通知ステータス**: 通知送信状況の管理
- **承認処理**: 承認後のアカウント有効化処理

#### 1.4 通知機能
- **申請者通知**: 申請状況変更の自動通知
- **審査者通知**: 新規申請・期限近づきの通知
- **管理者通知**: システム全体の監視通知
- **メール通知**: 重要なステータス変更のメール送信

### 2. データモデル

#### 2.1 VTuberApplication Entity
```typescript
interface VTuberApplication {
  id: string;                          // UUID
  applicantUserId: string;             // 申請者のユーザーID
  status: ApplicationStatus;           // 申請ステータス
  submittedAt: Date;                   // 申請日時
  lastUpdatedAt: Date;                 // 最終更新日時
  
  // プロフィール情報
  channelName: string;                 // チャンネル名
  channelDescription: string;          // チャンネル説明
  channelUrl?: string;                 // チャンネルURL
  socialLinks?: Record<string, string>; // SNSリンク集
  
  // 活動情報
  streamingPlatforms: string[];        // 配信プラットフォーム
  contentGenres: string[];             // コンテンツジャンル
  streamingSchedule?: string;          // 配信スケジュール
  experienceYears?: number;            // 活動年数
  
  // 申請書類
  identityDocument?: string;           // 身分証明書類URL
  activityProof?: string;              // 活動証明書類URL
  businessPlan?: string;               // 事業計画書URL
  additionalDocuments?: string[];      // 追加書類URL配列
  
  // システム管理
  reviewDeadline?: Date;               // 審査期限
  approvedAt?: Date;                   // 承認日時
  rejectedAt?: Date;                   // 却下日時
  metadata?: Record<string, any>;      // 追加メタデータ
}
```

#### 2.2 ApplicationReview Entity
```typescript
interface ApplicationReview {
  id: string;                          // UUID
  applicationId: string;               // 申請ID
  reviewerId: string;                  // 審査者ID
  reviewStage: ReviewStage;            // 審査段階
  status: ReviewStatus;                // 審査ステータス
  decision: ReviewDecision;            // 審査結果
  
  // 審査内容
  reviewComments?: string;             // 審査コメント
  score?: number;                      // 審査点数
  checklistItems: ReviewChecklistItem[]; // チェックリスト項目
  
  // 審査管理
  assignedAt: Date;                    // 審査割当日時
  startedAt?: Date;                    // 審査開始日時
  completedAt?: Date;                  // 審査完了日時
  deadline: Date;                      // 審査期限
  
  // システム管理
  createdAt: Date;                     // 作成日時
  updatedAt: Date;                     // 更新日時
  metadata?: Record<string, any>;      // 追加メタデータ
}
```

#### 2.3 ApplicationNotification Entity
```typescript
interface ApplicationNotification {
  id: string;                          // UUID
  applicationId: string;               // 申請ID
  recipientId: string;                 // 受信者ID
  type: NotificationType;              // 通知タイプ
  status: NotificationStatus;          // 通知ステータス
  
  // 通知内容
  title: string;                       // 通知タイトル
  message: string;                     // 通知メッセージ
  actionUrl?: string;                  // アクションURL
  
  // 送信管理
  scheduledAt?: Date;                  // 送信予定日時
  sentAt?: Date;                       // 送信日時
  readAt?: Date;                       // 既読日時
  
  // システム管理
  createdAt: Date;                     // 作成日時
  updatedAt: Date;                     // 更新日時
}
```

### 3. API エンドポイント

#### 3.1 申請管理API（申請者権限）
- `POST /api/v1/vtuber/applications` - 新規申請作成
- `GET /api/v1/vtuber/applications/:id` - 申請詳細取得
- `PUT /api/v1/vtuber/applications/:id` - 申請内容更新
- `GET /api/v1/vtuber/applications/my` - 自分の申請一覧
- `POST /api/v1/vtuber/applications/:id/documents` - 書類アップロード

#### 3.2 審査管理API（審査者権限）
- `GET /api/v1/vtuber/reviews` - 担当審査一覧
- `GET /api/v1/vtuber/reviews/:id` - 審査詳細取得
- `POST /api/v1/vtuber/reviews/:id/start` - 審査開始
- `PUT /api/v1/vtuber/reviews/:id` - 審査結果更新
- `POST /api/v1/vtuber/reviews/:id/complete` - 審査完了

#### 3.3 管理者API（Admin権限）
- `GET /api/v1/admin/vtuber/applications` - 全申請一覧
- `POST /api/v1/admin/vtuber/applications/:id/assign` - 審査者割当
- `GET /api/v1/admin/vtuber/reviews/stats` - 審査統計
- `POST /api/v1/admin/vtuber/applications/:id/approve` - 最終承認
- `POST /api/v1/admin/vtuber/applications/:id/reject` - 最終却下

### 4. ビジネスルール

#### 4.1 申請制限
- **重複申請**: 同一ユーザーは承認されるまで新規申請不可
- **申請頻度**: 却下後30日間は再申請不可
- **必須情報**: チャンネル名、説明、プラットフォームは必須
- **書類要件**: 身分証明書は必須、その他は任意

#### 4.2 審査プロセス
- **審査段階**: 1次審査（自動）→ 2次審査（人的）→ 最終審査（管理者）
- **審査期限**: 各段階7日以内、全体で21日以内
- **審査者割当**: ワークロード平準化による自動割当
- **審査基準**: チェックリスト項目をすべてクリア

#### 4.3 通知ルール
- **申請者通知**: ステータス変更時は即時通知
- **審査者通知**: 新規割当時、期限2日前に通知
- **管理者通知**: 審査期限超過時に通知
- **メール通知**: 重要なステータス変更のみ

### 5. セキュリティ要件

#### 5.1 認証・認可
- **JWT認証**: 全保護エンドポイントでの認証
- **ロールベース**: USER/REVIEWER/ADMIN権限の適切な制御
- **操作権限**: 申請者は自身の申請のみ操作可能

#### 5.2 データ保護
- **個人情報**: 申請者の個人情報の適切な保護
- **書類管理**: アップロード書類のセキュアな保存
- **アクセス制御**: 審査情報への適切なアクセス制限

### 6. パフォーマンス要件

#### 6.1 応答時間
- **申請一覧**: 2秒以内での表示
- **申請詳細**: 1秒以内での表示
- **審査処理**: 3秒以内での完了

#### 6.2 同時処理
- **申請処理**: 複数同時申請の適切な処理
- **審査割当**: 審査者ワークロードの平準化
- **通知送信**: 大量通知の効率的な処理

### 7. エラーハンドリング

#### 7.1 申請エラー
- `DuplicateApplicationException`: 重複申請
- `ApplicationNotFoundException`: 申請が見つからない
- `InvalidApplicationDataException`: 不正な申請内容
- `ApplicationDeadlineExceededException`: 申請期限超過
- `InsufficientApplicationDataException`: 必須情報不足

#### 7.2 審査エラー
- `ReviewNotFoundException`: 審査が見つからない
- `ReviewerNotAssignedException`: 審査者未割当
- `ReviewDeadlineExceededException`: 審査期限超過
- `InvalidReviewDecisionException`: 不正な審査結果
- `ReviewConflictException`: 審査競合

#### 7.3 システムエラー
- `NotificationSendFailedException`: 通知送信失敗
- `DocumentUploadFailedException`: 書類アップロード失敗
- `ReviewAssignmentFailedException`: 審査者割当失敗

## 🧪 テスト戦略

### 1. 単体テスト
- 申請処理ロジック
- 審査管理機能
- ステータス変更処理
- 通知機能
- エラーハンドリング

### 2. 統合テスト
- API エンドポイント
- データベース整合性
- ファイルアップロード連携
- 通知システム連携

### 3. パフォーマンステスト
- 同時申請処理
- 大量審査処理
- 通知システム負荷

## 🔄 実装フェーズ

### Phase 1: 基盤実装
1. エンティティ定義
2. 基本的なCRUD操作
3. データベースマイグレーション

### Phase 2: ビジネスロジック
1. 申請処理の実装
2. 審査管理機能
3. ステータス管理機能

### Phase 3: 統合・最適化
1. 通知システム連携
2. ファイル管理連携
3. パフォーマンス最適化
4. エラーハンドリング強化