# TASK-404: 推しメダル・交換所画面実装 - テストケース設計

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

## 1. MedalBalancePage テストケース

### MB001: 基本レンダリング
```typescript
describe('MedalBalancePage - Basic Rendering', () => {
  test('should render medal balance page with header', async () => {
    // Given: メダル残高データがロード済み
    // When: ページが表示される
    // Then: ヘッダー「推しメダル残高」が表示される
  })

  test('should render VTuber balance cards', async () => {
    // Given: 複数VTuberの残高データが存在
    // When: ページが表示される
    // Then: VTuber別のメダル残高カードが表示される
  })

  test('should show total balance summary', async () => {
    // Given: メダル残高データが存在
    // When: ページが表示される
    // Then: 総メダル数のサマリーが表示される
  })

  test('should render balance chart visualization', async () => {
    // Given: メダル残高データが存在
    // When: ページが表示される
    // Then: 円グラフまたは棒グラフが表示される
  })
})
```

### MB002: データロード処理
```typescript
describe('MedalBalancePage - Data Loading', () => {
  test('should show loading skeleton during balance fetch', async () => {
    // Given: APIがローディング中
    // When: ページが表示される
    // Then: スケルトンローダーが表示される
  })

  test('should display balance after successful load', async () => {
    // Given: API呼び出しが成功
    // When: データがロードされる
    // Then: メダル残高が表示される
  })

  test('should show error state when API fails', async () => {
    // Given: API呼び出しが失敗
    // When: エラーが発生
    // Then: エラーメッセージと再試行ボタンが表示される
  })

  test('should show empty state for new users', async () => {
    // Given: メダル残高が0の新規ユーザー
    // When: ページが表示される
    // Then: 「まだメダルがありません」メッセージが表示される
  })
})
```

### MB003: 残高詳細機能
```typescript
describe('MedalBalancePage - Balance Details', () => {
  test('should show detailed balance for specific VTuber', async () => {
    // Given: VTuberカードが表示されている
    // When: VTuberカードをクリック
    // Then: 詳細な獲得・使用履歴が表示される
  })

  test('should filter balance history by date range', async () => {
    // Given: 残高履歴が表示中
    // When: 期間フィルターを適用
    // Then: 指定期間の履歴のみが表示される
  })

  test('should display medal earning statistics', async () => {
    // Given: 残高詳細画面
    // When: 統計タブをクリック
    // Then: 平均獲得数・使用傾向が表示される
  })
})
```

## 2. ExchangePage テストケース

### EX001: アイテム一覧表示
```typescript
describe('ExchangePage - Item List Display', () => {
  test('should render exchange page with item categories', async () => {
    // Given: 交換アイテムデータが存在
    // When: 交換所ページが表示される
    // Then: カテゴリタブとアイテムリストが表示される
  })

  test('should display item cards with essential information', async () => {
    // Given: 交換アイテムが表示中
    // When: アイテムカードをチェック
    // Then: 画像・名前・価格・在庫が表示される
  })

  test('should show item availability status', async () => {
    // Given: 在庫切れアイテムが存在
    // When: アイテムリストが表示される
    // Then: 在庫状況が適切に表示される
  })

  test('should display exchange requirements clearly', async () => {
    // Given: アイテム詳細を確認
    // When: 必要メダル数をチェック
    // Then: 必要メダル数・VTuber・制限が明確に表示される
  })
})
```

### EX002: フィルタリング・検索機能
```typescript
describe('ExchangePage - Filtering and Search', () => {
  test('should filter items by category', async () => {
    // Given: 複数カテゴリのアイテムが存在
    // When: 特定カテゴリを選択
    // Then: そのカテゴリのアイテムのみが表示される
  })

  test('should filter items by VTuber', async () => {
    // Given: 複数VTuberのアイテムが存在
    // When: VTuberフィルターを適用
    // Then: 指定VTuberのアイテムのみが表示される
  })

  test('should search items by name', async () => {
    // Given: アイテムリストが表示中
    // When: 検索ボックスにキーワード入力
    // Then: 一致するアイテムのみが表示される
  })

  test('should sort items by different criteria', async () => {
    // Given: アイテムリストが表示中
    // When: ソート条件を変更（価格順・人気順・新着順）
    // Then: 指定順序でアイテムが並び替えられる
  })

  test('should handle multiple filter combinations', async () => {
    // Given: 複数のフィルターが適用可能
    // When: カテゴリ + VTuber + 価格帯フィルターを組み合わせ
    // Then: 全条件を満たすアイテムのみが表示される
  })
})
```

