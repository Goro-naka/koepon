# TASK-403: ガチャ画面実装 - テストケース設計

## テスト戦略

### テストレベル構成
1. **単体テスト (Unit Tests)**: コンポーネント・ストア・ユーティリティの個別機能
2. **統合テスト (Integration Tests)**: コンポーネント間の連携・API通信
3. **E2Eテスト (End-to-End Tests)**: ユーザーフローの全体動作

### テストツール
- **Jest**: テストランナー・モッキング
- **React Testing Library**: コンポーネントテスト
- **Playwright**: E2Eテスト
- **MSW (Mock Service Worker)**: APIモッキング

## 1. GachaListPage テストケース

### GL001: 基本レンダリング
```typescript
describe('GachaListPage - Basic Rendering', () => {
  test('should render gacha list page with header', async () => {
    // Given: ガチャリストデータがロード済み
    // When: ページが表示される
    // Then: ヘッダー「ガチャ一覧」が表示される
  })

  test('should render search and filter controls', async () => {
    // Given: ページが表示される
    // When: 初期状態をチェック
    // Then: 検索ボックス、VTuberフィルター、ソート選択が表示される
  })

  test('should render gacha cards in grid layout', async () => {
    // Given: 複数のガチャデータが存在
    // When: ページが表示される
    // Then: ガチャカードがグリッド形式で表示される
  })
})
```

### GL002: データロード処理
```typescript
describe('GachaListPage - Data Loading', () => {
  test('should show loading skeleton during data fetch', async () => {
    // Given: APIがローディング中
    // When: ページが表示される
    // Then: スケルトンローダーが表示される
  })

  test('should display gacha list after successful load', async () => {
    // Given: API呼び出しが成功
    // When: データがロードされる
    // Then: ガチャカードリストが表示される
  })

  test('should show error state when API fails', async () => {
    // Given: API呼び出しが失敗
    // When: エラーが発生
    // Then: エラーメッセージと再試行ボタンが表示される
  })

  test('should show empty state when no gacha available', async () => {
    // Given: ガチャが1件も存在しない
    // When: ページが表示される
    // Then: 「ガチャが登録されていません」メッセージが表示される
  })
})
```

### GL003: 検索・フィルタリング
```typescript
describe('GachaListPage - Search and Filter', () => {
  test('should filter gacha by VTuber selection', async () => {
    // Given: 複数VTuberのガチャが存在
    // When: 特定のVTuberを選択
    // Then: そのVTuberのガチャのみが表示される
  })

  test('should search gacha by name', async () => {
    // Given: ガチャリストが表示中
    // When: ガチャ名で検索
    // Then: 一致するガチャのみが表示される
  })

  test('should sort gacha by price/popularity/latest', async () => {
    // Given: ガチャリストが表示中
    // When: ソート条件を変更
    // Then: 指定順序でガチャが並び替えられる
  })

  test('should clear filters and show all gacha', async () => {
    // Given: フィルターが適用されている
    // When: クリアボタンをクリック
    // Then: 全てのガチャが表示される
  })
})
```

### GL004: ガチャカード表示
```typescript
describe('GachaListPage - Gacha Card Display', () => {
  test('should display gacha card information correctly', async () => {
    // Given: ガチャデータが存在
    // When: カードが表示される
    // Then: VTuber名、ガチャ名、価格、期間が正しく表示される
  })

  test('should show limited-time badge for time-limited gacha', async () => {
    // Given: 期間限定ガチャが存在
    // When: カードが表示される
    // Then: 「期間限定」バッジが表示される
  })

  test('should navigate to detail page on card click', async () => {
    // Given: ガチャカードが表示中
    // When: カードをクリック
    // Then: ガチャ詳細ページに遷移する
  })
})
```

## 2. GachaDetailPage テストケース

### GD001: 詳細情報表示
```typescript
describe('GachaDetailPage - Detail Display', () => {
  test('should render gacha detail information', async () => {
    // Given: ガチャIDが指定されている
    // When: 詳細ページが表示される
    // Then: タイトル、説明、VTuber情報が表示される
  })

  test('should display pricing options (single/10-draw)', async () => {
    // Given: 詳細ページが表示中
    // When: 価格情報をチェック
    // Then: 単発・10連の価格が表示される
  })

  test('should show probability rates table', async () => {
    // Given: 詳細ページが表示中
    // When: 排出率情報をチェック
    // Then: レアリティ別確率テーブルが表示される
  })

  test('should display available rewards preview', async () => {
    // Given: 詳細ページが表示中
    // When: 景品情報をチェック
    // Then: 獲得可能アイテムのプレビューが表示される
  })
})
```

