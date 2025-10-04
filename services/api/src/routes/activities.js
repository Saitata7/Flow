// routes/activities.js
// Activity stats and analytics routes
// Handles activity cache, stats calculations, and analytics data

const {
  getActivityStats,
  getScoreboard,
  getAllStats,
  getEmotionalActivity,
  getFlowSummary,
  updateActivityCache,
  syncActivityCache,
  getCacheStatus,
  clearActivityCache,
} = require('../controllers/activities.controller');

const { requireAuth } = require('../middleware/auth');

const activitiesRoutes = async fastify => {
  // Get comprehensive activity stats
  fastify.get(
    '/stats',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get comprehensive activity statistics',
        tags: ['activities'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            timeframe: {
              type: 'string',
              enum: ['weekly', 'monthly', 'yearly', 'all'],
              default: 'all',
            },
            includeArchived: { type: 'boolean', default: false },
            includeDeleted: { type: 'boolean', default: false },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    getAllStats
  );

  // Get scoreboard for specific flow
  fastify.get(
    '/scoreboard/:flowId',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get scoreboard data for a specific flow',
        tags: ['activities'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
          },
          required: ['flowId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    getScoreboard
  );

  // Get activity stats for specific flow
  fastify.get(
    '/flow/:flowId',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get activity statistics for a specific flow',
        tags: ['activities'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
          },
          required: ['flowId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    getActivityStats
  );

  // Get emotional activity data
  fastify.get(
    '/emotions/:flowId',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get emotional activity distribution for a flow',
        tags: ['activities'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
          },
          required: ['flowId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    getEmotionalActivity
  );

  // Get flow summary
  fastify.get(
    '/summary/:flowId',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get comprehensive flow summary',
        tags: ['activities'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
          },
          required: ['flowId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    getFlowSummary
  );

  // Update activity cache
  fastify.put(
    '/cache/:flowId',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Update activity cache for a specific flow',
        tags: ['activities'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
          },
          required: ['flowId'],
        },
        body: {
          type: 'object',
          properties: {
            dayKey: { type: 'string' },
            entry: {
              type: 'object',
              additionalProperties: true,
            },
          },
          required: ['dayKey', 'entry'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    updateActivityCache
  );

  // Sync activity cache with backend
  fastify.post(
    '/cache/sync',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Sync activity cache with backend',
        tags: ['activities'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            activityCache: {
              type: 'object',
              additionalProperties: true,
            },
            metadata: {
              type: 'object',
              additionalProperties: true,
            },
            lastSync: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    syncActivityCache
  );

  // Get cache status
  fastify.get(
    '/cache/status',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get activity cache status',
        tags: ['activities'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true,
              },
            },
          },
        },
      },
    },
    getCacheStatus
  );

  // Clear activity cache
  fastify.delete(
    '/cache',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Clear activity cache',
        tags: ['activities'],
        security: [{ bearerAuth: [] }],
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
    clearActivityCache
  );
};

module.exports = activitiesRoutes;