### EX003: アイテム詳細・交換機能
```typescript
describe('ExchangePage - Item Details and Exchange', () => {
  test('should show detailed item information', async () => {
    // Given: アイテムカードが表示中
    // When: アイテムをクリック
    // Then: 詳細情報モーダルが表示される
  })

  test('should display exchange confirmation modal', async () => {
    // Given: 交換可能なアイテム
    // When: 交換ボタンをクリック
    // Then: 確認モーダルが表示される
  })

  test('should prevent exchange when insufficient balance', async () => {
    // Given: メダル残高不足の状態
    // When: 交換を試行
    // Then: 残高不足警告が表示され、交換がブロックされる
  })

  test('should handle quantity selection for multiple items', async () => {
    // Given: 複数交換可能なアイテム
    // When: 数量選択画面
    // Then: 数量に応じて必要メダル数が更新される
  })

  test('should execute exchange successfully', async () => {
    // Given: 交換確認が完了
    // When: 交換実行ボタンをクリック
    // Then: 交換が実行され、成功通知が表示される
  })
})
```

### EX004: エラーハンドリング
```typescript
describe('ExchangePage - Error Handling', () => {
  test('should handle insufficient medal balance error', async () => {
    // Given: メダル残高不足
    // When: 交換を実行
    // Then: 適切なエラーメッセージが表示される
  })

  test('should handle out of stock error', async () => {
    // Given: 在庫切れアイテム
    // When: 交換を試行
    // Then: 在庫切れメッセージが表示される
  })

  test('should handle exchange limit exceeded error', async () => {
    // Given: 交換制限を超過
    // When: 交換を試行
    // Then: 制限超過エラーが表示される
  })

  test('should handle network errors gracefully', async () => {
    // Given: ネットワークエラーが発生
    // When: 交換処理中
    // Then: 適切なエラーメッセージと再試行ボタンが表示される
  })
})
```

## 3. ExchangeHistoryPage テストケース

### EH001: 履歴表示機能
```typescript
describe('ExchangeHistoryPage - History Display', () => {
  test('should render exchange history list', async () => {
    // Given: 交換履歴データが存在
    // When: 履歴ページが表示される
    // Then: 時系列順で並んだ交換履歴が表示される
  })

  test('should show detailed exchange information', async () => {
    // Given: 交換履歴アイテムが表示中
    // When: 履歴項目をチェック
    // Then: 日時・アイテム・使用メダル・ステータスが表示される
  })

  test('should display exchange status correctly', async () => {
    // Given: 異なるステータスの交換履歴
    // When: ステータスをチェック
    // Then: 完了・処理中・キャンセル状態が適切に表示される
  })

  test('should paginate history for large datasets', async () => {
    // Given: 大量の履歴データ
    // When: ページが表示される
    // Then: ページネーション機能が表示される
  })
})
```

### EH002: フィルタリング・検索機能
```typescript
describe('ExchangeHistoryPage - Filtering and Search', () => {
  test('should filter history by date range', async () => {
    // Given: 異なる日付の履歴が存在
    // When: 期間フィルターを適用
    // Then: 指定期間の履歴のみが表示される
  })

  test('should filter history by VTuber', async () => {
    // Given: 複数VTuberの交換履歴
    // When: VTuberフィルターを適用
    // Then: 指定VTuberの履歴のみが表示される
  })

  test('should filter history by item category', async () => {
    // Given: 異なるカテゴリの交換履歴
    // When: カテゴリフィルターを適用
    // Then: 指定カテゴリの履歴のみが表示される
  })

  test('should filter history by exchange status', async () => {
    // Given: 異なるステータスの履歴
    // When: ステータスフィルターを適用
    // Then: 指定ステータスの履歴のみが表示される
  })
})
```

### EH003: 統計・分析機能
```typescript
describe('ExchangeHistoryPage - Statistics and Analytics', () => {
  test('should display monthly exchange statistics', async () => {
    // Given: 月別の交換データ
    // When: 統計セクションを確認
    // Then: 月ごとの交換回数・使用メダルが表示される
  })

  test('should show category-wise analysis', async () => {
    // Given: カテゴリ別の交換履歴
    // When: 分析画面を表示
    // Then: よく交換するカテゴリの分析結果が表示される
  })

  test('should display VTuber-wise medal usage', async () => {
    // Given: VTuber別の使用メダル履歴
    // When: VTuber分析を確認
    // Then: 各VTuberへの使用メダル割合が表示される
  })

  test('should show exchange trend visualization', async () => {
    // Given: 時系列の交換データ
    // When: トレンド分析を表示
    // Then: 交換パターンのグラフが表示される
  })
})
```

