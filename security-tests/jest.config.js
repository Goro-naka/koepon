module.exports = {
  displayName: 'Security Tests',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.security.test.js',
    '<rootDir>/tests/**/*.security.test.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/setup/security-test-setup.js'],
  testTimeout: 30000, // Security tests may take longer
  collectCoverage: false, // Security tests focus on vulnerabilities, not coverage
  verbose: true,
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './reports',
      filename: 'security-test-report.html',
      expand: true,
    }],
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'security-test-results.xml',
    }]
  ],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../client/src/$1',
    '^@security/(.*)$': '<rootDir>/utils/$1'
  }
}