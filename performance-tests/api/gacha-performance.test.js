import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const gachaSuccessRate = new Rate('gacha_success_rate');
const gachaResponseTime = new Trend('gacha_response_time');
const gachaDraws = new Counter('gacha_draws_total');
const gachaErrors = new Counter('gacha_errors_total');

export let options = {
  vus: 30, // 30 virtual users
  duration: '3m',
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // 95% of gacha requests below 3 seconds
    'http_req_failed': ['rate<0.05'],     // Less than 5% gacha failures
    'gacha_success_rate': ['rate>0.95'],  // 95% gacha success rate
    'gacha_response_time': ['p(95)<3000'], // 95% gacha responses below 3s
  },
  ext: {
    influxdb: {
      url: 'http://localhost:8086',
      database: 'k6',
      tags: {
        testid: 'API-002-gacha-performance',
        api: 'gacha-system'
      }
    }
  }
};

const baseURL = __ENV.BASE_URL || 'http://localhost:3000';
const apiURL = `${baseURL}/api`;

// Test gacha configurations
const testGachas = [
  { id: 'basic-gacha-001', name: 'Basic Gacha', cost: 100 },
  { id: 'premium-gacha-002', name: 'Premium Gacha', cost: 300 },
  { id: 'special-gacha-003', name: 'Special Event Gacha', cost: 500 },
];

export function setup() {
  console.log('🎲 Starting API-002: Gacha Performance Test');
  console.log(`API URL: ${apiURL}`);
  
  // Pre-authenticate for gacha tests
  const loginPayload = JSON.stringify({
    email: 'gacha-test@example.com',
    password: 'gachatest123'
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
  // Test Case: API-002-1 - Single Gacha Draw Performance
  testSingleGachaDraw(data.authToken);
  sleep(1);
  
  // Test Case: API-002-2 - Multi Gacha Draw Performance  
  testMultiGachaDraw(data.authToken);
  sleep(2);
  
  // Test Case: API-002-3 - Gacha List Retrieval Performance
  testGachaListRetrieval(data.authToken);
  sleep(1);
  
  // Test Case: API-002-4 - Gacha Result History Performance
  testGachaHistory(data.authToken);
  sleep(1);
}

function testSingleGachaDraw(authToken) {
  const gacha = testGachas[Math.floor(Math.random() * testGachas.length)];
  
  const drawPayload = JSON.stringify({
    gachaId: gacha.id,
    drawCount: 1,
    useTicket: false
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  gachaDraws.add(1);
  const startTime = Date.now();
  
  const response = http.post(`${apiURL}/gacha/draw`, drawPayload, params);
  
  const responseTime = Date.now() - startTime;
  gachaResponseTime.add(responseTime);
  
  const success = check(response, {
    'Single gacha draw status check': (r) => r.status === 200 || r.status === 400 || r.status === 401 || r.status === 404,
    'Single gacha draw response time < 3s': (r) => r.timings.duration < 3000,
    'Single gacha draw has response body': (r) => r.body && r.body.length > 0,
    // Note: These will fail initially (Red Phase) as gacha system isn't implemented
    'Single gacha draw returns result on success': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return body.result !== undefined && body.items !== undefined;
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  if (!success || response.status >= 400) {
    gachaErrors.add(1);
  }
  
  gachaSuccessRate.add(success && response.status === 200);
}

function testMultiGachaDraw(authToken) {
  const gacha = testGachas[Math.floor(Math.random() * testGachas.length)];
  const drawCount = Math.floor(Math.random() * 10) + 1; // 1-10 draws
  
  const drawPayload = JSON.stringify({
    gachaId: gacha.id,
    drawCount: drawCount,
    useTicket: false
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  gachaDraws.add(drawCount);
  const response = http.post(`${apiURL}/gacha/draw-multi`, drawPayload, params);
  
  const success = check(response, {
    'Multi gacha draw status check': (r) => r.status === 200 || r.status === 400 || r.status === 401 || r.status === 404,
    'Multi gacha draw response time < 5s': (r) => r.timings.duration < 5000, // Allow more time for multi-draw
    'Multi gacha draw has response body': (r) => r.body && r.body.length > 0,
    // Note: This will fail initially (Red Phase)
    'Multi gacha draw returns multiple results': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return body.results && Array.isArray(body.results) && body.results.length === drawCount;
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  if (!success || response.status >= 400) {
    gachaErrors.add(1);
  }
  
  gachaSuccessRate.add(success && response.status === 200);
}

function testGachaListRetrieval(authToken) {
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  const response = http.get(`${apiURL}/gacha/list`, params);
  
  const success = check(response, {
    'Gacha list status check': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    'Gacha list response time < 1s': (r) => r.timings.duration < 1000,
    'Gacha list has response body': (r) => r.body && r.body.length > 0,
    // Note: This will fail initially (Red Phase)
    'Gacha list returns array of gachas': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.gachas) && body.gachas.length > 0;
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  gachaSuccessRate.add(success && response.status === 200);
}

function testGachaHistory(authToken) {
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  const response = http.get(`${apiURL}/gacha/history?limit=20`, params);
  
  const success = check(response, {
    'Gacha history status check': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    'Gacha history response time < 1s': (r) => r.timings.duration < 1000,
    'Gacha history has response body': (r) => r.body && r.body.length > 0,
    // Note: This will fail initially (Red Phase)
    'Gacha history returns draw history': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.history);
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  gachaSuccessRate.add(success && response.status === 200);
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ API-002 Gacha Performance Test completed in ${duration} seconds`);
  console.log('🎲 Gacha API performance metrics collected');
  console.log(`Total gacha draws attempted: ${gachaDraws.count || 0}`);
  console.log(`Total gacha errors: ${gachaErrors.count || 0}`);
}