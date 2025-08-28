# TASK-406: VTuber管理画面実装 - TDDテストケース設計

## テスト実装概要

本ドキュメントでは、VTuber管理画面の各コンポーネント・機能に対する包括的なテストケースを設計し、
TDD（Test-Driven Development）アプローチで品質を確保する。

**総テストケース数: 95+**
**テストカテゴリー: 11**

## テスト実装戦略

### 1. テストピラミッド
- **単体テスト (70%)**: コンポーネント・フック・ユーティリティ
- **統合テスト (20%)**: API統合・状態管理
- **E2Eテスト (10%)**: 主要ユーザーフロー

### 2. テストツール
- **Jest**: テストランナー・アサーション
- **React Testing Library**: コンポーネントテスト
- **MSW**: APIモック
- **Playwright**: E2Eテスト

## テストケース詳細

### TC-001: VTuberApplicationPage (VTuber申請画面) - 18テスト

#### 基本レンダリングテスト (3テスト)
```typescript
describe('VTuberApplicationPage - Basic Rendering', () => {
  it('should render application form with all required fields', () => {
    // チャンネル名、説明、SNSリンク、画像アップロードフィールドが表示される
  })

  it('should display current application status when exists', () => {
    // 既存申請がある場合、ステータス（審査中、承認済み、却下）が表示される
  })

  it('should show empty form for new application', () => {
    // 新規申請の場合、空のフォームが表示される
  })
})
```

#### フォームバリデーションテスト (5テスト)
```typescript
describe('VTuberApplicationPage - Form Validation', () => {
  it('should validate required fields', () => {
    // 必須フィールド（チャンネル名、説明）の未入力時エラー表示
  })

  it('should validate channel name format and length', () => {
    // チャンネル名の文字数制限・不正文字チェック
  })

  it('should validate social media URLs format', () => {
    // YouTube、Twitter、TwitchのURL形式チェック
  })

  it('should validate file upload requirements', () => {
    // プロフィール画像、バナー画像の形式・サイズチェック
  })

  it('should show validation errors in real-time', () => {
    // リアルタイムバリデーション動作確認
  })
})
```

#### ファイルアップロードテスト (4テスト)
```typescript
describe('VTuberApplicationPage - File Upload', () => {
  it('should upload profile image successfully', () => {
    // プロフィール画像の正常アップロード
  })

  it('should upload banner image successfully', () => {
    // バナー画像の正常アップロード
  })

  it('should display upload progress', () => {
    // アップロード進捗の表示確認
  })

  it('should handle upload errors gracefully', () => {
    // アップロード失敗時のエラーハンドリング
  })
})
```

#### 申請プロセステスト (4テスト)
```typescript
describe('VTuberApplicationPage - Application Process', () => {
  it('should submit application successfully', () => {
    // 申請の正常送信
  })

  it('should handle submission errors', () => {
    // 送信失敗時のエラーハンドリング
  })

  it('should disable form during submission', () => {
    // 送信中のフォーム無効化
  })

  it('should redirect after successful submission', () => {
    // 送信成功後のリダイレクト
  })
})
```

#### ステータス表示テスト (2テスト)
```typescript
describe('VTuberApplicationPage - Status Display', () => {
  it('should display application status with appropriate styling', () => {
    // ステータスごとの適切な表示・スタイル
  })

  it('should show rejection reason when rejected', () => {
    // 却下時の理由表示
  })
})
```

### TC-002: GachaManagementPage (ガチャ管理画面) - 22テスト

#### 基本表示テスト (4テスト)
```typescript
describe('GachaManagementPage - Basic Display', () => {
  it('should render gacha list with correct information', () => {
    // ガチャ一覧の正常表示
  })

  it('should display empty state when no gacha exists', () => {
    // ガチャが存在しない場合の空状態表示
  })

  it('should show loading state while fetching data', () => {
    // データ取得中のローディング表示
  })

  it('should display error state when fetch fails', () => {
    // データ取得失敗時のエラー表示
  })
})
```

#### ガチャ作成テスト (6テスト)
```typescript
describe('GachaManagementPage - Gacha Creation', () => {
  it('should open create gacha modal', () => {
    // ガチャ作成モーダルの表示
  })

  it('should validate gacha creation form', () => {
    // ガチャ作成フォームのバリデーション
  })

  it('should create gacha successfully', () => {
    // ガチャの正常作成
  })

  it('should upload gacha items with images', () => {
    // ガチャアイテム画像のアップロード
  })

  it('should set item rarity and drop rates', () => {
    // アイテムレアリティ・排出率設定
  })

  it('should validate drop rate total equals 100%', () => {
    // 排出率合計100%チェック
  })
})
```

