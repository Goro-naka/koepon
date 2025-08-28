# TASK-506: 法的要件対応 - TDD要件定義

## TDD フェーズ: Requirements Definition (1/6)

## 概要

こえポン！アプリケーションに必要な法的要件を実装し、日本の法規制に準拠したサービス運営を可能にする。

## 法的要件の整理

### REQ-405: 特定商取引法対応
**法的根拠**: 特定商取引に関する法律
**適用理由**: デジタルコンテンツ（ボイス・音声ファイル）の有償販売

**必要な表示項目**:
- 事業者の氏名又は名称
- 住所
- 電話番号  
- 電子メールアドレス
- 責任者の氏名
- 販売価格
- 代金の支払時期・方法
- 商品の引渡時期・方法
- 返品・交換の条件

### REQ-406: 利用規約
**目的**: サービス利用条件の明確化、トラブル防止
**必要な項目**:
- サービスの内容
- ユーザーの責任と義務
- 禁止行為
- 知的財産権の扱い
- 免責事項
- 規約変更手続き
- 準拠法・管轄裁判所

### REQ-407: プライバシーポリシー
**法的根拠**: 個人情報の保護に関する法律
**必要な項目**:
- 収集する個人情報の種類
- 利用目的
- 第三者提供の条件
- 安全管理措置
- 個人情報の開示・訂正・削除手続き
- 問い合わせ窓口

### REQ-408: 景品表示法対応
**法的根拠**: 不当景品類及び不当表示防止法
**対象**: ガチャシステムの確率表示
**必要事項**:
- ガチャ確率の明示
- 有料ガチャの総額表示
- 誤解を招く表現の排除

### ✅ **年齢制限機能は除外**
ユーザー判断により年齢制限機能は実装対象外とします。

## 実装要件

### 1. 法的表記ページの実装

#### 1.1 特定商取引法表記ページ
```typescript
// /pages/legal/specified-commercial-transactions
interface SpecifiedCommercialTransactionsInfo {
  companyName: string;
  representativeName: string;
  address: string;
  phoneNumber: string;
  email: string;
  businessRegistrationNumber: string;
  pricing: PricingInfo[];
  paymentMethods: PaymentMethod[];
  deliveryInfo: DeliveryInfo;
  returnPolicy: ReturnPolicy;
}
```

#### 1.2 利用規約ページ
```typescript
// /pages/legal/terms-of-service
interface TermsOfService {
  lastUpdated: Date;
  serviceDescription: string;
  userObligations: string[];
  prohibitedActs: string[];
  intellectualPropertyRights: string;
  disclaimers: string[];
  governingLaw: string;
  jurisdiction: string;
}
```

#### 1.3 プライバシーポリシーページ
```typescript
// /pages/legal/privacy-policy
interface PrivacyPolicy {
  lastUpdated: Date;
  personalInfoTypes: PersonalInfoType[];
  usagePurposes: string[];
  thirdPartySharing: ThirdPartySharing;
  securityMeasures: string[];
  userRights: UserRight[];
  contactInfo: ContactInfo;
}
```

### 2. 法的同意フローの実装

#### 2.1 初回登録時の同意チェック
```typescript
interface LegalConsent {
  userId: string;
  termsOfServiceAccepted: boolean;
  termsOfServiceAcceptedAt: Date;
  privacyPolicyAccepted: boolean;
  privacyPolicyAcceptedAt: Date;
  ipAddress: string;
  userAgent: string;
}
```

#### 2.2 規約更新時の再同意機能
```typescript
interface ConsentUpdate {
  userId: string;
  previousConsentId: string;
  updatedTermsVersion: string;
  reacceptedAt: Date;
  notifiedAt: Date;
}
```

### 3. ガチャ確率表示機能

#### 3.1 確率情報の管理
```typescript
interface GachaProbability {
  gachaId: string;
  items: GachaProbabilityItem[];
  totalProbability: number; // Must be 100%
  lastUpdated: Date;
  isActive: boolean;
}

interface GachaProbabilityItem {
  itemId: string;
  itemName: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  probability: number; // Percentage (0-100)
  description: string;
}
```

