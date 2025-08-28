# こえポン！ デザインガイドライン

## 🚨 重要な禁止事項

### ❌ 薄い文字色は絶対禁止
- `text-muted-foreground` - **使用禁止**
- `text-gray-400`～`text-gray-500` - **使用禁止**
- `text-slate-400`～`text-slate-500` - **使用禁止**
- `opacity-*` での文字の薄化 - **使用禁止**

**理由**: 視認性が悪く、ユーザーが文字を読むのに苦労する

## ✅ 推奨色システム

### 背景色
- **メイン背景**: `bg-white` - 純白
- **セクション背景**: `bg-gray-50` - 最も薄いグレー（アクセント用）
- **カード背景**: `bg-white` - 純白

### 文字色（視認性重視）
- **メインタイトル**: `text-gray-900` - 最も濃い黒
- **サブタイトル**: `text-gray-900` - 最も濃い黒
- **本文**: `text-gray-800` - 濃いグレー
- **説明文**: `text-gray-700` - 中程度のグレー（最も薄くてもこれまで）
- **キャプション**: `text-gray-700` - 中程度のグレー

### ボーダー・区切り線
- **メインボーダー**: `border-gray-200`
- **薄いボーダー**: `border-gray-100`

## 🎨 色の使用例

```tsx
// ✅ 良い例
<h1 className="text-gray-900 font-bold">メインタイトル</h1>
<p className="text-gray-800">本文テキスト</p>
<span className="text-gray-700 text-sm">小さな説明</span>

// ❌ 悪い例（薄すぎて読みにくい）
<h1 className="text-muted-foreground">メインタイトル</h1>
<p className="text-gray-500">本文テキスト</p>
<span className="text-gray-400">小さな説明</span>
```

## 📝 コンポーネント別ガイドライン

### ヘッダー
- 背景: `bg-white/95` (半透明白)
- ロゴ: `text-gray-900`
- ナビゲーション: `text-gray-600` → hover: `text-gray-900`

### カード
- 背景: `bg-white`
- ボーダー: `border-gray-100`
- タイトル: `text-gray-900`
- 説明: `text-gray-800`

### ボタン
- プライマリ: デフォルトのTailwind primary色を使用
- セカンダリ: `border-gray-300` with `text-gray-800`

### フォーム
- ラベル: `text-gray-900`
- プレースホルダー: `text-gray-700`
- ヘルプテキスト: `text-gray-700`

## 🔍 チェックリスト

新しいページやコンポーネントを作成する際は以下を確認：

- [ ] `text-muted-foreground` を使用していない
- [ ] `text-gray-400`～`text-gray-500` を使用していない
- [ ] すべての文字が `text-gray-700` 以上の濃さである
- [ ] 背景は `bg-white` ベースである
- [ ] コントラスト比が十分である

## 📐 レイアウト原則

### スペーシング
- セクション間: `py-12 sm:py-20`
- カード内padding: `p-6` or `p-8`
- 要素間マージン: `mb-4`, `mb-6`, `mb-8`

### レスポンシブ
- モバイルファースト設計
- `sm:`, `md:`, `lg:` プレフィックスを適切に使用
- グリッドは `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` パターン

### 角丸・シャドウ
- カード: `rounded-2xl shadow-lg`
- ボタン: `rounded-xl`
- 軽いアクセント: `rounded-lg`

## 🚨 コードレビューチェックポイント

1. **文字色チェック**: 薄い色を使用していないか
2. **背景色チェック**: 白ベースになっているか
3. **視認性チェック**: 実際にブラウザで見て読みやすいか
4. **一貫性チェック**: 他のページと統一されているか

---

**このガイドラインは絶対に守ること。視認性はユーザビリティの基本です。**