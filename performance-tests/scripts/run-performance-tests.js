#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class PerformanceTestRunner {
  constructor() {
    this.baseDir = path.dirname(__dirname);
    this.resultsDir = path.join(this.baseDir, 'results');
    this.reportsDir = path.join(this.baseDir, 'reports');
    this.logFile = path.join(this.reportsDir, `performance-test-${Date.now()}.log`);
    
    // Ensure directories exist
    [this.resultsDir, this.reportsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    this.testSuites = {
      api: [
        'api/auth-performance.test.js',
        'api/gacha-performance.test.js',
        'api/medal-balance.test.js'
      ],
      load: [
        'load/normal-load.test.js',
        'load/peak-load.test.js'
      ],
      spike: [
        'spike/sudden-spike.test.js',
        'spike/gacha-spike.test.js'
      ],
      stress: [
        'stress/limit-test.test.js'
      ],
      endurance: [
        'load/long-running.test.js'
      ]
    };
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    
    // Append to log file
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async checkPrerequisites() {
    this.log('🔍 Checking prerequisites...');
    
    try {
      // Check if Docker is running
      execSync('docker --version', { stdio: 'ignore' });
      this.log('✅ Docker is available');
    } catch (error) {
      throw new Error('Docker is not installed or not running');
    }

    try {
      // Check if k6 is installed
      execSync('k6 version', { stdio: 'ignore' });
      this.log('✅ k6 is available');
    } catch (error) {
      this.log('⚠️  k6 not found locally, will use Docker version');
    }

    // Check if performance environment is running
    try {
      const response = await this.makeHttpRequest('http://localhost:3000/api/health');
      if (response) {
        this.log('✅ Application is running on localhost:3000');
      } else {
        throw new Error('Application health check failed');
      }
    } catch (error) {
      this.log('❌ Application is not running. Please start with: docker-compose -f docker-compose.performance.yml up -d');
      throw error;
    }
  }

  async makeHttpRequest(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const request = http.get(url, { timeout }, (res) => {
        resolve(res.statusCode === 200);
      });
      
      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async runTestSuite(suiteName, tests) {
    this.log(`\n🚀 Starting ${suiteName.toUpperCase()} test suite...`);
    const suiteResults = [];

    for (const testFile of tests) {
      const testPath = path.join(this.baseDir, testFile);
      
      if (!fs.existsSync(testPath)) {
        this.log(`⚠️  Test file not found: ${testFile}`);
        continue;
      }

      try {
        this.log(`\n📊 Running ${testFile}...`);
        const startTime = Date.now();
        
        // Run k6 test (this will initially fail in Red Phase)
        const result = await this.runK6Test(testFile);
        
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        suiteResults.push({
          testFile,
          success: result.success,
          duration,
          output: result.output,
          error: result.error
        });
        
        if (result.success) {
          this.log(`✅ ${testFile} completed successfully in ${duration}s`);
        } else {
          this.log(`❌ ${testFile} failed in ${duration}s`);
          if (result.error) {
            this.log(`Error: ${result.error}`);
          }
        }
        
        // Wait between tests to avoid overwhelming the system
        await this.sleep(5000);
        
      } catch (error) {
        this.log(`❌ Error running ${testFile}: ${error.message}`);
        suiteResults.push({
          testFile,
          success: false,
          duration: 0,
          error: error.message
        });
      }
    }

    return suiteResults;
  }

  async runK6Test(testFile) {
    return new Promise((resolve) => {
      const k6Command = this.isK6Available() ? 'k6' : 'docker run --rm --network host -v $(pwd):/performance-tests grafana/k6:0.47.0';
      const fullCommand = `${k6Command} run ${testFile}`;
      
      this.log(`Executing: ${fullCommand}`);
      
      const child = spawn(k6Command.split(' ')[0], [
        ...k6Command.split(' ').slice(1),
        'run',
        testFile
      ], {
        cwd: this.baseDir,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        // Real-time logging (optional, can be commented out)
        // process.stdout.write(chunk);
      });

      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        error += chunk;
        // Real-time error logging
        // process.stderr.write(chunk);
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          output,
          error: error || null
        });
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          output,
          error: err.message
        });
      });
    });
  }

  isK6Available() {
    try {
      execSync('k6 version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateSummaryReport(allResults) {
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      suites: {}
    };

    Object.entries(allResults).forEach(([suiteName, results]) => {
      const suitePassedTests = results.filter(r => r.success).length;
      const suiteFailedTests = results.filter(r => !r.success).length;
      const suiteDuration = results.reduce((sum, r) => sum + r.duration, 0);

      summary.suites[suiteName] = {
        total: results.length,
        passed: suitePassedTests,
        failed: suiteFailedTests,
        duration: suiteDuration,
        passRate: Math.round((suitePassedTests / results.length) * 100)
      };

      summary.totalTests += results.length;
      summary.passedTests += suitePassedTests;
      summary.failedTests += suiteFailedTests;
      summary.totalDuration += suiteDuration;
    });

    summary.overallPassRate = Math.round((summary.passedTests / summary.totalTests) * 100);

    // Save summary report
    const summaryPath = path.join(this.reportsDir, 'performance-test-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    return summary;
  }

  printSummary(summary) {
    this.log('\n' + '='.repeat(60));
    this.log('📊 PERFORMANCE TEST SUMMARY');
    this.log('='.repeat(60));
    this.log(`Total Tests: ${summary.totalTests}`);
    this.log(`Passed: ${summary.passedTests} ✅`);
    this.log(`Failed: ${summary.failedTests} ❌`);
    this.log(`Overall Pass Rate: ${summary.overallPassRate}%`);
    this.log(`Total Duration: ${Math.round(summary.totalDuration / 60)} minutes`);
    this.log('');

    Object.entries(summary.suites).forEach(([suiteName, stats]) => {
      this.log(`${suiteName.toUpperCase()}: ${stats.passed}/${stats.total} (${stats.passRate}%) - ${Math.round(stats.duration / 60)}min`);
    });

    this.log('');
    this.log(`📄 Detailed log: ${this.logFile}`);
    this.log(`📊 Summary report: ${path.join(this.reportsDir, 'performance-test-summary.json')}`);
    this.log('='.repeat(60));

    // Red Phase: Expected to have failures
    if (summary.failedTests > 0) {
      this.log('\n🔴 RED PHASE: Test failures detected (expected in TDD Red Phase)');
      this.log('This is normal - we will implement the features to make these tests pass.');
    } else {
      this.log('\n🟢 All tests passed! Moving to Green Phase implementation.');
    }
  }

  async run() {
    try {
      this.log('🏁 Starting Koepon Performance Test Suite');
      this.log(`Test run started at: ${new Date().toISOString()}`);

      await this.checkPrerequisites();

      const allResults = {};

      // Run test suites in order
      const suiteOrder = ['api', 'load', 'spike', 'stress'];
      
      for (const suiteName of suiteOrder) {
        if (this.testSuites[suiteName]) {
          const results = await this.runTestSuite(suiteName, this.testSuites[suiteName]);
          allResults[suiteName] = results;
        }
      }

      // Generate and display summary
      const summary = this.generateSummaryReport(allResults);
      this.printSummary(summary);

      // Exit with appropriate code
      const exitCode = summary.failedTests > 0 ? 1 : 0;
      process.exit(exitCode);

    } catch (error) {
      this.log(`❌ Performance test run failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Main execution
if (require.main === module) {
  const runner = new PerformanceTestRunner();
  runner.run().catch(console.error);
}

module.exports = PerformanceTestRunner;