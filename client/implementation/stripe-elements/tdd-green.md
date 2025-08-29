# Stripe Elements決済システム - Green Phase実装

## 🎯 実装方針

**目標**: 失敗しているテストを通すための最小限の実装を行います。

---

## 📁 実装ファイル

### 1. StripeProvider.tsx

**目的**: Stripe Elementsのラッパーコンポーネント

**実装内容**:
- loadStripeによるStripe初期化
- Elements providerによるコンテキスト提供  
- エラーハンドリング・ローディング状態管理

### 2. PaymentForm.tsx

**目的**: 決済フォームUI

**実装内容**:
- CardElementを含むフォーム表示
- 決済処理の実行
- バリデーション・エラー表示

### 3. useStripePayment.ts

**目的**: 決済処理のカスタムフック

**実装内容**: 
- Payment Intent作成・確認
- 状態管理（loading, error, success）
- API連携

### 4. 型定義・ユーティリティ

**目的**: TypeScript型定義と支援関数

**実装内容**:
- PaymentData, PaymentResult等の型
- バリデーション・フォーマット関数

---

## 🚀 実装開始

次段階で実際のコンポーネント実装を行い、テストを通します。