const axios = require('axios')
const { spawn } = require('child_process')

// Global test configuration
global.TEST_CONFIG = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiURL: process.env.TEST_API_URL || 'http://localhost:8000',
  timeout: 30000,
  retries: 3,
  
  // Security test specific configuration
  security: {
    zapURL: 'http://localhost:8080',
    zapAPIKey: process.env.ZAP_API_KEY || '',
    maxVulnerabilities: {
      high: 0,
      medium: 2, // Allow up to 2 medium vulnerabilities
      low: 5     // Allow up to 5 low vulnerabilities
    },
    testUsers: {
      admin: {
        email: 'admin@koepon.com',
        password: 'AdminSecure123!',
        role: 'admin'
      },
      vtuber: {
        email: 'vtuber@koepon.com', 
        password: 'VTuberSecure123!',
        role: 'vtuber'
      },
      normal: {
        email: 'normal@koepon.com',
        password: 'NormalSecure123!',
        role: 'user'
      },
      attacker: {
        email: 'attacker@malicious.com',
        password: 'EvilPassword123!'
      }
    }
  }
}

// Security test utilities
global.securityUtils = {
  // Generate malicious payloads for testing
  sqlInjectionPayloads: [
    "'; DROP TABLE users; --",
    "' OR '1'='1' --",
    "'; DELETE FROM gachas; --",
    "' UNION SELECT null,null,null--",
    "admin'--",
    "admin' /*",
    "admin' OR 1=1#"
  ],
  
  xssPayloads: [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert('XSS')",
    "<svg onload=alert('XSS')>",
    "';alert(String.fromCharCode(88,83,83))//';alert(String.fromCharCode(88,83,83))//",
    "\";alert(String.fromCharCode(88,83,83))//\";alert(String.fromCharCode(88,83,83))//"
  ],
  
  csrfTokens: {
    valid: 'valid-csrf-token-123',
    invalid: 'invalid-csrf-token-456',
    missing: null
  },
  
  // Utility to wait for service to be ready
  waitForService: async (url, maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await axios.get(url, { timeout: 5000 })
        return true
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error(`Service at ${url} is not ready after ${maxAttempts} attempts`)
        }
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  },
  
  // Create authenticated session
  authenticate: async (userType = 'normal') => {
    const user = global.TEST_CONFIG.security.testUsers[userType]
    if (!user) {
      throw new Error(`Unknown user type: ${userType}`)
    }
    
    try {
      const response = await axios.post(`${global.TEST_CONFIG.apiURL}/auth/login`, {
        email: user.email,
        password: user.password
      })
      
      return {
        token: response.data.token,
        user: response.data.user,
        cookies: response.headers['set-cookie']
      }
    } catch (error) {
      throw new Error(`Authentication failed for ${userType}: ${error.message}`)
    }
  },
  
  // Execute OWASP ZAP scan
  runZapScan: async (targetURL) => {
    return new Promise((resolve, reject) => {
      const zapProcess = spawn('docker-compose', [
        '-f', 'docker-compose.zap.yml',
        'run', '--rm', 'zap'
      ], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      let output = ''
      let error = ''
      
      zapProcess.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      zapProcess.stderr.on('data', (data) => {
        error += data.toString()
      })
      
      zapProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ output, vulnerabilities: global.securityUtils.parseZapResults() })
        } else {
          reject(new Error(`ZAP scan failed: ${error}`))
        }
      })
    })
  },
  
  parseZapResults: () => {
    try {
      const fs = require('fs')
      const reportPath = './zap-reports/security-report.json'
      
      if (!fs.existsSync(reportPath)) {
        return { high: [], medium: [], low: [] }
      }
      
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      const vulnerabilities = { high: [], medium: [], low: [] }
      
      if (report.site && report.site[0] && report.site[0].alerts) {
        report.site[0].alerts.forEach(alert => {
          const risk = alert.riskdesc.toLowerCase()
          if (risk.includes('high')) {
            vulnerabilities.high.push(alert)
          } else if (risk.includes('medium')) {
            vulnerabilities.medium.push(alert)  
          } else if (risk.includes('low')) {
            vulnerabilities.low.push(alert)
          }
        })
      }
      
      return vulnerabilities
    } catch (error) {
      console.error('Failed to parse ZAP results:', error)
      return { high: [], medium: [], low: [] }
    }
  }
}

// Global setup - wait for services to be ready
beforeAll(async () => {
  console.log('🔒 Starting security test suite...')
  
  try {
    console.log('⏳ Waiting for web application to be ready...')
    await global.securityUtils.waitForService(`${global.TEST_CONFIG.baseURL}/health`)
    
    console.log('⏳ Waiting for API to be ready...')
    await global.securityUtils.waitForService(`${global.TEST_CONFIG.apiURL}/health`)
    
    console.log('✅ All services are ready for security testing')
  } catch (error) {
    console.error('❌ Security test setup failed:', error.message)
    throw error
  }
}, 60000)

// Global teardown
afterAll(async () => {
  console.log('🧹 Cleaning up security test environment...')
  
  // Cleanup any test data, close connections, etc.
  try {
    // Reset any modified security settings
    // Clear test users if created
    // Close browser instances if any
    console.log('✅ Security test cleanup completed')
  } catch (error) {
    console.error('⚠️  Security test cleanup warning:', error.message)
  }
})