### GD002: 購入オプション
```typescript
describe('GachaDetailPage - Purchase Options', () => {
  test('should enable single draw button with correct price', async () => {
    // Given: 詳細ページが表示中
    // When: 単発ボタンをチェック
    // Then: 正しい価格で有効状態のボタンが表示される
  })

  test('should enable 10-draw button with discount price', async () => {
    // Given: 詳細ページが表示中
    // When: 10連ボタンをチェック
    // Then: 割引価格で有効状態のボタンが表示される
  })

  test('should show confirmation modal on purchase button click', async () => {
    // Given: 購入ボタンが有効
    // When: ボタンをクリック
    // Then: 確認モーダルが表示される
  })

  test('should disable purchase when user has insufficient funds', async () => {
    // Given: ユーザーの残高不足
    // When: 詳細ページが表示される
    // Then: 購入ボタンが無効状態で表示される
  })
})
```

### GD003: 期間・制限表示
```typescript
describe('GachaDetailPage - Period and Limits', () => {
  test('should show campaign period for limited-time gacha', async () => {
    // Given: 期間限定ガチャの詳細
    // When: ページが表示される
    // Then: 開催期間が明確に表示される
  })

  test('should display remaining draw count for limited gacha', async () => {
    // Given: 回数制限ありのガチャ
    // When: ページが表示される
    // Then: 残り回数が表示される
  })

  test('should show expired state for ended gacha', async () => {
    // Given: 終了済みのガチャ
    // When: ページが表示される
    // Then: 終了メッセージと購入不可状態が表示される
  })
})
```

## 3. GachaDrawPage テストケース

### GDR001: 抽選演出
```typescript
describe('GachaDrawPage - Draw Animation', () => {
  test('should start draw animation on page load', async () => {
    // Given: 抽選ページが表示される
    // When: ページロード完了
    // Then: 3秒以内の抽選アニメーションが開始される
  })

  test('should prevent user interaction during animation', async () => {
    // Given: 抽選アニメーション中
    // When: ユーザーがクリック
    // Then: アニメーションが中断されない
  })

  test('should show progress indicator during draw', async () => {
    // Given: 抽選処理中
    // When: アニメーション実行中
    // Then: 進行状況インジケーターが表示される
  })

  test('should complete animation within 3 seconds', async () => {
    // Given: 抽選が開始される
    // When: アニメーション実行
    // Then: 3秒以内に完了する
  })
})
```

### GDR002: 結果表示
```typescript
describe('GachaDrawPage - Result Display', () => {
  test('should display single draw result with item details', async () => {
    // Given: 単発抽選が完了
    // When: 結果が表示される
    // Then: 獲得アイテム詳細が大きく表示される
  })

  test('should show rarity-specific visual effects', async () => {
    // Given: 高レアアイテム獲得
    // When: 結果表示
    // Then: レアリティに応じた特別エフェクトが表示される
  })

  test('should display earned medal count prominently', async () => {
    // Given: 抽選完了
    // When: 結果表示
    // Then: 獲得推しメダル数が強調表示される
  })

  test('should provide share functionality for rare items', async () => {
    // Given: レアアイテム獲得
    // When: 結果表示
    // Then: SNS共有ボタンが表示される
  })
})
```

### GDR003: 連続抽選（10連）
```typescript
describe('GachaDrawPage - Multi Draw', () => {
  test('should show 10-draw animation sequence', async () => {
    // Given: 10連抽選が選択されている
    // When: 抽選実行
    // Then: 連続抽選アニメーションが表示される
  })

  test('should display all 10 results in summary view', async () => {
    // Given: 10連抽選が完了
    // When: 結果表示
    // Then: 10件の結果がまとめて表示される
  })

  test('should highlight best result in multi-draw', async () => {
    // Given: 10連で最高レア獲得
    // When: 結果表示
    // Then: 最高レアアイテムが特別表示される
  })
})
```

### GDR004: エラーハンドリング
```typescript
describe('GachaDrawPage - Error Handling', () => {
  test('should handle network error during draw', async () => {
    // Given: 抽選実行中にネットワークエラー
    // When: エラーが発生
    // Then: エラーメッセージと再試行ボタンが表示される
  })

  test('should handle insufficient balance error', async () => {
    // Given: 残高不足で抽選実行
    // When: エラーが発生
    // Then: 残高不足メッセージが表示される
  })

  test('should handle server error gracefully', async () => {
    // Given: サーバーエラーが発生
    // When: 抽選実行
    // Then: 適切なエラーメッセージが表示される
  })
})
```

