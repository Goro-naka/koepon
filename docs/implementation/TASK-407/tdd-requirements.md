# TASK-407: 管理者画面実装 - TDD要件定義

## 実装概要

管理者向けWebインターフェースを実装し、システム全体の管理・監視・運営を可能にする包括的な管理画面を構築する。

## 機能要件

### 1. 管理者ダッシュボード (AdminDashboardPage.tsx)

#### 1.1 概要ダッシュボード
- **システム概要メトリクス**:
  - 総ユーザー数・新規登録数（日次・月次）
  - 総VTuber数・承認待ち数・承認率
  - 総売上・月間売上・前月比較
  - アクティブユーザー数（DAU・MAU）
  - システムアラート数・重要度別表示

#### 1.2 リアルタイム監視
- **システムステータス**:
  - API応答時間・エラー率
  - データベース接続状況
  - キャッシュヒット率
  - ファイルストレージ使用量

#### 1.3 期間選択機能
- プリセット期間: 今日・7日・30日・90日・カスタム期間
- 全メトリクスの期間フィルター対応

### 2. VTuber審査画面 (VTuberReviewPage.tsx)

#### 2.1 申請一覧表示
- **申請リスト**:
  - 申請者情報（チャンネル名・申請日・ステータス）
  - 優先度（緊急・高・中・低）
  - フィルター機能（ステータス・申請日・優先度）
  - ソート機能（申請日・更新日・優先度）
  - ページネーション（20件/ページ）

#### 2.2 詳細審査
- **申請詳細モーダル**:
  - 申請者基本情報表示
  - チャンネル情報・ソーシャルメディアリンク
  - アップロード画像プレビュー
  - 活動証明書確認
  - 審査履歴・コメント履歴

#### 2.3 審査操作
- **承認・却下機能**:
  - 承認/却下ボタン
  - 却下理由入力（必須）
  - 条件付承認（追加情報要求）
  - 審査メモ機能
  - 一括操作（複数選択対応）

### 3. システム監視画面 (SystemMonitoringPage.tsx)

#### 3.1 パフォーマンス監視
- **リアルタイムメトリクス**:
  - CPU・メモリ・ディスク使用率
  - API エンドポイント別レスポンス時間
  - データベースクエリ性能
  - 同時接続数・スループット

#### 3.2 エラー監視
- **エラートラッキング**:
  - エラーログ一覧（レベル別・時系列）
  - エラー率推移グラフ
  - 頻発エラートップ10
  - エラー詳細表示・スタックトレース

#### 3.3 アラート管理
- **アラート設定**:
  - 閾値設定（CPU・メモリ・エラー率）
  - 通知チャネル設定（メール・Slack）
  - アラート履歴・確認状況

### 4. ユーザー管理画面 (UserManagementPage.tsx)

#### 4.1 ユーザー検索・一覧
- **検索機能**:
  - ユーザー名・メールアドレス検索
  - 登録日・最終ログイン日範囲検索
  - ステータス（アクティブ・停止・削除）フィルター
  - 高度な検索（ガチャ利用回数・課金額等）

#### 4.2 ユーザー詳細管理
- **ユーザー情報表示**:
  - 基本情報・アカウント状況
  - ガチャ利用履歴・課金履歴
  - 推しメダル残高・交換履歴
  - 獲得特典・ダウンロード履歴

#### 4.3 ユーザー操作
- **管理操作**:
  - アカウント停止・復活
  - パスワードリセット強制実行
  - 推しメダル残高調整
  - 特典付与・削除
  - 利用制限設定

## 技術要件

### 1. フロントエンド技術スタック
- **フレームワーク**: Next.js 14 (App Router)
- **UI ライブラリ**: shadcn/ui + Tailwind CSS v4
- **状態管理**: Zustand + persist middleware
- **データフェッチング**: TanStack Query v5
- **フォーム管理**: react-hook-form + zod validation
- **チャート**: Chart.js または Recharts
- **テーブル**: @tanstack/react-table v8

