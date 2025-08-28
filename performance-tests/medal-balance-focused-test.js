#!/usr/bin/env node

const http = require('http');

class MedalBalanceFocusedTest {
  constructor() {
    this.baseURL = 'http://localhost:3000';
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = http.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 5000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            body,
            duration: Date.now() - startTime
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          status: 0,
          error: error.message,
          duration: Date.now() - startTime
        });
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    });
  }

  async testCachePerformance() {
    console.log('🔄 Testing Medal Balance API Cache Performance...\n');

    // First request (cold cache)
    console.log('1️⃣ Cold cache test (first request):');
    const firstResponse = await this.makeRequest(`${this.baseURL}/api/medals/balance`, {
      headers: { 'Authorization': 'Bearer fake-jwt-token' }
    });
    console.log(`   Duration: ${firstResponse.duration}ms`);
    if (firstResponse.body) {
      try {
        const data = JSON.parse(firstResponse.body);
        console.log(`   Cached: ${data.cached || false}`);
      } catch (e) {}
    }

    // Wait a moment then test cache hits
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('\n2️⃣ Warm cache test (subsequent requests):');
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(this.makeRequest(`${this.baseURL}/api/medals/balance`, {
        headers: { 'Authorization': 'Bearer fake-jwt-token' }
      }));
    }

    const responses = await Promise.all(promises);
    const durations = responses.map(r => r.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    console.log(`   Average: ${Math.round(avgDuration)}ms`);
    console.log(`   Min/Max: ${minDuration}ms/${maxDuration}ms`);
    
    // Check how many were cached
    let cachedResponses = 0;
    responses.forEach(response => {
      if (response.body) {
        try {
          const data = JSON.parse(response.body);
          if (data.cached) cachedResponses++;
        } catch (e) {}
      }
    });

    console.log(`   Cached responses: ${cachedResponses}/${responses.length}`);

    // Check if we meet the requirement
    const p95Index = Math.floor(durations.length * 0.95);
    durations.sort((a, b) => a - b);
    const p95Duration = durations[p95Index] || 0;

    console.log(`   P95: ${p95Duration}ms`);
    
    if (p95Duration <= 200) {
      console.log('\n✅ REFACTOR PHASE SUCCESS: Medal Balance API now meets <200ms requirement!');
    } else {
      console.log('\n🟡 Still optimizing: Medal Balance API P95 is still above 200ms');
    }

    return p95Duration;
  }

  async run() {
    console.log('🔵 REFACTOR PHASE - Medal Balance API Performance Test\n');
    
    const p95Duration = await this.testCachePerformance();
    
    console.log('\n' + '='.repeat(50));
    console.log('Medal Balance API Performance Summary:');
    console.log(`P95 Response Time: ${p95Duration}ms (requirement: <200ms)`);
    console.log(`Status: ${p95Duration <= 200 ? 'PASS ✅' : 'NEEDS MORE OPTIMIZATION 🟡'}`);
    console.log('='.repeat(50));

    return p95Duration <= 200 ? 0 : 1;
  }
}

if (require.main === module) {
  const tester = new MedalBalanceFocusedTest();
  tester.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(console.error);
}

module.exports = MedalBalanceFocusedTest;