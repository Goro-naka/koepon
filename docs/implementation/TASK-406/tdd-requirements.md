# TASK-406: VTuber管理画面実装 - TDD要件定義

## 概要

VTuberがこえポン！プラットフォームでガチャの作成・管理、収益の確認、ファンとの交流を行うための包括的な管理画面を実装する。
本タスクは、VTuberの活動をサポートし、効率的な運営を可能にするダッシュボードシステムの構築を目的とする。

## ビジネス要件

### VTuber-001: VTuber申請システム
- **要件**: 新規VTuberが平台に参加申請を行える機能
- **受け入れ基準**:
  - 申請フォームから基本情報、活動実績、プロフィール画像を入力できる
  - 申請状況（審査中、承認済み、却下）を確認できる
  - 審査結果の通知を受け取れる
  - 必要書類のアップロード機能がある

### VTuber-002: ガチャ作成・管理システム
- **要件**: VTuberが独自のガチャを作成・管理できる機能
- **受け入れ基準**:
  - ガチャの基本情報（タイトル、説明、価格、期間）を設定できる
  - アイテムの登録、排出率の設定ができる
  - ガチャのプレビュー機能がある
  - 公開・非公開の切り替えができる
  - 既存ガチャの編集・削除ができる

### VTuber-003: 収益ダッシュボード
- **要件**: VTuberの収益状況を一目で確認できるダッシュボード
- **受け入れ基準**:
  - 日別・月別・年別の売上グラフ表示
  - ガチャ別売上ランキング
  - 推しメダル受け取り数の推移
  - ファン数の増減グラフ
  - 詳細な統計データのエクスポート機能

### VTuber-004: ファイルアップロード管理
- **要件**: ガチャアイテムや特典ファイルのアップロード・管理機能
- **受け入れ基準**:
  - 画像、音声、動画ファイルのアップロード
  - ファイルのプレビュー機能
  - ファイル形式・サイズ制限の検証
  - アップロード進捗表示
  - ファイルの編集・削除機能

### VTuber-005: 統計・分析画面
- **要件**: 詳細な活動分析データを確認できる画面
- **受け入れ基準**:
  - ファン属性分析（年齢、性別、地域）
  - ガチャ人気度ランキング
  - アクティビティヒートマップ
  - コンバージョン率分析
  - カスタムレポート作成機能

## 技術要件

### Tech-001: フロントエンド技術スタック
- **要件**: Next.js 14 (App Router) + React + TypeScript
- **詳細**:
  - shadcn/ui コンポーネントライブラリ使用
  - Tailwind CSS によるスタイリング
  - Zustand による状態管理
  - TanStack Query による API 通信
  - React Hook Form + Zod によるフォーム管理

### Tech-002: レスポンシブデザイン
- **要件**: モバイル・タブレット・デスクトップ対応
- **詳細**:
  - モバイルファースト設計
  - タッチフレンドリーUI
  - 画面サイズに応じた最適なレイアウト
  - アクセシビリティ対応（WCAG 2.1 AA準拠）

### Tech-003: 状態管理
- **要件**: 複数画面間でのデータ共有・更新
- **詳細**:
  - VTuber情報の一元管理
  - ガチャデータのリアルタイム同期
  - 統計データのキャッシュ機能
  - オフライン対応（可能な範囲で）

### Tech-004: セキュリティ
- **要件**: VTuber専用機能への適切なアクセス制御
- **詳細**:
  - JWT トークンによる認証
  - VTuber ロールベースの認可
  - ファイルアップロード時のセキュリティチェック
  - XSS・CSRF対策

## UI/UXデザイン要件

### UX-001: ユーザビリティ
- **ナビゲーション**: 直感的なサイドバーナビゲーション
- **検索・フィルタ**: 高速な検索・フィルタリング機能
- **ヘルプ**: コンテキストヘルプとツールチップ
- **ショートカット**: キーボードショートカット対応

### UX-002: パフォーマンス
- **初回読み込み**: 3秒以内
- **画面遷移**: 1秒以内
- **ファイルアップロード**: プログレスバー表示
- **データ更新**: リアルタイム反映

### UX-003: エラーハンドリング
- **バリデーション**: リアルタイムフォームバリデーション
- **エラー表示**: 分かりやすいエラーメッセージ
- **復旧支援**: エラー状況からの復旧手順提示
- **オフライン**: オフライン状態の適切な通知

## 主要コンポーネント設計

