#!/usr/bin/env node

const http = require('http');

class GreenPhaseValidator {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.results = {
      tests: [],
      startTime: Date.now()
    };
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = http.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 10000
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

  async runLoadTest(testName, url, options = {}, concurrency = 5, iterations = 20) {
    console.log(`\n🔄 Running ${testName} (${concurrency}x${iterations} requests)...`);
    
    const promises = [];
    const results = [];
    
    for (let i = 0; i < concurrency; i++) {
      const promise = (async () => {
        const concurrentResults = [];
        for (let j = 0; j < iterations; j++) {
          const result = await this.makeRequest(url, options);
          concurrentResults.push(result);
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms between requests
        }
        return concurrentResults;
      })();
      promises.push(promise);
    }

    const concurrentResults = await Promise.all(promises);
    concurrentResults.forEach(batch => results.push(...batch));

    // Calculate statistics
    const successful = results.filter(r => r.status >= 200 && r.status < 300);
    const durations = successful.map(r => r.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    const successRate = (successful.length / results.length) * 100;

    // Sort durations for percentile calculations
    durations.sort((a, b) => a - b);
    const p95Index = Math.floor(durations.length * 0.95);
    const p95Duration = durations[p95Index] || 0;

    const testResult = {
      testName,
      totalRequests: results.length,
      successfulRequests: successful.length,
      successRate,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      minDuration,
      p95Duration
    };

    this.results.tests.push(testResult);

    console.log(`✅ ${testName}:`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Avg Response: ${testResult.avgDuration}ms`);
    console.log(`   P95 Response: ${p95Duration}ms`);
    console.log(`   Min/Max: ${minDuration}ms/${maxDuration}ms`);

    return testResult;
  }

  async validateNFRRequirements() {
    console.log('🎯 Validating NFR Performance Requirements...\n');

    // NFR-001: API Response Time Requirements
    console.log('📊 Testing API Response Time Requirements (NFR-001):');
    
    // Authentication API: 500ms以内
    await this.runLoadTest(
      'Authentication API (<500ms)',
      `${this.baseURL}/api/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
      },
      3, 10
    );

    // Medal Balance API: 200ms以内  
    await this.runLoadTest(
      'Medal Balance API (<200ms)',
      `${this.baseURL}/api/medals/balance`,
      {
        headers: { 'Authorization': 'Bearer fake-jwt-token' }
      },
      5, 15
    );

    // Gacha API: 3秒以内（アニメーション含む）
    await this.runLoadTest(
      'Gacha Draw API (<3000ms)',
      `${this.baseURL}/api/gacha/draw`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-jwt-token'
        },
        body: JSON.stringify({ gachaId: 'test-gacha-001', drawCount: 1 })
      },
      2, 5
    );

    // Web Page Response Tests
    console.log('\n📊 Testing Web Page Response Requirements (NFR-001):');
    
    // Homepage: 3秒以内
    await this.runLoadTest(
      'Homepage (<3000ms)',
      `${this.baseURL}/`,
      {},
      3, 10
    );

    // Gacha List Page: 3秒以内
    await this.runLoadTest(
      'Gacha List Page (<3000ms)', 
      `${this.baseURL}/gacha`,
      {},
      3, 10
    );

    // Health Check
    await this.runLoadTest(
      'Health Check API',
      `${this.baseURL}/api/health`,
      {},
      5, 20
    );
  }

  evaluateResults() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 GREEN PHASE VALIDATION RESULTS');
    console.log('='.repeat(70));

    const nfrRequirements = {
      'Authentication API (<500ms)': 500,
      'Medal Balance API (<200ms)': 200,
      'Gacha Draw API (<3000ms)': 3000,
      'Homepage (<3000ms)': 3000,
      'Gacha List Page (<3000ms)': 3000
    };

    let allPassed = true;

    this.results.tests.forEach(test => {
      const requirement = nfrRequirements[test.testName];
      const passed = requirement ? test.p95Duration <= requirement : true;
      const status = passed ? '✅ PASS' : '❌ FAIL';
      
      if (!passed) allPassed = false;

      console.log(`${status} ${test.testName}:`);
      console.log(`     P95: ${test.p95Duration}ms ${requirement ? `(req: <${requirement}ms)` : ''}`);
      console.log(`     Success: ${test.successRate.toFixed(1)}%`);
      console.log(`     Requests: ${test.successfulRequests}/${test.totalRequests}`);
    });

    console.log('\n' + '-'.repeat(70));
    const totalDuration = Date.now() - this.results.startTime;
    console.log(`Total test duration: ${Math.round(totalDuration / 1000)}s`);
    
    if (allPassed) {
      console.log('\n🟢 GREEN PHASE: All NFR requirements validated successfully!');
      console.log('Ready to proceed to Refactor Phase for optimization.');
    } else {
      console.log('\n🟡 GREEN PHASE: Some performance requirements need optimization.');
      console.log('Consider implementing caching, database optimization, or other improvements.');
    }

    console.log('='.repeat(70));
    
    return allPassed;
  }

  async run() {
    try {
      console.log('🟢 GREEN PHASE VALIDATION - Koepon Performance Testing');
      console.log('Testing minimum implementation against NFR requirements...\n');

      await this.validateNFRRequirements();
      const allPassed = this.evaluateResults();

      return allPassed ? 0 : 1;

    } catch (error) {
      console.error('❌ Green Phase validation failed:', error.message);
      return 1;
    }
  }
}

if (require.main === module) {
  const validator = new GreenPhaseValidator();
  validator.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(console.error);
}

module.exports = GreenPhaseValidator;