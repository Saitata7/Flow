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

  // Sync status endpoint for diagnostics
  fastify.get('/status', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { user } = request;
      const { query } = require('../db/config');
      
      try {
        // Get pending sync operations
        const pendingSync = await query(
          `SELECT COUNT(*) as count FROM sync_queue 
           WHERE user_id = $1 AND status = 'pending'`,
          [user.id]
        );
        
        // Get recent sync log entries
        const recentSyncs = await query(
          `SELECT idempotency_key, operation_type, created_at 
           FROM sync_log 
           WHERE user_id = $1 
           ORDER BY created_at DESC 
           LIMIT 10`,
          [user.id]
        );
        
        // Get active session info
        const activeSessions = await query(
          `SELECT COUNT(*) as count, MAX(expires_at) as latest_expiry 
           FROM sessions 
           WHERE user_id = $1 AND revoked = false AND expires_at > NOW()`,
          [user.id]
        );
        
        // Check Redis connection status
        const redisStatus = {
          available: !!request.server.redis,
          status: request.server.redis ? 'connected' : 'unavailable'
        };
        
        return reply.send({
          success: true,
          data: {
            pendingOperations: parseInt(pendingSync.rows[0]?.count || '0'),
            recentSyncs: recentSyncs.rows,
            activeSessions: {
              count: parseInt(activeSessions.rows[0]?.count || '0'),
              latestExpiry: activeSessions.rows[0]?.latest_expiry
            },
            redis: redisStatus
          },
          message: 'Sync status retrieved'
        });
      } catch (error) {
        console.error('Error getting sync status:', error);
        return reply.status(500).send({
          success: false,
          error: error.message
        });
      }
    }
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

  fastify.get('/status-old', {
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

  // Batch sync endpoint for queued operations
  fastify.post('/batch', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        properties: {
          operations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                idempotencyKey: {
                  type: 'string',
                  description: 'Unique key for idempotency'
                },
                opType: {
                  type: 'string',
                  enum: ['CREATE_FLOW', 'UPDATE_FLOW', 'DELETE_FLOW', 'CREATE_ENTRY', 'UPDATE_ENTRY', 'DELETE_ENTRY'],
                  description: 'Operation type'
                },
                payload: {
                  type: 'object',
                  description: 'Operation payload'
                },
                tempId: {
                  type: 'string',
                  description: 'Temporary ID from client'
                },
                storagePreference: {
                  type: 'string',
                  enum: ['local', 'cloud'],
                  description: 'Storage preference for flow operations'
                }
              },
              required: ['idempotencyKey', 'opType', 'payload']
            }
          }
        },
        required: ['operations']
      }
    },
    handler: async (request, reply) => {
      const { operations } = request.body;
      const { user } = request;
      const { query, transaction } = require('../db/config');
      const { FlowModel } = require('../db/models');
      
      const results = [];
      
      try {
        // Process operations in a transaction
        await transaction(async (client) => {
          for (const op of operations) {
            const { idempotencyKey, opType, payload, tempId, storagePreference } = op;
            
            // Check for existing idempotency
            const existingLog = await client.query(
              `SELECT * FROM sync_log WHERE idempotency_key = $1 AND user_id = $2`,
              [idempotencyKey, user.id]
            );
            
            if (existingLog.rows.length > 0) {
              // Return existing result
              results.push({
                tempId,
                serverId: existingLog.rows[0].response_payload?.id,
                status: 'duplicate',
                message: 'Operation already processed'
              });
              continue;
            }
            
            try {
              let result;
              
              // Handle different operation types
              if (opType === 'CREATE_FLOW') {
                if (storagePreference === 'local') {
                  result = { id: tempId, storagePreference: 'local' };
                } else {
                  // Create flow in database using direct query in transaction
                  const flowRecord = {
                    id: require('uuid').v4(),
                    title: payload.title,
                    description: payload.description,
                    tracking_type: payload.trackingType,
                    frequency: payload.frequency,
                    owner_id: user.id,
                    storage_preference: 'cloud',
                    schema_version: 2
                  };
                  result = await FlowModel.create(flowRecord);
                }
              } else if (opType === 'UPDATE_FLOW') {
                result = await FlowModel.update(payload.id, payload);
              } else if (opType === 'DELETE_FLOW') {
                result = await FlowModel.softDelete(payload.id);
              } else {
                throw new Error(`Unsupported operation type: ${opType}`);
              }
              
              // Log successful operation
              await client.query(
                `INSERT INTO sync_log (user_id, idempotency_key, operation_type, request_payload, response_payload) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [user.id, idempotencyKey, opType, JSON.stringify(payload), JSON.stringify(result)]
              );
              
              results.push({
                tempId,
                serverId: result?.id,
                status: 'success'
              });
              
            } catch (opError) {
              console.error('Operation failed:', opError);
              results.push({
                tempId,
                serverId: null,
                status: 'error',
                error: opError.message
              });
            }
          }
        });
        
        return reply.send({
          success: true,
          data: { results },
          message: `Processed ${results.length} operations`
        });
        
      } catch (error) {
        console.error('Batch sync failed:', error);
        return reply.status(500).send({
          success: false,
          error: error.message,
          data: { results }
        });
      }
    }
  });
};

module.exports = syncQueueRoutes;
