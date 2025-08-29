#!/bin/bash

# Production Admin API動作確認スクリプト

echo "🚀 Production Admin API テストを開始します..."
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PRODUCTION_URL="https://koepon.vercel.app"

echo -e "${BLUE}🌐 Production環境APIテスト${NC}"
echo "URL: $PRODUCTION_URL"
echo "=========================="

# Dashboard Metrics
echo -n "Dashboard Metrics: "
response=$(curl -s -w "%{http_code}" "$PRODUCTION_URL/api/admin/dashboard/metrics")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    total_users=$(echo "$response" | head -c -4 | jq -r '.systemOverview.totalUsers')
    total_vtubers=$(echo "$response" | head -c -4 | jq -r '.systemOverview.totalVTubers')
    echo "  📊 Total Users: $total_users"
    echo "  🎭 Total VTubers: $total_vtubers"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# Users
echo -n "Users API: "
response=$(curl -s -w "%{http_code}" "$PRODUCTION_URL/api/admin/users")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    user_count=$(echo "$response" | head -c -4 | jq -r 'length')
    first_user=$(echo "$response" | head -c -4 | jq -r '.[0].displayName')
    echo "  👥 User Count: $user_count"
    echo "  👤 First User: $first_user"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# VTuber Applications
echo -n "VTuber Applications: "
response=$(curl -s -w "%{http_code}" "$PRODUCTION_URL/api/admin/vtuber-applications")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    app_count=$(echo "$response" | head -c -4 | jq -r 'length')
    first_app=$(echo "$response" | head -c -4 | jq -r '.[0].applicant.channelName')
    echo "  📝 Application Count: $app_count"
    echo "  📺 First Channel: $first_app"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# System Status
echo -n "System Status: "
response=$(curl -s -w "%{http_code}" "$PRODUCTION_URL/api/admin/system/status")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    server_status=$(echo "$response" | head -c -4 | jq -r '.server')
    database_status=$(echo "$response" | head -c -4 | jq -r '.database')
    echo "  🖥️  Server: $server_status"
    echo "  💾 Database: $database_status"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# Admin Dashboard Page
echo -n "Admin Dashboard Page: "
response=$(curl -s -w "%{http_code}" -I "$PRODUCTION_URL/admin/dashboard")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ アクセス可能${NC}"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Production環境テスト完了！${NC}"
echo ""
echo -e "${YELLOW}📝 Production Admin URLs:${NC}"
echo "  • 管理画面: $PRODUCTION_URL/admin/dashboard"
echo "  • API健康チェック: $PRODUCTION_URL/api/health"
echo ""
echo -e "${BLUE}💡 管理画面機能:${NC}"
echo "  • ダッシュボード統計表示"
echo "  • ユーザー管理 (3名のテストユーザー)"
echo "  • VTuber申請審査 (3件の申請)"
echo "  • システム監視"
echo ""