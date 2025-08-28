#!/bin/bash

echo "====================================="
echo "Supabase セットアップガイド"
echo "====================================="

echo ""
echo "1. Supabaseアカウントにログインしてください:"
echo "   https://supabase.com/dashboard"
echo ""

echo "2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択してください"
echo ""

echo "3. プロジェクトの Settings > Database から以下の情報を取得してください:"
echo "   - Host: db.your-project-ref.supabase.co"
echo "   - Database name: postgres"
echo "   - Port: 5432"
echo "   - User: postgres"
echo "   - Password: [your-database-password]"
echo ""

echo "4. Settings > API から以下を取得してください:"
echo "   - Project URL: https://your-project-ref.supabase.co"
echo "   - anon public key"
echo "   - service_role secret"
echo ""

echo "5. .env.supabase ファイルを更新してください:"
echo ""
cat << 'EOF'
# Database接続情報
SUPABASE_HOST=db.your-project-ref.supabase.co
SUPABASE_PORT=5432
SUPABASE_USERNAME=postgres
SUPABASE_PASSWORD=your-database-password
SUPABASE_DATABASE=postgres

# API情報
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF

echo ""
echo "6. 接続テストを実行してください:"
echo "   npm run db:test"
echo ""

echo "7. 接続が成功したら、マイグレーションを実行してください:"
echo "   npm run db:sync"
echo ""

read -p ".env.supabaseファイルを編集しますか？ [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
        code .env.supabase
    elif command -v nano &> /dev/null; then
        nano .env.supabase
    elif command -v vi &> /dev/null; then
        vi .env.supabase
    else
        echo "テキストエディタが見つかりません。手動で .env.supabase を編集してください"
    fi
fi