## 4. GachaHistoryPage テストケース

### GH001: 履歴表示
```typescript
describe('GachaHistoryPage - History Display', () => {
  test('should render gacha history list', async () => {
    // Given: 抽選履歴が存在
    // When: 履歴ページが表示される
    // Then: 日時順でソートされた履歴リストが表示される
  })

  test('should show history item details correctly', async () => {
    // Given: 履歴アイテムが表示中
    // When: 詳細をチェック
    // Then: 日時、ガチャ名、結果、獲得メダルが正しく表示される
  })

  test('should paginate history for large datasets', async () => {
    // Given: 多数の履歴レコード
    // When: ページが表示される
    // Then: ページネーション機能が表示される
  })
})
```

### GH002: フィルタリング・検索
```typescript
describe('GachaHistoryPage - Filtering', () => {
  test('should filter history by VTuber', async () => {
    // Given: 複数VTuberの履歴が存在
    // When: VTuberフィルターを適用
    // Then: 指定VTuberの履歴のみが表示される
  })

  test('should filter history by date range', async () => {
    // Given: 異なる日付の履歴が存在
    // When: 期間フィルターを適用
    // Then: 指定期間の履歴のみが表示される
  })

  test('should filter history by rarity', async () => {
    // Given: 異なるレアリティの履歴が存在
    // When: レアリティフィルターを適用
    // Then: 指定レアリティの履歴のみが表示される
  })
})
```

### GH003: 統計情報
```typescript
describe('GachaHistoryPage - Statistics', () => {
  test('should display total draw count', async () => {
    // Given: 抽選履歴が存在
    // When: 統計情報をチェック
    // Then: 総抽選回数が表示される
  })

  test('should show total medals earned', async () => {
    // Given: メダル獲得履歴が存在
    // When: 統計情報をチェック
    // Then: 総獲得メダル数が表示される
  })

  test('should calculate and display rare item rate', async () => {
    // Given: 抽選履歴が存在
    // When: 統計情報をチェック
    // Then: レアアイテム排出率が計算表示される
  })
})
```

## 5. Zustand Store テストケース

### ZS001: ガチャリスト状態管理
```typescript
describe('GachaStore - List Management', () => {
  test('should fetch and store gacha list', async () => {
    // Given: ストアが初期化されている
    // When: fetchGachaList()が呼ばれる
    // Then: APIから取得したリストがストアに保存される
  })

  test('should handle loading state during fetch', async () => {
    // Given: ガチャリスト取得中
    // When: ローディング状態をチェック
    // Then: gachaListLoading: trueが設定される
  })

  test('should handle fetch error appropriately', async () => {
    // Given: API呼び出しエラー
    // When: エラーが発生
    // Then: gachaListErrorにエラーメッセージが設定される
  })
})
```

### ZS002: 抽選状態管理
```typescript
describe('GachaStore - Draw State Management', () => {
  test('should execute draw and update state', async () => {
    // Given: ガチャ実行準備完了
    // When: executeDraw()が呼ばれる
    // Then: 抽選結果がdrawResultに保存される
  })

  test('should manage draw state transitions', async () => {
    // Given: 抽選開始
    // When: 状態遷移をチェック
    // Then: idle → drawing → complete の順で遷移する
  })

  test('should clear draw result when requested', async () => {
    // Given: 抽選結果が存在
    // When: clearDrawResult()が呼ばれる
    // Then: drawResultがnullにリセットされる
  })
})
```

## 6. API統合テストケース

### API001: エンドポイント通信
```typescript
describe('API Integration - Endpoints', () => {
  test('should call gacha list API with correct parameters', async () => {
    // Given: ガチャリスト取得リクエスト
    // When: APIが呼ばれる
    // Then: 正しいエンドポイント・パラメータで通信される
  })

  test('should call gacha detail API with gacha ID', async () => {
    // Given: ガチャ詳細取得リクエスト
    // When: APIが呼ばれる
    // Then: 正しいIDでAPI通信される
  })

  test('should call draw API with count parameter', async () => {
    // Given: 抽選実行リクエスト
    // When: APIが呼ばれる
    // Then: 正しいcount（1 or 10）で通信される
  })
})
```

### API002: エラーハンドリング
```typescript
describe('API Integration - Error Handling', () => {
  test('should retry on network timeout', async () => {
    // Given: ネットワークタイムアウト発生
    // When: 自動リトライ機能が動作
    // Then: 指数バックオフでリトライされる
  })

  test('should redirect to login on authentication error', async () => {
    // Given: 認証エラー（401）発生
    // When: APIエラーレスポンス
    // Then: ログイン画面にリダイレクトされる
  })

  test('should show fallback UI on server error', async () => {
    // Given: サーバーエラー（5xx）発生
    // When: エラーレスポンス
    // Then: フォールバックUIが表示される
  })
})
```