#### 3.2 確率表示UI
- ガチャ詳細画面での確率一覧表示
- 確率の正確な数値表示（小数点以下3桁まで）
- レアリティ別の確率集計表示

### 4. 法的表記アクセス機能

#### 4.1 フッターからのアクセス
- 全ページのフッターに法的表記へのリンク
- 分かりやすいラベリング

#### 4.2 アプリ内での法的表記表示
- モーダル形式での表示オプション
- スクロール位置の記録
- 既読状態の管理

## データベース設計

### legal_consents テーブル
```sql
CREATE TABLE legal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL, -- 'terms_of_service', 'privacy_policy'
  version VARCHAR(20) NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### legal_documents テーブル
```sql
CREATE TABLE legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL, -- 'terms', 'privacy', 'commercial'
  version VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);
```

### gacha_probabilities テーブル
```sql
CREATE TABLE gacha_probabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gacha_id UUID REFERENCES gachas(id) ON DELETE CASCADE,
  item_id UUID REFERENCES gacha_items(id) ON DELETE CASCADE,
  probability DECIMAL(8,5) NOT NULL CHECK (probability >= 0 AND probability <= 100),
  rarity VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API設計

### 法的文書取得API
```typescript
// GET /api/legal/documents/:type
export interface LegalDocumentResponse {
  document: {
    id: string;
    type: 'terms' | 'privacy' | 'commercial';
    version: string;
    title: string;
    content: string;
    effectiveDate: string;
  };
}
```

### 同意記録API
```typescript
// POST /api/legal/consent
export interface ConsentRequest {
  documentType: 'terms_of_service' | 'privacy_policy';
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ConsentResponse {
  success: boolean;
  consentId: string;
  acceptedAt: string;
}
```

### ガチャ確率取得API
```typescript
// GET /api/gacha/:id/probabilities
export interface GachaProbabilityResponse {
  gachaId: string;
  gachaName: string;
  totalItems: number;
  probabilities: {
    itemId: string;
    itemName: string;
    rarity: string;
    probability: number;
    description: string;
  }[];
  lastUpdated: string;
}
```

## テスト要件

### 単体テスト
- 法的文書の取得・表示機能
- 同意状態の記録・検証機能
- 確率計算・表示の正確性

### 統合テスト  
- ユーザー登録時の同意フロー
- 規約更新時の再同意フロー
- ガチャ確率表示の完全性

### E2Eテスト
- 法的表記ページへのアクセス性
- 同意チェックボックスの動作
- ガチャ画面での確率表示

## 受け入れ基準

### 機能要件
- ✅ 特定商取引法に必要な情報がすべて表示される
- ✅ 利用規約・プライバシーポリシーが明確に表示される
- ✅ ユーザーの同意状態が適切に記録される
- ✅ ガチャ確率が正確に表示される
- ✅ 法的表記へのアクセスが容易である

### 法的要件
- ✅ 特定商取引法の表示義務を満たす
- ✅ 個人情報保護法の要件を満たす
- ✅ 景品表示法の確率表示要件を満たす
- ✅ 利用規約で適切にリスクを軽減する

### ユーザビリティ要件
- ✅ 法的文書が理解しやすい形式で表示される
- ✅ 同意プロセスが簡潔で分かりやすい
- ✅ 確率情報が見やすく整理されている
- ✅ モバイルデバイスでも適切に表示される

## 実装フェーズ

### Phase 1: データベース・API実装
- Supabase テーブル作成
- 法的文書管理API
- 同意記録API
- 確率管理API

### Phase 2: フロントエンド実装  
- 法的表記ページ作成
- 同意フロー実装
- ガチャ確率表示機能

### Phase 3: 統合・テスト
- E2E テスト実装
- 法務レビュー対応
- アクセシビリティ確認

次のステップ: TDDテストケース設計へ進みます。