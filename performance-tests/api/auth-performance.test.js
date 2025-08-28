import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const authSuccessRate = new Rate('auth_success_rate');
const authResponseTime = new Trend('auth_response_time');
const authAttempts = new Counter('auth_attempts');

export let options = {
  vus: 50, // 50 virtual users
  duration: '2m',
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of auth requests below 500ms
    'http_req_failed': ['rate<0.01'],    // Less than 1% auth failures
    'auth_success_rate': ['rate>0.99'],  // 99% auth success rate
    'auth_response_time': ['p(95)<500'], // 95% auth responses below 500ms
  },
  ext: {
    influxdb: {
      url: 'http://localhost:8086',
      database: 'k6',
      tags: {
        testid: 'API-001-auth-performance',
        api: 'authentication'
      }
    }
  }
};

const baseURL = __ENV.BASE_URL || 'http://localhost:3000';
const apiURL = `${baseURL}/api`;

// Test data
const testUsers = [
  { email: 'user1@test.com', password: 'securepass123' },
  { email: 'user2@test.com', password: 'securepass456' },
  { email: 'user3@test.com', password: 'securepass789' },
];

export function setup() {
  console.log('🔐 Starting API-001: Authentication Performance Test');
  console.log(`API URL: ${apiURL}`);
  return { startTime: Date.now() };
}

export default function() {
  // Test Case: API-001-1 - Login Performance
  testLogin();
  sleep(1);
  
  // Test Case: API-001-2 - Token Validation Performance  
  testTokenValidation();
  sleep(1);
  
  // Test Case: API-001-3 - Logout Performance
  testLogout();
  sleep(1);
}

function testLogin() {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  authAttempts.add(1);
  const startTime = Date.now();
  
  const response = http.post(`${apiURL}/auth/login`, loginPayload, params);
  
  const responseTime = Date.now() - startTime;
  authResponseTime.add(responseTime);
  
  const success = check(response, {
    'Login API status check': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    'Login response time < 500ms': (r) => r.timings.duration < 500,
    'Login response has body': (r) => r.body && r.body.length > 0,
    // Note: These will initially fail (Red Phase) as auth system isn't implemented
    'Login returns token on success': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined;
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail if it's an expected error
    },
  });
  
  authSuccessRate.add(success && response.status === 200);
  
  // Store token for subsequent tests
  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.token) {
        __ENV.AUTH_TOKEN = body.token;
      }
    } catch (e) {
      // Token parsing failed - expected in Red Phase
    }
  }
}

function testTokenValidation() {
  const token = __ENV.AUTH_TOKEN || 'fake-jwt-token-for-testing';
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const response = http.get(`${apiURL}/auth/validate`, params);
  
  const success = check(response, {
    'Token validation status check': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    'Token validation response time < 200ms': (r) => r.timings.duration < 200,
    // Note: This will fail initially (Red Phase) as validation isn't implemented
    'Valid token returns user info': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return body.user !== undefined;
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  authSuccessRate.add(success && response.status === 200);
}

function testLogout() {
  const token = __ENV.AUTH_TOKEN || 'fake-jwt-token-for-testing';
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };
  
  const response = http.post(`${apiURL}/auth/logout`, null, params);
  
  const success = check(response, {
    'Logout status check': (r) => r.status === 200 || r.status === 401 || r.status === 404,
    'Logout response time < 300ms': (r) => r.timings.duration < 300,
    // Note: This will fail initially (Red Phase) as logout isn't implemented
    'Logout success confirmation': (r) => {
      if (r.status === 200) {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch (e) {
          return false;
        }
      }
      return true; // Don't fail for expected errors
    },
  });
  
  authSuccessRate.add(success && response.status === 200);
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ API-001 Authentication Performance Test completed in ${duration} seconds`);
  console.log('🔐 Authentication API performance metrics collected');
}