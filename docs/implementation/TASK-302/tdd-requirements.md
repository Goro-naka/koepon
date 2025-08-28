# TASK-302: VTuber管理ダッシュボードAPI実装 - TDD要件定義

## 🎯 タスク概要

**タスク**: VTuber管理ダッシュボードAPI実装  
**タイプ**: TDD  
**依存タスク**: TASK-301（VTuber申請・審査システム）  
**要件リンク**: REQ-103, レポート機能

## 📋 要件定義

### 1. 機能要件

#### 1.1 売上統計API
- **収益分析**: ガチャ売上、推しメダル購入の分析
- **期間別売上**: 日次、週次、月次の売上推移
- **VTuber別売上**: 各VTuberの収益パフォーマンス
- **支払い方法分析**: 決済手段別の統計
- **トップパフォーマー**: 収益上位VTuberの分析

#### 1.2 ガチャ管理API  
- **ガチャ統計**: 実行回数、アイテム出現率の分析
- **ガチャ設定管理**: ガチャ確率、アイテムプールの管理
- **パフォーマンス分析**: VTuber別ガチャ人気度
- **収益分析**: ガチャ別の収益貢献度
- **アイテム管理**: レアアイテム配布状況

#### 1.3 特典設定API
- **特典配布状況**: デジタル/物理特典の配布統計
- **特典人気分析**: アイテム別人気度ランキング
- **在庫管理**: 物理特典の在庫状況監視
- **配布スケジュール**: 特典配布の時系列管理
- **特典効果分析**: 特典がユーザー行動に与える影響

#### 1.4 分析データAPI
- **ユーザー行動分析**: アクティビティパターンの分析
- **エンゲージメント分析**: ユーザーの関与度測定
- **リテンション分析**: ユーザー継続率の分析
- **コンバージョン分析**: 無料→有料への転換率
- **チャーン分析**: ユーザー離脱パターンの分析

### 2. データモデル

#### 2.1 DashboardMetrics Interface
```typescript
interface DashboardMetrics {
  // 売上関連
  totalRevenue: number;
  revenueGrowth: number;
  revenueByPeriod: RevenueDataPoint[];
  revenueByVTuber: VTuberRevenue[];
  
  // ガチャ関連
  totalGachaPlays: number;
  gachaPlayGrowth: number;
  gachaRevenueShare: number;
  topPerformingGachas: GachaPerformance[];
  
  // ユーザー関連
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  userRetention: RetentionData;
  
  // 特典関連
  totalRewardsDistributed: number;
  popularRewards: RewardPopularity[];
  inventoryStatus: InventoryStatus[];
}
```

#### 2.2 VTuberDashboard Entity
```typescript
interface VTuberDashboard {
  id: string;                          // UUID
  vtuberId: string;                    // VTuber ID
  periodStart: Date;                   // 集計期間開始
  periodEnd: Date;                     // 集計期間終了
  
  // 収益データ
  totalRevenue: number;                // 総収益
  gachaRevenue: number;                // ガチャ収益
  medalRevenue: number;                // メダル売上
  revenueGrowth: number;               // 成長率
  
  // エンゲージメント
  totalFans: number;                   // ファン総数
  activeFans: number;                  // アクティブファン数
  newFans: number;                     // 新規ファン数
  fanGrowthRate: number;               // ファン成長率
  
  // ガチャ統計
  gachaPlays: number;                  // ガチャ実行回数
  uniqueGachaUsers: number;            // ユニークユーザー数
  averageGachaSpend: number;           // 平均ガチャ支出
  
  // 特典統計
  rewardsDistributed: number;          // 特典配布数
  digitalRewards: number;              // デジタル特典数
  physicalRewards: number;             // 物理特典数
  
  // パフォーマンス指標
  conversionRate: number;              // コンバージョン率
  retentionRate: number;               // リテンション率
  churnRate: number;                   // チャーン率
  
  // メタデータ
  calculatedAt: Date;                  // 計算日時
  lastUpdated: Date;                   // 最終更新
  metadata?: Record<string, any>;      // 追加データ
}
```

#### 2.3 AnalyticsReport Entity  
```typescript
interface AnalyticsReport {
  id: string;                          // UUID
  reportType: ReportType;              // レポートタイプ
  vtuberId?: string;                   // VTuber ID (個別レポート用)
  periodType: PeriodType;              // 期間タイプ
  startDate: Date;                     // 開始日
  endDate: Date;                       // 終了日
  
  // レポートデータ
  reportData: Record<string, any>;     // レポート内容
  summary: ReportSummary;              // サマリーデータ
  insights: string[];                  // インサイト
  recommendations: string[];           // 推奨事項
  
  // ステータス
  status: ReportStatus;                // レポート状態
  generatedBy: string;                 // 生成者
  generatedAt: Date;                   // 生成日時
  
  // アクセス制御
  visibility: ReportVisibility;        // 表示範囲
  sharedWith: string[];                // 共有対象
}
```

