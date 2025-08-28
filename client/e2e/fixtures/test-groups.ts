// Test group configurations for parallel execution optimization

export const testGroups = {
  // Group A: Basic flows (35 min parallel) - Authentication & Core Features
  groupA: {
    testDir: 'e2e/tests/auth.spec.ts',
    timeout: 45000,
    parallel: true,
    workers: 3,
  },
  
  // Group B: Management features (35 min parallel) - Admin & VTuber Management  
  groupB: {
    testDir: 'e2e/tests/{admin,vtuber-management}.spec.ts',
    timeout: 45000,
    parallel: true,
    workers: 3,
  },
  
  // Group C: Quality/Performance (20 min sequential) - Performance & Edge Cases
  groupC: {
    testDir: 'e2e/tests/{performance,edge-cases}.spec.ts',
    timeout: 60000,
    parallel: false,
    workers: 1,
  },
  
  // Group D: Specialized tests (15 min sequential) - User Flows
  groupD: {
    testDir: 'e2e/tests/{gacha,exchange,rewards}.spec.ts',
    timeout: 45000,
    parallel: true,
    workers: 2,
  },
}

// Performance test thresholds
export const performanceThresholds = {
  pageLoad: 3000,      // 3 seconds
  gachaDraw: 3000,     // 3 seconds
  tenDraw: 5000,       // 5 seconds
  fileDownload: 5000,  // 5 seconds
  apiResponse: 2000,   // 2 seconds
  concurrentOps: 10000, // 10 seconds
}

// Test data generation utilities
export const testDataGenerators = {
  uniqueEmail: (prefix = 'test') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}@koepon.com`,
  uniqueUsername: (prefix = 'user') => `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 3)}`,
  randomPassword: () => `Test${Math.random().toString(36).substr(2, 8)}Pass!`,
}