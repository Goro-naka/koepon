# こえポン！（Koepon!） 技術設計文書

## 概要

個人VTuberのデジタルコンテンツをガチャ形式で販売するプラットフォーム「こえポン！」の技術設計文書です。

## 設計文書構成

### 📋 [architecture.md](./architecture.md)
システム全体のアーキテクチャ設計

- アーキテクチャパターン (マイクロサービス + イベント駆動)
- システム構成 (フロントエンド/バックエンド/インフラ)
- 技術選定とその理由
- スケーリング戦略
- 災害対策

### 📊 [dataflow.md](./dataflow.md)
データフローと処理フローの可視化

- システム全体のデータフロー図
- ガチャ購入フロー
- 推しメダル交換フロー
- 特典ダウンロードフロー
- VTuberガチャ作成フロー
- エラーハンドリングフロー
- キャッシング戦略
- セキュリティフロー

### 🔧 [interfaces.ts](./interfaces.ts)
TypeScript型定義

- 基本型とEnum定義
- エンティティ型定義
- APIリクエスト/レスポンス型
- WebSocketイベント型
- ユーティリティ型
- バリデーション関数

### 🗄️ [database-schema.sql](./database-schema.sql)
PostgreSQLデータベーススキーマ

- テーブル定義
- インデックス設計
- 制約とバリデーション
- トリガー関数
- 初期データ

### 🌐 [api-endpoints.md](./api-endpoints.md)
RESTful API仕様

- 認証エンドポイント
- ガチャ関連API
- 推しメダル管理API
- 交換所API
- 特典管理API
- VTuber管理API
- 管理者API
- WebSocketイベント仕様

## 主要な設計決定

### 1. マイクロサービス構成
- **認証サービス**: ユーザー認証・認可
- **ガチャサービス**: ガチャ抽選・結果管理
- **決済サービス**: Stripe/KOMOJU連携
- **特典管理サービス**: ファイル管理・配信
- **VTuber管理サービス**: VTuber情報・権限管理
- **交換所サービス**: 推しメダル交換

### 2. データベース設計
- **PostgreSQL**: メインデータベース
- **Redis**: キャッシュ・セッション管理
- **S3/R2**: オブジェクトストレージ

### 3. セキュリティ対策
- OWASP ASVS Level 2準拠
- JWT + Refresh Token認証
- 署名付きURL による安全なファイル配信
- 冪等性キーによる重複決済防止

### 4. パフォーマンス対策
- CDNによる静的コンテンツ配信
- Redisキャッシング
- 水平スケーリング対応
- 非同期処理（メッセージキュー）

### 5. 法令遵守
- 景品表示法に準拠した排出率表示
- 特定商取引法表記の実装
- 個人情報保護法対応

## 実装フェーズ

### Phase 1 (MVP)
1. 基本的なガチャ機能
2. 推しメダルシステム
3. Stripe決済連携
4. 特典BOX・ダウンロード機能
5. 基本認証機能

### Phase 2 (機能拡張)
1. 交換所機能
2. VTuber管理コンソール
3. KOMOJU決済追加
4. 詳細レポート機能

### Phase 3 (最適化)
1. パフォーマンス最適化
2. 高度なセキュリティ対策
3. 分析ダッシュボード
4. キャンペーン機能
5. 自動スケーリング対応

## 技術スタック

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **State Management**: Zustand + TanStack Query
- **UI**: Tailwind CSS + shadcn/ui
- **Authentication**: NextAuth.js

### バックエンド
- **Runtime**: Node.js
- **Framework**: NestJS / Express
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Message Queue**: RabbitMQ
- **File Storage**: AWS S3 / Cloudflare R2

### インフラ
- **Container**: Docker + Kubernetes
- **CI/CD**: GitHub Actions + ArgoCD
- **Monitoring**: Datadog / New Relic
- **CDN**: CloudFront / Cloudflare

## 開発ガイドライン

### コード規約
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- 単体テスト必須（カバレッジ80%以上）

### セキュリティ
- シークレット情報はコードに含めない
- 入力値の検証・サニタイズ必須
- SQLインジェクション対策
- XSS/CSRF対策

### パフォーマンス
- N+1クエリの回避
- 適切なインデックス設計
- キャッシング戦略の実装
- 画像最適化

## 関連リンク

- [要件定義書](../../spec/koepon-requirements.md)
- [開発環境セットアップ](../../../README.md)
- [デプロイメントガイド](../../../deployment/README.md)