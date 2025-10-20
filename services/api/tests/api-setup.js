/**
 * API-specific test setup
 * Additional setup for API service tests
 */

// Mock database connections
jest.mock('../src/db/config', () => ({
  testConnection: jest.fn().mockResolvedValue(true),
  closePool: jest.fn().mockResolvedValue(),
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(),
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
  },
  query: jest.fn().mockResolvedValue({ rows: [] }),
  transaction: jest.fn().mockImplementation(async (callback) => {
    const mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    return await callback(mockClient);
  }),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'healthy',
    connected: true,
    poolSize: 0,
    idleConnections: 0,
    waitingClients: 0,
  }),
  getPoolStats: jest.fn().mockReturnValue({
    totalCount: 0,
    idleCount: 0,
    waitingCount: 0,
    config: {
      max: 20,
      min: 2,
      idleTimeoutMillis: 10000,
    },
  }),
}));

// Mock Redis connections
jest.mock('../src/redis/client', () => ({
  RedisClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn().mockReturnValue({
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
      }),
      listUsers: jest.fn().mockResolvedValue({
        users: [],
      }),
    }),
  }),
  credential: {
    cert: jest.fn().mockReturnValue({}),
  },
}));

// Mock external API calls
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
});

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    email: 'test@example.com',
  }),
  decode: jest.fn().mockReturnValue({
    userId: 'test-user-id',
    email: 'test@example.com',
  }),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
  validate: jest.fn().mockReturnValue(true),
}));

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Setup test database
beforeAll(async () => {
  // Initialize test database if needed
  console.log('Setting up API test environment...');
});

afterAll(async () => {
  // Cleanup test database
  console.log('Cleaning up API test environment...');
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
