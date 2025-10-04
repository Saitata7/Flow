const {
  createFlowEntry,
  getFlowEntry,
  getUserFlowEntries,
  updateFlowEntry,
  updateFlowStatus,
  deleteFlowEntry,
  getTodayEntries,
  bulkCreateEntries,
} = require('../controllers/flowEntries.controller');

const { requireAuth, requireOwnership } = require('../middleware/auth');
const { validateFlowEntryData } = require('../middleware/errorHandler');

const flowEntriesRoutes = async fastify => {
  // Create a new flow entry
  fastify.post(
    '/',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Create a new flow entry',
        tags: ['entries'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['flowId', 'date', 'symbol'],
          properties: {
            flowId: { type: 'string' },
            date: { type: 'string', format: 'date' },
            symbol: { type: 'string', enum: ['+', '-', '*', '/'] },
            emotion: { type: 'string' },
            moodScore: { type: 'integer', minimum: 1, maximum: 5 },
            note: { type: 'string', maxLength: 1000 },
            quantitative: {
              type: 'object',
              properties: {
                unitText: { type: 'string' },
                count: { type: 'number' },
              },
            },
            timebased: {
              type: 'object',
              properties: {
                totalDuration: { type: 'number' },
              },
            },
            device: { type: 'string', enum: ['mobile', 'web', 'api'] },
            geo: {
              type: 'object',
              properties: {
                lat: { type: 'number', minimum: -90, maximum: 90 },
                lng: { type: 'number', minimum: -180, maximum: 180 },
                accuracy: { type: 'number', minimum: 0 },
              },
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              errors: { type: 'array', items: { type: 'string' } },
            },
          },
          409: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    createFlowEntry
  );

  // Get user's flow entries
  fastify.get(
    '/',
    {
      preHandler: [requireAuth],
    },
    getUserFlowEntries
  );

  // Get today's entries
  fastify.get(
    '/today',
    {
      preHandler: [requireAuth],
      schema: {
        description: "Get today's flow entries",
        tags: ['entries'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array', items: { type: 'object' } },
              date: { type: 'string' },
            },
          },
        },
      },
    },
    getTodayEntries
  );

  // Get flow entry by ID
  fastify.get(
    '/:id',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get flow entry by ID',
        tags: ['entries'],
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
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    getFlowEntry
  );

  // Update flow status (mobile app compatible)
  fastify.put(
    '/status/:flowId/:date',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Update flow status for a specific date',
        tags: ['entries'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
            date: { type: 'string', format: 'date' },
          },
          required: ['flowId', 'date'],
        },
        body: {
          type: 'object',
          properties: {
            symbol: { type: 'string', enum: ['+', '-', '*', '/'] },
            emotion: { type: 'string' },
            moodScore: { type: 'integer', minimum: 1, maximum: 5 },
            note: { type: 'string', maxLength: 1000 },
            quantitative: {
              type: 'object',
              properties: {
                unitText: { type: 'string' },
                goal: { type: 'number' },
                count: { type: 'number' },
              },
            },
            timebased: {
              type: 'object',
              properties: {
                hours: { type: 'number' },
                minutes: { type: 'number' },
                seconds: { type: 'number' },
                totalDuration: { type: 'number' },
                pauses: { type: 'array' },
                pausesCount: { type: 'number' },
              },
            },
            device: { type: 'string', enum: ['mobile', 'web', 'api'] },
            geo: {
              type: 'object',
              properties: {
                lat: { type: 'number', minimum: -90, maximum: 90 },
                lng: { type: 'number', minimum: -180, maximum: 180 },
                accuracy: { type: 'number', minimum: 0 },
              },
            },
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
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateFlowStatus
  );

  // Update flow entry
  fastify.put(
    '/:id',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Update flow entry',
        tags: ['entries'],
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
            symbol: { type: 'string', enum: ['+', '-', '*', '/'] },
            emotion: { type: 'string' },
            moodScore: { type: 'integer', minimum: 1, maximum: 5 },
            note: { type: 'string', maxLength: 1000 },
            quantitative: {
              type: 'object',
              properties: {
                unitText: { type: 'string' },
                count: { type: 'number' },
              },
            },
            timebased: {
              type: 'object',
              properties: {
                totalDuration: { type: 'number' },
              },
            },
            device: { type: 'string', enum: ['mobile', 'web', 'api'] },
            geo: {
              type: 'object',
              properties: {
                lat: { type: 'number', minimum: -90, maximum: 90 },
                lng: { type: 'number', minimum: -180, maximum: 180 },
              },
            },
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
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateFlowEntry
  );

  // Delete flow entry
  fastify.delete(
    '/:id',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Delete flow entry',
        tags: ['entries'],
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
    deleteFlowEntry
  );

  // Bulk create entries
  fastify.post(
    '/bulk',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Bulk create flow entries',
        tags: ['entries'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['entries'],
          properties: {
            entries: {
              type: 'array',
              items: {
                type: 'object',
                required: ['flowId', 'date', 'symbol'],
                properties: {
                  flowId: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  symbol: { type: 'string', enum: ['+', '-', '*', '/'] },
                  emotion: { type: 'string' },
                  moodScore: { type: 'integer', minimum: 1, maximum: 5 },
                  note: { type: 'string', maxLength: 1000 },
                  quantitative: {
                    type: 'object',
                    properties: {
                      unitText: { type: 'string' },
                      count: { type: 'number' },
                    },
                  },
                  timebased: {
                    type: 'object',
                    properties: {
                      totalDuration: { type: 'number' },
                    },
                  },
                  device: { type: 'string', enum: ['mobile', 'web', 'api'] },
                  geo: {
                    type: 'object',
                    properties: {
                      lat: { type: 'number', minimum: -90, maximum: 90 },
                      lng: { type: 'number', minimum: -180, maximum: 180 },
                      accuracy: { type: 'number', minimum: 0 },
                    },
                  },
                },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  created: { type: 'array', items: { type: 'object' } },
                  errors: { type: 'array', items: { type: 'object' } },
                  summary: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      created: { type: 'integer' },
                      errors: { type: 'integer' },
                    },
                  },
                },
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    bulkCreateEntries
  );
};

module.exports = flowEntriesRoutes;