#### ガチャ編集テスト (4テスト)
```typescript
describe('GachaManagementPage - Gacha Editing', () => {
  it('should edit existing gacha information', () => {
    // 既存ガチャ情報の編集
  })

  it('should update gacha status (active/inactive)', () => {
    // ガチャステータス（公開/非公開）変更
  })

  it('should modify gacha items and rates', () => {
    // ガチャアイテム・排出率の変更
  })

  it('should save changes successfully', () => {
    // 変更内容の正常保存
  })
})
```

#### ガチャ削除テスト (2テスト)
```typescript
describe('GachaManagementPage - Gacha Deletion', () => {
  it('should show confirmation dialog before deletion', () => {
    // 削除前の確認ダイアログ表示
  })

  it('should delete gacha successfully', () => {
    // ガチャの正常削除
  })
})
```

#### フィルター・検索テスト (3テスト)
```typescript
describe('GachaManagementPage - Filter and Search', () => {
  it('should filter gacha by status', () => {
    // ステータス別フィルタリング
  })

  it('should search gacha by name', () => {
    // 名前による検索
  })

  it('should sort gacha by various criteria', () => {
    // 各種条件でのソート
  })
})
```

#### プレビュー機能テスト (3テスト)
```typescript
describe('GachaManagementPage - Preview', () => {
  it('should show gacha preview modal', () => {
    // ガチャプレビューモーダル表示
  })

  it('should display all gacha items with rates', () => {
    // 全アイテム・排出率表示
  })

  it('should simulate gacha draw', () => {
    // ガチャ抽選シミュレーション
  })
})
```

### TC-003: VTuberDashboardPage (ダッシュボード画面) - 16テスト

#### 基本メトリクス表示テスト (6テスト)
```typescript
describe('VTuberDashboardPage - Basic Metrics', () => {
  it('should display total revenue correctly', () => {
    // 総収益の正確な表示
  })

  it('should show monthly revenue with trend', () => {
    // 月間収益・トレンド表示
  })

  it('should display fan count with growth rate', () => {
    // ファン数・成長率表示
  })

  it('should show medal statistics', () => {
    // 推しメダル統計表示
  })

  it('should display recent activities feed', () => {
    // 最新アクティビティフィード表示
  })

  it('should show gacha performance ranking', () => {
    // ガチャ性能ランキング表示
  })
})
```

#### チャート表示テスト (4テスト)
```typescript
describe('VTuberDashboardPage - Charts', () => {
  it('should render revenue chart correctly', () => {
    // 収益チャートの正常レンダリング
  })

  it('should display fan growth chart', () => {
    // ファン成長チャート表示
  })

  it('should show interactive chart tooltips', () => {
    // チャートツールチップの表示
  })

  it('should handle chart data updates', () => {
    // チャートデータ更新処理
  })
})
```

#### 期間フィルターテスト (3テスト)
```typescript
describe('VTuberDashboardPage - Date Filters', () => {
  it('should filter data by selected date range', () => {
    // 選択期間でのデータフィルタリング
  })

  it('should update all metrics when date changes', () => {
    // 期間変更時の全メトリクス更新
  })

  it('should persist selected date range', () => {
    // 選択期間の保持
  })
})
```

#### リアルタイム更新テスト (3テスト)
```typescript
describe('VTuberDashboardPage - Real-time Updates', () => {
  it('should update metrics in real-time', () => {
    // メトリクスのリアルタイム更新
  })

  it('should show notification for significant changes', () => {
    // 重要な変更の通知表示
  })

  it('should handle update errors gracefully', () => {
    // 更新エラーのハンドリング
  })
})
```

### TC-004: StatisticsPage (統計画面) - 14テスト

#### 詳細統計表示テスト (5テスト)
```typescript
describe('StatisticsPage - Detailed Statistics', () => {
  it('should display comprehensive revenue analytics', () => {
    // 包括的収益分析表示
  })

  it('should show fan demographics breakdown', () => {
    // ファン属性分析表示
  })

  it('should display activity heatmap', () => {
    // アクティビティヒートマップ表示
  })

  it('should show conversion rate analysis', () => {
    // コンバージョン率分析表示
  })

  it('should display comparison with previous periods', () => {
    // 前期間との比較表示
  })
})
```