### 1. VTuberApplicationPage (VTuber申請画面)
```typescript
interface VTuberApplicationPageProps {
  initialData?: VTuberApplication
}

interface VTuberApplication {
  id: string
  channelName: string
  description: string
  socialMediaLinks: {
    youtube?: string
    twitter?: string
    twitch?: string
  }
  profileImage: File | string
  bannerImage: File | string
  activityProof: File[]
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  submittedAt?: string
  reviewedAt?: string
  rejectionReason?: string
}
```

### 2. GachaManagementPage (ガチャ管理画面)
```typescript
interface GachaManagementPageProps {
  vtuberInfo: VTuberInfo
}

interface GachaManagementState {
  gachaList: Gacha[]
  selectedGacha: Gacha | null
  isCreatingGacha: boolean
  uploadProgress: Record<string, number>
  validationErrors: ValidationError[]
}
```

### 3. VTuberDashboardPage (ダッシュボード画面)
```typescript
interface VTuberDashboardPageProps {
  vtuberInfo: VTuberInfo
}

interface DashboardMetrics {
  totalRevenue: number
  monthlyRevenue: number
  fanCount: number
  gachaPerformance: GachaPerformance[]
  medalStats: MedalStats
  recentActivities: Activity[]
}
```

### 4. StatisticsPage (統計画面)
```typescript
interface StatisticsPageProps {
  vtuberInfo: VTuberInfo
}

interface StatisticsData {
  revenueChart: ChartData
  fanDemographics: DemographicData
  gachaRankings: GachaRanking[]
  activityHeatmap: HeatmapData
  conversionRates: ConversionData
}
```

### 5. FileUploadManager (ファイルアップロード管理)
```typescript
interface FileUploadManagerProps {
  acceptedTypes: string[]
  maxFileSize: number
  maxFiles?: number
  onUploadComplete: (files: UploadedFile[]) => void
  onUploadError: (error: UploadError) => void
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  thumbnailUrl?: string
  uploadedAt: string
}
```

## 状態管理設計

### VTuber Store (Zustand)
```typescript
interface VTuberStore {
  // State
  vtuberInfo: VTuberInfo | null
  applicationStatus: ApplicationStatus
  gachaList: Gacha[]
  dashboardMetrics: DashboardMetrics | null
  statisticsData: StatisticsData | null
  uploadedFiles: UploadedFile[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchVTuberInfo: () => Promise<void>
  updateVTuberInfo: (info: Partial<VTuberInfo>) => Promise<void>
  submitApplication: (application: VTuberApplication) => Promise<void>
  createGacha: (gacha: CreateGachaRequest) => Promise<void>
  updateGacha: (gachaId: string, gacha: UpdateGachaRequest) => Promise<void>
  deleteGacha: (gachaId: string) => Promise<void>
  uploadFile: (file: File, type: FileType) => Promise<UploadedFile>
  fetchDashboardMetrics: () => Promise<void>
  fetchStatisticsData: (dateRange: DateRange) => Promise<void>
}
```

## API統合設計

### APIクライアント
```typescript
export class VTuberAPIClient {
  // VTuber情報管理
  getVTuberInfo(): Promise<VTuberInfo>
  updateVTuberInfo(info: Partial<VTuberInfo>): Promise<void>
  
  // 申請管理
  submitApplication(application: VTuberApplication): Promise<void>
  getApplicationStatus(): Promise<ApplicationStatus>
  
  // ガチャ管理
  getGachaList(): Promise<Gacha[]>
  createGacha(gacha: CreateGachaRequest): Promise<Gacha>
  updateGacha(gachaId: string, gacha: UpdateGachaRequest): Promise<void>
  deleteGacha(gachaId: string): Promise<void>
  
  // 統計・ダッシュボード
  getDashboardMetrics(): Promise<DashboardMetrics>
  getStatisticsData(dateRange: DateRange): Promise<StatisticsData>
  exportStatistics(format: 'csv' | 'excel'): Promise<Blob>
  
  // ファイルアップロード
  uploadFile(file: File, type: FileType): Promise<UploadedFile>
  deleteFile(fileId: string): Promise<void>
}
```

## パフォーマンス要件

### Performance-001: 読み込み時間
- **ダッシュボード初回表示**: 3秒以内
- **画面遷移**: 1秒以内
- **データ更新**: 2秒以内
- **ファイルアップロード**: 10MB/分以上