## 4. MedalStore テストケース

### MS001: メダル残高状態管理
```typescript
describe('MedalStore - Balance Management', () => {
  test('should fetch and store medal balances', async () => {
    // Given: ストアが初期化されている
    // When: fetchBalances()が呼ばれる
    // Then: APIから取得した残高データがストアに保存される
  })

  test('should handle loading state during balance fetch', async () => {
    // Given: 残高取得中
    // When: ローディング状態をチェック
    // Then: balanceLoading: trueが設定される
  })

  test('should handle balance fetch error', async () => {
    // Given: API呼び出しエラー
    // When: エラーが発生
    // Then: balanceErrorにエラーメッセージが設定される
  })

  test('should update balance after successful exchange', async () => {
    // Given: 交換が完了
    // When: 残高が更新される
    // Then: 使用メダル分が残高から減算される
  })
})
```

### MS002: 交換アイテム状態管理
```typescript
describe('MedalStore - Exchange Items Management', () => {
  test('should fetch and store exchange items', async () => {
    // Given: ストアが初期化されている
    // When: fetchExchangeItems()が呼ばれる
    // Then: APIから取得したアイテムデータがストアに保存される
  })

  test('should handle item filtering', async () => {
    // Given: フィルター条件が設定される
    // When: setFilters()が呼ばれる
    // Then: フィルター条件がストアに保存される
  })

  test('should manage exchange processing state', async () => {
    // Given: 交換処理が開始される
    // When: exchangeStateをチェック
    // Then: idle → processing → complete の順で遷移する
  })
})
```

### MS003: 交換実行処理
```typescript
describe('MedalStore - Exchange Execution', () => {
  test('should execute exchange successfully', async () => {
    // Given: 交換条件が満たされている
    // When: executeExchange()が呼ばれる
    // Then: 交換が実行され、完了状態になる
  })

  test('should handle insufficient balance error', async () => {
    // Given: メダル残高不足
    // When: 交換を実行
    // Then: 適切なエラー状態が設定される
  })

  test('should prevent duplicate exchange execution', async () => {
    // Given: 交換処理中
    // When: 重複して交換を実行
    // Then: 重複実行が防止される
  })
})
```

## 5. ユーティリティ関数テストケース

### UT001: メダル計算関数
```typescript
describe('Medal Utilities - Calculation Functions', () => {
  test('should calculate total medal balance correctly', async () => {
    // Given: VTuber別のメダル残高配列
    // When: calculateTotalBalance()を呼び出し
    // Then: 正しい合計値が返される
  })

  test('should determine exchange affordability', async () => {
    // Given: ユーザーの残高と交換コスト
    // When: canAffordExchange()を呼び出し
    // Then: 交換可能性の真偽値が正しく返される
  })

  test('should calculate medal usage by category', async () => {
    // Given: 交換履歴データ
    // When: calculateCategoryUsage()を呼び出し
    // Then: カテゴリ別使用量が正しく計算される
  })
})
```

### UT002: フィルタリング関数
```typescript
describe('Medal Utilities - Filtering Functions', () => {
  test('should filter exchange items by criteria', async () => {
    // Given: アイテムリストとフィルター条件
    // When: filterExchangeItems()を呼び出し
    // Then: 条件に合致するアイテムのみが返される
  })

  test('should sort items by different criteria', async () => {
    // Given: アイテムリストとソート条件
    // When: sortExchangeItems()を呼び出し
    // Then: 指定条件でソートされたリストが返される
  })
})
```

## 6. API統合テストケース

### API001: エンドポイント通信
```typescript
describe('API Integration - Endpoints', () => {
  test('should call medal balance API correctly', async () => {
    // Given: 残高取得リクエスト
    // When: APIが呼ばれる
    // Then: 正しいエンドポイント・パラメータで通信される
  })

  test('should call exchange items API with filters', async () => {
    // Given: フィルター付きアイテム取得リクエスト
    // When: APIが呼ばれる
    // Then: フィルター条件がクエリパラメータに含まれる
  })

  test('should call exchange execution API', async () => {
    // Given: 交換実行リクエスト
    // When: APIが呼ばれる
    // Then: 正しいitemId・quantity・medalTypeで通信される
  })

  test('should call exchange history API with pagination', async () => {
    // Given: 履歴取得リクエスト
    // When: APIが呼ばれる
    // Then: ページネーション情報が含まれる
  })
})
```

