# TASK-405: 特典BOX画面実装 - 要件定義

## 概要

こえポン！の特典BOXシステムのフロントエンド実装。ユーザーが交換・獲得した特典（デジタルコンテンツ）を管理・ダウンロード・プレビューできる画面を提供する。

## 機能要件

### 1. 特典一覧画面 (RewardsBoxPage)

#### 1.1 特典表示機能
- **特典カード表示**: サムネイル・タイトル・説明・ファイルサイズ
- **取得日時表示**: いつ獲得したかの履歴
- **ダウンロード状況**: ダウンロード済み/未ダウンロードの表示
- **有効期限表示**: ダウンロード期限の表示と警告

#### 1.2 特典カテゴリ
- **ボイス特典**: 音声ファイル（MP3/WAV）
- **画像特典**: 壁紙・イラスト（JPG/PNG）
- **動画特典**: 特別動画（MP4）
- **その他特典**: PDF・テキストファイル等

#### 1.3 特典管理機能
- **一括ダウンロード**: 複数特典の同時ダウンロード
- **ダウンロード履歴**: いつダウンロードしたかの記録
- **お気に入り**: よく使う特典のマーキング
- **アーカイブ**: 古い特典の非表示化

### 2. プレビュー機能 (RewardPreview)

#### 2.1 画像プレビュー
- **インライン表示**: モーダルでの拡大表示
- **ズーム機能**: ピンチズーム・マウスホイール対応
- **画像情報**: 解像度・ファイルサイズ表示

#### 2.2 音声プレビュー
- **インラインプレーヤー**: 再生・一時停止・シークバー
- **音量調整**: ボリュームコントロール
- **再生速度**: 0.5x～2.0xの速度調整

#### 2.3 動画プレビュー
- **ビデオプレーヤー**: HTML5ビデオプレーヤー
- **フルスクリーン**: 全画面表示対応
- **字幕対応**: VTT字幕ファイル対応

### 3. ダウンロード機能 (DownloadManager)

#### 3.1 ダウンロード処理
- **個別ダウンロード**: 単一ファイルのダウンロード
- **一括ダウンロード**: ZIPアーカイブでの複数ダウンロード
- **レジューム機能**: 中断したダウンロードの再開
- **帯域制限**: ダウンロード速度の調整

#### 3.2 ダウンロード管理
- **進捗表示**: プログレスバー・パーセンテージ
- **キュー管理**: 複数ダウンロードのキューイング
- **エラーリトライ**: 失敗時の自動再試行
- **完了通知**: ダウンロード完了のトースト通知

### 4. 検索・フィルター機能

#### 4.1 検索機能
- **テキスト検索**: タイトル・説明での検索
- **VTuber検索**: 提供VTuberでの絞り込み
- **タグ検索**: 特典に付与されたタグでの検索

#### 4.2 フィルター機能
- **カテゴリフィルター**: ボイス・画像・動画等
- **期間フィルター**: 取得日・有効期限での絞り込み
- **ステータスフィルター**: ダウンロード済み・未ダウンロード
- **サイズフィルター**: ファイルサイズでの絞り込み

#### 4.3 ソート機能
- **取得日順**: 新しい順・古い順
- **名前順**: アルファベット順
- **サイズ順**: ファイルサイズ順
- **有効期限順**: 期限が近い順

## UI/UX要件

### 1. レイアウト設計

#### 1.1 グリッドレイアウト
```
┌─────────────────────────────────────────────┐
│ ヘッダー: 特典BOX                             │
├─────────────────────────────────────────────┤
│ 検索バー | フィルター | ソート | 表示切替      │
├─────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│ │     │ │     │ │     │ │     │         │
│ │特典1│ │特典2│ │特典3│ │特典4│         │
│ │     │ │     │ │     │ │     │         │
│ └─────┘ └─────┘ └─────┘ └─────┘         │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│ │     │ │     │ │     │ │     │         │
│ │特典5│ │特典6│ │特典7│ │特典8│         │
│ │     │ │     │ │     │ │     │         │
│ └─────┘ └─────┘ └─────┘ └─────┘         │
└─────────────────────────────────────────────┘
```

#### 1.2 リストレイアウト（モバイル）
```
┌─────────────────────────┐
│ 特典BOX                  │
├─────────────────────────┤
│ 🔍 検索...              │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ 🎵 ボイス特典#1      │ │
│ │ VTuber: 〇〇         │ │
│ │ 2.5MB | ⬇️          │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ 🖼️ 壁紙特典#1       │ │
│ │ VTuber: △△         │ │
│ │ 5.2MB | ✓          │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

### 2. インタラクション設計

#### 2.1 ダウンロード操作
- **シングルタップ**: プレビュー表示
- **ロングタップ**: コンテキストメニュー表示
- **ダウンロードボタン**: 明確なCTAボタン
- **進捗インジケーター**: リアルタイム更新

#### 2.2 プレビュー操作
- **モーダル表示**: オーバーレイでの表示
- **スワイプ操作**: 前後の特典への移動
- **ピンチズーム**: 画像の拡大縮小
- **ESCキー**: モーダルクローズ

### 3. レスポンシブデザイン

#### 3.1 ブレイクポイント
- **Mobile**: 320px～768px
- **Tablet**: 768px～1024px  
- **Desktop**: 1024px以上

#### 3.2 グリッド設定
- **Mobile**: 1カラム（リスト表示）
- **Tablet**: 2～3カラム
- **Desktop**: 4～6カラム

## 技術要件

### 1. 状態管理

#### 1.1 Zustandストア構成
```typescript
interface RewardsStore {
  // 特典リスト状態
  rewards: Reward[]
  rewardsLoading: boolean
  rewardsError: string | null
  
