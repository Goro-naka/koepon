import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test configuration
jest.setTimeout(10000);

// Console warning suppression for tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings that are expected in test environment
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('ExperimentalWarning') ||
     message.includes('Buffer() is deprecated'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Mock global fetch for tests if needed
if (!globalThis.fetch) {
  globalThis.fetch = jest.fn();
}

// Global test utilities
globalThis.testUtils = {
  /**
   * Wait for a specific amount of time
   */
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Generate test UUID
   */
  uuid: () => '123e4567-e89b-12d3-a456-426614174000',
  
  /**
   * Create test date
   */
  date: () => new Date('2024-01-01T00:00:00.000Z'),
};

// Declare global types for TypeScript
declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        sleep: (ms: number) => Promise<void>;
        uuid: () => string;
        date: () => Date;
      };
    }
  }
}