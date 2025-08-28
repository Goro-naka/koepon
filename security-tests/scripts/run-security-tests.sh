#!/bin/bash

# Koepon Security Test Runner
# Executes comprehensive security testing suite

set -e

echo "🔒 Starting Koepon Security Test Suite..."
echo "========================================"

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:8000}"
REPORT_DIR="./reports"
ZAP_REPORT_DIR="./zap-reports"

# Create report directories
mkdir -p "$REPORT_DIR"
mkdir -p "$ZAP_REPORT_DIR"

echo "📋 Test Configuration:"
echo "  Base URL: $BASE_URL"
echo "  API URL: $API_URL"
echo "  Report Directory: $REPORT_DIR"
echo ""

# Function to check service availability
check_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Waiting for $name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url/health" > /dev/null 2>&1; then
            echo "✅ $name is ready"
            return 0
        fi
        
        echo "   Attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ $name failed to start after $max_attempts attempts"
    return 1
}

# Step 1: Verify services are running
echo "🚀 Step 1: Service Health Check"
echo "--------------------------------"

if ! check_service "$BASE_URL" "Web Application"; then
    echo "❌ Web application is not accessible at $BASE_URL"
    echo "   Please start the application with: npm run dev"
    exit 1
fi

if ! check_service "$API_URL" "API Server"; then
    echo "❌ API server is not accessible at $API_URL"
    echo "   Please start the API server"
    exit 1
fi

echo ""

# Step 2: Run security unit tests
echo "🧪 Step 2: Security Unit Tests"
echo "-------------------------------"

echo "Running authentication security tests..."
npm test -- --testNamePattern="Authentication Security Tests" --verbose

echo "Running input validation security tests..."
npm test -- --testNamePattern="Input Validation Security Tests" --verbose

echo "Running session management security tests..."
npm test -- --testNamePattern="Session Management Security Tests" --verbose

echo "Running encryption security tests..."
npm test -- --testNamePattern="Encryption Security Tests" --verbose

echo "Running error handling security tests..."
npm test -- --testNamePattern="Error Handling Security Tests" --verbose

echo ""

# Step 3: OWASP ZAP Security Scan
echo "🕷️  Step 3: OWASP ZAP Security Scan"
echo "-----------------------------------"

echo "Starting OWASP ZAP container..."
docker-compose -f docker-compose.zap.yml up --build --detach

echo "Waiting for ZAP to initialize..."
sleep 30

echo "Running ZAP spider scan..."
docker exec koepon-zap-scanner zap-cli --zap-url http://localhost:8080 spider "$BASE_URL"

echo "Running ZAP active scan..."
docker exec koepon-zap-scanner zap-cli --zap-url http://localhost:8080 active-scan "$BASE_URL"

echo "Generating ZAP reports..."
docker exec koepon-zap-scanner zap-cli --zap-url http://localhost:8080 report -o /zap/wrk/security-report.html -f html
docker exec koepon-zap-scanner zap-cli --zap-url http://localhost:8080 report -o /zap/wrk/security-report.json -f json

echo "Stopping ZAP container..."
docker-compose -f docker-compose.zap.yml down

echo ""

# Step 4: Generate Security Report
echo "📊 Step 4: Security Report Generation"
echo "------------------------------------"

node scripts/generate-security-report.js

echo ""

# Step 5: Vulnerability Assessment
echo "🔍 Step 5: Vulnerability Assessment"
echo "-----------------------------------"

if [ -f "$ZAP_REPORT_DIR/security-report.json" ]; then
    echo "Analyzing ZAP scan results..."
    node scripts/analyze-vulnerabilities.js
else
    echo "⚠️  ZAP report not found. Scan may have failed."
fi

echo ""

# Step 6: Security Score Calculation
echo "📈 Step 6: Security Score Calculation"
echo "------------------------------------"

node scripts/calculate-security-score.js

echo ""

# Summary
echo "🎯 Security Test Summary"
echo "========================"

echo "✅ Security unit tests completed"
echo "✅ OWASP ZAP scan completed"
echo "✅ Vulnerability analysis completed"
echo "📄 Reports available in: $REPORT_DIR"
echo "📄 ZAP reports available in: $ZAP_REPORT_DIR"

echo ""
echo "🔍 Next Steps:"
echo "1. Review security report: $REPORT_DIR/security-summary.html"
echo "2. Address any high/critical vulnerabilities"
echo "3. Update security policies if needed"
echo "4. Schedule regular security scans"

echo ""
echo "🔒 Security test suite completed successfully!"