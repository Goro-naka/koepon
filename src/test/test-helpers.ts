import { CustomLoggerService } from '../common/logger/logger.service';

/**
 * テスト用のCustomLoggerServiceモック
 */
export const createMockCustomLoggerService = () => ({
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  logRequest: jest.fn(),
  logBusinessEvent: jest.fn(),
  logSecurityEvent: jest.fn(),
  setContext: jest.fn(),
  setLogLevels: jest.fn(),
});

/**
 * テスト用のDatabaseServiceモック
 */
export const createMockDatabaseService = () => ({
  // User operations
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  getUserByUsername: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  searchUsers: jest.fn(),
  
  // Session operations
  createSession: jest.fn(),
  getSession: jest.fn(),
  updateSession: jest.fn(),
  removeSession: jest.fn(),
  removeAllUserSessions: jest.fn(),
  
  // Health and stats
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
  getTableStats: jest.fn().mockResolvedValue([]),
  
  // VTuber operations
  createVtuber: jest.fn(),
  getVtuberById: jest.fn(),
  updateVtuber: jest.fn(),
  deleteVtuber: jest.fn(),
  
  // Gacha operations
  getGachaById: jest.fn(),
  createGacha: jest.fn(),
  updateGacha: jest.fn(),
  deleteGacha: jest.fn(),
  getGachaItems: jest.fn(),
  createGachaResult: jest.fn(),
  
  // Push medal operations
  getUserMedalBalance: jest.fn(),
  updateMedalBalance: jest.fn(),
  createMedalTransaction: jest.fn(),
  getMedalTransactions: jest.fn(),
  
  // Exchange operations
  getExchangeItems: jest.fn(),
  createExchangeItem: jest.fn(),
  updateExchangeItem: jest.fn(),
  createExchangeTransaction: jest.fn(),
  
  // Payment operations
  createPaymentRecord: jest.fn(),
  getPaymentHistory: jest.fn(),
  updatePaymentStatus: jest.fn(),
  
  // Admin operations
  getSystemMetrics: jest.fn(),
  createAdminAction: jest.fn(),
  getAdminActions: jest.fn(),
  
  // Supabase client operations
  getAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        range: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
        })),
        or: jest.fn(() => ({
          range: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  })),
  getClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        range: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
        })),
        or: jest.fn(() => ({
          range: jest.fn(() => ({
            order: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    })),
  })),
});

/**
 * テスト用のPasswordServiceモック
 */
export const createMockPasswordService = () => ({
  hashPassword: jest.fn(),
  validatePassword: jest.fn(),
  comparePassword: jest.fn(),
  generateSalt: jest.fn(),
  validatePasswordStrength: jest.fn(),
});

/**
 * テスト用のJwtServiceモック
 */
export const createMockJwtService = () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  decode: jest.fn(),
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
});

/**
 * テスト用のConfigServiceモック
 */
export const createMockConfigService = () => ({
  get: jest.fn((key: string) => {
    const mockConfig = {
      'JWT_SECRET': 'test-secret',
      'JWT_EXPIRES_IN': '1h',
      'REFRESH_TOKEN_EXPIRES_IN': '7d',
      'STRIPE_SECRET_KEY': 'sk_test_mock',
      'STRIPE_PUBLISHABLE_KEY': 'pk_test_mock',
      'SUPABASE_URL': 'https://test.supabase.co',
      'SUPABASE_SERVICE_ROLE_KEY': 'test-service-role-key',
      'SUPABASE_ANON_KEY': 'test-anon-key',
    };
    return mockConfig[key];
  }),
});

/**
 * 一般的なテストユーティリティ
 */
export const testUtils = {
  /**
   * Promise.resolveでラップされたモック関数を作成
   */
  createAsyncMock: <T>(returnValue: T) => jest.fn().mockResolvedValue(returnValue),
  
  /**
   * Promise.rejectでラップされたモック関数を作成
   */
  createAsyncErrorMock: (error: Error) => jest.fn().mockRejectedValue(error),
  
  /**
   * テスト用UUIDを生成
   */
  generateTestUUID: () => '123e4567-e89b-12d3-a456-426614174000',
  
  /**
   * テスト用のユーザーデータを作成
   */
  createTestUser: () => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    username: 'testuser',
    display_name: 'Test User',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  }),
  
  /**
   * テスト用のVTuberデータを作成
   */
  createTestVtuber: () => ({
    id: '223e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    channel_name: 'Test VTuber Channel',
    description: 'Test description',
    subscriber_count: 1000,
    is_verified: true,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  }),
};

/**
 * テスト用の共通プロバイダーセットアップ
 */
export const getCommonTestProviders = () => [
  {
    provide: CustomLoggerService,
    useValue: createMockCustomLoggerService(),
  },
  {
    provide: 'DatabaseService',
    useValue: createMockDatabaseService(),
  },
  {
    provide: 'PasswordService',
    useValue: createMockPasswordService(),
  },
  {
    provide: 'JwtService',
    useValue: createMockJwtService(),
  },
  {
    provide: 'ConfigService',
    useValue: createMockConfigService(),
  },
];