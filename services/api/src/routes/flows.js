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

const { requireAuth, requireOwnership } = require('../middleware/auth');
const { validateFlowData } = require('../middleware/errorHandler');

const flowsRoutes = async (fastify) => {
  // Create a new flow
  fastify.post('/', {
    preHandler: [requireAuth, validateFlowData],
    schema: {
      description: 'Create a new flow',
      tags: ['flows'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'trackingType', 'frequency'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          trackingType: { type: 'string', enum: ['Binary', 'Quantitative', 'Time-based'] },
          frequency: { type: 'string', enum: ['Daily', 'Weekly', 'Monthly'] },
          everyDay: { type: 'boolean' },
          daysOfWeek: {
            type: 'array',
            items: { type: 'string', enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
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
              unit: { type: 'string' }
            }
          },
          progressMode: { type: 'string', enum: ['sum', 'average', 'latest'] },
          tags: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 10 },
          visibility: { type: 'string', enum: ['private', 'friends', 'public'] }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, createFlow);

  // Get user's flows
  fastify.get('/', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get user\'s flows',
      tags: ['flows'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          archived: { type: 'boolean', default: false },
          visibility: { type: 'string', enum: ['private', 'friends', 'public'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, getUserFlows);

  // Search flows
  fastify.get('/search', {
    preHandler: [requireAuth],
    schema: {
      description: 'Search flows',
      tags: ['flows'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Search query' },
          tags: { type: 'array', items: { type: 'string' } },
          trackingType: { type: 'string', enum: ['Binary', 'Quantitative', 'Time-based'] },
          visibility: { type: 'string', enum: ['private', 'friends', 'public'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, searchFlows);

  // Get flow by ID
  fastify.get('/:id', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get flow by ID',
      tags: ['flows'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, getFlow);

  // Update flow
  fastify.put('/:id', {
    preHandler: [requireAuth, requireOwnership('ownerId'), validateFlowData],
    schema: {
      description: 'Update flow',
      tags: ['flows'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
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
            items: { type: 'string', enum: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }
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
              unit: { type: 'string' }
            }
          },
          progressMode: { type: 'string', enum: ['sum', 'average', 'latest'] },
          tags: { type: 'array', items: { type: 'string', maxLength: 30 }, maxItems: 10 },
          visibility: { type: 'string', enum: ['private', 'friends', 'public'] },
          archived: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, updateFlow);

  // Archive flow
  fastify.patch('/:id/archive', {
    preHandler: [requireAuth, requireOwnership('ownerId')],
    schema: {
      description: 'Archive flow',
      tags: ['flows'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, archiveFlow);

  // Delete flow (soft delete)
  fastify.delete('/:id', {
    preHandler: [requireAuth, requireOwnership('ownerId')],
    schema: {
      description: 'Delete flow',
      tags: ['flows'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, deleteFlow);

  // Get flow statistics
  fastify.get('/:id/stats', {
    preHandler: [requireAuth],
    schema: {
      description: 'Get flow statistics',
      tags: ['flows'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalEntries: { type: 'integer' },
                completedEntries: { type: 'integer' },
                skippedEntries: { type: 'integer' },
                bonusEntries: { type: 'integer' },
                currentStreak: { type: 'integer' },
                longestStreak: { type: 'integer' },
                averageMoodScore: { type: 'number' },
                completionRate: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, getFlowStats);
};

module.exports = { flowsRoutes };
