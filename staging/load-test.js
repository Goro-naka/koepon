import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,
  duration: '30s',
};

export default function() {
  // フロントエンドページテスト
  let frontendResponse = http.get('http://localhost:3000');
  check(frontendResponse, {
    'frontend status is 200': (r) => r.status === 200,
    'frontend response time < 3s': (r) => r.timings.duration < 3000,
  });
  
  // APIテスト
  let apiResponse = http.get('http://localhost:3000/api/api/health');
  check(apiResponse, {
    'api status is 200': (r) => r.status === 200,
    'api response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  // ガチャリストAPI
  let gachaResponse = http.get('http://localhost:3000/api/api/gacha/list');
  check(gachaResponse, {
    'gacha list status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}