## 7. Socket.io統合テストケース

### WS001: リアルタイム通信
```typescript
describe('Socket.io Integration - Real-time Communication', () => {
  test('should connect to socket server on page load', async () => {
    // Given: ガチャページ表示
    // When: Socket.io接続
    // Then: サーバーとのWebSocket接続が確立される
  })

  test('should receive draw progress updates', async () => {
    // Given: 抽選実行中
    // When: draw:progressイベント受信
    // Then: 進行状況UIが更新される
  })

  test('should receive final draw results', async () => {
    // Given: 抽選完了
    // When: draw:resultイベント受信
    // Then: 最終結果が表示される
  })

  test('should handle connection loss gracefully', async () => {
    // Given: WebSocket接続断
    // When: 接続エラー発生
    // Then: 自動再接続とフォールバック機能が動作する
  })
})
```

## 8. E2Eテストシナリオ

### E2E001: 完全ガチャフロー
```typescript
test('complete gacha user journey', async ({ page }) => {
  // Given: ユーザーがログイン済み
  // When: ガチャ一覧 → 詳細 → 抽選 → 結果 → 履歴の完全フロー
  // Then: 全ての画面遷移と機能が正常動作する
})
```

### E2E002: モバイル対応
```typescript
test('mobile gacha experience', async ({ page }) => {
  // Given: モバイルデバイスでアクセス
  // When: ガチャ機能を利用
  // Then: レスポンシブUIとタッチ操作が正常動作する
})
```

### E2E003: エラー回復
```typescript
test('error recovery flow', async ({ page }) => {
  // Given: ネットワーク障害発生
  // When: エラー状態から回復
  // Then: ユーザーが操作を継続できる
})
```

## 9. パフォーマンステスト

### PERF001: Core Web Vitals
```typescript
describe('Performance Tests - Core Web Vitals', () => {
  test('should load gacha list page within 2.5s (LCP)', async () => {
    // Given: ガチャ一覧ページアクセス
    // When: ページロード測定
    // Then: LCP < 2.5秒を満たす
  })

  test('should respond to user input within 100ms (FID)', async () => {
    // Given: ユーザーインタラクション
    // When: 入力応答時間測定
    // Then: FID < 100msを満たす
  })

  test('should maintain stable layout (CLS < 0.1)', async () => {
    // Given: ページ表示中
    // When: レイアウトシフト測定
    // Then: CLS < 0.1を満たす
  })
})
```

### PERF002: アニメーション性能
```typescript
describe('Performance Tests - Animation', () => {
  test('should maintain 60fps during draw animation', async () => {
    // Given: 抽選アニメーション実行
    // When: フレームレート測定
    // Then: 60fps以上を維持する
  })

  test('should complete draw animation within 3 seconds', async () => {
    // Given: 抽選開始
    // When: アニメーション時間測定
    // Then: 3秒以内で完了する
  })
})
```

## 10. アクセシビリティテスト

### A11Y001: WCAG 2.1準拠
```typescript
describe('Accessibility Tests - WCAG 2.1', () => {
  test('should have sufficient color contrast (4.5:1)', async () => {
    // Given: 全ガチャページ
    // When: カラーコントラスト測定
    // Then: WCAG AA基準を満たす
  })

  test('should support keyboard navigation', async () => {
    // Given: キーボードのみでの操作
    // When: Tab・Enter・Escapeキーでナビゲーション
    // Then: 全機能にアクセス可能
  })

  test('should provide appropriate ARIA labels', async () => {
    // Given: スクリーンリーダー使用
    // When: ページ要素を読み上げ
    // Then: 適切なARIA属性で情報提供される
  })
})
```

## テスト実行優先順位

### 第1優先: 基本機能テスト
1. GachaListPage 基本レンダリング・データロード
2. GachaDetailPage 詳細情報表示
3. GachaDrawPage 抽選演出・結果表示
4. Zustand Store 状態管理

### 第2優先: 統合・E2Eテスト
1. 完全ガチャフロー E2E
2. API統合テスト
3. Socket.io通信テスト

### 第3優先: 品質・性能テスト
1. パフォーマンステスト
2. アクセシビリティテスト
3. エラーハンドリングテスト

このテストケース設計に基づき、TDDのRed-Green-Refactorサイクルで実装を進めます。