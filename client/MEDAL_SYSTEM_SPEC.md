# こえポン！メダルシステム仕様書

## 1. システム概要

### 🎯 **基本概念**
メダルは**ガチャで獲得できる無料のポイント**で、特典BOXのアイテムと交換するために使用します。

### 💰 **重要：メダル購入は不可**
- ❌ **メダルを直接購入することはできません**
- ✅ **ガチャを引いた結果としてメダルを獲得**
- ✅ **獲得したメダルで特典と交換**

---

## 2. メダル獲得の仕組み

### 🎰 **ガチャから獲得**
```
ユーザー → ガチャ料金支払い → ガチャ実行 → アイテム + メダル獲得
```

### 🏆 **獲得パターン**
- **単発ガチャ**: 50-200メダル獲得
- **10連ガチャ**: 500-2000メダル獲得  
- **ボーナス**: 初回、連続、イベント等での追加獲得
- **レア排出**: 高レアアイテム獲得時のボーナスメダル

---

## 3. メダル残高システム

### 📊 **残高構造**
```typescript
interface MedalBalance {
  totalMedals: number        // 累計獲得メダル
  availableMedals: number    // 交換可能メダル
  usedMedals: number         // 使用済みメダル
  earnedMedals: number       // 獲得メダル
  vtuberBalances: Array<{    // VTuber別メダル残高
    vtuberName: string
    balance: number
  }>
}
```

### 🔄 **VTuber別メダル**
- ガチャで獲得したメダルは**そのVTuber専用**
- 星月ひなのガチャ → 星月ひなメダル
- 各VTuberメダルは**そのVTuberの特典のみ交換可能**

---

## 4. 交換所システム

### 🛍️ **交換可能アイテム**
```typescript
interface ExchangeItem {
  id: string
  name: string              // "限定ボイス"
  category: ExchangeCategory // 'voice' | 'goods' | 'special' | 'limited'
  cost: number              // 必要メダル数
  vtuberName: string        // 対象VTuber
  stock: number | null      // 在庫数（nullは無制限）
  limitPerUser: number      // ユーザー購入制限
}
```

### 🎪 **交換カテゴリ**
- **voice**: ボイス、セリフ、挨拶
- **goods**: デジタルグッズ、画像、壁紙  
- **special**: 限定コンテンツ、生放送参加権
- **limited**: 期間限定、数量限定アイテム

---

## 5. 取引履歴

### 📈 **メダル取引タイプ**
```typescript
type MedalTransactionType = 'earned' | 'used'
type MedalTransactionSource = 'gacha-draw' | 'exchange' | 'reward' | 'bonus'
```

### 📋 **取引記録**
- **獲得履歴**: どのガチャでいくら獲得したか
- **使用履歴**: どの特典にいくら使ったか
- **統計情報**: 累計、お気に入りVTuber、平均使用額

---

## 6. バリデーション

### ✅ **交換前チェック**
```typescript
interface ExchangeValidation {
  sufficientBalance: boolean    // メダル残高チェック
  stockAvailable: boolean       // 在庫チェック  
  withinUserLimit: boolean      // 購入制限チェック
  correctVTuberMedal: boolean   // VTuber別メダルチェック
}
```

### 🚫 **制限事項**
- VTuber Aのメダルで VTuber Bの特典は交換不可
- 在庫切れアイテムは交換不可
- ユーザー購入制限を超える交換は不可

---

## 7. UI/UX設計

### 💳 **メダル残高表示**
```
総メダル: 2,500メダル
├─ 星月ひな: 500メダル
├─ 桜井みお: 400メダル  
├─ 音羽ゆめ: 350メダル
└─ その他...
```

### 🛒 **交換所画面**
- VTuber別フィルター
- カテゴリ別フィルター  
- 価格範囲フィルター
- 在庫状況表示
- 交換可能/不可表示

---

## 8. API設計

### 🔌 **主要エンドポイント**
- `GET /api/medals/balance` - メダル残高取得
- `GET /api/medals/transactions` - 取引履歴取得  
- `GET /api/exchange/items` - 交換アイテム一覧
- `POST /api/exchange/execute` - 交換実行
- `GET /api/exchange/history` - 交換履歴

### ❌ **削除済みエンドポイント**
- ~~`POST /api/medals/purchase`~~ - メダル購入（不要のため削除済み）

---

## 9. データフロー

### 🔄 **正常フロー**
```
1. ユーザーがガチャ料金を支払い
2. ガチャ実行でアイテム + メダル獲得
3. メダル残高に加算（VTuber別）
4. 交換所でメダル使用
5. 特典BOXにアイテム追加
```

### 🚨 **エラーハンドリング**
- 残高不足時の適切なメッセージ
- 在庫切れ時の代替提案
- VTuberメダル不一致時の説明

---

## 10. 今後の拡張性

### 🎁 **追加機能候補**
- **メダルギフト**: ユーザー間でのメダル送付
- **期間限定ボーナス**: イベント時の獲得倍率アップ
- **メダル履歴分析**: 使用傾向の可視化
- **おすすめ特典**: ユーザーの好みに基づく提案

---

## ✅ **実装状況**

### 🟢 **完成済み**
- メダル残高管理システム
- VTuber別メダル分離
- 交換所基本機能
- 取引履歴機能

### 🟡 **要改善**
- 不要なメダル購入機能削除 ✅
- エラーハンドリングの改善
- UI/UXの統一

### 🔴 **未実装**
- 実際のガチャ→メダル付与連携
- Stripe決済連携
- 在庫管理システム

このシステム仕様に基づいて、正しいメダルエコシステムが構築されています。