### Performance-002: メモリ使用量
- **初期メモリ**: 50MB以内
- **最大メモリ**: 200MB以内
- **メモリリーク**: なし
- **ガベージコレクション**: 適切な管理

## セキュリティ要件

### Security-001: 認証・認可
- **VTuberロール**: 適切な権限チェック
- **トークン管理**: 安全なトークン保存・更新
- **セッション**: 適切なタイムアウト設定
- **リフレッシュ**: 自動トークンリフレッシュ

### Security-002: ファイルセキュリティ
- **ファイル検証**: MIME typeとマジックナンバーチェック
- **サイズ制限**: 適切なファイルサイズ制限
- **スキャン**: ウイルススキャン連携
- **アクセス制御**: ファイルへの適切なアクセス権限

## テスト要件

### Test-001: 単体テスト
- **コンポーネント**: 各コンポーネントの動作確認
- **フック**: カスタムフックのテスト
- **ユーティリティ**: ヘルパー関数のテスト
- **カバレッジ**: 80%以上

### Test-002: 統合テスト
- **API統合**: バックエンドとの連携テスト
- **状態管理**: Zustandストアのテスト
- **ファイルアップロード**: アップロード機能のテスト
- **エラーハンドリング**: エラーケースのテスト

### Test-003: E2Eテスト
- **申請フロー**: VTuber申請から承認までの完全フロー
- **ガチャ管理**: ガチャ作成から公開までのフロー
- **統計表示**: ダッシュボード・統計画面の表示確認
- **ファイル管理**: ファイルアップロードから削除までのフロー

## アクセシビリティ要件

### A11y-001: WCAG 2.1 AA準拠
- **キーボード**: 全機能をキーボードで操作可能
- **スクリーンリーダー**: 適切なARIA属性設定
- **コントラスト**: 4.5:1以上のコントラスト比
- **フォーカス**: 明確なフォーカス表示

### A11y-002: 多様なユーザー対応
- **言語**: 日本語・英語対応
- **文字サイズ**: ズーム200%まで対応
- **カラー**: 色覚異常者への配慮
- **モーション**: アニメーション無効化対応

## 国際化要件

### I18n-001: 多言語対応
- **言語**: 日本語・英語
- **文字エンコーディング**: UTF-8
- **右から左**: RTL言語への対応準備
- **数値・日付**: ロケールに応じた表示

## エラーハンドリング要件

### Error-001: ユーザーフレンドリーなエラー表示
- **バリデーションエラー**: フィールド単位の詳細エラー
- **ネットワークエラー**: 再試行オプション付きエラー表示
- **権限エラー**: 適切な権限説明とガイダンス
- **システムエラー**: サポート窓口への誘導

### Error-002: エラーログ・監視
- **エラーログ**: 詳細なエラー情報の記録
- **ユーザーアクション**: エラー発生時のユーザーアクション記録
- **パフォーマンス**: パフォーマンス問題の検出
- **アラート**: 重要なエラーのリアルタイム通知

## 完了条件

### 必須条件
1. ✅ 全5つの主要画面が実装され、正常に動作する
2. ✅ VTuberロールでの認証・認可が正しく機能する
3. ✅ ファイルアップロード機能が安全に動作する
4. ✅ レスポンシブデザインでモバイル・デスクトップ対応
5. ✅ 全テストが成功し、カバレッジ80%以上を達成

### 品質条件
1. ✅ パフォーマンス要件を全て満たす
2. ✅ セキュリティ要件を全て満たす
3. ✅ アクセシビリティ要件を全て満たす
4. ✅ エラーハンドリングが適切に実装されている
5. ✅ コードの保守性・拡張性が確保されている

## リスク・課題

### 技術的リスク
- **ファイルアップロード**: 大容量ファイルの処理性能
- **リアルタイムデータ**: 統計データの更新頻度とパフォーマンス
- **状態管理**: 複雑な画面間でのデータ同期

### ビジネスリスク
- **ユーザビリティ**: VTuberにとって使いやすいUIの実現
- **スケーラビリティ**: 多数のVTuberが同時利用する際の性能
- **セキュリティ**: VTuberの重要データの保護

### 対応策
- **プロトタイピング**: 重要機能の事前検証
- **段階的実装**: 機能を段階的にリリース
- **ユーザーテスト**: 実際のVTuberによるテスト
- **監視体制**: リアルタイムでの性能・エラー監視

---

この要件定義は、TASK-406の実装における指針となり、すべての開発者が同じ理解を持って開発を進められるよう設計されています。