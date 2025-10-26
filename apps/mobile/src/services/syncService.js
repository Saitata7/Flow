// services/syncService.js
// Comprehensive sync service for offline-first architecture
// Handles bidirectional sync between local storage and backend

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import sessionApiService from './sessionApiService';
import settingsService from './settingsService';
import { safeSetItem, safeGetItem, safeMultiSet, safeMultiGet } from '../utils/safeAsyncStorage';

const SYNC_STORAGE_KEYS = {
  PENDING_UPLOADS: 'pending_uploads',
  PENDING_DOWNLOADS: 'pending_downloads',
  LAST_SYNC_TIMESTAMP: 'last_sync_timestamp',
  SYNC_CONFLICTS: 'sync_conflicts',
  SYNC_METADATA: 'sync_metadata',
};

class SyncService {
  constructor() {
    this.isOnline = false;
    this.isSyncing = false;
    this.syncQueue = [];
    this.pendingDownloads = [];
    this.conflicts = [];
    this.lastSyncTime = null;
    this.syncMetadata = {};
    
    this.setupNetworkListener();
    this.loadSyncState();
  }

  /**
   * Setup network connectivity listener
   */
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      if (!wasOnline && this.isOnline) {
        console.log('🌐 Network connected - triggering sync');
        this.triggerSync();
      } else if (wasOnline && !this.isOnline) {
        console.log('📱 Network disconnected - switching to offline mode');
      }
    });
  }

  /**
   * Load sync state from storage
   */
  async loadSyncState() {
    try {
      const [pendingUploads, pendingDownloads, lastSync, conflicts, metadata] = await Promise.all([
        AsyncStorage.getItem(SYNC_STORAGE_KEYS.PENDING_UPLOADS),
        AsyncStorage.getItem(SYNC_STORAGE_KEYS.PENDING_DOWNLOADS),
        AsyncStorage.getItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIMESTAMP),
        AsyncStorage.getItem(SYNC_STORAGE_KEYS.SYNC_CONFLICTS),
        AsyncStorage.getItem(SYNC_STORAGE_KEYS.SYNC_METADATA),
      ]);

      this.syncQueue = pendingUploads ? JSON.parse(pendingUploads) : [];
      this.pendingDownloads = pendingDownloads ? JSON.parse(pendingDownloads) : [];
      this.lastSyncTime = lastSync ? new Date(lastSync) : null;
      this.conflicts = conflicts ? JSON.parse(conflicts) : [];
      this.syncMetadata = metadata ? JSON.parse(metadata) : {};

      console.log('📱 Sync state loaded:', {
        pendingUploads: this.syncQueue.length,
        pendingDownloads: this.pendingDownloads.length,
        conflicts: this.conflicts.length,
        lastSync: this.lastSyncTime,
      });
    } catch (error) {
      console.error('Error loading sync state:', error);
    }
  }

  /**
   * Save sync state to storage
   */
  async saveSyncState() {
    try {
      // Use safe storage to prevent undefined value errors
      await safeMultiSet({
        [SYNC_STORAGE_KEYS.PENDING_UPLOADS]: this.syncQueue || [],
        [SYNC_STORAGE_KEYS.PENDING_DOWNLOADS]: this.pendingDownloads || [],
        [SYNC_STORAGE_KEYS.LAST_SYNC_TIMESTAMP]: this.lastSyncTime?.toISOString() || '',
        [SYNC_STORAGE_KEYS.SYNC_CONFLICTS]: this.conflicts || [],
        [SYNC_STORAGE_KEYS.SYNC_METADATA]: this.syncMetadata || {},
      });
    } catch (error) {
      console.error('Error saving sync state:', error);
    }
  }

  /**
   * Check if sync is possible
   */
  canSync() {
    return (
      this.isOnline &&
      !this.isSyncing &&
      settingsService.isSyncEnabled() &&
      sessionApiService.canSync()
    );
  }

  /**
   * Trigger sync process
   */
  async triggerSync() {
    if (!this.canSync()) {
      console.log('⏸️ Sync skipped - conditions not met');
      return;
    }

    if (this.isSyncing) {
      console.log('⏸️ Sync already in progress');
      return;
    }

    try {
      this.isSyncing = true;
      console.log('🔄 Starting comprehensive sync...');

      // Step 1: Upload pending changes
      await this.uploadPendingChanges();

      // Step 2: Download latest data
      await this.downloadLatestData();

      // Step 3: Resolve conflicts
      await this.resolveConflicts();

      // Step 4: Update sync metadata
      this.lastSyncTime = new Date();
      await this.saveSyncState();

      console.log('✅ Sync completed successfully');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Upload pending changes to backend
   */
  async uploadPendingChanges() {
    if (this.syncQueue.length === 0) {
      console.log('📤 No pending uploads');
      return;
    }

    console.log(`📤 Uploading ${this.syncQueue.length} pending changes...`);

    for (const operation of [...this.syncQueue]) {
      try {
        await this.executeUploadOperation(operation);
        
        // Remove successful operation from queue
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
        
        console.log(`✅ Uploaded: ${operation.type} - ${operation.id}`);
      } catch (error) {
        console.error(`❌ Upload failed: ${operation.type} - ${operation.id}:`, error);
        
        // Increment retry count
        operation.retryCount = (operation.retryCount || 0) + 1;
        
        // Remove from queue if max retries exceeded
        if (operation.retryCount >= 3) {
          this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id);
          console.log(`🗑️ Removed failed operation after max retries: ${operation.type}`);
        }
      }
    }

    await this.saveSyncState();
  }

  /**
   * Execute individual upload operation
   */
  async executeUploadOperation(operation) {
    const { type, data, flowId, entryId } = operation;

    switch (type) {
      case 'CREATE_FLOW':
        await sessionApiService.createFlow(data);
        break;
      case 'UPDATE_FLOW':
        await sessionApiService.updateFlow(flowId, data);
        break;
      case 'DELETE_FLOW':
        await sessionApiService.deleteFlow(flowId);
        break;
      case 'CREATE_ENTRY':
        await sessionApiService.createFlowEntry(data);
        break;
      case 'UPDATE_ENTRY':
        await sessionApiService.updateFlowEntry(entryId, data);
        break;
      case 'DELETE_ENTRY':
        await sessionApiService.deleteFlowEntry(entryId);
        break;
      default:
        throw new Error(`Unknown upload operation: ${type}`);
    }
  }

  /**
   * Download latest data from backend
   */
  async downloadLatestData() {
    try {
      console.log('📥 Downloading latest data from backend...');

      // Check authentication before making API calls
      const isAuthenticated = await sessionApiService.isUserAuthenticated();
      if (!isAuthenticated) {
        console.log('📥 User not authenticated, skipping download');
        return;
      }

      // Get flows
      const flowsResponse = await sessionApiService.getFlows();
      if (flowsResponse.success) {
        await this.mergeFlowsFromServer(flowsResponse.data);
        console.log(`📥 Downloaded ${flowsResponse.data.length} flows`);
      }

      // Get flow entries for last 30 days
      const entriesResponse = await sessionApiService.getFlowEntries({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      if (entriesResponse.success) {
        await this.mergeFlowEntriesFromServer(entriesResponse.data);
        console.log(`📥 Downloaded ${entriesResponse.data.length} flow entries`);
      }

      // Get user settings
      const settingsResponse = await sessionApiService.getUserSettings();
      if (settingsResponse.success) {
        await this.mergeSettingsFromServer(settingsResponse.data);
        console.log('📥 Downloaded user settings');
      }

    } catch (error) {
      console.error('Error downloading latest data:', error);
    }
  }

  /**
   * Merge flows from server with local data
   */
  async mergeFlowsFromServer(serverFlows) {
    try {
      const localFlowsData = await AsyncStorage.getItem('flows');
      const localFlows = localFlowsData ? JSON.parse(localFlowsData) : [];

      // Create a map of local flows for quick lookup
      const localFlowsMap = new Map(localFlows.map(flow => [flow.id, flow]));

      // Merge server flows with local flows
      const mergedFlows = serverFlows.map(serverFlow => {
        const localFlow = localFlowsMap.get(serverFlow.id);
        
        if (localFlow) {
          // Check for conflicts
          const conflict = this.detectFlowConflict(localFlow, serverFlow);
          if (conflict) {
            this.addConflict(conflict);
            return this.resolveFlowConflict(localFlow, serverFlow);
          }
          
          // Merge local status with server flow, prioritizing server status if local is empty
          const mergedStatus = localFlow.status && Object.keys(localFlow.status).length > 0 
            ? { ...serverFlow.status, ...localFlow.status }
            : serverFlow.status;
            
          console.log(`Sync: Merging flow ${serverFlow.id}:`, {
            serverStatusKeys: serverFlow.status ? Object.keys(serverFlow.status) : 'No server status',
            localStatusKeys: localFlow.status ? Object.keys(localFlow.status) : 'No local status',
            mergedStatusKeys: mergedStatus ? Object.keys(mergedStatus) : 'No merged status'
          });
            
          return {
            ...serverFlow,
            status: mergedStatus,
            localUpdatedAt: localFlow.updatedAt,
          };
        }
        
        return serverFlow;
      });

      // Add any local-only flows
      const serverFlowIds = new Set(serverFlows.map(flow => flow.id));
      const localOnlyFlows = localFlows.filter(flow => !serverFlowIds.has(flow.id));
      
      const allFlows = [...mergedFlows, ...localOnlyFlows];

      await AsyncStorage.setItem('flows', JSON.stringify(allFlows));
      console.log(`🔄 Merged ${allFlows.length} flows (${mergedFlows.length} from server, ${localOnlyFlows.length} local-only)`);
      
      // Log sample flow data for debugging
      if (allFlows.length > 0) {
        const sampleFlow = allFlows[0];
        console.log('Sample merged flow:', {
          id: sampleFlow.id,
          title: sampleFlow.title,
          statusKeys: sampleFlow.status ? Object.keys(sampleFlow.status) : 'No status',
          statusSample: sampleFlow.status ? Object.entries(sampleFlow.status)[0] : 'No status entries'
        });
      }
    } catch (error) {
      console.error('Error merging flows from server:', error);
    }
  }

  /**
   * Merge flow entries from server
   */
  async mergeFlowEntriesFromServer(serverEntries) {
    try {
      // Defensive check for serverEntries
      if (!serverEntries || !Array.isArray(serverEntries)) {
        console.warn('mergeFlowEntriesFromServer: Invalid serverEntries:', serverEntries);
        return;
      }

      const localFlowsData = await AsyncStorage.getItem('flows');
      const localFlows = localFlowsData ? JSON.parse(localFlowsData) : [];

      // Group entries by flow ID
      const entriesByFlow = {};
      serverEntries.forEach(entry => {
        // Additional defensive check for entry structure
        if (!entry || !entry.flowId || !entry.date) {
          console.warn('mergeFlowEntriesFromServer: Skipping invalid entry:', entry);
          return;
        }
        
        if (!entriesByFlow[entry.flowId]) {
          entriesByFlow[entry.flowId] = {};
        }
        entriesByFlow[entry.flowId][entry.date] = entry;
      });

      // Merge entries into flows
      const updatedFlows = localFlows.map(flow => {
        // Defensive check for flow structure
        if (!flow || !flow.id) {
          console.warn('mergeFlowEntriesFromServer: Skipping invalid flow:', flow);
          return flow;
        }

        if (entriesByFlow[flow.id]) {
          const serverEntries = entriesByFlow[flow.id];
          const mergedStatus = { ...(flow.status || {}) };
          
          Object.keys(serverEntries).forEach(date => {
            const serverEntry = serverEntries[date];
            const localEntry = flow.status?.[date];
            
            if (localEntry) {
              // Check for conflicts
              const conflict = this.detectEntryConflict(localEntry, serverEntry);
              if (conflict) {
                this.addConflict(conflict);
                mergedStatus[date] = this.resolveEntryConflict(localEntry, serverEntry);
              } else {
                // Use server data if it's newer
                mergedStatus[date] = serverEntry;
              }
            } else {
              mergedStatus[date] = serverEntry;
            }
          });
          
          return { ...flow, status: mergedStatus };
        }
        
        return flow;
      });

      await AsyncStorage.setItem('flows', JSON.stringify(updatedFlows));
      console.log(`🔄 Merged flow entries for ${Object.keys(entriesByFlow).length} flows`);
    } catch (error) {
      console.error('Error merging flow entries from server:', error);
    }
  }

  /**
   * Merge settings from server
   */
  async mergeSettingsFromServer(serverSettings) {
    try {
      const currentSettings = settingsService.getSettings();
      const mergedSettings = { ...currentSettings, ...serverSettings };
      
      // Update settings service
      Object.keys(mergedSettings).forEach(key => {
        settingsService.settings[key] = mergedSettings[key];
      });
      
      await settingsService.saveSettings();
      console.log('🔄 Merged settings from server');
    } catch (error) {
      console.error('Error merging settings from server:', error);
    }
  }

  /**
   * Detect conflicts between local and server flows
   */
  detectFlowConflict(localFlow, serverFlow) {
    const localUpdated = new Date(localFlow.updatedAt);
    const serverUpdated = new Date(serverFlow.updatedAt);
    
    // If both were updated after last sync, there's a conflict
    if (localUpdated > this.lastSyncTime && serverUpdated > this.lastSyncTime) {
      return {
        type: 'flow',
        id: localFlow.id,
        localData: localFlow,
        serverData: serverFlow,
        conflictFields: this.getConflictFields(localFlow, serverFlow),
        detectedAt: new Date().toISOString(),
      };
    }
    
    return null;
  }

  /**
   * Detect conflicts between local and server entries
   */
  detectEntryConflict(localEntry, serverEntry) {
    const localUpdated = new Date(localEntry.timestamp || 0);
    const serverUpdated = new Date(serverEntry.timestamp || 0);
    
    // If both were updated after last sync, there's a conflict
    if (localUpdated > this.lastSyncTime && serverUpdated > this.lastSyncTime) {
      return {
        type: 'entry',
        id: `${serverEntry.flowId}_${serverEntry.date}`,
        localData: localEntry,
        serverData: serverEntry,
        conflictFields: this.getConflictFields(localEntry, serverEntry),
        detectedAt: new Date().toISOString(),
      };
    }
    
    return null;
  }

  /**
   * Get fields that have conflicts
   */
  getConflictFields(localData, serverData) {
    const conflicts = [];
    const fields = ['title', 'description', 'symbol', 'emotion', 'note', 'quantitative', 'timebased'];
    
    fields.forEach(field => {
      if (localData[field] !== serverData[field]) {
        conflicts.push(field);
      }
    });
    
    return conflicts;
  }

  /**
   * Add conflict to conflicts list
   */
  addConflict(conflict) {
    this.conflicts.push(conflict);
    console.log(`⚠️ Conflict detected: ${conflict.type} - ${conflict.id}`);
  }

  /**
   * Resolve flow conflict (use server data by default)
   */
  resolveFlowConflict(localFlow, serverFlow) {
    // For now, use server data as the source of truth
    // In a real implementation, you might want to show a conflict resolution UI
    return {
      ...serverFlow,
      status: { ...serverFlow.status, ...localFlow.status },
      conflictResolved: true,
      resolvedAt: new Date().toISOString(),
    };
  }

  /**
   * Resolve entry conflict (use server data by default)
   */
  resolveEntryConflict(localEntry, serverEntry) {
    // For now, use server data as the source of truth
    return {
      ...serverEntry,
      conflictResolved: true,
      resolvedAt: new Date().toISOString(),
    };
  }

  /**
   * Resolve all conflicts
   */
  async resolveConflicts() {
    if (this.conflicts.length === 0) {
      console.log('✅ No conflicts to resolve');
      return;
    }

    console.log(`🔧 Resolving ${this.conflicts.length} conflicts...`);

    for (const conflict of this.conflicts) {
      try {
        if (conflict.type === 'flow') {
          await this.resolveFlowConflictAction(conflict);
        } else if (conflict.type === 'entry') {
          await this.resolveEntryConflictAction(conflict);
        }
        
        console.log(`✅ Resolved conflict: ${conflict.type} - ${conflict.id}`);
      } catch (error) {
        console.error(`❌ Failed to resolve conflict: ${conflict.type} - ${conflict.id}:`, error);
      }
    }

    // Clear resolved conflicts
    this.conflicts = [];
    await this.saveSyncState();
  }

  /**
   * Resolve flow conflict action
   */
  async resolveFlowConflictAction(conflict) {
    const resolvedFlow = this.resolveFlowConflict(conflict.localData, conflict.serverData);
    
    // Update local storage
    const flowsData = await AsyncStorage.getItem('flows');
    const flows = flowsData ? JSON.parse(flowsData) : [];
    const updatedFlows = flows.map(flow => 
      flow.id === conflict.id ? resolvedFlow : flow
    );
    
    await AsyncStorage.setItem('flows', JSON.stringify(updatedFlows));
  }

  /**
   * Resolve entry conflict action
   */
  async resolveEntryConflictAction(conflict) {
    const resolvedEntry = this.resolveEntryConflict(conflict.localData, conflict.serverData);
    
    // Update local storage
    const flowsData = await AsyncStorage.getItem('flows');
    const flows = flowsData ? JSON.parse(flowsData) : [];
    const [flowId, date] = conflict.id.split('_');
    
    const updatedFlows = flows.map(flow => {
      if (flow.id === flowId) {
        return {
          ...flow,
          status: {
            ...flow.status,
            [date]: resolvedEntry,
          },
        };
      }
      return flow;
    });
    
    await AsyncStorage.setItem('flows', JSON.stringify(updatedFlows));
  }

  /**
   * Add operation to sync queue
   */
  async addToSyncQueue(operation) {
    const syncOperation = {
      ...operation,
      id: `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.syncQueue.push(syncOperation);
    await this.saveSyncState();

    console.log(`📝 Added to sync queue: ${operation.type}`);

    // Trigger sync if online
    if (this.canSync()) {
      this.triggerSync();
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      canSync: this.canSync(),
      pendingUploads: this.syncQueue.length,
      pendingDownloads: this.pendingDownloads.length,
      conflicts: this.conflicts.length,
      lastSyncTime: this.lastSyncTime,
      syncEnabled: settingsService.isSyncEnabled(),
    };
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue() {
    this.syncQueue = [];
    await this.saveSyncState();
    console.log('🧹 Sync queue cleared');
  }

  /**
   * Clear conflicts
   */
  async clearConflicts() {
    this.conflicts = [];
    await this.saveSyncState();
    console.log('🧹 Conflicts cleared');
  }

  /**
   * Force sync (ignore conditions)
   */
  async forceSync() {
    console.log('🔄 Force sync triggered');
    this.isSyncing = false; // Reset syncing flag
    await this.triggerSync();
  }

  /**
   * Get sync metadata
   */
  getSyncMetadata() {
    return {
      ...this.syncMetadata,
      lastSyncTime: this.lastSyncTime,
      totalSyncs: this.syncMetadata.totalSyncs || 0,
      successfulSyncs: this.syncMetadata.successfulSyncs || 0,
      failedSyncs: this.syncMetadata.failedSyncs || 0,
    };
  }

  /**
   * Update sync metadata
   */
  updateSyncMetadata(updates) {
    this.syncMetadata = { ...this.syncMetadata, ...updates };
    this.saveSyncState();
  }
}

// Export singleton instance
export default new SyncService();
