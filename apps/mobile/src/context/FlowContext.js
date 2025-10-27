import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';
import { InteractionManager, AppState } from 'react-native';
import sessionApiService from '../services/sessionApiService';
import syncService from '../services/syncService';
import notificationService from '../services/notificationService';
import { useAuth } from './JWTAuthContext';
import logger from '../utils/logger';

const FLOWS_STORAGE_KEY = 'flows';

export const FlowsContext = createContext();

export const FlowsProvider = ({ children }) => {
  const [flows, setFlows] = useState([]);
  const [updateQueue, setUpdateQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Performance optimization refs
  const renderCountRef = useRef(0);
  const lastFlowsRef = useRef([]);
  const syncTimeoutRef = useRef(null);
  const authStateRef = useRef({ isAuthenticated, user });
  
  // Update auth ref when auth state changes
  useEffect(() => {
    authStateRef.current = { isAuthenticated, user };
  }, [isAuthenticated, user]);
  
  // Memoized flows to prevent unnecessary re-renders
  const memoizedFlows = useMemo(() => {
    renderCountRef.current += 1;
    logger.log(`🔄 FlowContext render #${renderCountRef.current} with ${flows.length} flows`);
    
    // Only update if flows actually changed
    const flowsChanged = JSON.stringify(flows) !== JSON.stringify(lastFlowsRef.current);
    if (flowsChanged) {
      lastFlowsRef.current = flows;
      logger.log('📊 Flows changed, updating memoized flows');
    }
    
    return flows;
  }, [flows]);

  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      if (renderTime > 100) {
        logger.warn(`⚠️ Slow FlowContext render: ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  // Optimized status generation with memoization
  const generateStatusDates = useCallback((trackingType, unitText, hours, minutes, seconds, goal) => {
    // Use InteractionManager for heavy calculations
    return InteractionManager.runAfterInteractions(() => {
    const status = {};
      const today = new Date();
      
      // Pre-calculate date keys for better performance
      const dateKeys = Array.from({ length: 7 }, (_, i) => 
        format(addDays(today, i), 'yyyy-MM-dd')
      );
      
      // Create base status object
      const baseStatus = {
        symbol: null,
        emotion: null,
        note: null,
        timestamp: null,
      };
      
      // Add tracking-specific data
      if (trackingType === 'Quantitative') {
        baseStatus.quantitative = { unitText, goal, count: 0 };
      } else if (trackingType === 'Time-based') {
        baseStatus.timebased = {
          hours,
          minutes,
          seconds,
          start0: null,
          startTime: null,
          pauses: [],
          stop: null,
          endTime: null,
          totalDuration: 0,
          pausesCount: 0
        };
      }
      
      // Populate status for all dates
      dateKeys.forEach(dateKey => {
        status[dateKey] = { ...baseStatus };
      });
      
    return status;
    });
  }, []);

  // Schedule notifications for active flows
  const scheduleFlowNotifications = useCallback(async (flowsToSchedule) => {
    try {
      logger.log('🔔 Scheduling notifications for flows...');
      
      // Filter active flows (not deleted or archived)
      const activeFlows = flowsToSchedule.filter(flow => 
        !flow.deletedAt && !flow.archived && flow.reminderTime
      );
      
      if (activeFlows.length === 0) {
        logger.log('🔔 No active flows with reminder times found');
        return;
      }
      
      logger.log(`🔔 Found ${activeFlows.length} active flows with reminders`);
      
      // Schedule notifications for each active flow
      for (const flow of activeFlows) {
        const flowLevel = parseInt(flow.reminderLevel || flow.level || '1');
        const reminderTime = flow.reminderTime || '09:00';
        
        logger.log(`🔔 Scheduling Level ${flowLevel} reminder for: ${flow.title} at ${reminderTime}`);
        
        const success = await notificationService.scheduleFlowReminder(
          flow.id,
          flow.title,
          flowLevel,
          reminderTime,
          flow.customSound
        );
        
        if (success) {
          logger.log(`✅ Scheduled reminder for: ${flow.title}`);
        } else {
          logger.log(`❌ Failed to schedule reminder for: ${flow.title}`);
        }
      }
      
      logger.log('🔔 Flow notification scheduling completed');
    } catch (error) {
      logger.error('Error scheduling flow notifications:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      logger.log('=== FLOWS CONTEXT LOAD DATA START ===');
      logger.log('FlowsContext: loadData called');
      
      const currentAuthState = authStateRef.current;
      logger.log('FlowsContext: isAuthenticated:', currentAuthState.isAuthenticated);
      
      // First, load from local storage
      const flowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      if (flowsData) {
        const loadedFlows = JSON.parse(flowsData).filter(flow => {
          // Filter out flows with invalid IDs
          if (!flow || !flow.id || flow.id === 'undefined') {
            logger.warn('FlowsContext: Skipping flow with invalid ID:', flow);
            return false;
          }
          return true;
        });
        logger.log('FlowsContext: Loading flows from storage:', loadedFlows.length, 'flows');
        logger.log('FlowsContext: Loaded flow details:', loadedFlows.map(f => ({ 
          id: f.id, 
          title: f.title, 
          groupId: f.groupId,
          trackingType: f.trackingType,
          deletedAt: f.deletedAt,
          archived: f.archived
        })));
        setFlows(loadedFlows);
        logger.log('FlowsContext: Flows state updated to:', loadedFlows.length, 'flows');
        
        // Schedule notifications for active flows
        await scheduleFlowNotifications(loadedFlows);
      } else {
        logger.log('FlowsContext: No flows data found in storage');
        setFlows([]);
      }

      // Always try to sync with backend if user is authenticated
      if (currentAuthState.isAuthenticated && currentAuthState.user) {
        logger.log('FlowsContext: User authenticated, attempting sync for cloud flows...');
        try {
          logger.log('FlowsContext: About to call syncWithBackend...');
          await syncWithBackend();
          
          // After sync, reload flows from storage to ensure we have the latest data
          const updatedFlowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
          if (updatedFlowsData) {
            const updatedFlows = JSON.parse(updatedFlowsData).filter(flow => {
              if (!flow || !flow.id || flow.id === 'undefined') {
                return false;
              }
              return true;
            });
            logger.log('FlowsContext: Updated flows after sync:', updatedFlows.length, 'flows');
            logger.log('FlowsContext: Cloud flows:', updatedFlows.filter(f => f.storagePreference === 'cloud').length);
            logger.log('FlowsContext: Local flows:', updatedFlows.filter(f => f.storagePreference === 'local').length);
            setFlows(updatedFlows);
          }
          logger.log('FlowsContext: syncWithBackend completed');
        } catch (syncError) {
          logger.log('ℹ️ FlowsContext: Sync failed (expected if not authenticated):', syncError.message);
          // Don't treat sync errors as critical if user is not authenticated
        }
      } else {
        logger.log('FlowsContext: Sync skipped - isAuthenticated:', currentAuthState.isAuthenticated, 'user:', !!currentAuthState.user);
      }
      
      logger.log('=== FLOWS CONTEXT LOAD DATA END ===');
    } catch (e) {
      logger.error('FlowsContext: Failed to load flows:', e);
      logger.error('FlowsContext: Error stack:', e.stack);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependencies - don't recreate this function

  // Clean up invalid flows from storage
  const cleanupInvalidFlows = useCallback(async () => {
    try {
      const flowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      if (flowsData) {
        const allFlows = JSON.parse(flowsData);
        const validFlows = allFlows.filter(flow => {
          if (!flow || !flow.id || flow.id === 'undefined') {
            logger.warn('FlowsContext: Removing invalid flow from storage:', flow);
            return false;
          }
          return true;
        });
        
        if (validFlows.length !== allFlows.length) {
          logger.log(`FlowsContext: Cleaned up ${allFlows.length - validFlows.length} invalid flows`);
          await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(validFlows));
        }
      }
    } catch (error) {
      logger.error('FlowsContext: Error cleaning up invalid flows:', error);
    }
  }, []);

  // Sync with backend using comprehensive sync service
  const syncWithBackend = useCallback(async () => {
    logger.log('=== SYNC WITH BACKEND START ===');
    logger.log('FlowsContext: syncWithBackend called');
    
    const currentAuthState = authStateRef.current;
    logger.log('FlowsContext: isAuthenticated:', currentAuthState.isAuthenticated);
    logger.log('FlowsContext: user exists:', !!currentAuthState.user);
    
    // Debug authentication state
    const authDebug = await sessionApiService.debugAuthState();
    logger.log('FlowsContext: Auth debug result:', authDebug);
    
    // Double-check authentication with actual JWT token
    const userAuthenticated = await sessionApiService.isUserAuthenticated();
    logger.log('FlowsContext: userAuthenticated:', userAuthenticated);
    
    if (!userAuthenticated) {
      logger.log('FlowsContext: Sync skipped - user not properly authenticated');
      return;
    }

    try {
      setSyncStatus('syncing');
      logger.log('FlowsContext: Starting comprehensive sync...');
      
      // Trigger comprehensive sync
      logger.log('FlowsContext: Calling syncService.triggerSync()...');
      await syncService.triggerSync();
      logger.log('FlowsContext: syncService.triggerSync() completed');
      
      // Preserve local flows before fetching backend data (critical for temp flows)
      logger.log('FlowsContext: Preserving local flows before fetching backend data...');
      
      const currentLocalFlows = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      const localFlows = currentLocalFlows ? JSON.parse(currentLocalFlows) : [];
      const localTempFlows = localFlows.filter(f => f.id?.startsWith('temp_'));
      logger.log('FlowsContext: Current local flows:', localFlows.length);
      logger.log('FlowsContext: Temp flows to preserve:', localTempFlows.length);
      logger.log('FlowsContext: Temp flow IDs:', localTempFlows.map(f => f.id + ' - ' + f.title));
      
      // Fetch fresh data from backend
      logger.log('FlowsContext: Fetching fresh flows from backend...');
      
      // Double-check authentication before making API call
      // Add a small delay to allow auth state to settle after login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isAuthenticated = await sessionApiService.isUserAuthenticated();
      if (!isAuthenticated) {
        logger.log('FlowsContext: User not authenticated, skipping API call');
        logger.log('FlowsContext: This is expected if user is not logged in or is anonymous');
        return;
      }
      
      logger.log('FlowsContext: About to call sessionApiService.getFlows()...');
      const flowsResponse = await sessionApiService.getFlows();
      logger.log('FlowsContext: API response received:', flowsResponse);
      
      if (flowsResponse.success) {
        logger.log('FlowsContext: Fresh flows received from backend:', flowsResponse.data.length, 'flows');
        
        // Backend already merges flow entries into flows.status, so use flows data directly
        logger.log('FlowsContext: Using flows data directly (backend already merged entries)');
        const syncedFlows = flowsResponse.data;
        
        // Merge local flows (including temp flows) with backend flows
        logger.log('FlowsContext: Merging local flows with backend flows...');
        
        // Create a map to track backend flow IDs to avoid duplicates
        const backendFlowIds = new Set(syncedFlows.map(f => f.id));
        
        // CRITICAL FIX: Preserve temp flows and any local-only flows
        const localOnlyFlows = localFlows.filter(f => {
          const isTempId = f.id?.startsWith('temp_');
          const isLocalOnly = f.storagePreference === 'local';
          const notOnBackend = !backendFlowIds.has(f.id);
          
          // Keep temp flows OR local-only flows OR flows not on backend
          const shouldKeep = isTempId || isLocalOnly || notOnBackend;
          
          if (shouldKeep) {
            logger.log(`📦 Preserving local flow: ${f.id} - ${f.title} (temp: ${isTempId}, local: ${isLocalOnly}, notOnBackend: ${notOnBackend})`);
          }
          
          return shouldKeep;
        });
        
        logger.log('FlowsContext: Local-only flows to preserve:', localOnlyFlows.length);
        logger.log('FlowsContext: Local-only flow IDs:', localOnlyFlows.map(f => `${f.id} - ${f.title}`));
        
        // Start with backend flows
        const mergedFlows = [...syncedFlows];
        
        // Add local-only flows that aren't on the backend yet
        localOnlyFlows.forEach(localOnlyFlow => {
          // Only add if not already in mergedFlows
          if (!mergedFlows.find(f => f.id === localOnlyFlow.id)) {
            mergedFlows.push(localOnlyFlow);
            logger.log(`✅ Added local flow to merge: ${localOnlyFlow.id} - ${localOnlyFlow.title}`);
          }
        });
        
        // Merge status for flows that exist in both backend and local
        syncedFlows.forEach(backendFlow => {
          const localFlow = localFlows.find(lf => lf.id === backendFlow.id);
          if (localFlow && localFlow.status) {
            logger.log(`FlowsContext: Merging local status for flow ${backendFlow.title}`);
            // Merge local status with backend status, prioritizing local changes
            const mergedStatus = { ...backendFlow.status };
            Object.keys(localFlow.status).forEach(date => {
              const localStatus = localFlow.status[date];
              const backendStatus = backendFlow.status?.[date];
              
              // If local status has more recent data or different data, use local
              if (localStatus && (!backendStatus || 
                  (localStatus.timestamp && backendStatus.timestamp && 
                   new Date(localStatus.timestamp) > new Date(backendStatus.timestamp)))) {
                mergedStatus[date] = localStatus;
                logger.log(`FlowsContext: Using local status for ${date}:`, localStatus);
              } else if (backendStatus) {
                mergedStatus[date] = backendStatus;
                logger.log(`FlowsContext: Using backend status for ${date}:`, backendStatus);
              }
            });
            
            // Update the flow in mergedFlows
            const flowIndex = mergedFlows.findIndex(f => f.id === backendFlow.id);
            if (flowIndex >= 0) {
              mergedFlows[flowIndex] = { ...backendFlow, status: mergedStatus };
            }
          }
        });
        
        logger.log('FlowsContext: Synced flows details:', mergedFlows.map(f => ({ 
          id: f.id, 
          title: f.title, 
          trackingType: f.trackingType,
          statusKeys: f.status ? Object.keys(f.status) : 'No status',
          statusCount: f.status ? Object.keys(f.status).length : 0
        })));
        
        logger.log('FlowsContext: Total flows after merge:', mergedFlows.length);
        logger.log('FlowsContext: Backend flows:', syncedFlows.length);
        logger.log('FlowsContext: Temp flows preserved:', localTempFlows.length);
        
        setFlows(mergedFlows);
        logger.log('FlowsContext: Flows state updated to:', mergedFlows.length, 'flows');
        
        // Save merged data to local storage
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(mergedFlows));
        logger.log('FlowsContext: Merged flows saved to local storage');
        
        // Schedule notifications for synced flows
        await scheduleFlowNotifications(mergedFlows);
      } else {
        logger.warn('FlowsContext: Failed to fetch fresh flows from backend:', flowsResponse.error);
        // Fallback to local flows we stored before clearing cache
        if (localFlows.length > 0) {
          logger.log('FlowsContext: Using fallback flows from local storage:', localFlows.length, 'flows');
          setFlows(localFlows);
          await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(localFlows));
        } else {
          // Try to load from storage as last resort
          const flowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
          if (flowsData) {
            const syncedFlows = JSON.parse(flowsData);
            logger.log('FlowsContext: Using last resort flows from storage:', syncedFlows.length, 'flows');
            setFlows(syncedFlows);
          }
        }
      }
      
      setSyncStatus('success');
      setLastSyncTime(syncService.lastSyncTime);
      logger.log('FlowsContext: Comprehensive sync completed successfully');
    } catch (error) {
      logger.error('FlowsContext: Comprehensive sync failed:', error);
      logger.error('FlowsContext: Error stack:', error.stack);
      setSyncStatus('error');
    }
    
    logger.log('=== SYNC WITH BACKEND END ===');
  }, []); // Empty dependencies to prevent recreation

  // Enhanced offline-first flow operations with performance optimization
  const createFlowOfflineFirst = useCallback(async (flowData) => {
    logger.log('FlowsContext: Creating flow offline-first...');
    
    // Generate temporary ID for offline use
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFlow = {
      ...flowData,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _isLocal: true, // Mark as local until synced
      _needsSync: true,
      _syncStatus: 'pending', // Track sync status
    };

    // Save locally first - CRITICAL: Must save before trying to sync
    try {
      const updatedFlows = [...flows, newFlow];
      await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
      setFlows(updatedFlows);
      logger.log('✅ FlowsContext: Flow saved locally:', newFlow.title);
      
      // If cloud storage, immediately try to sync to API
      if (flowData.storagePreference === 'cloud') {
        logger.log('☁️ Cloud flow - attempting immediate API sync...');
        
        // DON'T use fire and forget - check auth first
        const canAuthenticate = await sessionApiService.isUserAuthenticated();
        if (!canAuthenticate) {
          logger.warn('⚠️ Cannot sync - user not authenticated, flow will remain local');
          // Flow is already saved locally, just queue it for later
          await sessionApiService.addToSyncQueue({
            type: 'create_flow',
            data: newFlow,
            flowId: tempId,
          });
          logger.log('📝 Flow queued for later sync when authenticated');
          return newFlow;
        }
        
        try {
          const cloudFlow = await sessionApiService.createFlow(newFlow);
          
          if (cloudFlow && cloudFlow.success && cloudFlow.data) {
            // Successfully synced - update local flow with permanent ID
            const permanentId = cloudFlow.data.id || tempId;
            const updatedFlow = { 
              ...cloudFlow.data, 
              id: permanentId,
              _isLocal: false, 
              _needsSync: false, 
              _syncStatus: 'synced' 
            };
            
            // Update the flow in storage with permanent ID
            const currentFlows = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
            const currentFlowsArray = currentFlows ? JSON.parse(currentFlows) : [];
            const syncedFlows = currentFlowsArray.map(f => f.id === tempId ? updatedFlow : f);
            await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(syncedFlows));
            setFlows(syncedFlows);
            
            logger.log('✅ Flow synced to cloud with permanent ID:', updatedFlow.title, 'ID:', permanentId);
            return updatedFlow;
          } else {
            // API returned failure - queue for later
            logger.warn('⚠️ API sync failed, queueing for later:', cloudFlow?.error);
            await sessionApiService.addToSyncQueue({
              type: 'create_flow',
              data: newFlow,
              flowId: tempId,
            });
            logger.log('📝 Flow queued for retry');
            return newFlow;
          }
        } catch (syncError) {
          // Network or other error - queue for later
          logger.warn('⚠️ Sync error, queueing for later:', syncError.message);
          await sessionApiService.addToSyncQueue({
            type: 'create_flow',
            data: newFlow,
            flowId: tempId,
          });
          logger.log('📝 Flow queued for retry');
          return newFlow;
        }
      } else {
        logger.log('📱 Local flow - no sync needed');
        return newFlow;
      }
    } catch (storageError) {
      logger.error('❌ FlowsContext: Failed to save flow locally:', storageError);
      throw storageError; // Re-throw so AddFlow can handle the error
    }
  }, [flows, isAuthenticated]);

  const updateFlowOfflineFirst = useCallback(async (flowId, updates) => {
    try {
      logger.log('FlowsContext: Updating flow offline-first...');
      
      const flowIndex = flows.findIndex(flow => flow.id === flowId);
      if (flowIndex === -1) {
        throw new Error('Flow not found');
      }

      const updatedFlow = {
        ...flows[flowIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
        _needsSync: true,
      };

      // Update local storage immediately
      const updatedFlows = [...flows];
      updatedFlows[flowIndex] = updatedFlow;
      await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
      setFlows(updatedFlows);
      
      logger.log('FlowsContext: Flow updated locally:', updatedFlow.title);

      // Queue for sync if online
      if (isAuthenticated && sessionApiService.canSync()) {
        await sessionApiService.addToSyncQueue({
          type: 'update_flow',
          data: updatedFlow,
          flowId: flowId,
        });
        logger.log('FlowsContext: Flow update queued for sync');
      }

      return updatedFlow;
    } catch (error) {
      logger.error('FlowsContext: Failed to update flow:', error);
      throw error;
    }
  }, [flows, isAuthenticated]);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    await syncWithBackend();
  }, [syncWithBackend]);

  // Force sync (ignore conditions)
  const forceSync = useCallback(async () => {
    await syncService.forceSync();
    await syncWithBackend();
  }, [syncWithBackend]);

  // Sync queue management functions
  const SYNC_QUEUE_KEY = 'sync_queue';
  
  const enqueueSync = useCallback(async (flow) => {
    try {
      const queue = JSON.parse(await AsyncStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      const syncItem = {
        ...flow,
        retryAt: new Date().toISOString(),
        retryCount: 0,
        maxRetries: 3
      };
      queue.push(syncItem);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      logger.log('🔄 [SYNC] Flow queued for retry:', flow.title);
    } catch (error) {
      logger.error('❌ [SYNC] Failed to enqueue sync:', error);
    }
  }, []);

  const processSyncQueue = useCallback(async () => {
    try {
      const queue = JSON.parse(await AsyncStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      if (queue.length === 0) {
        logger.log('🔄 [SYNC] No items in sync queue');
        return;
      }

      logger.log(`🔄 [SYNC] Processing ${queue.length} items in sync queue`);
      
      const updatedQueue = [];
      
      for (const item of queue) {
        try {
          // Check if item has exceeded max retries
          if (item.retryCount >= item.maxRetries) {
            logger.warn(`⚠️ [SYNC] Item exceeded max retries, removing from queue:`, item.title);
            continue;
          }

          // Check if enough time has passed since last retry
          const retryAt = new Date(item.retryAt);
          const now = new Date();
          if (now < retryAt) {
            updatedQueue.push(item);
            continue;
          }

          logger.log(`🔄 [SYNC] Attempting to sync flow: ${item.title}`);
          
          const result = await sessionApiService.createFlow(item);
          if (result && result.success) {
            logger.log(`✅ [SYNC] Flow synced successfully: ${item.title}`);
            
            // Update local flow with cloud data
            const updatedFlows = flows.map(f => 
              f.id === item.id ? { ...f, ...result.data, _isLocal: false, _needsSync: false, _syncStatus: 'synced' } : f
            );
            await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
            setFlows(updatedFlows);
          } else {
            // API returned failure (but no exception) - queue for retry
            logger.warn(`⚠️ [SYNC] Sync failed for ${item.title}:`, result?.error || 'Unknown error');
            throw new Error(result?.error || 'Sync failed');
          }
        } catch (error) {
          logger.warn(`⚠️ [SYNC] Sync failed for ${item.title}:`, error.message);
          
          // Handle 401 errors by refreshing auth
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            logger.log('🔄 [SYNC] 401 error detected, refreshing auth token');
            try {
              await sessionApiService.refreshToken();
              // Retry immediately after token refresh
              const result = await sessionApiService.createFlow(item);
              if (result.success) {
                logger.log(`✅ [SYNC] Flow synced after token refresh: ${item.title}`);
                continue;
              }
            } catch (refreshError) {
              logger.error('❌ [SYNC] Token refresh failed:', refreshError.message);
            }
          }
          
          // Increment retry count and schedule next retry
          const updatedItem = {
            ...item,
            retryCount: (item.retryCount || 0) + 1,
            retryAt: new Date(Date.now() + Math.pow(2, item.retryCount || 0) * 60000).toISOString() // Exponential backoff
          };
          updatedQueue.push(updatedItem);
        }
      }
      
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
      logger.log(`🔄 [SYNC] Sync queue processing completed. ${updatedQueue.length} items remaining`);
    } catch (error) {
      logger.error('❌ [SYNC] Error processing sync queue:', error);
    }
  }, [flows]);

  const clearSyncQueue = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
      logger.log('🔄 [SYNC] Sync queue cleared');
    } catch (error) {
      logger.error('❌ [SYNC] Failed to clear sync queue:', error);
    }
  }, []);

  // Migrate local flows to cloud when user logs in
  const migrateLocalFlowsToCloud = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        logger.log('📱 User not authenticated, skipping local-to-cloud migration');
        return;
      }

      logger.log('🔄 Starting local-to-cloud migration...');
      
      // Find temp ID flows that haven't been synced (including those without explicit properties)
      const localFlows = flows.filter(flow => {
        const isTempId = flow.id && flow.id.startsWith('temp_');
        const isLocal = flow._isLocal || isTempId;
        const needsCloud = flow.storagePreference === 'cloud' || (isTempId && !flow.storagePreference);
        const needsSync = flow._needsSync !== false; // Default to true if not set
        
        return isLocal && needsCloud && needsSync;
      });

      if (localFlows.length === 0) {
        logger.log('📱 No local flows to migrate');
        return;
      }

      logger.log(`🔄 Migrating ${localFlows.length} local flows to cloud...`);

      const migrationPromises = localFlows.map(async (flow) => {
        try {
          const cloudFlow = await sessionApiService.createFlow(flow);
          if (cloudFlow.success) {
            // Update local flow with cloud data
            const updatedFlow = { 
              ...flow, 
              ...cloudFlow.data, 
              _isLocal: false, 
              _needsSync: false, 
              _syncStatus: 'synced' 
            };
            
            logger.log(`✅ Migrated flow to cloud: ${flow.title}`);
            return updatedFlow;
          } else {
            // If sync fails repeatedly, mark as failed to prevent loop
            const syncFailureCount = (flow._syncFailureCount || 0) + 1;
            if (syncFailureCount >= 3) {
              logger.warn(`⚠️ Flow ${flow.title} failed sync ${syncFailureCount} times, marking as failed`);
              return { ...flow, _isLocal: false, _needsSync: false, _syncStatus: 'failed' };
            }
            return { ...flow, _syncFailureCount: syncFailureCount };
          }
        } catch (error) {
          logger.warn(`⚠️ Failed to migrate flow ${flow.title}:`, error.message);
          // If sync fails repeatedly, mark as failed to prevent loop
          const syncFailureCount = (flow._syncFailureCount || 0) + 1;
          if (syncFailureCount >= 3) {
            logger.warn(`⚠️ Flow ${flow.title} failed sync ${syncFailureCount} times, marking as failed`);
            return { ...flow, _isLocal: false, _needsSync: false, _syncStatus: 'failed' };
          }
          return { ...flow, _syncFailureCount: syncFailureCount };
        }
      });

      const migratedFlows = await Promise.all(migrationPromises);
      
      // Update flows with migrated data
      const updatedFlows = flows.map(flow => {
        const migratedFlow = migratedFlows.find(mf => mf.id === flow.id);
        return migratedFlow || flow;
      });

      await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
      setFlows(updatedFlows);
      
      logger.log('✅ Local-to-cloud migration completed');
    } catch (error) {
      logger.error('❌ Local-to-cloud migration failed:', error);
    }
  }, [flows, isAuthenticated]);

  // Force complete refresh - clear all caches and sync
  const forceCompleteRefresh = useCallback(async () => {
    try {
      logger.log('🔄 Force complete refresh started...');
      
      // Clear all AsyncStorage caches
      await AsyncStorage.removeItem(FLOWS_STORAGE_KEY);
      await AsyncStorage.removeItem('api_cache_flows');
      await AsyncStorage.removeItem('api_cache_flow_entries');
      await AsyncStorage.removeItem('activity_cache');
      await AsyncStorage.removeItem('cache_metadata');
      
      // Reset state
      setFlows([]);
      setUpdateQueue([]);
      setSyncStatus('idle');
      setLastSyncTime(null);
      
      // Force fresh sync
      await syncWithBackend();
      
      logger.log('✅ Force complete refresh completed');
    } catch (error) {
      logger.error('❌ Force complete refresh failed:', error);
    }
  }, [syncWithBackend]);

  // Track if initial load has been done
  const initialLoadDoneRef = useRef(false);
  
  useEffect(() => {
    logger.log('=== FLOWS CONTEXT MOUNT EFFECT START ===');
    logger.log('FlowsContext: Initial load on mount');
    
    // Only load data ONCE on mount if user is authenticated
    // Don't reload every time isAuthenticated changes
    const currentAuthState = authStateRef.current;
    if (currentAuthState.isAuthenticated && !initialLoadDoneRef.current) {
      logger.log('FlowsContext: User is authenticated, calling loadData()...');
      cleanupInvalidFlows().then(() => {
        loadData();
        initialLoadDoneRef.current = true;
      });
    } else if (!currentAuthState.isAuthenticated && initialLoadDoneRef.current) {
      // Reset initial load flag when user logs out
      logger.log('FlowsContext: User logged out, resetting initial load flag');
      initialLoadDoneRef.current = false;
    }
    
    logger.log('=== FLOWS CONTEXT MOUNT EFFECT END ===');
  }, [isAuthenticated]); // Watch for auth changes to reset flag

  // Track if migration has been attempted
  const migrationAttemptedRef = useRef(false);
  
  // Effect to migrate local flows to cloud when user logs in
  useEffect(() => {
    if (isAuthenticated && flows.length > 0 && !migrationAttemptedRef.current) {
      // Use InteractionManager to avoid blocking UI
      InteractionManager.runAfterInteractions(() => {
        migrationAttemptedRef.current = true;
        logger.log('🔄 Starting one-time migration attempt...');
        migrateLocalFlowsToCloud();
      });
    }
    
    // Reset migration flag when user logs out
    if (!isAuthenticated) {
      migrationAttemptedRef.current = false;
    }
  }, [isAuthenticated, flows.length, migrateLocalFlowsToCloud]);

  // Effect to process sync queue when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      logger.log('🔄 [SYNC] User authenticated, processing sync queue');
      InteractionManager.runAfterInteractions(() => {
        processSyncQueue();
      });
    }
  }, [isAuthenticated, processSyncQueue]);

  // Effect to process sync queue on app focus (network reconnection)
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        logger.log('🔄 [SYNC] App became active, processing sync queue');
        InteractionManager.runAfterInteractions(() => {
          processSyncQueue();
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAuthenticated, processSyncQueue]);


  useEffect(() => {
    if (updateQueue.length > 0) {
      const processQueue = async () => {
        for (const { id, date, updates, type } of updateQueue) {
          logger.log('Processing queue item:', { id, date, updates, type });
          if (type === 'status') {
            await updateFlowStatus(id, date, updates, true);
          } else if (type === 'flow') {
            await updateFlow(id, updates, true);
          }
        }
        setUpdateQueue([]);
      };
      processQueue();
    }
  }, [updateQueue]);

  const addFlow = useCallback(
    async (flow) => {
      try {
        logger.log('FlowsContext: addFlow called with:', flow);
        logger.log('FlowsContext: Current flows count before adding:', flows.length);
        
        // Validate title length
        if (!flow.title || flow.title.trim().length < 3) {
          throw new Error('Title must be at least 3 characters long');
        }
        
        if (flow.title.trim().length > 10) {
          throw new Error('Title must be 10 characters or less');
        }
        
        // Check for duplicate title (exclude deleted and archived flows)
        logger.log('FlowsContext: Checking for duplicates. Current flows:', flows.map(f => ({ 
          id: f.id, 
          title: f.title, 
          deletedAt: f.deletedAt, 
          archived: f.archived 
        })));
        
        const existingFlow = flows.find(existingFlow => {
          // Add comprehensive null checks
          if (!existingFlow || existingFlow.deletedAt || existingFlow.archived) {
            return false;
          }
          
          // Check if both titles exist and are strings
          if (!existingFlow.title || !flow.title || 
              typeof existingFlow.title !== 'string' || typeof flow.title !== 'string') {
            return false;
          }
          
          // Now safely compare titles
          try {
            return existingFlow.title.toLowerCase().trim() === flow.title.toLowerCase().trim();
          } catch (error) {
            logger.log('FlowsContext: Error comparing titles:', error, 'existingFlow.title:', existingFlow.title, 'flow.title:', flow.title);
            return false;
          }
        });
        
        if (existingFlow) {
          logger.log('FlowsContext: Duplicate title found:', flow.title, 'Existing flow:', existingFlow);
          throw new Error(`A flow with the title "${flow.title}" already exists. Please choose a different title.`);
        }
        
        const now = new Date().toISOString();
        const newFlow = {
          // Required fields
          id: flow.id || Date.now().toString(),
          title: flow.title,
          trackingType: flow.trackingType,
          frequency: flow.frequency || 'Daily',
          ownerId: flow.ownerId || user?.uid || 'user123', // Use authenticated user ID
          schemaVersion: 2,
          createdAt: now,
          updatedAt: now,
          startDate: now, // Add startDate field
          
          // CRITICAL FIX: Include storagePreference from the flow parameter
          storagePreference: flow.storagePreference || (isAuthenticated ? 'cloud' : 'local'),
          
          // Optional fields with defaults
          description: flow.description || '',
          everyDay: flow.everyDay || false,
          daysOfWeek: flow.daysOfWeek || [],
          reminderTime: flow.reminderTime || null,
          reminderLevel: flow.reminderLevel || '1',
          cheatMode: flow.cheatMode || false,
          
          // New v2 fields
          planId: flow.planId || null,
          goal: flow.goal || null,
          progressMode: flow.progressMode || 'sum',
          tags: flow.tags || [],
          archived: flow.archived || false,
          visibility: flow.visibility || 'private',
          deletedAt: null,
          
          // Legacy fields for backward compatibility
          goalLegacy: flow.trackingType === 'Quantitative' ? flow.goal || 0 : undefined,
          hours: flow.trackingType === 'Time-based' ? flow.hours || 0 : undefined,
          minutes: flow.trackingType === 'Time-based' ? flow.minutes || 0 : undefined,
          seconds: flow.trackingType === 'Time-based' ? flow.seconds || 0 : undefined,
          unitText: flow.trackingType === 'Quantitative' ? flow.unitText || '' : undefined,
          
          // Status tracking
          status: generateStatusDates(
            flow.trackingType,
            flow.trackingType === 'Quantitative' ? flow.unitText : undefined,
            flow.trackingType === 'Time-based' ? flow.hours : undefined,
            flow.trackingType === 'Time-based' ? flow.minutes : undefined,
            flow.trackingType === 'Time-based' ? flow.seconds : undefined,
            flow.trackingType === 'Quantitative' ? flow.goal : undefined
          )
        };
        
        // Save to local storage first (offline-first)
        const newFlows = [...flows, newFlow];
        logger.log('FlowsContext: Saving flows to storage:', newFlows.length, 'flows');
        logger.log('FlowsContext: Current flows before adding:', flows.map(f => ({ id: f.id, title: f.title })));
        logger.log('FlowsContext: New flow being added:', { id: newFlow.id, title: newFlow.title });
        
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(newFlows));
        setFlows(newFlows);
        
        // Enhanced cloud sync logic with retry queue
        if (newFlow.storagePreference === 'cloud') {
          if (isAuthenticated && await sessionApiService.canSync()) {
            logger.log('🔄 [SYNC] Attempting immediate cloud sync for:', newFlow.title);
          try {
            const apiResult = await sessionApiService.createFlow(newFlow);
            if (apiResult.success) {
                logger.log('✅ [SYNC] Cloud flow created successfully:', newFlow.title);
                
                // Update local flow with cloud data
                const syncedFlow = { 
                  ...newFlow, 
                  ...apiResult.data, 
                  _isLocal: false, 
                  _needsSync: false, 
                  _syncStatus: 'synced' 
                };
                
                const syncedFlows = newFlows.map(f => f.id === newFlow.id ? syncedFlow : f);
                await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(syncedFlows));
                setFlows(syncedFlows);
            } else {
                throw new Error(apiResult.error || 'API call failed');
              }
            } catch (syncError) {
              logger.warn('⚠️ [SYNC] Immediate sync failed, queuing for retry:', syncError.message);
              await enqueueSync(newFlow);
            }
        } else {
            logger.log('🔄 [SYNC] Cloud flow created locally - queuing for sync when authenticated');
            await enqueueSync(newFlow);
          }
        } else {
          logger.log('📱 [SYNC] Local flow created (no sync needed):', newFlow.title);
        }
        
        // Verify the save worked
        const savedFlows = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
        const parsedSavedFlows = savedFlows ? JSON.parse(savedFlows) : [];
        logger.log('FlowsContext: Verified saved flows count:', parsedSavedFlows.length);
        logger.log('FlowsContext: Verified saved flows:', parsedSavedFlows.map(f => ({ id: f.id, title: f.title })));
        
        logger.log('FlowsContext: Flow added successfully:', newFlow.title);
        logger.log('FlowsContext: New flows count after adding:', newFlows.length);
        logger.log('FlowsContext: Latest flows:', newFlows.slice(-3).map(f => ({ id: f.id, title: f.title, groupId: f.groupId })));
      } catch (e) {
        logger.error('FlowsContext: Failed to add flow:', e);
        throw e; // Re-throw the error so it can be caught by AddFlow
      }
    },
    [flows, generateStatusDates, user, isAuthenticated]
  );

  const updateFlowStatus = useCallback(
    async (id, date, updates, fromQueue = false) => {
      try {
        const now = new Date().toISOString();
        const updatedFlows = flows.map((flow) => {
          if (flow.id !== id) return flow;
          const currentStatus = flow.status[date] || {
            symbol: null, // Don't default to skipped
            emotion: null,
            note: null,
            timestamp: null,
            quantitative: flow.trackingType === 'Quantitative' ? { 
              unitText: flow.unitText || '', 
              goal: flow.goal || 0, 
              count: 0 
            } : null,
            timebased: flow.trackingType === 'Time-based' ? {
              hours: flow.hours || 0,
              minutes: flow.minutes || 0,
              seconds: flow.seconds || 0,
              start0: null,
              startTime: null,
              pauses: [],
              stop: null,
              endTime: null,
              totalDuration: 0,
              pausesCount: 0
            } : null
          };
          let newStatus = { ...currentStatus, ...updates };

          if (flow.trackingType === 'Quantitative' && updates.quantitative) {
            newStatus.quantitative = { ...currentStatus.quantitative, ...updates.quantitative };
            const count = newStatus.quantitative.count || 0;
            const goal = newStatus.quantitative.goal || flow.goal || 1;
            newStatus.symbol = count >= goal ? '+' : count >= goal * 0.5 ? '*' : count > 0 ? '-' : '/';
          } else if (flow.trackingType === 'Time-based' && updates.timebased) {
            newStatus.timebased = { ...currentStatus.timebased, ...updates.timebased };
            const duration = newStatus.timebased.totalDuration || 0;
            const goalSeconds = ((flow.hours || 0) * 3600) + ((flow.minutes || 0) * 60) + (flow.seconds || 0);
            newStatus.symbol = duration >= goalSeconds ? '+' : duration >= goalSeconds * 0.5 ? '*' : duration > 0 ? '-' : '/';
          } else {
            newStatus.symbol = updates.symbol || null; // Don't default to skipped
          }

          // Update v2 fields
          newStatus.emotion = updates.emotion ?? currentStatus.emotion;
          newStatus.note = updates.note ?? currentStatus.note;
          newStatus.timestamp = updates.timestamp || now;
          
          // Add new FlowEntry v2 fields
          newStatus.moodScore = updates.moodScore ?? currentStatus.moodScore;
          newStatus.device = updates.device || 'mobile';
          newStatus.geo = updates.geo ?? currentStatus.geo;
          newStatus.streakCount = updates.streakCount ?? currentStatus.streakCount;
          newStatus.edited = updates.edited || false;
          newStatus.editedBy = updates.editedBy ?? currentStatus.editedBy;
          newStatus.editedAt = updates.editedAt ?? currentStatus.editedAt;
          newStatus.deletedAt = updates.deletedAt ?? currentStatus.deletedAt;

          return {
            ...flow,
            updatedAt: now,
            status: {
              ...flow.status,
              [date]: newStatus
            }
          };
        });

        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
        setFlows(updatedFlows);
        logger.log('Updated flow status:', { id, date, updates, updatedFlows: updatedFlows.find(f => f.id === id)?.status[date] });

        // If authenticated and sync enabled, add to sync queue for backend
        if (isAuthenticated && syncService.canSync() && !fromQueue) {
          logger.log('FlowsContext: Adding flow status update to sync queue for backend');
          await syncService.addToSyncQueue({
            type: 'UPDATE_ENTRY',
            data: {
              flowId: id,
              date: date,
              ...updates,
              timestamp: now,
            },
            flowId: id,
            entryId: `${id}_${date}`,
          });
          
          // Trigger immediate sync for critical updates
          logger.log('FlowsContext: Triggering immediate sync for flow status update');
          setTimeout(() => {
            syncService.triggerSync().catch(error => {
              logger.log('FlowsContext: Immediate sync failed (will retry later):', error.message);
            });
          }, 1000);
        }
      } catch (e) {
        logger.error('Failed to update flow status:', e);
        if (!fromQueue) {
          setUpdateQueue((prev) => [...prev, { id, date, updates, type: 'status' }]);
        }
      }
    },
    [flows, isAuthenticated]
  );

  const updateFlow = useCallback(
    async (id, updates, fromQueue = false) => {
      try {
        logger.log('FlowContext: updateFlow called with:', { id, updates, fromQueue });
        
        // Validate title length if title is being updated
        if (updates.title) {
          if (updates.title.trim().length < 3) {
            throw new Error('Title must be at least 3 characters long');
          }
          
          if (updates.title.trim().length > 10) {
            throw new Error('Title must be 10 characters or less');
          }
        }
        
        // Check for duplicate title if title is being updated (exclude deleted and archived flows)
        if (updates.title) {
          const existingFlow = flows.find(existingFlow => {
            // Add comprehensive null checks
            if (!existingFlow || existingFlow.id === id || existingFlow.deletedAt || existingFlow.archived) {
              return false;
            }
            
            // Check if both titles exist and are strings
            if (!existingFlow.title || !updates.title || 
                typeof existingFlow.title !== 'string' || typeof updates.title !== 'string') {
              return false;
            }
            
            // Now safely compare titles
            try {
              return existingFlow.title.toLowerCase().trim() === updates.title.toLowerCase().trim();
            } catch (error) {
              logger.log('FlowsContext: Error comparing titles during update:', error, 'existingFlow.title:', existingFlow.title, 'updates.title:', updates.title);
              return false;
            }
          });
          
          if (existingFlow) {
            logger.log('FlowContext: Duplicate title found during update:', updates.title);
            throw new Error(`A flow with the title "${updates.title}" already exists. Please choose a different title.`);
          }
        }
        
        const now = new Date().toISOString();
        const updatedFlows = flows.map((flow) =>
          flow.id === id ? { 
            ...flow, 
            ...updates, 
            updatedAt: now,
            schemaVersion: 2 // Ensure schema version is updated
          } : flow
        );
        logger.log('FlowContext: Updated flows array:', updatedFlows.find(f => f.id === id));
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
        setFlows(updatedFlows);
        logger.log('FlowContext: Flow updated successfully:', { id, updates });

        // If authenticated and sync enabled, try immediate API call first, then queue as fallback
        if (isAuthenticated && syncService.canSync() && !fromQueue) {
          logger.log('FlowContext: Attempting immediate API call for flow update');
          try {
            const apiResult = await sessionApiService.updateFlow(id, updates);
            if (apiResult.success) {
              logger.log('FlowContext: Flow updated successfully on backend:', apiResult.data);
            } else {
              logger.log('FlowContext: API call failed, adding to sync queue:', apiResult.error);
              await syncService.addToSyncQueue({
                type: 'UPDATE_FLOW',
                data: updates,
                flowId: id,
              });
            }
          } catch (apiError) {
            logger.log('FlowContext: API call failed with error, adding to sync queue:', apiError);
            await syncService.addToSyncQueue({
              type: 'UPDATE_FLOW',
              data: updates,
              flowId: id,
            });
          }
        }
      } catch (e) {
        logger.error('FlowContext: Failed to update flow:', e);
        if (!fromQueue) {
          setUpdateQueue((prev) => [...prev, { id, updates, type: 'flow' }]);
        }
      }
    },
    [flows, isAuthenticated]
  );

  const deleteFlow = useCallback(
    async (id, softDelete = true) => {
      try {
        logger.log('FlowsContext: deleteFlow called with id:', id, 'softDelete:', softDelete);
        logger.log('FlowsContext: Current flows before deletion:', flows.map(f => ({ 
          id: f.id, 
          title: f.title, 
          deletedAt: f.deletedAt 
        })));
        
        if (softDelete) {
          // Soft delete - set deletedAt timestamp
          const now = new Date().toISOString();
          const updatedFlows = flows.map((flow) =>
            flow.id === id ? { 
              ...flow, 
              deletedAt: now,
              updatedAt: now
            } : flow
          );
          logger.log('FlowsContext: Updated flows after soft delete:', updatedFlows.map(f => ({ 
            id: f.id, 
            title: f.title, 
            deletedAt: f.deletedAt 
          })));
          await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
          setFlows(updatedFlows);
          logger.log('Soft deleted flow:', id);
          
          // If authenticated and sync enabled, try immediate API call first, then queue as fallback
          if (isAuthenticated && syncService.canSync()) {
            logger.log('FlowsContext: Attempting immediate API call for flow deletion');
            try {
              const apiResult = await sessionApiService.deleteFlow(id);
              if (apiResult.success) {
                logger.log('FlowsContext: Flow deleted successfully on backend');
              } else {
                logger.log('FlowsContext: API call failed, adding to sync queue:', apiResult.error);
                await syncService.addToSyncQueue({
                  type: 'DELETE_FLOW',
                  flowId: id,
                });
              }
            } catch (apiError) {
              logger.log('FlowsContext: API call failed with error, adding to sync queue:', apiError);
              await syncService.addToSyncQueue({
                type: 'DELETE_FLOW',
                flowId: id,
              });
            }
          }
          
          // Verify the state was updated
          logger.log('FlowsContext: State after delete - flows count:', updatedFlows.length);
          logger.log('FlowsContext: Deleted flow should have deletedAt:', updatedFlows.find(f => f.id === id)?.deletedAt);
        } else {
          // Hard delete - remove from array
          const updatedFlows = flows.filter((flow) => flow.id !== id);
          await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
          setFlows(updatedFlows);
          logger.log('Hard deleted flow:', id);
        }
      } catch (e) {
        logger.error('Failed to delete flow:', e);
      }
    },
    [flows, isAuthenticated]
  );

  const restoreFlow = useCallback(
    async (id) => {
      try {
        const now = new Date().toISOString();
        const updatedFlows = flows.map((flow) =>
          flow.id === id ? { 
            ...flow, 
            deletedAt: null,
            updatedAt: now
          } : flow
        );
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
        setFlows(updatedFlows);
        logger.log('Restored flow:', id);
      } catch (e) {
        logger.error('Failed to restore flow:', e);
      }
    },
    [flows, isAuthenticated]
  );

  const updateCount = useCallback(
    async (id, date, action) => {
      await updateFlowStatus(id, date, { action });
    },
    [updateFlowStatus]
  );

  const updateTimeBased = useCallback(
    async (id, date, timeUpdate) => {
      logger.log('Updating timebased:', { id, date, timeUpdate });
      await updateFlowStatus(id, date, { timebased: timeUpdate });
    },
    [updateFlowStatus]
  );

  // Helper functions for filtering flows
  const getActiveFlows = useCallback(() => {
    return flows.filter(flow => !flow.deletedAt && !flow.archived);
  }, [flows]);

  const getArchivedFlows = useCallback(() => {
    return flows.filter(flow => !flow.deletedAt && flow.archived);
  }, [flows]);

  const getDeletedFlows = useCallback(() => {
    return flows.filter(flow => flow.deletedAt);
  }, [flows]);

  const getFlowsByPlan = useCallback((planId) => {
    return flows.filter(flow => !flow.deletedAt && flow.planId === planId);
  }, [flows]);

  const getFlowsByTag = useCallback((tag) => {
    return flows.filter(flow => !flow.deletedAt && flow.tags?.includes(tag));
  }, [flows]);

  // Debug function to check flow status
  const debugFlowStatus = useCallback((flowId) => {
    const flow = flows.find(f => f.id === flowId);
    if (!flow) {
      logger.log('Debug: Flow not found:', flowId);
      return;
    }
    
    const todayKey = moment().format('YYYY-MM-DD');
    const status = flow.status?.[todayKey];
    
    logger.log('Debug Flow Status:', {
      flowId: flow.id,
      title: flow.title,
      todayKey,
      status,
      allStatusKeys: flow.status ? Object.keys(flow.status) : 'No status',
      statusCount: flow.status ? Object.keys(flow.status).length : 0
    });
    
    return {
      flow,
      todayKey,
      status,
      allStatus: flow.status
    };
  }, [flows]);

  const contextValue = useMemo(() => ({
    // Data (using memoized flows for performance)
    flows: memoizedFlows,
    activeFlows: getActiveFlows(),
    archivedFlows: getArchivedFlows(),
    deletedFlows: getDeletedFlows(),
    
    // Sync state
    isLoading,
    syncStatus,
    lastSyncTime,
    isOnline: syncService.isOnline,
    syncEnabled: syncService.canSync(),
    syncMetadata: syncService.getSyncMetadata(),
    conflicts: syncService.conflicts,
    
    // Actions
    addFlow,
    updateFlow,
    updateFlowStatus,
    deleteFlow,
    restoreFlow,
    updateCount,
    updateTimeBased,
    setFlows,
    
    // Enhanced offline-first actions
    createFlowOfflineFirst,
    updateFlowOfflineFirst,
    
    // Migration and sync functions
    migrateLocalFlowsToCloud,
    processSyncQueue,
    enqueueSync,
    clearSyncQueue,
    
    // Debug functions
    debugFlowStatus,
    loadData,
    triggerSync,
    forceSync,
    forceCompleteRefresh,
    
    // Sync actions
    clearSyncQueue: syncService.clearSyncQueue,
    clearConflicts: syncService.clearConflicts,
    
    // Filters
    getFlowsByPlan,
    getFlowsByTag,
    getActiveFlows,
    getArchivedFlows,
    getDeletedFlows
  }), [
    memoizedFlows,
    isLoading,
    syncStatus,
    lastSyncTime,
    addFlow,
    updateFlow,
    updateFlowStatus,
    deleteFlow,
    restoreFlow,
    updateCount,
    updateTimeBased,
    setFlows,
    createFlowOfflineFirst,
    updateFlowOfflineFirst,
    migrateLocalFlowsToCloud,
    processSyncQueue,
    enqueueSync,
    clearSyncQueue,
    debugFlowStatus,
    loadData,
    triggerSync,
    forceSync,
    forceCompleteRefresh,
    getActiveFlows,
    getArchivedFlows,
    getDeletedFlows,
    getFlowsByPlan,
    getFlowsByTag
  ]);

  logger.log('FlowsProvider: Providing context value:', {
    flowsCount: flows.length,
    hasAddFlow: !!addFlow,
    hasUpdateFlow: !!updateFlow
  });

  return (
    <FlowsContext.Provider value={contextValue}>
      {children}
    </FlowsContext.Provider>
  );
};
