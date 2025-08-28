# Supabase セットアップガイド

## 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com) にアクセス
2. 「New Project」をクリック
3. プロジェクト名: `koepon`
4. データベースパスワードを設定
5. リージョン: `Asia Northeast (Tokyo)` を選択
6. プロジェクト作成完了まで待機

## 2. 環境変数設定

1. Supabaseプロジェクトの「Settings」→「API」から取得:
   - Project URL
   - Project API keys (anon, service_role)

2. `.env` ファイルを作成:
```bash
cp .env.supabase .env
```

3. 以下の値を更新:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-service-role-key
```

## 3. データベーススキーマ実行

1. Supabase Dashboard → SQL Editor
2. `migrations/001_initial_schema.sql` の内容をコピー
3. SQL Editor に貼り付けて実行
4. エラーがないことを確認

## 4. Row Level Security (RLS) 設定確認

以下のポリシーが設定されていることを確認:

- **users テーブル**: ユーザーは自分のプロファイルのみ閲覧・更新可能
- **vtubers テーブル**: 承認済みVTuberは全員閲覧可能、自分のデータは管理可能
- **gachas テーブル**: 公開中のガチャは全員閲覧可能、VTuberは自分のガチャ管理可能
- **oshi_medals テーブル**: ユーザーは自分のメダルのみ閲覧可能

## 5. Storage 設定

1. Supabase Dashboard → Storage
2. 新しいバケット作成: `koepon-files`
3. バケット設定:
   - Public: `false` (署名付きURL使用)
   - File size limit: `100MB`
   - Allowed MIME types: `image/*, audio/*, video/*, application/zip`

## 6. Authentication 設定

1. Supabase Dashboard → Authentication → Settings
2. 以下を設定:
   - Site URL: `http://localhost:3001` (開発用)
   - Email templates をカスタマイズ (オプション)
   - Enable email confirmations: `true`

## 7. Realtime 設定

1. Database → Replication
2. 以下のテーブルでRealtimeを有効化:
   - `gacha_pulls` (ガチャ結果のリアルタイム配信用)
   - `oshi_medals` (メダル残高の即時更新用)

## 8. Database Functions (必要に応じて)

将来の拡張用にカスタム関数を追加:

```sql
-- ガチャ抽選関数の例
CREATE OR REPLACE FUNCTION execute_gacha_pull(
    p_user_id UUID,
    p_gacha_id UUID,
    p_pull_count INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- 実装は後で追加
$$;
```

## 9. API Keys セキュリティ

**重要**: 
- `anon key` はフロントエンドで使用可能
- `service_role key` はサーバーサイドのみで使用
- `.env` ファイルを Git にコミットしない

## 10. 接続テスト

アプリケーションを起動して接続確認:

```bash
npm run dev
```

以下のエンドポイントで確認:
- http://localhost:3000/api/v1/health/ready
- http://localhost:3000/api/v1/health/database
- http://localhost:3000/api/v1/health/stats

## 11. 本番環境設定

本番環境では以下を更新:
- Site URL を本番URLに変更
- CORS設定を本番ドメインに限定
- カスタムドメイン設定 (オプション)
- SSL証明書設定

## トラブルシューティング

### よくあるエラー

1. **接続エラー**: 環境変数の値を再確認
2. **権限エラー**: RLSポリシーを確認
3. **型エラー**: `src/shared/types/supabase.types.ts` を更新

### サポート

- Supabase Documentation: https://supabase.com/docs
- Discord コミュニティ: https://discord.supabase.com