import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';
import jwtApiService from '../services/jwtApiService';
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

  logger.log('FlowsProvider: Initializing with', flows.length, 'flows');
  logger.log('FlowsProvider: Current flows:', flows.map(f => ({ id: f.id, title: f.title })));

  const generateStatusDates = useCallback((trackingType, unitText, hours, minutes, seconds, goal) => {
    const status = {};
    for (let i = 0; i < 7; i++) {
      const dateKey = format(addDays(new Date(), i), 'yyyy-MM-dd');
      status[dateKey] = {
        symbol: null, // Don't default to skipped
        emotion: null,
        note: null,
        timestamp: null,
        quantitative: trackingType === 'Quantitative' ? { unitText, goal, count: 0 } : null,
        timebased: trackingType === 'Time-based' ? {
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
        } : null
      };
    }
    return status;
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
      logger.log('FlowsContext: loadData called - current flows count:', flows.length);
      logger.log('FlowsContext: isAuthenticated:', isAuthenticated);
      
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
      if (isAuthenticated && user) {
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
        logger.log('FlowsContext: Sync skipped - isAuthenticated:', isAuthenticated, 'user:', !!user);
      }
      
      logger.log('=== FLOWS CONTEXT LOAD DATA END ===');
    } catch (e) {
      logger.error('FlowsContext: Failed to load flows:', e);
      logger.error('FlowsContext: Error stack:', e.stack);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

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
    logger.log('FlowsContext: isAuthenticated:', isAuthenticated);
    logger.log('FlowsContext: user exists:', !!user);
    
    // Debug authentication state
    const authDebug = await jwtApiService.debugAuthState();
    logger.log('FlowsContext: Auth debug result:', authDebug);
    
    // Double-check authentication with actual JWT token
    const userAuthenticated = await jwtApiService.isUserAuthenticated();
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
      
      // Force reload data from backend by clearing local cache first
      logger.log('FlowsContext: Clearing local cache to force fresh backend data...');
      
      // Store current local flows before clearing cache
      const currentLocalFlows = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      const localFlows = currentLocalFlows ? JSON.parse(currentLocalFlows) : [];
      logger.log('FlowsContext: Stored local flows before sync:', localFlows.length, 'flows');
      
      await AsyncStorage.removeItem(FLOWS_STORAGE_KEY);
      
      // Also clear any cached API responses
      await AsyncStorage.removeItem('api_cache_flows');
      await AsyncStorage.removeItem('api_cache_flow_entries');
      
      // Fetch fresh data from backend
      logger.log('FlowsContext: Fetching fresh flows from backend...');
      
      // Double-check authentication before making API call
      // Add a small delay to allow auth state to settle after login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isAuthenticated = await jwtApiService.isUserAuthenticated();
      if (!isAuthenticated) {
        logger.log('FlowsContext: User not authenticated, skipping API call');
        logger.log('FlowsContext: This is expected if user is not logged in or is anonymous');
        return;
      }
      
      logger.log('FlowsContext: About to call jwtApiService.getFlows()...');
      const flowsResponse = await jwtApiService.getFlows();
      logger.log('FlowsContext: API response received:', flowsResponse);
      
      if (flowsResponse.success) {
        logger.log('FlowsContext: Fresh flows received from backend:', flowsResponse.data.length, 'flows');
        
        // Backend already merges flow entries into flows.status, so use flows data directly
        logger.log('FlowsContext: Using flows data directly (backend already merged entries)');
        const syncedFlows = flowsResponse.data;
        
        // Merge local status changes with backend data
        const mergedFlows = syncedFlows.map(backendFlow => {
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
            
            return {
              ...backendFlow,
              status: mergedStatus
            };
          }
          return backendFlow;
        });
        
        logger.log('FlowsContext: Synced flows details:', mergedFlows.map(f => ({ 
          id: f.id, 
          title: f.title, 
          trackingType: f.trackingType,
          statusKeys: f.status ? Object.keys(f.status) : 'No status',
          statusCount: f.status ? Object.keys(f.status).length : 0,
          status: f.status ? JSON.stringify(f.status, null, 2) : 'No status'
        })));
        
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
  }, [isAuthenticated]);

  // Enhanced offline-first flow operations
  const createFlowOfflineFirst = useCallback(async (flowData) => {
    try {
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
      };

      // Save to local storage immediately
      const updatedFlows = [...flows, newFlow];
      await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
      setFlows(updatedFlows);
      
      logger.log('FlowsContext: Flow created locally:', newFlow.title);

      // Queue for sync if online
      if (isAuthenticated && jwtApiService.canSync()) {
        await jwtApiService.addToSyncQueue({
          type: 'create_flow',
          data: newFlow,
          flowId: tempId,
        });
        logger.log('FlowsContext: Flow queued for sync');
      }

      return newFlow;
    } catch (error) {
      logger.error('FlowsContext: Failed to create flow:', error);
      throw error;
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
      if (isAuthenticated && jwtApiService.canSync()) {
        await jwtApiService.addToSyncQueue({
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

  useEffect(() => {
    logger.log('=== FLOWS CONTEXT MOUNT EFFECT START ===');
    logger.log('FlowsContext: Initial load on mount');
    logger.log('FlowsContext: About to call cleanupInvalidFlows()...');
    cleanupInvalidFlows(); // Clean up invalid flows first
    logger.log('FlowsContext: cleanupInvalidFlows() completed');
    
    // Only load data if user is authenticated
    if (isAuthenticated) {
      logger.log('FlowsContext: User is authenticated, calling loadData()...');
      loadData();
      logger.log('FlowsContext: loadData() call completed');
    } else {
      logger.log('FlowsContext: User not authenticated, skipping loadData()');
    }
    logger.log('=== FLOWS CONTEXT MOUNT EFFECT END ===');
  }, [isAuthenticated]); // Depend on isAuthenticated


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
        
        // If authenticated and sync enabled, try immediate API call first, then queue as fallback
        if (isAuthenticated && syncService.canSync() && newFlow.storagePreference === 'cloud') {
          logger.log('🌐 FlowsContext: Attempting immediate API call for cloud flow creation:', newFlow.title);
          logger.log('🌐 FlowsContext: Flow data:', {
            id: newFlow.id,
            title: newFlow.title,
            storagePreference: newFlow.storagePreference,
            trackingType: newFlow.trackingType
          });
          try {
            const apiResult = await jwtApiService.createFlow(newFlow);
            logger.log('🌐 FlowsContext: API response:', apiResult);
            if (apiResult.success) {
              logger.log('✅ FlowsContext: Cloud flow created successfully on backend:', apiResult.data);
              // Update local flow with backend data if needed
              if (apiResult.data && apiResult.data.id !== newFlow.id) {
                const updatedFlows = newFlows.map(f => f.id === newFlow.id ? { ...f, id: apiResult.data.id } : f);
                await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
                setFlows(updatedFlows);
                logger.log('✅ FlowsContext: Updated flows with backend ID:', apiResult.data.id);
              }
            } else {
              logger.log('❌ FlowsContext: API call failed, adding to sync queue:', apiResult.error);
              await syncService.addToSyncQueue({
                type: 'CREATE_FLOW',
                data: newFlow,
                flowId: newFlow.id,
              });
              logger.log('🔄 FlowsContext: Added to sync queue for retry');
            }
          } catch (apiError) {
            logger.log('❌ FlowsContext: API call failed with error, adding to sync queue:', apiError.message);
            await syncService.addToSyncQueue({
              type: 'CREATE_FLOW',
              data: newFlow,
              flowId: newFlow.id,
            });
            logger.log('🔄 FlowsContext: Added to sync queue for retry due to error');
          }
        } else if (newFlow.storagePreference === 'local') {
          logger.log('FlowsContext: Local-only flow created, no cloud sync needed');
        } else {
          logger.log('FlowsContext: Not authenticated or sync not available, flow saved locally only');
          if (newFlow.storagePreference === 'cloud') {
            logger.log('⚠️ FlowsContext: Cloud flow created locally - user needs to login to sync to database');
          }
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
            const apiResult = await jwtApiService.updateFlow(id, updates);
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
              const apiResult = await jwtApiService.deleteFlow(id);
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

  const contextValue = {
    // Data
    flows,
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
  };

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