#### カスタムレポートテスト (4テスト)
```typescript
describe('StatisticsPage - Custom Reports', () => {
  it('should create custom report with selected metrics', () => {
    // 選択メトリクスでのカスタムレポート作成
  })

  it('should save and load report templates', () => {
    // レポートテンプレートの保存・読み込み
  })

  it('should export report in multiple formats', () => {
    // 複数形式でのレポートエクスポート
  })

  it('should schedule automatic report generation', () => {
    // 自動レポート生成スケジュール
  })
})
```

#### データフィルタリングテスト (3テスト)
```typescript
describe('StatisticsPage - Data Filtering', () => {
  it('should filter statistics by date range', () => {
    // 期間指定での統計フィルタリング
  })

  it('should filter by gacha or content type', () => {
    // ガチャ・コンテンツ種別フィルタリング
  })

  it('should combine multiple filters', () => {
    // 複数フィルターの組み合わせ
  })
})
```

#### パフォーマンステスト (2テスト)
```typescript
describe('StatisticsPage - Performance', () => {
  it('should load large datasets efficiently', () => {
    // 大量データの効率的読み込み
  })

  it('should use data pagination for large reports', () => {
    // 大量レポートのページネーション
  })
})
```

### TC-005: FileUploadManager (ファイルアップロード管理) - 15テスト

#### 基本アップロードテスト (5テスト)
```typescript
describe('FileUploadManager - Basic Upload', () => {
  it('should upload single file successfully', () => {
    // 単一ファイルの正常アップロード
  })

  it('should upload multiple files simultaneously', () => {
    // 複数ファイルの同時アップロード
  })

  it('should display upload progress for each file', () => {
    // ファイル毎のアップロード進捗表示
  })

  it('should handle upload completion', () => {
    // アップロード完了処理
  })

  it('should retry failed uploads', () => {
    // 失敗したアップロードの再試行
  })
})
```

#### ファイル検証テスト (4テスト)
```typescript
describe('FileUploadManager - File Validation', () => {
  it('should validate file type restrictions', () => {
    // ファイル形式制限の検証
  })

  it('should enforce file size limits', () => {
    // ファイルサイズ制限の実施
  })

  it('should check file name validity', () => {
    // ファイル名の有効性チェック
  })

  it('should scan files for security threats', () => {
    // セキュリティ脅威のスキャン
  })
})
```

#### プレビュー機能テスト (3テスト)
```typescript
describe('FileUploadManager - Preview', () => {
  it('should generate image thumbnails', () => {
    // 画像サムネイルの生成
  })

  it('should display audio/video preview', () => {
    // 音声・動画プレビュー表示
  })

  it('should handle preview generation errors', () => {
    // プレビュー生成エラーのハンドリング
  })
})
```

#### ファイル管理テスト (3テスト)
```typescript
describe('FileUploadManager - File Management', () => {
  it('should delete uploaded files', () => {
    // アップロード済みファイルの削除
  })

  it('should organize files by categories', () => {
    // カテゴリ別ファイル整理
  })

  it('should search files by name or tags', () => {
    // 名前・タグによるファイル検索
  })
})
```

### TC-006: VTuberStore (Zustand状態管理) - 12テスト

#### 状態初期化テスト (2テスト)
```typescript
describe('VTuberStore - Initialization', () => {
  it('should initialize with default state', () => {
    // デフォルト状態での初期化
  })

  it('should load persisted state from storage', () => {
    // ストレージからの永続化状態読み込み
  })
})
```

#### VTuber情報管理テスト (3テスト)
```typescript
describe('VTuberStore - VTuber Info Management', () => {
  it('should fetch and store VTuber information', () => {
    // VTuber情報の取得・保存
  })

  it('should update VTuber information', () => {
    // VTuber情報の更新
  })

  it('should handle VTuber info fetch errors', () => {
    // VTuber情報取得エラーのハンドリング
  })
})
```

#### ガチャ管理テスト (4テスト)
```typescript
describe('VTuberStore - Gacha Management', () => {
  it('should manage gacha list state', () => {
    // ガチャリスト状態管理
  })

  it('should create new gacha', () => {
    // 新規ガチャ作成
  })

  it('should update existing gacha', () => {
    // 既存ガチャ更新
  })

  it('should delete gacha from list', () => {
    // リストからガチャ削除
  })
})
```

