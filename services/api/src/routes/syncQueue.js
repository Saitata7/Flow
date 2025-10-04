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

const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

/**
 * Sync Queue Routes
 * Handles offline sync operations and conflict resolution
 */

const syncQueueRoutes = async (fastify, options) => {
  // Admin routes for sync queue management
  fastify.post('/admin/sync/start', {
    preHandler: [authenticateToken, requireAdmin],
    handler: startSyncProcessing,
  });

  fastify.post('/admin/sync/stop', {
    preHandler: [authenticateToken, requireAdmin],
    handler: stopSyncProcessing,
  });

  fastify.get('/admin/sync/stats', {
    preHandler: [authenticateToken, requireAdmin],
    handler: getSyncStats,
  });

  fastify.post('/admin/sync/clear', {
    preHandler: [authenticateToken, requireAdmin],
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
    preHandler: [authenticateToken, requireAdmin],
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
  fastify.post('/sync/queue', {
    preHandler: [authenticateToken],
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

  fastify.get('/sync/status', {
    preHandler: [authenticateToken],
    handler: getSyncStatus,
  });

  fastify.get('/sync/pending', {
    preHandler: [authenticateToken],
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

  fastify.post('/sync/resolve-conflicts', {
    preHandler: [authenticateToken],
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
