import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const medalBalanceSuccessRate = new Rate('medal_balance_success_rate');
const medalBalanceResponseTime = new Trend('medal_balance_response_time');
const medalBalanceRequests = new Counter('medal_balance_requests_total');

export let options = {
  vus: 40, // 40 virtual users
  duration: '2m',
  thresholds: {
    'http_req_duration': ['p(95)<200'], // 95% of medal balance requests below 200ms
    'http_req_failed': ['rate<0.01'],    // Less than 1% medal balance failures
    'medal_balance_success_rate': ['rate>0.99'], // 99% success rate
    'medal_balance_response_time': ['p(95)<200'], // 95% responses below 200ms
  },
  ext: {
    influxdb: {
      url: 'http://localhost:8086',
      database: 'k6',
      tags: {
        testid: 'API-003-medal-balance-performance',
        api: 'medal-system'
      }
    }
  }
};

const baseURL = __ENV.BASE_URL || 'http://localhost:3000';
const apiURL = `${baseURL}/api`;

export function setup() {
  console.log('💰 Starting API-003: Medal Balance Performance Test');
  console.log(`API URL: ${apiURL}`);
  
  // Pre-authenticate for medal balance tests
  const loginPayload = JSON.stringify({
    email: 'medal-test@example.com',
    password: 'medaltest123'
  });
  
  const loginResponse = http.post(`${apiURL}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  let authToken = 'fake-jwt-token-for-testing';
  if (loginResponse.status === 200) {
    try {
      const body = JSON.parse(loginResponse.body);
      if (body.token) {
        authToken = body.token;
      }
    } catch (e) {
      // Expected in Red Phase
    }
  }
  
  return { 
    startTime: Date.now(),
    authToken: authToken
  };
}

export default function(data) {
  // Test Case: API-003-1 - Get Medal Balance Performance
  testGetMedalBalance(data.authToken);
  sleep(0.5);
  
  // Test Case: API-003-2 - Medal Transaction History Performance
  testMedalTransactionHistory(data.authToken);
  sleep(0.5);
  
  // Test Case: API-003-3 - Medal Purchase Performance
  testMedalPurchase(data.authToken);
  sleep(1);
  
  // Test Case: API-003-4 - Medal Spending Performance
  testMedalSpending(data.authToken);
  sleep(0.5);
}

function testGetMedalBalance(authToken) {
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  medalBalanceRequests.add(1);
  const startTime = Date.now();
  
  const response = http.get(`${apiURL}/medals/balance`, params);
  
  const responseTime = Date.now() - startTime;
  medalBalanceResponseTime.add(responseTime);
  
  const success = check(response, {
    'Medal balance status check': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    'Medal balance response time < 200ms': (r) => r.timings.duration < 200,
    'Medal balance has response body': (r) => r.body && r.body.length > 0,
    // Note: This will fail initially (Red Phase) as medal system isn't implemented
    'Medal balance returns balance info on success': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return typeof body.balance === 'number' && body.balance >= 0;
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  medalBalanceSuccessRate.add(success && response.status === 200);
}

function testMedalTransactionHistory(authToken) {
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  const response = http.get(`${apiURL}/medals/transactions?limit=20`, params);
  
  const success = check(response, {
    'Medal transactions status check': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    'Medal transactions response time < 300ms': (r) => r.timings.duration < 300,
    'Medal transactions has response body': (r) => r.body && r.body.length > 0,
    // Note: This will fail initially (Red Phase)
    'Medal transactions returns history on success': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.transactions);
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  medalBalanceSuccessRate.add(success && response.status === 200);
}

function testMedalPurchase(authToken) {
  const purchaseAmount = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 medals
  const packageId = `medal-package-${Math.floor(Math.random() * 3) + 1}`; // package-1, package-2, package-3
  
  const purchasePayload = JSON.stringify({
    packageId: packageId,
    amount: purchaseAmount,
    paymentMethod: 'credit-card'
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  const response = http.post(`${apiURL}/medals/purchase`, purchasePayload, params);
  
  const success = check(response, {
    'Medal purchase status check': (r) => r.status === 200 || r.status === 400 || r.status === 401 || r.status === 404,
    'Medal purchase response time < 2s': (r) => r.timings.duration < 2000, // Purchase may take longer
    'Medal purchase has response body': (r) => r.body && r.body.length > 0,
    // Note: This will fail initially (Red Phase)
    'Medal purchase returns transaction info on success': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return body.transactionId && body.newBalance !== undefined;
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  medalBalanceSuccessRate.add(success && response.status === 200);
}

function testMedalSpending(authToken) {
  const spendAmount = Math.floor(Math.random() * 500) + 100; // 100-600 medals
  const itemType = ['gacha-draw', 'item-purchase', 'premium-feature'][Math.floor(Math.random() * 3)];
  
  const spendPayload = JSON.stringify({
    amount: spendAmount,
    itemType: itemType,
    itemId: `item-${Math.floor(Math.random() * 100) + 1}`
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  const response = http.post(`${apiURL}/medals/spend`, spendPayload, params);
  
  const success = check(response, {
    'Medal spending status check': (r) => r.status === 200 || r.status === 400 || r.status === 401 || r.status === 404,
    'Medal spending response time < 300ms': (r) => r.timings.duration < 300,
    'Medal spending has response body': (r) => r.body && r.body.length > 0,
    // Note: This will fail initially (Red Phase)
    'Medal spending returns updated balance on success': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return body.newBalance !== undefined && body.spentAmount === spendAmount;
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  medalBalanceSuccessRate.add(success && response.status === 200);
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ API-003 Medal Balance Performance Test completed in ${duration} seconds`);
  console.log('💰 Medal system API performance metrics collected');
  console.log(`Total medal balance requests: ${medalBalanceRequests.count || 0}`);
}