#### 統計データ管理テスト (3テスト)
```typescript
describe('VTuberStore - Statistics Management', () => {
  it('should cache statistics data', () => {
    // 統計データのキャッシュ
  })

  it('should invalidate cache when needed', () => {
    // 必要時のキャッシュ無効化
  })

  it('should handle statistics fetch errors', () => {
    // 統計取得エラーのハンドリング
  })
})
```

### TC-007: API統合テスト - 8テスト

#### VTuberAPI統合テスト (4テスト)
```typescript
describe('VTuberAPI Integration', () => {
  it('should integrate with VTuber info endpoints', () => {
    // VTuber情報APIとの統合
  })

  it('should handle API authentication properly', () => {
    // API認証の適切な処理
  })

  it('should retry failed requests', () => {
    // 失敗リクエストの再試行
  })

  it('should cache API responses', () => {
    // APIレスポンスのキャッシュ
  })
})
```

#### ファイルアップロードAPI統合テスト (2テスト)
```typescript
describe('File Upload API Integration', () => {
  it('should integrate with file upload endpoints', () => {
    // ファイルアップロードAPIとの統合
  })

  it('should handle large file uploads', () => {
    // 大容量ファイルアップロードの処理
  })
})
```

#### エラーハンドリングテスト (2テスト)
```typescript
describe('API Error Handling', () => {
  it('should handle network errors gracefully', () => {
    // ネットワークエラーの適切な処理
  })

  it('should display user-friendly error messages', () => {
    // ユーザーフレンドリーなエラーメッセージ表示
  })
})
```

### TC-008: レスポンシブデザインテスト - 6テスト

#### モバイル対応テスト (3テスト)
```typescript
describe('Responsive Design - Mobile', () => {
  it('should display correctly on mobile devices', () => {
    // モバイル端末での正常表示
  })

  it('should provide touch-friendly interactions', () => {
    // タッチフレンドリーなインタラクション
  })

  it('should adjust layout for portrait/landscape', () => {
    // 縦横画面でのレイアウト調整
  })
})
```

#### タブレット・デスクトップ対応テスト (3テスト)
```typescript
describe('Responsive Design - Tablet & Desktop', () => {
  it('should utilize screen space effectively on tablets', () => {
    // タブレットでの画面領域有効活用
  })

  it('should provide enhanced features on desktop', () => {
    // デスクトップでの機能強化
  })

  it('should handle window resize gracefully', () => {
    // ウィンドウサイズ変更の適切な処理
  })
})
```

### TC-009: アクセシビリティテスト - 8テスト

#### キーボードナビゲーションテスト (3テスト)
```typescript
describe('Accessibility - Keyboard Navigation', () => {
  it('should navigate all interactive elements with keyboard', () => {
    // 全インタラクティブ要素のキーボードナビゲーション
  })

  it('should provide visible focus indicators', () => {
    // 明確なフォーカス表示
  })

  it('should support keyboard shortcuts', () => {
    // キーボードショートカット対応
  })
})
```

#### スクリーンリーダー対応テスト (3テスト)
```typescript
describe('Accessibility - Screen Reader', () => {
  it('should provide appropriate ARIA labels', () => {
    // 適切なARIAラベル提供
  })

  it('should announce dynamic content changes', () => {
    // 動的コンテンツ変更の通知
  })

  it('should structure content semantically', () => {
    // セマンティックなコンテンツ構造
  })
})
```

#### 視覚的アクセシビリティテスト (2テスト)
```typescript
describe('Accessibility - Visual', () => {
  it('should meet color contrast requirements', () => {
    // カラーコントラスト要件の満足
  })

  it('should scale properly at 200% zoom', () => {
    // 200%ズーム時の適切なスケーリング
  })
})
```

### TC-010: パフォーマンステスト - 5テスト

#### 読み込み時間テスト (2テスト)
```typescript
describe('Performance - Load Times', () => {
  it('should load dashboard within 3 seconds', () => {
    // ダッシュボード3秒以内読み込み
  })

  it('should transition between pages within 1 second', () => {
    // ページ遷移1秒以内完了
  })
})
```

#### メモリ使用量テスト (2テスト)
```typescript
describe('Performance - Memory Usage', () => {
  it('should maintain reasonable memory usage', () => {
    // 適切なメモリ使用量維持
  })

  it('should not have memory leaks', () => {
    // メモリリークの防止
  })
})
```