### API002: エラーハンドリング
```typescript
describe('API Integration - Error Handling', () => {
  test('should handle network timeout', async () => {
    // Given: ネットワークタイムアウト発生
    // When: 自動リトライ機能が動作
    // Then: 指数バックオフでリトライされる
  })

  test('should handle authentication errors', async () => {
    // Given: 認証エラー（401）発生
    // When: APIエラーレスポンス
    // Then: ログイン画面にリダイレクトされる
  })

  test('should handle insufficient balance errors', async () => {
    // Given: 残高不足エラー（400）発生
    // When: 交換実行
    // Then: 適切なエラーメッセージが表示される
  })

  test('should handle server errors', async () => {
    // Given: サーバーエラー（5xx）発生
    // When: エラーレスポンス
    // Then: フォールバックUIが表示される
  })
})
```

## 7. E2Eテストシナリオ

### E2E001: 完全交換フロー
```typescript
test('complete exchange user journey', async ({ page }) => {
  // Given: ユーザーがログイン済み
  // When: 残高確認 → 交換所 → アイテム選択 → 交換実行 → 履歴確認
  // Then: 全ての画面遷移と機能が正常動作する
})
```

### E2E002: モバイル対応
```typescript
test('mobile exchange experience', async ({ page }) => {
  // Given: モバイルデバイスでアクセス
  // When: 交換機能を利用
  // Then: レスポンシブUIとタッチ操作が正常動作する
})
```

### E2E003: エラー回復
```typescript
test('error recovery scenarios', async ({ page }) => {
  // Given: 各種エラー状況
  // When: エラー状態から回復
  // Then: ユーザーが操作を継続できる
})
```

## 8. パフォーマンステスト

### PERF001: ページ表示速度
```typescript
describe('Performance Tests - Page Load Speed', () => {
  test('should load medal balance page within 2 seconds', async () => {
    // Given: 残高ページアクセス
    // When: ページロード測定
    // Then: 2秒以内で表示完了
  })

  test('should load exchange page with items within 2 seconds', async () => {
    // Given: 交換所ページアクセス
    // When: アイテムロード測定
    // Then: 2秒以内でアイテム表示
  })

  test('should complete exchange within 5 seconds', async () => {
    // Given: 交換実行
    // When: 処理時間測定
    // Then: 5秒以内で交換完了
  })
})
```

### PERF002: メモリ・リソース使用量
```typescript
describe('Performance Tests - Resource Usage', () => {
  test('should handle large item lists efficiently', async () => {
    // Given: 1000件以上のアイテムリスト
    // When: 表示・スクロール
    // Then: スムーズな動作を維持
  })

  test('should maintain stable memory usage', async () => {
    // Given: 長時間の利用
    // When: メモリ使用量測定
    // Then: メモリリークなし
  })
})
```

## 9. アクセシビリティテスト

### A11Y001: WCAG 2.1準拠
```typescript
describe('Accessibility Tests - WCAG 2.1', () => {
  test('should have sufficient color contrast', async () => {
    // Given: 全交換画面
    // When: カラーコントラスト測定
    // Then: 4.5:1以上のコントラストを満たす
  })

  test('should support keyboard navigation', async () => {
    // Given: キーボードのみでの操作
    // When: Tab・Enter・Escapeキーでナビゲーション
    // Then: 全機能にアクセス可能
  })

  test('should provide appropriate ARIA labels', async () => {
    // Given: スクリーンリーダー使用
    // When: ページ要素を読み上げ
    // Then: 適切な情報が音声提供される
  })

  test('should announce balance changes', async () => {
    // Given: メダル残高の変更
    // When: 残高更新
    // Then: 変更内容が音声アナウンスされる
  })
})
```

## テスト実行優先順位

### 第1優先: 基本機能テスト
1. MedalBalancePage 基本レンダリング・データロード
2. ExchangePage アイテム表示・フィルタリング
3. ExchangeHistoryPage 履歴表示・検索
4. MedalStore 状態管理

### 第2優先: 統合・E2Eテスト
1. 完全交換フロー E2E
2. API統合テスト
3. エラーハンドリングテスト

### 第3優先: 品質・性能テスト
1. パフォーマンステスト
2. アクセシビリティテスト
3. セキュリティテスト

このテストケース設計に基づき、TDDのRed-Green-Refactorサイクルで実装を進めます。