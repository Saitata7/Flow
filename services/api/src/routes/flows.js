const {
  createFlow,
  getFlow,
  getUserFlows,
  updateFlow,
  archiveFlow,
  deleteFlow,
  searchFlows,
  getFlowStats,
} = require('../controllers/flows.controller');

const { authenticateSession } = require('../middleware/sessionAuth');
const { validateFlowData } = require('../middleware/errorHandler');

const flowsRoutes = async fastify => {
  // Debug endpoint to check specific user by email
  fastify.get('/debug-user/:email', async (request, reply) => {
    const { FlowModel, UserModel } = require('../db/models');
    try {
      const email = request.params.email;
      console.log('Debug endpoint: Checking user with email:', email);
      
      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return reply.send({
          success: false,
          message: `User with email ${email} not found`,
          data: null
        });
      }
      
      console.log('Debug endpoint: Found user:', user.id);
      
      // Get flows for this user
      const flows = await FlowModel.findByUserIdWithStatus(user.id);
      
      const debugInfo = {
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          created_at: user.created_at
        },
        totalFlows: flows.length,
        flows: flows.map(f => ({
          id: f.id,
          title: f.title,
          description: f.description,
          created_at: f.created_at,
          status: f.status
        }))
      };

      return reply.send({
        success: true,
        data: debugInfo,
        message: `Debug endpoint - user ${email} data`,
      });
    } catch (error) {
      console.error('Debug user endpoint error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Create a new flow
  fastify.post(
    '/',
    {
      preHandler: [authenticateSession],
    },
    createFlow
  );

  // Test endpoint to debug data serialization
  fastify.get('/test', async (request, reply) => {
    const { FlowModel } = require('../db/models');
    try {
      // Use the dev user ID directly
      const flows = await FlowModel.findByUserIdWithStatus('550e8400-e29b-41d4-a716-446655440000');
      console.log('Test endpoint - raw flows:', flows.length);
      console.log('Test endpoint - first flow:', flows[0]);

      return reply.send({
        success: true,
        data: flows,
        message: 'Test endpoint working',
      });
    } catch (error) {
      console.error('Test endpoint error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Test endpoint to create flow without authentication (for testing)
  fastify.post('/test-create', async (request, reply) => {
    const { FlowModel } = require('../db/models');
    try {
      const flowData = {
        ...request.body,
        owner_id: 'd8043270-9c85-420b-a143-e93e34715a99', // saitata7@gmail.com user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Test create endpoint - creating flow:', flowData);
      const flow = await FlowModel.create(flowData);
      console.log('Test create endpoint - flow created:', flow);

      return reply.send({
        success: true,
        data: flow,
        message: 'Test flow created successfully',
      });
    } catch (error) {
      console.error('Test create endpoint error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // Get user's flows
  fastify.get(
    '/',
    {
      preHandler: [authenticateSession],
    },
    getUserFlows
  );

  // Get flow by ID
  fastify.get(
    '/:id',
    {
      preHandler: [authenticateSession],
      schema: {
        description: 'Get a specific flow by ID',
        tags: ['flows'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    getFlow
  );

  // Update flow
  fastify.put(
    '/:id',
    {
      preHandler: [authenticateSession, validateFlowData],
      schema: {
        description: 'Update a specific flow by ID',
        tags: ['flows'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 100 },
            description: { type: 'string', maxLength: 500 },
            trackingType: { type: 'string', enum: ['Binary', 'Quantitative', 'Time-based'] },
            frequency: { type: 'string', enum: ['Daily', 'Weekly', 'Monthly'] },
            everyDay: { type: 'boolean' },
            daysOfWeek: {
              type: 'array',
              items: { type: 'string', enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
            },
            reminderTime: { type: 'string', format: 'date-time' },
            reminderLevel: { type: 'string', enum: ['1', '2', '3'] },
            cheatMode: { type: 'boolean' },
            planId: { type: 'string' },
            goal: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['number', 'duration', 'count'] },
                value: { type: 'number' },
                unit: { type: 'string' },
              },
            },
            progressMode: { type: 'string', enum: ['sum', 'average', 'latest'] },
            tags: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 10 },
            visibility: { type: 'string', enum: ['private', 'friends', 'public'] },
            storagePreference: { type: 'string', enum: ['local', 'cloud'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateFlow
  );

  // Archive flow
  fastify.patch(
    '/:id/archive',
    {
      preHandler: [authenticateSession],
      schema: {
        description: 'Archive a specific flow by ID',
        tags: ['flows'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    archiveFlow
  );

  // Delete flow
  fastify.delete(
    '/:id',
    {
      preHandler: [authenticateSession],
      schema: {
        description: 'Delete a specific flow by ID',
        tags: ['flows'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    deleteFlow
  );

  // Search flows
  fastify.get(
    '/search',
    {
      preHandler: [authenticateSession],
      schema: {
        description: 'Search flows by title or description',
        tags: ['flows'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string', minLength: 1 },
            page: { type: 'integer', minimum: 1, default: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          required: ['q'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: { type: 'object' },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  total: { type: 'integer' },
                  totalPages: { type: 'integer' },
                },
              },
            },
          },
        },
      },
    },
    searchFlows
  );

  // Get flow stats
  fastify.get(
    '/:id/stats',
    {
      preHandler: [authenticateSession],
      schema: {
        description: 'Get statistics for a specific flow',
        tags: ['flows'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            timeframe: { type: 'string', enum: ['week', 'month', 'year', 'all'], default: 'all' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    getFlowStats
  );
};

module.exports = flowsRoutes;
