const {
  getUserStats,
  getLeaderboard,
  getFlowStats,
  getTrends,
  getGlobalStats,
} = require('../controllers/stats.controller');

const { requireAuth, requireRole } = require('../middleware/auth');

const statsRoutes = async fastify => {
  // Get user statistics
  fastify.get(
    '/users/:userId',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get user statistics',
        tags: ['stats'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  totalFlows: { type: 'integer' },
                  totalEntries: { type: 'integer' },
                  completedEntries: { type: 'integer' },
                  currentStreak: { type: 'integer' },
                  longestStreak: { type: 'integer' },
                  completionRate: { type: 'number' },
                  joinDate: { type: 'string' },
                  username: { type: 'string' },
                  displayName: { type: 'string' },
                },
              },
            },
          },
          403: {
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
    getUserStats
  );

  // Get leaderboard
  fastify.get(
    '/leaderboard',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get leaderboard',
        tags: ['stats'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['streak', 'completion'], default: 'streak' },
            timeframe: { type: 'string', enum: ['week', 'month', 'year'], default: 'month' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array', items: { type: 'object' } },
              meta: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  timeframe: { type: 'string' },
                  limit: { type: 'integer' },
                  generatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    getLeaderboard
  );

  // Get flow statistics
  fastify.get(
    '/flows/:flowId',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get flow statistics',
        tags: ['stats'],
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
                properties: {
                  currentStreak: { type: 'integer' },
                  longestStreak: { type: 'integer' },
                  completedEntries: { type: 'integer' },
                  totalEntries: { type: 'integer' },
                  skippedEntries: { type: 'integer' },
                  bonusEntries: { type: 'integer' },
                  averageMoodScore: { type: 'number' },
                  completionRate: { type: 'number' },
                },
              },
            },
          },
          403: {
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
    getFlowStats
  );

  // Get trends data
  fastify.get(
    '/trends',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get trends data',
        tags: ['stats'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            flowId: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    flowId: { type: 'string' },
                    flowTitle: { type: 'string' },
                    flowType: { type: 'string' },
                    dailyStats: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          date: { type: 'string' },
                          completed: { type: 'integer' },
                          total: { type: 'integer' },
                          completionRate: { type: 'number' },
                          averageMood: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  startDate: { type: 'string' },
                  endDate: { type: 'string' },
                  flowCount: { type: 'integer' },
                  generatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    getTrends
  );

  // Get global statistics (admin only)
  fastify.get(
    '/global',
    {
      preHandler: [requireAuth, requireRole(['admin'])],
      schema: {
        description: 'Get global statistics (admin only)',
        tags: ['stats'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  totalUsers: { type: 'integer' },
                  totalFlows: { type: 'integer' },
                  totalEntries: { type: 'integer' },
                  activeUsers: { type: 'integer' },
                  averageCompletionRate: { type: 'number' },
                  topFlows: { type: 'array', items: { type: 'object' } },
                  recentActivity: { type: 'array', items: { type: 'object' } },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  generatedAt: { type: 'string' },
                  cached: { type: 'boolean' },
                },
              },
            },
          },
          403: {
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
    getGlobalStats
  );
};

module.exports = statsRoutes;
