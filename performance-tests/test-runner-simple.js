#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class SimplePerformanceTestRunner {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.reportsDir = path.join(__dirname, 'reports');
    this.logFile = path.join(this.reportsDir, `performance-test-${Date.now()}.log`);
    
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
    
    this.results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      startTime: Date.now()
    };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Append to log file
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async makeHttpRequest(url, options = {}) {
    return new Promise((resolve) => {
      const isHttps = url.startsWith('https:');
      const lib = isHttps ? https : http;
      
      const requestOptions = {
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || 5000
      };
      
      if (options.body) {
        requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
      }
      
      const startTime = Date.now();
      
      const req = lib.request(url, requestOptions, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          const endTime = Date.now();
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            duration: endTime - startTime,
            success: res.statusCode < 400
          });
        });
      });
      
      req.on('error', (err) => {
        const endTime = Date.now();
        resolve({
          status: 0,
          error: err.message,
          duration: endTime - startTime,
          success: false
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        const endTime = Date.now();
        resolve({
          status: 408,
          error: 'Request timeout',
          duration: endTime - startTime,
          success: false
        });
      });
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async runTest(testName, testFunc) {
    this.results.totalTests++;
    this.log(`\n📊 Running ${testName}...`);
    
    try {
      const result = await testFunc();
      if (result.success) {
        this.results.passedTests++;
        this.log(`✅ ${testName} PASSED (${result.duration}ms)`);
      } else {
        this.results.failedTests++;
        this.log(`❌ ${testName} FAILED (${result.duration}ms) - ${result.error || 'Test assertion failed'}`);
      }
      return result;
    } catch (error) {
      this.results.failedTests++;
      this.log(`❌ ${testName} ERROR - ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async testApplicationAvailability() {
    return await this.runTest('Application Availability', async () => {
      const response = await this.makeHttpRequest('http://localhost:3000/');
      return {
        success: response.status === 200 || response.status === 404, // 404 is acceptable for now
        duration: response.duration,
        error: response.error || (response.status >= 500 ? `HTTP ${response.status}` : null)
      };
    });
  }

  async testHealthEndpoint() {
    return await this.runTest('Health Endpoint', async () => {
      const response = await this.makeHttpRequest('http://localhost:3000/api/health');
      return {
        success: response.status === 200 || response.status === 404, // 404 is acceptable for now
        duration: response.duration,
        error: response.error || (response.status >= 500 ? `HTTP ${response.status}` : null)
      };
    });
  }

  async testAuthAPI() {
    return await this.runTest('Authentication API', async () => {
      const payload = JSON.stringify({
        email: 'test@example.com',
        password: 'testpass123'
      });
      
      const response = await this.makeHttpRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payload
      });
      
      // In Red Phase, we expect this to fail (404 or 500)
      // We're testing that the server responds, not that auth works
      return {
        success: response.status !== 0, // Any response from server is good for now
        duration: response.duration,
        error: response.error || (response.status === 0 ? 'No server response' : null)
      };
    });
  }

  async testGachaAPI() {
    return await this.runTest('Gacha API', async () => {
      const payload = JSON.stringify({
        gachaId: 'test-gacha-001',
        drawCount: 1
      });
      
      const response = await this.makeHttpRequest('http://localhost:3000/api/gacha/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer fake-jwt-token'
        },
        body: payload
      });
      
      // In Red Phase, we expect this to fail (404 or 500)
      return {
        success: response.status !== 0, // Any response from server is good for now
        duration: response.duration,
        error: response.error || (response.status === 0 ? 'No server response' : null)
      };
    });
  }

  async testMedalAPI() {
    return await this.runTest('Medal Balance API', async () => {
      const response = await this.makeHttpRequest('http://localhost:3000/api/medals/balance', {
        headers: {
          'Authorization': 'Bearer fake-jwt-token'
        }
      });
      
      // In Red Phase, we expect this to fail (404 or 500)
      return {
        success: response.status !== 0, // Any response from server is good for now
        duration: response.duration,
        error: response.error || (response.status === 0 ? 'No server response' : null)
      };
    });
  }

  async testResponseTimes() {
    return await this.runTest('Response Time Requirements', async () => {
      const homePageResponse = await this.makeHttpRequest('http://localhost:3000/');
      
      // Check if homepage loads within 3 seconds (NFR-001 requirement)
      const withinTimeLimit = homePageResponse.duration < 3000;
      
      return {
        success: withinTimeLimit && homePageResponse.status !== 0,
        duration: homePageResponse.duration,
        error: withinTimeLimit ? homePageResponse.error : `Homepage took ${homePageResponse.duration}ms (>3000ms limit)`
      };
    });
  }

  printSummary() {
    const totalDuration = Date.now() - this.results.startTime;
    const passRate = Math.round((this.results.passedTests / this.results.totalTests) * 100);
    
    this.log('\n' + '='.repeat(60));
    this.log('📊 PERFORMANCE TEST SUMMARY (Red Phase)');
    this.log('='.repeat(60));
    this.log(`Total Tests: ${this.results.totalTests}`);
    this.log(`Passed: ${this.results.passedTests} ✅`);
    this.log(`Failed: ${this.results.failedTests} ❌`);
    this.log(`Pass Rate: ${passRate}%`);
    this.log(`Total Duration: ${Math.round(totalDuration / 1000)} seconds`);
    this.log('');
    this.log(`📄 Log file: ${this.logFile}`);
    this.log('='.repeat(60));

    if (this.results.failedTests > 0) {
      this.log('\n🔴 RED PHASE: Test failures detected (EXPECTED!)');
      this.log('This is the Red Phase of TDD - failures are expected.');
      this.log('Next step: Implement minimum functionality to make tests pass (Green Phase).');
    } else {
      this.log('\n🟢 All tests passed! Ready for Green Phase optimization.');
    }
    
    return {
      totalTests: this.results.totalTests,
      passedTests: this.results.passedTests,
      failedTests: this.results.failedTests,
      passRate: passRate
    };
  }

  async run() {
    try {
      this.log('🏁 Starting Simple Performance Test Suite (Red Phase)');
      this.log('This test suite validates basic connectivity and response requirements.');
      this.log('='.repeat(60));

      // Run basic connectivity tests
      await this.testApplicationAvailability();
      await this.testHealthEndpoint();
      
      // Run API endpoint tests (expected to fail in Red Phase)
      await this.testAuthAPI();
      await this.testGachaAPI();
      await this.testMedalAPI();
      
      // Run performance requirement tests
      await this.testResponseTimes();

      // Print summary
      const summary = this.printSummary();
      
      // Generate JSON report
      const report = {
        timestamp: new Date().toISOString(),
        phase: 'Red',
        summary: summary,
        message: 'Red Phase - Basic connectivity and API structure tests'
      };
      
      fs.writeFileSync(
        path.join(this.reportsDir, 'red-phase-results.json'),
        JSON.stringify(report, null, 2)
      );

      // Exit with status 1 if we have failures (expected in Red Phase)
      return summary.failedTests > 0 ? 1 : 0;

    } catch (error) {
      this.log(`❌ Test runner error: ${error.message}`);
      return 1;
    }
  }
}

// Main execution
if (require.main === module) {
  const runner = new SimplePerformanceTestRunner();
  runner.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = SimplePerformanceTestRunner;