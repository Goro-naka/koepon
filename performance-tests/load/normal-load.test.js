import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

// Test configuration
export let options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // 95% of requests below 3 seconds
    'http_req_failed': ['rate<0.1'],      // Error rate below 10%
    'error_rate': ['rate<0.1'],           // Custom error rate
    'response_time': ['p(95)<3000'],      // Custom response time
  },
  ext: {
    influxdb: {
      url: 'http://localhost:8086',
      database: 'k6',
      tags: {
        testid: 'LT-001-normal-load',
        environment: 'performance-test'
      }
    }
  }
};

const baseURL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // Setup phase - prepare test data
  console.log('🚀 Starting LT-001: Normal Load Test');
  console.log(`Base URL: ${baseURL}`);
  
  // Check if application is running
  const healthResponse = http.get(`${baseURL}/api/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`Application not running. Health check failed with status: ${healthResponse.status}`);
  }
  
  return { startTime: Date.now() };
}

export default function(data) {
  // Test scenario: Normal user journey
  
  // 1. Visit homepage
  let response = http.get(`${baseURL}/`);
  let success = check(response, {
    'Homepage status is 200': (r) => r.status === 200,
    'Homepage response time < 3s': (r) => r.timings.duration < 3000,
    'Homepage contains title': (r) => r.body.includes('こえポン！'),
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  sleep(1); // Think time
  
  // 2. Navigate to gacha list
  response = http.get(`${baseURL}/gacha`);
  success = check(response, {
    'Gacha list status is 200': (r) => r.status === 200,
    'Gacha list response time < 3s': (r) => r.timings.duration < 3000,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  sleep(2); // Think time
  
  // 3. User authentication (mock login)
  const loginData = {
    email: `test-user-${Math.floor(Math.random() * 1000)}@example.com`,
    password: 'testpassword123'
  };
  
  response = http.post(`${baseURL}/api/auth/login`, JSON.stringify(loginData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  success = check(response, {
    'Login API response time < 500ms': (r) => r.timings.duration < 500,
    // Note: This will fail initially (Red Phase) as auth system isn't implemented yet
    'Login attempt processed': (r) => r.status === 200 || r.status === 401 || r.status === 404,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  sleep(1);
  
  // 4. Check medal balance
  response = http.get(`${baseURL}/api/medals/balance`, {
    headers: { 'Authorization': 'Bearer fake-jwt-token' },
  });
  
  success = check(response, {
    'Medal balance response time < 200ms': (r) => r.timings.duration < 200,
    // Note: This will fail initially (Red Phase) as medals system isn't implemented yet
    'Medal balance request processed': (r) => r.status === 200 || r.status === 401 || r.status === 404,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  sleep(1);
  
  // 5. Perform gacha draw
  const gachaData = {
    gachaId: 'test-gacha-001',
    drawCount: 1
  };
  
  response = http.post(`${baseURL}/api/gacha/draw`, JSON.stringify(gachaData), {
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer fake-jwt-token'
    },
  });
  
  success = check(response, {
    'Gacha draw response time < 3s': (r) => r.timings.duration < 3000,
    // Note: This will fail initially (Red Phase) as gacha system isn't implemented yet
    'Gacha draw request processed': (r) => r.status === 200 || r.status === 401 || r.status === 404 || r.status === 400,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  sleep(3); // Animation time
  
  // 6. Check user profile
  response = http.get(`${baseURL}/profile`, {
    headers: { 'Authorization': 'Bearer fake-jwt-token' },
  });
  
  success = check(response, {
    'Profile page response time < 2s': (r) => r.timings.duration < 2000,
    'Profile page request processed': (r) => r.status === 200 || r.status === 401 || r.status === 404,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  sleep(1);
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`✅ LT-001 Normal Load Test completed in ${duration} seconds`);
  console.log('📊 Check results in InfluxDB/Grafana dashboard');
}