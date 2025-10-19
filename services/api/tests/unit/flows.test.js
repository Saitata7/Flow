const { createFlow, getFlow, getUserFlows } = require('../../src/controllers/flows.controller');
const { FlowModel } = require('../../src/db/models');

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
      const mockFlow = {
        id: 'flow-123',
        title: 'Test Flow',
        tracking_type: 'Binary',
        frequency: 'Daily',
        owner_id: 'user-123',
        schema_version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Mock FlowModel.create
      FlowModel.create = jest.fn().mockResolvedValue(mockFlow);

      const request = createMockRequest({
        user: { id: 'user-123' },
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
        data: mockFlow,
        message: 'Flow created successfully',
      });
    });

    it('should cache flow in Redis', async () => {
      const mockFlow = {
        id: 'flow-123',
        title: 'Test Flow',
        tracking_type: 'Binary',
        frequency: 'Daily',
        owner_id: 'user-123',
      };

      // Mock FlowModel.create
      FlowModel.create = jest.fn().mockResolvedValue(mockFlow);

      const request = createMockRequest({
        user: { id: 'user-123' },
        body: {
          title: 'Test Flow',
          trackingType: 'Binary',
          frequency: 'Daily',
        },
        server: {
          redis: {
            set: jest.fn().mockResolvedValue(),
          },
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
        owner_id: 'user-123',
        visibility: 'private',
      };

      const request = createMockRequest({
        params: { id: flowId },
        user: { id: 'user-123', role: 'user' },
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
      // Mock FlowModel.findById to return null
      FlowModel.findById = jest.fn().mockResolvedValue(null);

      const request = createMockRequest({
        params: { id: 'non-existent' },
        user: { id: 'user-123', role: 'user' },
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
      const mockFlows = [
        {
          id: 'flow-1',
          title: 'Test Flow 1',
          owner_id: 'user-123',
          status: {},
        },
        {
          id: 'flow-2',
          title: 'Test Flow 2',
          owner_id: 'user-123',
          status: {},
        },
      ];

      // Mock FlowModel.findByUserIdWithStatus
      FlowModel.findByUserIdWithStatus = jest.fn().mockResolvedValue(mockFlows);

      const request = createMockRequest({
        query: { page: 1, limit: 10 },
        user: { id: 'user-123' },
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
