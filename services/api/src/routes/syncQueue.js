const {
  startSyncProcessing,
  stopSyncProcessing,
  queueSyncOperation,
  getSyncStatus,
  getPendingOperations,
  resolveConflicts,
  clearOldOperations,
  forceSync,
  getSyncStats,
} = require('../controllers/syncQueue.controller');

const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

/**
 * Sync Queue Routes
 * Handles offline sync operations and conflict resolution
 */

const syncQueueRoutes = async (fastify, options) => {
  // Admin routes for sync queue management
  fastify.post('/admin/sync/start', {
    preHandler: [requireAuth, requireAdmin],
    handler: startSyncProcessing,
  });

  fastify.post('/admin/sync/stop', {
    preHandler: [requireAuth, requireAdmin],
    handler: stopSyncProcessing,
  });

  fastify.get('/admin/sync/stats', {
    preHandler: [requireAuth, requireAdmin],
    handler: getSyncStats,
  });

  fastify.post('/admin/sync/clear', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      body: {
        type: 'object',
        properties: {
          daysOld: {
            type: 'integer',
            minimum: 1,
            maximum: 365,
            default: 7,
          },
        },
      },
    },
    handler: clearOldOperations,
  });

  fastify.post('/admin/sync/force/:userId', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      params: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
          },
        },
        required: ['userId'],
      },
    },
    handler: forceSync,
  });

  // User routes for sync operations
  fastify.post('/queue', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            enum: ['flow', 'flow_entry', 'user_profile', 'user_settings'],
          },
          entityId: {
            type: 'string',
          },
          operation: {
            type: 'string',
            enum: ['CREATE', 'UPDATE', 'DELETE'],
          },
          payload: {
            type: 'object',
          },
          metadata: {
            type: 'object',
            default: {},
          },
        },
        required: ['entityType', 'entityId', 'operation', 'payload'],
      },
    },
    handler: queueSyncOperation,
  });

  fastify.get('/status', {
    preHandler: [requireAuth],
    handler: getSyncStatus,
  });

  fastify.get('/pending', {
    preHandler: [requireAuth],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 1000,
            default: 100,
          },
        },
      },
    },
    handler: getPendingOperations,
  });

  fastify.post('/resolve-conflicts', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        properties: {
          conflicts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                entityType: {
                  type: 'string',
                  enum: ['flow', 'flow_entry', 'user_profile', 'user_settings'],
                },
                entityId: {
                  type: 'string',
                },
                localData: {
                  type: 'object',
                },
                serverData: {
                  type: 'object',
                },
                conflictType: {
                  type: 'string',
                  enum: ['timestamp_conflict', 'data_conflict', 'deletion_conflict'],
                },
              },
              required: ['entityType', 'entityId', 'localData', 'serverData', 'conflictType'],
            },
          },
        },
        required: ['conflicts'],
      },
    },
    handler: resolveConflicts,
  });
};

module.exports = syncQueueRoutes;