#### ファイル処理パフォーマンステスト (1テスト)
```typescript
describe('Performance - File Processing', () => {
  it('should handle large file uploads efficiently', () => {
    // 大容量ファイルアップロードの効率的処理
  })
})
```

### TC-011: セキュリティテスト - 6テスト

#### 認証・認可テスト (3テスト)
```typescript
describe('Security - Authentication & Authorization', () => {
  it('should enforce VTuber role requirements', () => {
    // VTuberロール要件の実施
  })

  it('should handle token expiration gracefully', () => {
    // トークン期限切れの適切な処理
  })

  it('should prevent unauthorized access', () => {
    // 不正アクセスの防止
  })
})
```

#### ファイルセキュリティテスト (2テスト)
```typescript
describe('Security - File Security', () => {
  it('should validate uploaded file types securely', () => {
    // アップロードファイル形式の安全な検証
  })

  it('should prevent malicious file uploads', () => {
    // 悪意あるファイルアップロードの防止
  })
})
```

#### データ保護テスト (1テスト)
```typescript
describe('Security - Data Protection', () => {
  it('should sanitize user input properly', () => {
    // ユーザー入力の適切なサニタイズ
  })
})
```

## テスト実装順序

### フェーズ1: 基本コンポーネントテスト
1. VTuberApplicationPage 基本レンダリング
2. GachaManagementPage 基本表示
3. VTuberDashboardPage メトリクス表示
4. StatisticsPage 統計表示
5. FileUploadManager 基本アップロード

### フェーズ2: 機能統合テスト
1. フォームバリデーション・送信
2. ファイルアップロード機能
3. API統合テスト
4. 状態管理テスト

### フェーズ3: 品質・パフォーマンステスト
1. レスポンシブデザインテスト
2. アクセシビリティテスト
3. パフォーマンステスト
4. セキュリティテスト

## テストデータ・モック設計

### モックAPI設定
```typescript
// MSW (Mock Service Worker) handlers
export const vtuberHandlers = [
  rest.get('/api/vtuber/info', (req, res, ctx) => {
    return res(ctx.json(mockVTuberInfo))
  }),
  rest.post('/api/vtuber/application', (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),
  rest.get('/api/vtuber/gacha', (req, res, ctx) => {
    return res(ctx.json(mockGachaList))
  }),
  rest.post('/api/vtuber/gacha', (req, res, ctx) => {
    return res(ctx.json(mockCreatedGacha))
  }),
  rest.get('/api/vtuber/statistics', (req, res, ctx) => {
    return res(ctx.json(mockStatistics))
  }),
  rest.post('/api/upload', (req, res, ctx) => {
    return res(ctx.json(mockUploadResponse))
  })
]
```

### テストデータ定義
```typescript
export const mockVTuberInfo = {
  id: 'vtuber-test-1',
  channelName: 'テストVTuber',
  description: 'テスト用VTuberアカウント',
  profileImage: 'https://example.com/profile.jpg',
  bannerImage: 'https://example.com/banner.jpg',
  socialMedia: {
    youtube: 'https://youtube.com/@testvtuber',
    twitter: 'https://twitter.com/testvtuber'
  },
  status: 'approved',
  joinedAt: '2024-01-01'
}

export const mockGachaList = [
  {
    id: 'gacha-1',
    title: 'テストガチャ1',
    description: 'テスト用ガチャ',
    price: 500,
    status: 'active',
    items: mockGachaItems
  }
]
```

## テスト実行・CI/CD統合

### テスト実行コマンド
```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジレポート
npm run test:coverage

# E2Eテスト
npm run test:e2e

# 並列テスト実行
npm run test:parallel
```

### CI/CDパイプライン統合
```yaml
test:
  stage: test
  script:
    - npm ci
    - npm run test:coverage
    - npm run test:e2e
  coverage: /All files[^|]*\|[^|]*\s+([\d\.]+)/
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

## 品質ゲート

### 成功条件
- **テスト成功率**: 100%
- **コードカバレッジ**: 80%以上
- **パフォーマンス**: 全要件満足
- **アクセシビリティ**: WCAG 2.1 AA準拠
- **セキュリティ**: 脆弱性0件

### 失敗時の対応
- **テスト失敗**: 原因調査・修正後再実行
- **カバレッジ不足**: 追加テスト作成
- **パフォーマンス不足**: 最適化実施
- **セキュリティ問題**: 緊急修正対応

このテストケース設計により、VTuber管理画面の品質を確保し、
ユーザーにとって安全で使いやすい機能を提供します。