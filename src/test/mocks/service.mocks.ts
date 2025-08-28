// Common service mocks for testing

export const createMockRewardService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getRewardById: jest.fn(),
  awardReward: jest.fn(),
  getUserRewards: jest.fn(),
  validateReward: jest.fn(),
});

export const createMockPaymentService = () => ({
  processPayment: jest.fn().mockResolvedValue({
    id: 'payment-test-001',
    status: 'completed',
  }),
  refundPayment: jest.fn().mockResolvedValue({ success: true }),
  validatePayment: jest.fn(),
  getPaymentById: jest.fn(),
  getUserPayments: jest.fn(),
});

export const createMockPushMedalService = () => ({
  awardMedals: jest.fn().mockResolvedValue({
    success: true,
    newBalance: 100,
  }),
  deductMedals: jest.fn().mockResolvedValue({
    success: true,
    newBalance: 400, // Default to 400 to match test expectation (500 - 100)
  }),
  getMedalBalance: jest.fn().mockResolvedValue(500), // Start with 500 medals
  getMedalHistory: jest.fn(),
});

export const createMockDatabaseService = () => ({
  getAdminClient: jest.fn(),
  getClient: jest.fn(),
  getUserById: jest.fn(),
  executeQuery: jest.fn(),
  transaction: jest.fn(),
});

export const createMockDrawAlgorithm = () => ({
  draw: jest.fn(),
  drawMultiple: jest.fn(),
  calculateProbabilities: jest.fn(),
  validateDropRates: jest.fn().mockImplementation((items) => {
    // Validate drop rates - throw exception for negative values
    const hasNegative = items.some(item => item.dropRate < 0);
    if (hasNegative) {
      throw new Error('Invalid drop rate: negative values not allowed');
    }
  }),
  normalizeDropRates: jest.fn().mockImplementation((items) => {
    // Check for invalid drop rates first
    const hasNegative = items.some(item => item.dropRate < 0);
    if (hasNegative) {
      throw new Error('Invalid drop rate: negative values not allowed');
    }
    
    // Mock normalization behavior - convert percentages to decimals if > 1
    return items.map(item => ({
      ...item,
      dropRate: item.dropRate > 1 ? item.dropRate / 100 : item.dropRate
    }));
  }),
  executeDraws: jest.fn().mockImplementation((items, userId, drawCount) => {
    // Return the number of results based on drawCount
    return Promise.resolve(Array(drawCount).fill(null).map((_, index) => ({
      id: `result${index + 1}`,
      userId,
      gachaId: 'gacha1',
      itemId: 'item1',
      medalCost: 100,
      timestamp: new Date(),
    })));
  }),
});

export const createMockGachaRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn().mockResolvedValue(null), // Default to null, can be overridden in tests
  save: jest.fn().mockImplementation((data) => ({ id: 'gacha_123', ...data })), // Return with ID
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn().mockImplementation((data) => data), // Return the data as entity-like object
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getOne: jest.fn().mockResolvedValue(null),
  })),
});

export const createMockGachaItemRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn().mockImplementation((items) => 
    Array.isArray(items) 
      ? items.map((item, index) => ({ id: `item_${index}`, ...item }))
      : { id: 'item_1', ...items }
  ),
  update: jest.fn(),
  delete: jest.fn(),
  create: jest.fn().mockImplementation((data) => data),
});

export const createMockGachaResultRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn().mockImplementation((results) => {
    // Return the same array with added ids if not present
    return Array.isArray(results) 
      ? results.map((result, index) => ({ id: `result_${index}`, ...result }))
      : [{ id: 'result_1', ...results }];
  }),
  create: jest.fn().mockImplementation((data) => data),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  })),
});