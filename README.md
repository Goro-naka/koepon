# こえポン！（Koepon!）

個人VTuberのデジタルコンテンツをガチャ形式で販売するプラットフォーム。推しメダルシステムにより、射幸性を抑えつつファンエンゲージメントを高める安心設計を提供します。

## 🎯 プロジェクト概要

- **ガチャシステム**: 単発・10連でデジタルコンテンツを購入
- **推しメダル**: ガチャ購入時に必ず獲得できるVTuber専用通貨
- **交換所**: 推しメダルで確実に特典と交換可能
- **特典BOX**: 獲得した特典の管理・ダウンロード
- **法令遵守**: 景品表示法・特定商取引法に完全対応

## 🛠️ 技術スタック

### バックエンド
- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL 15 + TypeORM
- **Cache**: Redis 7
- **Authentication**: JWT + Refresh Token
- **Payment**: Stripe + KOMOJU
- **File Storage**: AWS S3 / Cloudflare R2

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **State Management**: Zustand + TanStack Query  
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Authentication**: NextAuth.js

### インフラ
- **Container**: Docker + Kubernetes
- **CI/CD**: GitHub Actions + ArgoCD
- **Monitoring**: Datadog / New Relic
- **CDN**: CloudFront / Cloudflare

## 🚀 開発環境セットアップ

### 前提条件
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. プロジェクトクローン
```bash
git clone <repository-url>
cd koepon
```

### 2. 依存関係インストール
```bash
npm install
```

### 3. 環境変数設定
```bash
cp .env.example .env
# .envファイルを適切な値で編集
```

### 4. Docker環境起動
```bash
# 自動セットアップスクリプト実行
npm run db:setup

# または手動でコンテナ起動
docker-compose up -d postgres redis
```

### 5. 開発サーバー起動
```bash
npm run dev
```

サーバーは http://localhost:3000 で起動します。

## 📝 開発コマンド

### 基本コマンド
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# テスト実行
npm test
npm run test:watch
npm run test:coverage

# コード品質チェック
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run typecheck
```

### Docker & データベース関連
```bash
# 開発環境セットアップ
npm run db:setup

# データベースリセット
npm run db:reset

# Docker コンテナ管理
npm run docker:dev     # アプリ含む全コンテナ起動
npm run docker:tools   # 管理ツール起動 (PgAdmin, Redis Commander)
npm run docker:stop    # 全コンテナ停止
npm run docker:logs    # ログ表示

# マイグレーション関連
npm run migration:create -- CreateUserTable
npm run migration:run
npm run migration:revert
```

## 🏗️ プロジェクト構造

```
koepon/
├── src/
│   ├── modules/           # ビジネスロジックモジュール
│   │   ├── auth/         # 認証・認可
│   │   ├── user/         # ユーザー管理
│   │   ├── gacha/        # ガチャシステム
│   │   ├── payment/      # 決済処理
│   │   ├── reward/       # 特典管理
│   │   ├── exchange/     # 交換所
│   │   ├── vtuber/       # VTuber管理
│   │   └── admin/        # 管理者機能
│   ├── common/           # 共通ユーティリティ
│   ├── config/           # 設定ファイル
│   ├── shared/           # 共有型・定数
│   ├── app.module.ts     # アプリケーションモジュール
│   └── main.ts           # エントリーポイント
├── docs/                 # ドキュメント
│   ├── spec/            # 要件定義
│   ├── design/          # 技術設計
│   └── tasks/           # 実装タスク
├── test/                # テストファイル
├── migrations/          # データベースマイグレーション
├── seeds/              # シードデータ
├── scripts/            # 運用スクリプト
└── docker-compose.yml  # Docker設定
```

## 🧪 テスト

### テスト実行
```bash
# 全テスト実行
npm test

# 監視モード
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

### テストカテゴリ
- **単体テスト**: `src/**/*.spec.ts`
- **統合テスト**: `test/integration/**/*.test.ts`
- **E2Eテスト**: `test/e2e/**/*.e2e-spec.ts`

## 🔒 セキュリティ

### セキュリティ対策
- OWASP ASVS Level 2準拠
- JWT + Refresh Token認証
- bcryptによるパスワードハッシュ化
- helmet.jsによるセキュリティヘッダー
- CORS設定
- レート制限
- 入力値バリデーション・サニタイズ
- SQLインジェクション対策
- XSS/CSRF対策

### セキュリティテスト
```bash
# セキュリティ脆弱性スキャン
npm run security:audit

# 依存関係脆弱性チェック
npm audit
```

## 📊 モニタリング

### ヘルスチェック
- `/api/v1/health` - サーバー状態
- `/api/v1/health/ready` - 依存サービス状態

### メトリクス
- アプリケーションメトリクス
- ビジネスメトリクス（ガチャ実行数、売上など）
- パフォーマンスメトリクス

## 🚢 デプロイメント

### ステージング環境
```bash
npm run deploy:staging
```

### 本番環境
```bash
npm run deploy:production
```

## 📚 API仕様

API仕様書は以下で確認できます：
- **OpenAPI**: `/api/v1/docs`
- **設計文書**: `docs/design/koepon/api-endpoints.md`

## 🤝 開発ガイドライン

### コーディング規約
- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits
- TDD (Test Driven Development)

### コミット規約
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードフォーマット
refactor: リファクタリング
test: テスト追加・修正
chore: その他の変更
```

## 📖 ドキュメント

- [要件定義書](docs/spec/koepon-requirements.md)
- [技術設計書](docs/design/koepon/README.md)
- [実装タスク](docs/tasks/koepon-tasks.md)

## 🐛 問題報告

バグ報告や機能要望は以下の方法で：
1. GitHub Issues
2. プロジェクトSlackチャンネル
3. 定期ミーティング

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 👥 チーム

- **プロジェクトマネージャー**: TBD
- **バックエンド**: TBD  
- **フロントエンド**: TBD
- **インフラ**: TBD
- **QA**: TBD

---

**Koepon Development Team** 🎵