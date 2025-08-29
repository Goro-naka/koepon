#!/bin/bash

# Admin API動作確認スクリプト

echo "🚀 Admin API テストを開始します..."
echo ""

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_URL="http://localhost:3002/api/v1"
FRONTEND_URL="http://localhost:3000"

# サーバー起動確認
echo -e "${BLUE}📡 サーバー起動状況を確認中...${NC}"
echo ""

# バックエンドサーバー確認
echo -n "Backend Server (port 3002): "
if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 起動中${NC}"
else
    echo -e "${RED}❌ 停止中${NC}"
    exit 1
fi

# フロントエンドサーバー確認
echo -n "Frontend Server (port 3000): "
if curl -s "$FRONTEND_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 起動中${NC}"
else
    echo -e "${RED}❌ 停止中${NC}"
    exit 1
fi

echo ""

# バックエンドAPIテスト
echo -e "${BLUE}🔧 バックエンドAPIテスト${NC}"
echo "=========================="

# Dashboard Stats
echo -n "Dashboard Stats: "
response=$(curl -s -w "%{http_code}" "$BACKEND_URL/admin/dashboard/stats")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    total_users=$(echo "$response" | head -c -4 | jq -r '.systemOverview.totalUsers')
    echo "  📊 Total Users: $total_users"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# Users List
echo -n "Users List: "
response=$(curl -s -w "%{http_code}" "$BACKEND_URL/admin/users")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    user_count=$(echo "$response" | head -c -4 | jq -r 'length')
    echo "  👥 User Count: $user_count"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# VTuber Applications
echo -n "VTuber Applications: "
response=$(curl -s -w "%{http_code}" "$BACKEND_URL/admin/vtubers")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    app_count=$(echo "$response" | head -c -4 | jq -r 'length')
    echo "  📝 Application Count: $app_count"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# System Monitoring
echo -n "System Monitoring: "
response=$(curl -s -w "%{http_code}" "$BACKEND_URL/admin/system/monitoring")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    server_status=$(echo "$response" | head -c -4 | jq -r '.server')
    echo "  🖥️  Server Status: $server_status"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# Gacha Probability
echo -n "Gacha Probability: "
response=$(curl -s -w "%{http_code}" "$BACKEND_URL/admin/gacha/probability")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    n_rate=$(echo "$response" | head -c -4 | jq -r '.settings.N.rate')
    echo "  🎲 N Rarity Rate: ${n_rate}%"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

echo ""

# フロントエンドプロキシAPIテスト
echo -e "${BLUE}🌐 フロントエンドプロキシAPIテスト${NC}"
echo "============================="

# Dashboard Metrics Proxy
echo -n "Dashboard Metrics Proxy: "
response=$(curl -s -w "%{http_code}" "$FRONTEND_URL/api/admin/dashboard/metrics")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    total_users=$(echo "$response" | head -c -4 | jq -r '.systemOverview.totalUsers')
    echo "  📊 Total Users: $total_users"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# Users Proxy
echo -n "Users Proxy: "
response=$(curl -s -w "%{http_code}" "$FRONTEND_URL/api/admin/users")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    user_count=$(echo "$response" | head -c -4 | jq -r 'length')
    echo "  👥 User Count: $user_count"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# VTuber Applications Proxy
echo -n "VTuber Applications Proxy: "
response=$(curl -s -w "%{http_code}" "$FRONTEND_URL/api/admin/vtuber-applications")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    app_count=$(echo "$response" | head -c -4 | jq -r 'length')
    echo "  📝 Application Count: $app_count"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# System Status Proxy
echo -n "System Status Proxy: "
response=$(curl -s -w "%{http_code}" "$FRONTEND_URL/api/admin/system/status")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    server_status=$(echo "$response" | head -c -4 | jq -r '.server')
    echo "  🖥️  Server Status: $server_status"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

# System Metrics Proxy
echo -n "System Metrics Proxy: "
response=$(curl -s -w "%{http_code}" "$FRONTEND_URL/api/admin/system/metrics")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    database_status=$(echo "$response" | head -c -4 | jq -r '.database')
    echo "  💾 Database Status: $database_status"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

echo ""

# 管理画面アクセステスト
echo -e "${BLUE}🎯 管理画面アクセステスト${NC}"
echo "========================"

# Admin Dashboard Page
echo -n "Admin Dashboard Page: "
response=$(curl -s -w "%{http_code}" -I "$FRONTEND_URL/admin/dashboard")
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ アクセス可能${NC}"
    echo "  🔗 URL: $FRONTEND_URL/admin/dashboard"
else
    echo -e "${RED}❌ FAIL (HTTP: $http_code)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 すべてのテストが完了しました！${NC}"
echo ""
echo -e "${YELLOW}📝 管理画面URL一覧:${NC}"
echo "  • ダッシュボード: $FRONTEND_URL/admin/dashboard"
echo "  • API文書: $BACKEND_URL/docs"
echo ""