const { createFlow, getFlow, getUserFlows } = require('../../src/controllers/flows.controller');

// Mock request and reply objects
const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: { id: 'user-123', role: 'user' },
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  server: {
    redis: {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    },
  },
  ...overrides,
});

const createMockReply = () => {
  const reply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return reply;
};

describe('Flows Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFlow', () => {
    it('should create a new flow successfully', async () => {
      const request = createMockRequest({
        body: {
          title: 'Test Flow',
          trackingType: 'Binary',
          frequency: 'Daily',
          cheatMode: false,
        },
      });
      const reply = createMockReply();

      await createFlow(request, reply);

      expect(reply.status).toHaveBeenCalledWith(201);
      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          title: 'Test Flow',
          trackingType: 'Binary',
          frequency: 'Daily',
          ownerId: 'user-123',
          schemaVersion: 1,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
        message: 'Flow created successfully',
      });
    });

    it('should cache flow in Redis', async () => {
      const request = createMockRequest({
        body: {
          title: 'Test Flow',
          trackingType: 'Binary',
          frequency: 'Daily',
        },
      });
      const reply = createMockReply();

      await createFlow(request, reply);

      expect(request.server.redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^flow:/),
        expect.any(Object),
        3600
      );
    });
  });

  describe('getFlow', () => {
    it('should return flow if found', async () => {
      const flowId = 'flow-123';
      const mockFlow = {
        id: flowId,
        title: 'Test Flow',
        ownerId: 'user-123',
        visibility: 'private',
      };

      const request = createMockRequest({
        params: { id: flowId },
        server: {
          redis: {
            get: jest.fn().mockResolvedValue(mockFlow),
          },
        },
      });
      const reply = createMockReply();

      await getFlow(request, reply);

      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data: mockFlow,
      });
    });

    it('should throw NotFoundError if flow not found', async () => {
      const request = createMockRequest({
        params: { id: 'non-existent' },
        server: {
          redis: {
            get: jest.fn().mockResolvedValue(null),
          },
        },
      });
      const reply = createMockReply();

      await expect(getFlow(request, reply)).rejects.toThrow('Flow not found');
    });
  });

  describe('getUserFlows', () => {
    it('should return paginated user flows', async () => {
      const request = createMockRequest({
        query: { page: 1, limit: 10 },
      });
      const reply = createMockReply();

      await getUserFlows(request, reply);

      expect(reply.send).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      });
    });
  });
});
