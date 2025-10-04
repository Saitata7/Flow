const { query, transaction } = require('../db/config');
const { v4: uuidv4 } = require('uuid');

/**
 * Sync Queue Service
 * Handles offline sync operations with conflict resolution and retry mechanisms
 */
class SyncQueueService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay
    this.maxRetryDelay = 30000; // 30 seconds max delay
    this.batchSize = 50;
    this.processingInterval = 5000; // 5 seconds
    this.isProcessing = false;
    this.processingTimer = null;
  }

  /**
   * Start the sync queue processor
   */
  startProcessing() {
    if (this.processingTimer) {
      return;
    }

    console.log('🔄 Starting sync queue processor...');
    this.processingTimer = setInterval(() => {
      this.processSyncQueue();
    }, this.processingInterval);
  }

  /**
   * Stop the sync queue processor
   */
  stopProcessing() {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = null;
      console.log('⏹️ Sync queue processor stopped');
    }
  }

  /**
   * Add operation to sync queue
   */
  async queueOperation(userId, entityType, entityId, operation, payload, metadata = {}) {
    try {
      const syncOperation = {
        id: uuidv4(),
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        operation: operation, // CREATE, UPDATE, DELETE
        payload: JSON.stringify(payload),
        metadata: JSON.stringify(metadata),
        status: 'pending',
        retry_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await query(
        `INSERT INTO sync_queue (id, user_id, entity_type, entity_id, operation, payload, metadata, status, retry_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          syncOperation.id,
          syncOperation.user_id,
          syncOperation.entity_type,
          syncOperation.entity_id,
          syncOperation.operation,
          syncOperation.payload,
          syncOperation.metadata,
          syncOperation.status,
          syncOperation.retry_count,
          syncOperation.created_at,
          syncOperation.updated_at,
        ]
      );

      console.log(`📝 Queued sync operation: ${operation} ${entityType}:${entityId} for user ${userId}`);
      return syncOperation.id;
    } catch (error) {
      console.error('❌ Failed to queue sync operation:', error);
      throw error;
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending operations
      const pendingOps = await query(
        `SELECT * FROM sync_queue 
         WHERE status = 'pending' 
         ORDER BY created_at ASC 
         LIMIT $1`,
        [this.batchSize]
      );

      if (pendingOps.rows.length === 0) {
        return;
      }

      console.log(`🔄 Processing ${pendingOps.rows.length} sync operations...`);

      for (const operation of pendingOps.rows) {
        await this.processOperation(operation);
      }
    } catch (error) {
      console.error('❌ Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual sync operation
   */
  async processOperation(operation) {
    try {
      // Mark as processing
      await this.updateOperationStatus(operation.id, 'processing');

      // Execute the operation based on entity type
      let result;
      switch (operation.entity_type) {
        case 'flow':
          result = await this.processFlowOperation(operation);
          break;
        case 'flow_entry':
          result = await this.processFlowEntryOperation(operation);
          break;
        case 'user_profile':
          result = await this.processUserProfileOperation(operation);
          break;
        case 'user_settings':
          result = await this.processUserSettingsOperation(operation);
          break;
        default:
          throw new Error(`Unknown entity type: ${operation.entity_type}`);
      }

      // Mark as completed
      await this.updateOperationStatus(operation.id, 'completed', result);
      console.log(`✅ Completed sync operation: ${operation.operation} ${operation.entity_type}:${operation.entity_id}`);

    } catch (error) {
      console.error(`❌ Failed to process sync operation ${operation.id}:`, error);
      await this.handleOperationError(operation, error);
    }
  }

  /**
   * Process flow operations
   */
  async processFlowOperation(operation) {
    const payload = JSON.parse(operation.payload);
    const metadata = JSON.parse(operation.metadata || '{}');

    switch (operation.operation) {
      case 'CREATE':
        return await this.createFlow(operation.user_id, payload, metadata);
      case 'UPDATE':
        return await this.updateFlow(operation.entity_id, payload, metadata);
      case 'DELETE':
        return await this.deleteFlow(operation.entity_id, metadata);
      default:
        throw new Error(`Unknown flow operation: ${operation.operation}`);
    }
  }

  /**
   * Process flow entry operations
   */
  async processFlowEntryOperation(operation) {
    const payload = JSON.parse(operation.payload);
    const metadata = JSON.parse(operation.metadata || '{}');

    switch (operation.operation) {
      case 'CREATE':
        return await this.createFlowEntry(operation.user_id, payload, metadata);
      case 'UPDATE':
        return await this.updateFlowEntry(operation.entity_id, payload, metadata);
      case 'DELETE':
        return await this.deleteFlowEntry(operation.entity_id, metadata);
      default:
        throw new Error(`Unknown flow entry operation: ${operation.operation}`);
    }
  }

  /**
   * Process user profile operations
   */
  async processUserProfileOperation(operation) {
    const payload = JSON.parse(operation.payload);
    const metadata = JSON.parse(operation.metadata || '{}');

    switch (operation.operation) {
      case 'CREATE':
        return await this.createUserProfile(operation.user_id, payload, metadata);
      case 'UPDATE':
        return await this.updateUserProfile(operation.user_id, payload, metadata);
      default:
        throw new Error(`Unknown user profile operation: ${operation.operation}`);
    }
  }

  /**
   * Process user settings operations
   */
  async processUserSettingsOperation(operation) {
    const payload = JSON.parse(operation.payload);
    const metadata = JSON.parse(operation.metadata || '{}');

    switch (operation.operation) {
      case 'CREATE':
        return await this.createUserSettings(operation.user_id, payload, metadata);
      case 'UPDATE':
        return await this.updateUserSettings(operation.user_id, payload, metadata);
      default:
        throw new Error(`Unknown user settings operation: ${operation.operation}`);
    }
  }

  /**
   * Handle operation errors with retry logic
   */
  async handleOperationError(operation, error) {
    const retryCount = operation.retry_count + 1;

    if (retryCount >= this.maxRetries) {
      // Max retries exceeded, mark as failed
      await this.updateOperationStatus(operation.id, 'failed', { error: error.message });
      console.log(`❌ Sync operation ${operation.id} failed after ${retryCount} retries`);
    } else {
      // Calculate exponential backoff delay
      const delay = Math.min(this.retryDelay * Math.pow(2, retryCount - 1), this.maxRetryDelay);
      
      // Schedule retry
      await this.updateOperationStatus(operation.id, 'pending', null, retryCount);
      
      console.log(`🔄 Scheduling retry for operation ${operation.id} in ${delay}ms (attempt ${retryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.processOperation(operation);
      }, delay);
    }
  }

  /**
   * Update operation status
   */
  async updateOperationStatus(operationId, status, result = null, retryCount = null) {
    const updates = ['status = $2', 'updated_at = NOW()'];
    const params = [operationId, status];

    if (result !== null) {
      updates.push('result = $3');
      params.push(JSON.stringify(result));
    }

    if (retryCount !== null) {
      updates.push('retry_count = $' + (params.length + 1));
      params.push(retryCount);
    }

    await query(
      `UPDATE sync_queue SET ${updates.join(', ')} WHERE id = $1`,
      params
    );
  }

  /**
   * Get sync queue status for a user
   */
  async getSyncStatus(userId) {
    try {
      const result = await query(
        `SELECT 
           COUNT(*) as total,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
           COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
           COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
         FROM sync_queue 
         WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      console.error('❌ Failed to get sync status:', error);
      throw error;
    }
  }

  /**
   * Get pending operations for a user
   */
  async getPendingOperations(userId, limit = 100) {
    try {
      const result = await query(
        `SELECT * FROM sync_queue 
         WHERE user_id = $1 AND status = 'pending'
         ORDER BY created_at ASC 
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get pending operations:', error);
      throw error;
    }
  }

  /**
   * Clear completed operations older than specified days
   */
  async clearOldOperations(daysOld = 7) {
    try {
      const result = await query(
        `DELETE FROM sync_queue 
         WHERE status IN ('completed', 'failed') 
         AND updated_at < NOW() - INTERVAL '${daysOld} days'`,
        []
      );

      console.log(`🗑️ Cleared ${result.rowCount} old sync operations`);
      return result.rowCount;
    } catch (error) {
      console.error('❌ Failed to clear old operations:', error);
      throw error;
    }
  }

  /**
   * Resolve conflicts between local and server data
   */
  async resolveConflicts(userId, conflicts) {
    try {
      const resolvedConflicts = [];

      for (const conflict of conflicts) {
        const resolution = await this.resolveConflict(conflict);
        resolvedConflicts.push(resolution);
      }

      return resolvedConflicts;
    } catch (error) {
      console.error('❌ Failed to resolve conflicts:', error);
      throw error;
    }
  }

  /**
   * Resolve individual conflict
   */
  async resolveConflict(conflict) {
    const { entityType, entityId, localData, serverData, conflictType } = conflict;

    switch (conflictType) {
      case 'timestamp_conflict':
        // Server wins for timestamp conflicts
        return {
          ...conflict,
          resolution: 'server',
          resolvedData: serverData,
        };

      case 'data_conflict':
        // Merge data based on entity type
        return {
          ...conflict,
          resolution: 'merge',
          resolvedData: await this.mergeData(entityType, localData, serverData),
        };

      case 'deletion_conflict':
        // Server wins for deletion conflicts
        return {
          ...conflict,
          resolution: 'server',
          resolvedData: serverData,
        };

      default:
        throw new Error(`Unknown conflict type: ${conflictType}`);
    }
  }

  /**
   * Merge data based on entity type
   */
  async mergeData(entityType, localData, serverData) {
    switch (entityType) {
      case 'flow':
        return this.mergeFlowData(localData, serverData);
      case 'flow_entry':
        return this.mergeFlowEntryData(localData, serverData);
      case 'user_profile':
        return this.mergeUserProfileData(localData, serverData);
      case 'user_settings':
        return this.mergeUserSettingsData(localData, serverData);
      default:
        // Default merge: server wins
        return serverData;
    }
  }

  /**
   * Merge flow data
   */
  mergeFlowData(localData, serverData) {
    return {
      ...serverData,
      // Keep local changes for certain fields
      name: localData.name || serverData.name,
      description: localData.description || serverData.description,
      // Server wins for timestamps and counters
      updated_at: serverData.updated_at,
      streak_count: serverData.streak_count,
    };
  }

  /**
   * Merge flow entry data
   */
  mergeFlowEntryData(localData, serverData) {
    return {
      ...serverData,
      // Keep local status if it's more recent
      status: localData.updated_at > serverData.updated_at ? localData.status : serverData.status,
      // Merge notes
      note: localData.note || serverData.note,
      // Server wins for timestamps
      updated_at: serverData.updated_at,
    };
  }

  /**
   * Merge user profile data
   */
  mergeUserProfileData(localData, serverData) {
    return {
      ...serverData,
      // Keep local preferences
      display_name: localData.display_name || serverData.display_name,
      profile_theme: localData.profile_theme || serverData.profile_theme,
      // Server wins for timestamps
      updated_at: serverData.updated_at,
    };
  }

  /**
   * Merge user settings data
   */
  mergeUserSettingsData(localData, serverData) {
    return {
      ...serverData,
      // Merge settings objects
      settings: {
        ...serverData.settings,
        ...localData.settings,
      },
      // Server wins for timestamps
      updated_at: serverData.updated_at,
    };
  }

  // CRUD operation implementations (simplified)
  async createFlow(userId, payload, metadata) {
    // Implementation would call the actual flow creation logic
    console.log(`Creating flow for user ${userId}:`, payload);
    return { id: payload.id, status: 'created' };
  }

  async updateFlow(flowId, payload, metadata) {
    // Implementation would call the actual flow update logic
    console.log(`Updating flow ${flowId}:`, payload);
    return { id: flowId, status: 'updated' };
  }

  async deleteFlow(flowId, metadata) {
    // Implementation would call the actual flow deletion logic
    console.log(`Deleting flow ${flowId}`);
    return { id: flowId, status: 'deleted' };
  }

  async createFlowEntry(userId, payload, metadata) {
    // Implementation would call the actual flow entry creation logic
    console.log(`Creating flow entry for user ${userId}:`, payload);
    return { id: payload.id, status: 'created' };
  }

  async updateFlowEntry(entryId, payload, metadata) {
    // Implementation would call the actual flow entry update logic
    console.log(`Updating flow entry ${entryId}:`, payload);
    return { id: entryId, status: 'updated' };
  }

  async deleteFlowEntry(entryId, metadata) {
    // Implementation would call the actual flow entry deletion logic
    console.log(`Deleting flow entry ${entryId}`);
    return { id: entryId, status: 'deleted' };
  }

  async createUserProfile(userId, payload, metadata) {
    // Implementation would call the actual user profile creation logic
    console.log(`Creating user profile for user ${userId}:`, payload);
    return { id: userId, status: 'created' };
  }

  async updateUserProfile(userId, payload, metadata) {
    // Implementation would call the actual user profile update logic
    console.log(`Updating user profile for user ${userId}:`, payload);
    return { id: userId, status: 'updated' };
  }

  async createUserSettings(userId, payload, metadata) {
    // Implementation would call the actual user settings creation logic
    console.log(`Creating user settings for user ${userId}:`, payload);
    return { id: userId, status: 'created' };
  }

  async updateUserSettings(userId, payload, metadata) {
    // Implementation would call the actual user settings update logic
    console.log(`Updating user settings for user ${userId}:`, payload);
    return { id: userId, status: 'updated' };
  }
}

module.exports = { SyncQueueService };