### 3. API エンドポイント

#### 3.1 ダッシュボード概要API（VTuber/Admin権限）
- `GET /api/v1/dashboard/overview` - ダッシュボード概要取得
- `GET /api/v1/dashboard/metrics` - 主要指標取得
- `GET /api/v1/dashboard/vtuber/:id` - VTuber別ダッシュボード
- `GET /api/v1/dashboard/summary` - サマリーデータ取得

#### 3.2 売上分析API（VTuber/Admin権限）
- `GET /api/v1/analytics/revenue` - 売上分析データ
- `GET /api/v1/analytics/revenue/trend` - 売上トレンド
- `GET /api/v1/analytics/revenue/breakdown` - 収益内訳
- `GET /api/v1/analytics/revenue/comparison` - 比較分析

#### 3.3 ガチャ分析API（VTuber/Admin権限）
- `GET /api/v1/analytics/gacha` - ガチャ分析データ
- `GET /api/v1/analytics/gacha/performance` - ガチャパフォーマンス
- `POST /api/v1/analytics/gacha/settings` - ガチャ設定更新
- `GET /api/v1/analytics/gacha/items` - アイテム分析

#### 3.4 ユーザー分析API（VTuber/Admin権限）
- `GET /api/v1/analytics/users` - ユーザー分析データ
- `GET /api/v1/analytics/users/behavior` - 行動分析
- `GET /api/v1/analytics/users/retention` - リテンション分析
- `GET /api/v1/analytics/users/conversion` - コンバージョン分析

#### 3.5 レポート生成API（VTuber/Admin権限）
- `POST /api/v1/reports/generate` - レポート生成
- `GET /api/v1/reports` - レポート一覧
- `GET /api/v1/reports/:id` - レポート詳細
- `DELETE /api/v1/reports/:id` - レポート削除

### 4. ビジネスルール

#### 4.1 データ集計ルール
- **リアルタイム更新**: 主要指標は15分間隔で更新
- **日次バッチ**: 詳細分析は日次で処理
- **データ保持期間**: 生データ1年、集計データ3年
- **プライバシー**: 個人情報を含まない集計データのみ

#### 4.2 権限管理
- **VTuber権限**: 自身のデータのみアクセス可能
- **Admin権限**: 全VTuberのデータアクセス可能
- **レポート共有**: VTuberは自身のレポートを管理者と共有可能
- **データエクスポート**: Admin権限のみ

#### 4.3 パフォーマンス要件
- **応答時間**: ダッシュボード表示3秒以内
- **データ更新**: リアルタイム指標15分以内
- **レポート生成**: 複雑なレポート30秒以内
- **同時アクセス**: 50VTuber同時ダッシュボード利用

### 5. セキュリティ要件

#### 5.1 認証・認可
- **JWT認証**: 全保護エンドポイントでの認証
- **ロールベース**: VTUBER/ADMIN権限の適切な制御
- **データ分離**: VTuberは自身のデータのみアクセス

#### 5.2 データセキュリティ
- **暗号化**: 機密な売上データの暗号化
- **監査ログ**: データアクセスの完全なログ記録
- **アクセス制限**: IPホワイトリスト（管理者向け）

### 6. エラーハンドリング

#### 6.1 データ取得エラー
- `DashboardDataNotFoundException`: ダッシュボードデータが見つからない
- `AnalyticsDataUnavailableException`: 分析データが利用不可
- `ReportGenerationFailedException`: レポート生成失敗
- `DataAggregationException`: データ集計エラー

#### 6.2 権限エラー
- `InsufficientDashboardAccessException`: ダッシュボードアクセス権限不足
- `ReportAccessDeniedException`: レポートアクセス拒否
- `VTuberDataAccessException`: VTuberデータアクセスエラー

#### 6.3 システムエラー
- `DashboardServiceUnavailableException`: ダッシュボードサービス利用不可
- `AnalyticsCalculationException`: 分析計算エラー
- `DataSynchronizationException`: データ同期エラー

## 🧪 テスト戦略

### 1. 単体テスト
- ダッシュボードデータ取得ロジック
- 分析計算機能
- レポート生成機能
- 権限チェック機能
- エラーハンドリング

### 2. 統合テスト
- API エンドポイント
- データベース集計処理
- 外部システム連携
- レポート出力機能

### 3. パフォーマンステスト
- 大量データ集計処理
- 同時アクセス処理
- レポート生成時間

## 🔄 実装フェーズ

### Phase 1: 基盤実装
1. エンティティ定義
2. 基本的なCRUD操作
3. ダッシュボードデータ構造

### Phase 2: 分析機能
1. データ集計処理
2. 統計計算機能  
3. トレンド分析機能

### Phase 3: レポート・最適化
1. レポート生成機能
2. パフォーマンス最適化
3. エラーハンドリング強化