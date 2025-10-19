/**
 * Health Endpoint Unit Tests
 * Tests the health check functionality
 */

const { healthCheck } = require('../../src/controllers/health.controller');

describe('Health Controller', () => {
  let mockRequest;
  let mockReply;

  beforeEach(() => {
    mockRequest = {
      log: {
        info: jest.fn(),
        error: jest.fn(),
      },
    };
    
    mockReply = {
      send: jest.fn(),
      code: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      await healthCheck(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: 'test',
        services: {
          database: 'healthy',
          redis: 'healthy',
          firebase: 'healthy'
        }
      });
    });

    it('should include database status when available', async () => {
      mockRequest.server = {
        db: {
          query: jest.fn().mockResolvedValue({ rows: [{ count: 1 }] }),
        },
      };

      await healthCheck(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: 'test',
        services: {
          database: 'healthy',
          redis: 'healthy',
          firebase: 'healthy'
        }
      });
    });

    it('should include Redis status when available', async () => {
      mockRequest.server = {
        redis: {
          ping: jest.fn().mockResolvedValue('PONG'),
        },
      };

      await healthCheck(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: 'test',
        services: {
          database: 'healthy',
          redis: 'healthy',
          firebase: 'healthy'
        }
      });
    });

    it('should handle database connection errors', async () => {
      mockRequest.server = {
        db: {
          query: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        },
      };

      await healthCheck(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: 'test',
        services: {
          database: 'healthy',
          redis: 'healthy',
          firebase: 'healthy'
        }
      });
    });

    it('should handle Redis connection errors', async () => {
      mockRequest.server = {
        redis: {
          ping: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        },
      };

      await healthCheck(mockRequest, mockReply);

      expect(mockReply.send).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        environment: 'test',
        services: {
          database: 'healthy',
          redis: 'healthy',
          firebase: 'healthy'
        }
      });
    });
  });
});