  // ダウンロード状態
  downloads: DownloadItem[]
  downloadQueue: string[]
  
  // フィルター状態
  searchQuery: string
  filters: RewardFilters
  sortBy: RewardSortOption
  
  // アクション
  fetchRewards: () => Promise<void>
  downloadReward: (rewardId: string) => Promise<void>
  downloadMultiple: (rewardIds: string[]) => Promise<void>
  setFilters: (filters: RewardFilters) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: RewardSortOption) => void
}
```

### 2. API統合

#### 2.1 エンドポイント設計
```typescript
// 特典一覧取得
GET /api/v1/rewards
Response: { rewards: Reward[], pagination: Pagination }

// 特典詳細取得
GET /api/v1/rewards/:id
Response: { reward: RewardDetail }

// ダウンロードURL取得
POST /api/v1/rewards/:id/download
Response: { downloadUrl: string, expiresAt: string }

// ダウンロード履歴記録
POST /api/v1/rewards/:id/downloaded
Body: { downloadedAt: string }
```

### 3. ファイル処理

#### 3.1 ダウンロード処理
```typescript
interface DownloadManager {
  download: (url: string, filename: string) => Promise<void>
  downloadMultiple: (items: DownloadItem[]) => Promise<void>
  pauseDownload: (id: string) => void
  resumeDownload: (id: string) => void
  cancelDownload: (id: string) => void
}
```

#### 3.2 プレビュー処理
```typescript
interface PreviewManager {
  previewImage: (url: string) => void
  previewAudio: (url: string) => void
  previewVideo: (url: string) => void
  previewDocument: (url: string) => void
}
```

## セキュリティ要件

### 1. ダウンロードセキュリティ
- **署名付きURL**: 期限付きの署名付きダウンロードURL
- **ダウンロード制限**: 同一ファイルのダウンロード回数制限
- **IPアドレス制限**: 異常なダウンロードパターンの検出

### 2. コンテンツ保護
- **DRM対応**: 必要に応じたDRM保護
- **透かし**: ダウンロード時のユーザー情報埋め込み
- **スクリーンショット防止**: 重要コンテンツの画面キャプチャ制限

## テスト要件

### 1. 単体テスト
```typescript
describe('RewardsBoxPage', () => {
  it('should render rewards list')
  it('should filter rewards by category')
  it('should search rewards by keyword')
  it('should handle download action')
})

describe('RewardPreview', () => {
  it('should preview image files')
  it('should preview audio files')
  it('should preview video files')
  it('should handle preview errors')
})

describe('DownloadManager', () => {
  it('should download single file')
  it('should download multiple files')
  it('should handle download errors')
  it('should show download progress')
})
```

### 2. 統合テスト
- **ダウンロードフロー**: 選択→確認→ダウンロード→完了
- **プレビューフロー**: 選択→プレビュー表示→操作→クローズ
- **フィルタリング**: 複数条件での絞り込み動作

### 3. E2Eテスト
```typescript
test('complete reward download flow', async ({ page }) => {
  // 特典一覧→選択→プレビュー→ダウンロード→確認
})

test('batch download flow', async ({ page }) => {
  // 複数選択→一括ダウンロード→進捗確認→完了
})
```

## パフォーマンス要件

### 1. 読み込み性能
- **初回表示**: 2秒以内
- **画像遅延読み込み**: ビューポート外の画像は遅延
- **無限スクロール**: 大量特典の段階的読み込み

### 2. ダウンロード性能
- **並列ダウンロード**: 最大3ファイル同時
- **チャンク転送**: 大容量ファイルの分割転送
- **帯域調整**: ネットワーク状況に応じた調整

## 実装優先順位

### フェーズ1：基本機能（1日目）
1. **特典一覧表示** - 基本的なリスト表示
2. **フィルタリング** - カテゴリ別絞り込み
3. **単一ダウンロード** - 個別ファイルダウンロード

### フェーズ2：拡張機能（2日目）
1. **プレビュー機能** - 各種ファイルのプレビュー
2. **一括ダウンロード** - 複数ファイルの同時処理
3. **検索・ソート** - 高度な検索とソート機能

## 受け入れ基準

### 機能面
- [ ] 特典一覧が正しく表示される
- [ ] 各種ファイルがダウンロード可能
- [ ] プレビュー機能が動作する
- [ ] フィルタリング・検索が機能する

### 品質面
- [ ] TypeScript型安全性が100%
- [ ] テストカバレッジが85%以上
- [ ] ページ表示時間が2秒以内
- [ ] エラーハンドリングが適切

### セキュリティ面
- [ ] 署名付きURLが正しく機能
- [ ] ダウンロード制限が適用される
- [ ] 不正アクセスが防止される

この要件定義に基づいて、ユーザーフレンドリーな特典BOX画面を実装します。