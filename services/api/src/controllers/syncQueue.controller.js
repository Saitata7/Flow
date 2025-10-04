const { SyncQueueService } = require('../services/syncQueueService');
const { BadRequestError, NotFoundError, InternalServerError } = require('../middleware/errorHandler');

const syncQueueService = new SyncQueueService();

/**
 * Sync Queue API Routes
 * Handles offline sync operations and conflict resolution
 */

// Start sync queue processing
const startSyncProcessing = async (request, reply) => {
  try {
    syncQueueService.startProcessing();
    
    return reply.send({
      success: true,
      message: 'Sync queue processing started',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Failed to start sync processing');
    throw new InternalServerError('Failed to start sync processing');
  }
};

// Stop sync queue processing
const stopSyncProcessing = async (request, reply) => {
  try {
    syncQueueService.stopProcessing();
    
    return reply.send({
      success: true,
      message: 'Sync queue processing stopped',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Failed to stop sync processing');
    throw new InternalServerError('Failed to stop sync processing');
  }
};

// Queue sync operation
const queueSyncOperation = async (request, reply) => {
  try {
    const { entityType, entityId, operation, payload, metadata } = request.body;
    const userId = request.user.id;

    // Validate required fields
    if (!entityType || !entityId || !operation || !payload) {
      throw new BadRequestError('Missing required fields: entityType, entityId, operation, payload');
    }

    // Validate operation type
    const validOperations = ['CREATE', 'UPDATE', 'DELETE'];
    if (!validOperations.includes(operation)) {
      throw new BadRequestError(`Invalid operation. Must be one of: ${validOperations.join(', ')}`);
    }

    // Validate entity type
    const validEntityTypes = ['flow', 'flow_entry', 'user_profile', 'user_settings'];
    if (!validEntityTypes.includes(entityType)) {
      throw new BadRequestError(`Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`);
    }

    const operationId = await syncQueueService.queueOperation(
      userId,
      entityType,
      entityId,
      operation,
      payload,
      metadata
    );

    return reply.send({
      success: true,
      data: {
        operationId,
        status: 'queued',
        timestamp: new Date().toISOString(),
      },
      message: 'Sync operation queued successfully',
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Failed to queue sync operation');
    throw error;
  }
};

// Get sync status for user
const getSyncStatus = async (request, reply) => {
  try {
    const userId = request.user.id;
    const status = await syncQueueService.getSyncStatus(userId);

    return reply.send({
      success: true,
      data: {
        ...status,
        isProcessing: syncQueueService.isProcessing,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Failed to get sync status');
    throw new InternalServerError('Failed to get sync status');
  }
};

// Get pending operations for user
const getPendingOperations = async (request, reply) => {
  try {
    const userId = request.user.id;
    const { limit = 100 } = request.query;

    const operations = await syncQueueService.getPendingOperations(userId, parseInt(limit));

    return reply.send({
      success: true,
      data: operations,
      meta: {
        count: operations.length,
        limit: parseInt(limit),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Failed to get pending operations');
    throw new InternalServerError('Failed to get pending operations');
  }
};

// Resolve conflicts
const resolveConflicts = async (request, reply) => {
  try {
    const { conflicts } = request.body;
    const userId = request.user.id;

    if (!conflicts || !Array.isArray(conflicts)) {
      throw new BadRequestError('Conflicts array is required');
    }

    const resolvedConflicts = await syncQueueService.resolveConflicts(userId, conflicts);

    return reply.send({
      success: true,
      data: resolvedConflicts,
      message: 'Conflicts resolved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Failed to resolve conflicts');
    throw error;
  }
};

// Clear old operations (admin only)
const clearOldOperations = async (request, reply) => {
  try {
    const { daysOld = 7 } = request.body;

    if (daysOld < 1 || daysOld > 365) {
      throw new BadRequestError('Days old must be between 1 and 365');
    }

    const clearedCount = await syncQueueService.clearOldOperations(daysOld);

    return reply.send({
      success: true,
      data: {
        clearedCount,
        daysOld,
      },
      message: `${clearedCount} old operations cleared`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Failed to clear old operations');
    throw error;
  }
};

// Force sync for user (admin only)
const forceSync = async (request, reply) => {
  try {
    const { userId } = request.params;

    if (!userId) {
      throw new BadRequestError('User ID is required');
    }

    // Process all pending operations for the user
    const pendingOps = await syncQueueService.getPendingOperations(userId, 1000);
    
    if (pendingOps.length === 0) {
      return reply.send({
        success: true,
        message: 'No pending operations to sync',
        data: { processedCount: 0 },
      });
    }

    // Process operations in batches
    let processedCount = 0;
    for (const operation of pendingOps) {
      try {
        await syncQueueService.processOperation(operation);
        processedCount++;
      } catch (error) {
        request.log.error({ error: error.message, operationId: operation.id }, 'Failed to process operation during force sync');
      }
    }

    return reply.send({
      success: true,
      data: {
        processedCount,
        totalPending: pendingOps.length,
      },
      message: `Force sync completed: ${processedCount}/${pendingOps.length} operations processed`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Failed to force sync');
    throw error;
  }
};

// Get sync queue statistics (admin only)
const getSyncStats = async (request, reply) => {
  try {
    const result = await request.server.db.query(`
      SELECT 
        COUNT(*) as total_operations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_operations,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_operations,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_operations,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_operations,
        COUNT(DISTINCT user_id) as active_users,
        AVG(retry_count) as avg_retry_count,
        MAX(created_at) as last_operation_time
      FROM sync_queue
    `);

    const stats = result.rows[0];

    return reply.send({
      success: true,
      data: {
        ...stats,
        isProcessing: syncQueueService.isProcessing,
        processingInterval: syncQueueService.processingInterval,
        maxRetries: syncQueueService.maxRetries,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    request.log.error({ error: error.message }, 'Failed to get sync stats');
    throw new InternalServerError('Failed to get sync statistics');
  }
};

module.exports = {
  startSyncProcessing,
  stopSyncProcessing,
  queueSyncOperation,
  getSyncStatus,
  getPendingOperations,
  resolveConflicts,
  clearOldOperations,
  forceSync,
  getSyncStats,
};
