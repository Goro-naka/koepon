# TASK-405: 特典BOX画面実装 - テストケース設計

## テストカテゴリ

1. **RB: RewardsBoxPage Tests** - 特典一覧画面
2. **RP: RewardPreview Tests** - プレビュー機能
3. **DM: DownloadManager Tests** - ダウンロード管理
4. **RS: RewardsStore Tests** - 状態管理
5. **RF: RewardFilters Tests** - フィルタリング機能
6. **RU: RewardUtils Tests** - ユーティリティ関数
7. **RA: API Integration Tests** - API統合
8. **RE: Error Handling Tests** - エラー処理
9. **RP: Performance Tests** - パフォーマンス

## 詳細テストケース

### RB: RewardsBoxPage Tests

#### RB001: 基本レンダリング
```typescript
describe('RewardsBoxPage', () => {
  it('should render rewards list with correct layout')
  it('should display reward cards with thumbnail, title, and metadata')
  it('should show empty state when no rewards available')
  it('should handle loading state with skeleton loaders')
  it('should display error state with retry button')
})
```

#### RB002: レスポンシブレイアウト
```typescript
describe('Responsive Layout', () => {
  it('should render single column on mobile')
  it('should render 2-3 columns on tablet')
  it('should render 4-6 columns on desktop')
  it('should adjust card size based on viewport')
})
```

#### RB003: インタラクション
```typescript
describe('User Interactions', () => {
  it('should open preview on card click')
  it('should trigger download on download button click')
  it('should show context menu on long press')
  it('should select multiple items for batch download')
  it('should toggle favorite status')
})
```

### RP: RewardPreview Tests

#### RP001: 画像プレビュー
```typescript
describe('Image Preview', () => {
  it('should display image in modal')
  it('should support pinch zoom on mobile')
  it('should support mouse wheel zoom on desktop')
  it('should show image metadata (dimensions, size)')
  it('should handle image loading errors')
})
```

#### RP002: 音声プレビュー
```typescript
describe('Audio Preview', () => {
  it('should render audio player with controls')
  it('should play/pause audio')
  it('should adjust volume')
  it('should seek to specific position')
  it('should change playback speed')
  it('should display audio duration and current time')
})
```

#### RP003: 動画プレビュー
```typescript
describe('Video Preview', () => {
  it('should render video player')
  it('should support fullscreen mode')
  it('should load and display subtitles')
  it('should handle video loading errors')
  it('should remember playback position')
})
```

#### RP004: ドキュメントプレビュー
```typescript
describe('Document Preview', () => {
  it('should display PDF in viewer')
  it('should show text file content')
  it('should handle unsupported file types')
  it('should provide download fallback')
})
```

### DM: DownloadManager Tests

#### DM001: 単一ダウンロード
```typescript
describe('Single Download', () => {
  it('should initiate download with correct URL')
  it('should show download progress')
  it('should handle download completion')
  it('should retry on failure')
  it('should validate file integrity')
})
```

#### DM002: 一括ダウンロード
```typescript
describe('Batch Download', () => {
  it('should download multiple files sequentially')
  it('should create ZIP archive for batch downloads')
  it('should show overall progress')
  it('should handle partial failures')
  it('should limit concurrent downloads')
})
```

#### DM003: ダウンロード管理
```typescript
describe('Download Queue Management', () => {
  it('should queue downloads when limit reached')
  it('should pause/resume downloads')
  it('should cancel downloads')
  it('should persist download state')
  it('should clean up completed downloads')
})
```

### RS: RewardsStore Tests

#### RS001: 状態管理
```typescript
describe('RewardsStore', () => {
  it('should fetch and store rewards list')
  it('should update download status')
  it('should manage filter state')
  it('should handle pagination')
  it('should cache rewards data')
})
```

#### RS002: アクション処理
```typescript
describe('Store Actions', () => {
  it('should execute fetchRewards action')
  it('should execute downloadReward action')
  it('should execute downloadMultiple action')
  it('should execute setFilters action')
  it('should execute search action')
})
```

#### RS003: セレクター
```typescript
describe('Store Selectors', () => {
  it('should filter rewards by category')
  it('should filter rewards by download status')
  it('should search rewards by keyword')
  it('should sort rewards by various criteria')
  it('should paginate rewards list')
})
```

### RF: RewardFilters Tests

#### RF001: カテゴリフィルター
```typescript
describe('Category Filters', () => {
  it('should filter by voice category')
  it('should filter by image category')
  it('should filter by video category')
  it('should filter by document category')
  it('should support multiple category selection')
})
```

#### RF002: ステータスフィルター
```typescript
describe('Status Filters', () => {
  it('should filter downloaded rewards')
  it('should filter not downloaded rewards')
  it('should filter expired rewards')
  it('should filter favorited rewards')
})
```