### 2. 認証・認可
- **管理者権限チェック**: ルートレベルでの権限検証
- **セッション管理**: JWT + refresh token
- **ロールベース制御**: 管理者・スーパー管理者区分
- **操作ログ**: 全管理操作のアクションログ記録

### 3. データ管理
- **リアルタイム更新**: WebSocket or Server-Sent Events
- **キャッシュ戦略**: React Query cache + SWR pattern  
- **楽観的更新**: ユーザー体験向上
- **エラーリカバリ**: 自動再試行・手動リフレッシュ

### 4. パフォーマンス要件
- **初期表示**: 3秒以内
- **データ更新**: 1秒以内
- **大量データ**: 仮想化・ページネーション
- **リアルタイム**: 500ms以内のデータ反映

## UI/UX要件

### 1. デザインシステム
- **カラーパレット**: 
  - Primary: こえポン！ブランドカラー (#FF6B9D)
  - Success: #10B981, Warning: #F59E0B, Error: #EF4444
  - Neutral: #6B7280 series
- **タイポグラフィ**: Noto Sans JP (日本語対応)
- **アイコン**: Heroicons または Lucide React

### 2. レイアウト・ナビゲーション
- **サイドバーナビゲーション**:
  - 折りたたみ可能なサイドバー
  - 階層構造対応（メイン・サブメニュー）
  - アクティブ状態表示・ブレッドクラム

### 3. レスポンシブ対応
- **ブレークポイント**:
  - Mobile: 0-640px
  - Tablet: 641-1024px  
  - Desktop: 1025px+
- **タブレット最適化**: 管理操作に適したレイアウト

### 4. アクセシビリティ (WCAG 2.1 Level AA)
- **キーボードナビゲーション**: 全機能キーボード操作可能
- **スクリーンリーダー**: ARIA属性・適切なラベル
- **カラーコントラスト**: 4.5:1以上の比率確保
- **確認ダイアログ**: 破壊的操作には必須確認

### 5. インタラクション
- **ローディング状態**:
  - スケルトンローダー（一覧・カード）
  - プログレスバー（長時間処理）
  - スピナー（ボタン操作）

- **エラー表示**:
  - インライン検証エラー
  - システムエラーは画面上部にアラート
  - 操作失敗時の詳細メッセージ
  - 再試行ボタン提供

## データ型定義

### 1. 管理者関連型

```typescript
// 管理者ダッシュボード
export interface AdminDashboardMetrics {
  systemOverview: {
    totalUsers: number
    newUsersToday: number
    newUsersThisMonth: number
    totalVTubers: number
    pendingApplications: number
    approvalRate: number
    totalRevenue: number
    monthlyRevenue: number
    revenueGrowth: number
    activeUsersDAU: number
    activeUsersMAU: number
    systemAlerts: SystemAlert[]
  }
  systemStatus: {
    apiResponseTime: number
    errorRate: number
    databaseStatus: 'healthy' | 'warning' | 'critical'
    cacheHitRate: number
    storageUsage: {
      used: number
      total: number
      percentage: number
    }
  }
  dateRange: DateRange
}

export interface SystemAlert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: string
  acknowledged: boolean
  source: string
}

// VTuber 審査
export interface VTuberApplicationReview {
  id: string
  applicant: {
    id: string
    channelName: string
    email: string
    applicationDate: string
  }
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'requires_info'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reviewHistory: ReviewAction[]
  currentReviewer?: string
  estimatedReviewTime?: string
}

export interface ReviewAction {
  id: string
  reviewerId: string
  reviewerName: string
  action: 'review_started' | 'approved' | 'rejected' | 'info_requested' | 'comment_added'
  comment?: string
  timestamp: string
}

// システム監視
export interface SystemMetrics {
  timestamp: string
  cpu: {
    usage: number
    cores: number
  }
  memory: {
    used: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    total: number
    percentage: number
  }
  network: {
    inbound: number
    outbound: number
  }
}

export interface ApiMetrics {
  endpoint: string
  method: string
  avgResponseTime: number
  requestCount: number
  errorCount: number
  errorRate: number
  p95ResponseTime: number
}

// ユーザー管理
export interface AdminUserView {
  id: string
  email: string
  displayName: string
  registrationDate: string
  lastLoginDate: string
  status: 'active' | 'suspended' | 'deleted'
  totalGachaDraws: number
  totalSpent: number
  medalBalance: number
  rewardCount: number
  riskScore: number
}

export interface UserDetailView {
  basicInfo: AdminUserView
  gachaHistory: GachaDrawHistory[]
  paymentHistory: PaymentHistory[]
  medalTransactions: MedalTransaction[]
  rewardDownloads: RewardDownload[]
  supportTickets: SupportTicket[]
  securityEvents: SecurityEvent[]
}
```

### 2. 操作関連型

```typescript
// 管理操作
export interface AdminAction {
  type: 'user_suspend' | 'user_restore' | 'vtuber_approve' | 'vtuber_reject' | 'medal_adjust' | 'reward_grant'
  targetId: string
  targetType: 'user' | 'vtuber' | 'system'
  reason?: string
  metadata?: Record<string, any>
}

// フィルター・検索
export interface AdminFilters {
  dateRange: DateRange
  status?: string[]
  priority?: string[]
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// アラート設定
export interface AlertThreshold {
  id: string
  metric: string
  condition: 'greater_than' | 'less_than' | 'equals'
  threshold: number
  severity: 'info' | 'warning' | 'error' | 'critical'
  enabled: boolean
  notifications: {
    email: boolean
    slack: boolean
    webhook?: string
  }
}
```

## API連携要件

### 1. 管理者API エンドポイント
```typescript
// ダッシュボード
GET /api/admin/dashboard/metrics?period=${period}
GET /api/admin/system/status
GET /api/admin/alerts?status=${status}&limit=${limit}

// VTuber審査
GET /api/admin/vtuber-applications?status=${status}&page=${page}
GET /api/admin/vtuber-applications/${id}
POST /api/admin/vtuber-applications/${id}/review
PUT /api/admin/vtuber-applications/${id}/status

// システム監視
GET /api/admin/system/metrics?start=${start}&end=${end}
GET /api/admin/api/metrics?endpoint=${endpoint}
GET /api/admin/errors?level=${level}&limit=${limit}

// ユーザー管理
GET /api/admin/users?search=${search}&status=${status}&page=${page}
GET /api/admin/users/${id}
POST /api/admin/users/${id}/suspend
POST /api/admin/users/${id}/restore
POST /api/admin/users/${id}/adjust-medals
```

### 2. WebSocket / SSE 連携
```typescript
// リアルタイム更新
WebSocket: /ws/admin/dashboard
Events: {
  'metrics_update': SystemMetrics
  'alert_created': SystemAlert
  'application_submitted': VTuberApplicationReview
  'user_action': UserActivity
}
```

## 状態管理設計

### 1. Zustand Store 構成

```typescript
// AdminStore
export interface AdminStore {
  // ダッシュボード
  dashboardMetrics: AdminDashboardMetrics | null
  systemStatus: SystemStatus | null
  
  // VTuber審査
  applications: VTuberApplicationReview[]
  selectedApplication: VTuberApplicationReview | null
  
  // システム監視
  systemMetrics: SystemMetrics[]
  apiMetrics: ApiMetrics[]
  errorLogs: ErrorLog[]
  alerts: SystemAlert[]
  
  // ユーザー管理
  users: AdminUserView[]
  selectedUser: UserDetailView | null
  
  // UI状態
  filters: AdminFilters
  loading: Record<string, boolean>
  errors: Record<string, string>
  
  // Actions
  fetchDashboardMetrics: (period: string) => Promise<void>
  fetchApplications: (filters: AdminFilters) => Promise<void>
  reviewApplication: (id: string, action: AdminAction) => Promise<void>
  fetchUsers: (filters: AdminFilters) => Promise<void>
  performUserAction: (userId: string, action: AdminAction) => Promise<void>
  
  // Real-time updates
  subscribeToUpdates: () => void
  unsubscribeFromUpdates: () => void
}
```

## コンポーネント設計

### 1. ページコンポーネント
- `AdminDashboardPage.tsx` - ダッシュボードメイン
- `VTuberReviewPage.tsx` - VTuber審査管理
- `SystemMonitoringPage.tsx` - システム監視
- `UserManagementPage.tsx` - ユーザー管理

### 2. 共通コンポーネント
- `AdminLayout.tsx` - 管理画面レイアウト
- `AdminSidebar.tsx` - サイドバーナビゲーション  
- `MetricsCard.tsx` - メトリクス表示カード
- `DataTable.tsx` - テーブル表示（ソート・フィルター対応）
- `ConfirmDialog.tsx` - 確認ダイアログ
- `AdminBreadcrumb.tsx` - パンくずナビゲーション

### 3. 特殊コンポーネント
- `RealtimeChart.tsx` - リアルタイムチャート
- `ApplicationReviewModal.tsx` - 申請審査モーダル
- `UserActionModal.tsx` - ユーザー操作モーダル
- `AlertConfigPanel.tsx` - アラート設定パネル

## セキュリティ要件

### 1. 認証・認可
- **管理者認証**: 2FA必須・強固なパスワードポリシー
- **セッション管理**: 短時間セッション・アクティビティベース延長
- **権限制御**: ルートレベル・コンポーネントレベル権限チェック

### 2. 操作ログ
- **監査ログ**: 全管理操作のログ記録
- **改竄防止**: ログの整合性確保
- **保存期間**: 法的要件に応じた長期保存

### 3. データ保護
- **機密情報表示**: 必要最小限の情報のみ表示
- **マスキング**: 個人情報の適切なマスキング
- **アクセス制御**: IP制限・時間制限

## パフォーマンス要件

### 1. 初期表示
- **ダッシュボード**: 3秒以内
- **データテーブル**: 2秒以内  
- **詳細モーダル**: 1秒以内

### 2. データ処理
- **大量データ**: 仮想化・遅延ローディング
- **リアルタイム**: 500ms以内の更新反映
- **検索**: 1秒以内のレスポンス

### 3. 最適化戦略
- **コード分割**: ページ単位・機能単位の分割
- **画像最適化**: WebP対応・適切なサイズ設定
- **キャッシュ**: 効果的なクライアントサイドキャッシュ

## エラーハンドリング

### 1. ネットワークエラー
- **自動リトライ**: 指数バックオフ戦略
- **オフライン対応**: ネットワーク状況表示
- **タイムアウト**: 適切なタイムアウト設定

### 2. 権限エラー
- **アクセス拒否**: 適切なメッセージと代替行動提示
- **セッション期限切れ**: 自動ログアウト・再ログイン促進

### 3. システムエラー
- **エラー境界**: React Error Boundary実装
- **エラー報告**: 自動エラー報告機能
- **復旧ガイダンス**: ユーザーへの明確な指示

## テスト要件

### 1. 単体テスト
- **コンポーネント**: Jest + React Testing Library
- **フック**: @testing-library/react-hooks
- **状態管理**: Zustand store テスト
- **ユーティリティ**: 純粋関数テスト

### 2. 統合テスト
- **API連携**: MSW (Mock Service Worker)
- **認証フロー**: 権限制御テスト
- **リアルタイム**: WebSocket モックテスト

### 3. E2Eテスト
- **管理フロー**: Playwright
- **クロスブラウザ**: Chrome・Firefox・Safari
- **レスポンシブ**: モバイル・タブレット・デスクトップ

## 実装優先順位

### Phase 1: 基盤構築
1. AdminLayout・認証・ナビゲーション
2. 基本的なデータフェッチング・状態管理
3. 共通UIコンポーネント

### Phase 2: コア機能
1. AdminDashboardPage - メトリクス表示
2. VTuberReviewPage - 審査機能
3. UserManagementPage - ユーザー管理

### Phase 3: 高度機能
1. SystemMonitoringPage - 監視機能
2. リアルタイム更新
3. アラート・通知機能

### Phase 4: 品質向上
1. パフォーマンス最適化
2. アクセシビリティ向上
3. 包括的テスト実装

この要件定義に基づき、段階的にTDD手法で実装を進めます。