#### RF003: 検索機能
```typescript
describe('Search Functionality', () => {
  it('should search by title')
  it('should search by description')
  it('should search by VTuber name')
  it('should search by tags')
  it('should handle special characters in search')
})
```

### RU: RewardUtils Tests

#### RU001: ファイル処理
```typescript
describe('File Utilities', () => {
  it('should format file size correctly')
  it('should detect file type from extension')
  it('should generate download filename')
  it('should validate file integrity')
  it('should calculate download progress')
})
```

#### RU002: 日付処理
```typescript
describe('Date Utilities', () => {
  it('should format acquisition date')
  it('should calculate expiry status')
  it('should format remaining time')
  it('should handle timezone differences')
})
```

#### RU003: カテゴリ処理
```typescript
describe('Category Utilities', () => {
  it('should map file type to category')
  it('should get category icon')
  it('should get category color')
  it('should validate category')
})
```

### RA: API Integration Tests

#### RA001: API通信
```typescript
describe('API Integration', () => {
  it('should fetch rewards list from API')
  it('should handle API errors gracefully')
  it('should retry failed requests')
  it('should cache API responses')
  it('should handle pagination')
})
```

#### RA002: ダウンロードAPI
```typescript
describe('Download API', () => {
  it('should get signed download URL')
  it('should record download history')
  it('should validate download permissions')
  it('should handle URL expiration')
})
```

### RE: Error Handling Tests

#### RE001: ネットワークエラー
```typescript
describe('Network Errors', () => {
  it('should handle connection timeout')
  it('should handle network offline')
  it('should handle server errors (5xx)')
  it('should handle client errors (4xx)')
  it('should show appropriate error messages')
})
```

#### RE002: ファイルエラー
```typescript
describe('File Errors', () => {
  it('should handle corrupted files')
  it('should handle unsupported formats')
  it('should handle file size limits')
  it('should handle storage quota exceeded')
})
```

### RP: Performance Tests

#### RP001: レンダリングパフォーマンス
```typescript
describe('Rendering Performance', () => {
  it('should render 100 items without lag')
  it('should implement virtual scrolling')
  it('should lazy load images')
  it('should debounce search input')
})
```

#### RP002: ダウンロードパフォーマンス
```typescript
describe('Download Performance', () => {
  it('should handle large file downloads')
  it('should implement chunk transfer')
  it('should optimize bandwidth usage')
  it('should handle concurrent downloads efficiently')
})
```

## モック設計

### API モック
```typescript
const mockRewards: Reward[] = [
  {
    id: 'reward-1',
    title: 'ボイス特典 #1',
    description: '特別ボイスメッセージ',
    category: 'voice',
    fileType: 'audio/mp3',
    fileSize: 2500000,
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    vtuberName: 'テストVTuber',
    acquiredAt: '2024-01-15T10:00:00.000Z',
    expiresAt: '2024-12-31T23:59:59.000Z',
    isDownloaded: false,
    isFavorite: false,
    tags: ['限定', 'ボイス'],
  },
  // ... more mock data
]

const mockDownloadUrl = {
  url: 'https://example.com/download/signed-url',
  expiresAt: '2024-01-15T11:00:00.000Z',
}
```

### ファイル処理モック
```typescript
const mockDownloadManager = {
  download: jest.fn().mockResolvedValue({ success: true }),
  downloadMultiple: jest.fn().mockResolvedValue({ success: true }),
  pauseDownload: jest.fn(),
  resumeDownload: jest.fn(),
  cancelDownload: jest.fn(),
  onProgress: jest.fn(),
}
```

## テスト実行計画

### フェーズ1: Red Phase (失敗テスト)
1. 基本コンポーネントテストを作成
2. ストアテストを作成
3. ユーティリティテストを作成
4. すべてのテストが失敗することを確認

### フェーズ2: Green Phase (最小実装)
1. 基本的な特典一覧表示を実装
2. 単一ダウンロード機能を実装
3. 基本的なフィルタリングを実装
4. テストが通ることを確認

### フェーズ3: Refactor Phase
1. コンポーネントの分離と最適化
2. パフォーマンスの改善
3. エラーハンドリングの強化
4. コード品質の向上

## カバレッジ目標

- **ライン**: 85%以上
- **ブランチ**: 80%以上
- **関数**: 90%以上
- **ステートメント**: 85%以上

## リスクと対策

### リスク1: 大容量ファイルのダウンロード
- **対策**: チャンク転送とプログレス表示

### リスク2: 同時ダウンロード数
- **対策**: キューイングと並列数制限

### リスク3: ネットワーク不安定
- **対策**: レジューム機能と自動リトライ

### リスク4: ストレージ容量
- **対策**: 事前チェックと警告表示