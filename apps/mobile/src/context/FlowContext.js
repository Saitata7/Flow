import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';
import apiService from '../services/apiService';
import syncService from '../services/syncService';
import { useAuth } from './AuthContext';

const FLOWS_STORAGE_KEY = 'flows';

export const FlowsContext = createContext();

export const FlowsProvider = ({ children }) => {
  const [flows, setFlows] = useState([]);
  const [updateQueue, setUpdateQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const { user, isAuthenticated } = useAuth();

  console.log('FlowsProvider: Initializing with', flows.length, 'flows');
  console.log('FlowsProvider: Current flows:', flows.map(f => ({ id: f.id, title: f.title })));

  const generateStatusDates = useCallback((trackingType, unitText, hours, minutes, seconds, goal) => {
    const status = {};
    for (let i = 0; i < 7; i++) {
      const dateKey = format(addDays(new Date(), i), 'yyyy-MM-dd');
      status[dateKey] = {
        symbol: '/',
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

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('=== FLOWS CONTEXT LOAD DATA START ===');
      console.log('FlowsContext: loadData called - current flows count:', flows.length);
      console.log('FlowsContext: isAuthenticated:', isAuthenticated);
      
      // First, load from local storage
      const flowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      if (flowsData) {
        const loadedFlows = JSON.parse(flowsData).filter(flow => {
          // Filter out flows with invalid IDs
          if (!flow || !flow.id || flow.id === 'undefined') {
            console.warn('FlowsContext: Skipping flow with invalid ID:', flow);
            return false;
          }
          return true;
        });
        console.log('FlowsContext: Loading flows from storage:', loadedFlows.length, 'flows');
        console.log('FlowsContext: Loaded flow details:', loadedFlows.map(f => ({ 
          id: f.id, 
          title: f.title, 
          groupId: f.groupId,
          trackingType: f.trackingType,
          deletedAt: f.deletedAt,
          archived: f.archived
        })));
        setFlows(loadedFlows);
        console.log('FlowsContext: Flows state updated to:', loadedFlows.length, 'flows');
      } else {
        console.log('FlowsContext: No flows data found in storage');
        setFlows([]);
      }

      // If user is authenticated, try to sync with backend (bypass canSync check for development)
      if (isAuthenticated) {
        console.log('FlowsContext: User authenticated, attempting sync...');
        console.log('FlowsContext: canSync result:', await apiService.canSync());
        console.log('FlowsContext: About to call syncWithBackend...');
        await syncWithBackend();
        console.log('FlowsContext: syncWithBackend completed');
      } else {
        console.log('FlowsContext: Sync skipped - isAuthenticated:', isAuthenticated);
      }
      
      console.log('=== FLOWS CONTEXT LOAD DATA END ===');
    } catch (e) {
      console.error('FlowsContext: Failed to load flows:', e);
      console.error('FlowsContext: Error stack:', e.stack);
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
            console.warn('FlowsContext: Removing invalid flow from storage:', flow);
            return false;
          }
          return true;
        });
        
        if (validFlows.length !== allFlows.length) {
          console.log(`FlowsContext: Cleaned up ${allFlows.length - validFlows.length} invalid flows`);
          await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(validFlows));
        }
      }
    } catch (error) {
      console.error('FlowsContext: Error cleaning up invalid flows:', error);
    }
  }, []);

  // Sync with backend using comprehensive sync service
  const syncWithBackend = useCallback(async () => {
    console.log('=== SYNC WITH BACKEND START ===');
    console.log('FlowsContext: syncWithBackend called');
    console.log('FlowsContext: isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('FlowsContext: Sync skipped - not authenticated');
      return;
    }

    try {
      setSyncStatus('syncing');
      console.log('FlowsContext: Starting comprehensive sync...');
      
      // Trigger comprehensive sync
      console.log('FlowsContext: Calling syncService.triggerSync()...');
      await syncService.triggerSync();
      console.log('FlowsContext: syncService.triggerSync() completed');
      
      // Force reload data from backend by clearing local cache first
      console.log('FlowsContext: Clearing local cache to force fresh backend data...');
      await AsyncStorage.removeItem(FLOWS_STORAGE_KEY);
      
      // Also clear any cached API responses
      await AsyncStorage.removeItem('api_cache_flows');
      await AsyncStorage.removeItem('api_cache_flow_entries');
      
      // Fetch fresh data from backend
      console.log('FlowsContext: Fetching fresh flows from backend...');
      console.log('FlowsContext: About to call apiService.getFlows()...');
      const flowsResponse = await apiService.getFlows();
      console.log('FlowsContext: API response received:', flowsResponse);
      
      if (flowsResponse.success) {
        console.log('FlowsContext: Fresh flows received from backend:', flowsResponse.data.length, 'flows');
        console.log('FlowsContext: Flow details:', flowsResponse.data.map(f => ({ 
          id: f.id, 
          title: f.title, 
          trackingType: f.trackingType,
          statusKeys: f.status ? Object.keys(f.status) : 'No status',
          status: f.status ? JSON.stringify(f.status, null, 2) : 'No status'
        })));
        
        setFlows(flowsResponse.data);
        console.log('FlowsContext: Flows state updated to:', flowsResponse.data.length, 'flows');
        
        // Save fresh data to local storage
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(flowsResponse.data));
        console.log('FlowsContext: Fresh flows saved to local storage');
      } else {
        console.warn('FlowsContext: Failed to fetch fresh flows from backend:', flowsResponse.error);
        // Fallback to local storage if backend fails
        const flowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
        if (flowsData) {
          const syncedFlows = JSON.parse(flowsData);
          console.log('FlowsContext: Using fallback flows from storage:', syncedFlows.length, 'flows');
          setFlows(syncedFlows);
        }
      }
      
      setSyncStatus('success');
      setLastSyncTime(syncService.lastSyncTime);
      console.log('FlowsContext: Comprehensive sync completed successfully');
    } catch (error) {
      console.error('FlowsContext: Comprehensive sync failed:', error);
      console.error('FlowsContext: Error stack:', error.stack);
      setSyncStatus('error');
    }
    
    console.log('=== SYNC WITH BACKEND END ===');
  }, [isAuthenticated]);

  // Enhanced offline-first flow operations
  const createFlowOfflineFirst = useCallback(async (flowData) => {
    try {
      console.log('FlowsContext: Creating flow offline-first...');
      
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
      
      console.log('FlowsContext: Flow created locally:', newFlow.title);

      // Queue for sync if online
      if (isAuthenticated && apiService.canSync()) {
        await apiService.addToSyncQueue({
          type: 'create_flow',
          data: newFlow,
          flowId: tempId,
        });
        console.log('FlowsContext: Flow queued for sync');
      }

      return newFlow;
    } catch (error) {
      console.error('FlowsContext: Failed to create flow:', error);
      throw error;
    }
  }, [flows, isAuthenticated]);

  const updateFlowOfflineFirst = useCallback(async (flowId, updates) => {
    try {
      console.log('FlowsContext: Updating flow offline-first...');
      
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
      
      console.log('FlowsContext: Flow updated locally:', updatedFlow.title);

      // Queue for sync if online
      if (isAuthenticated && apiService.canSync()) {
        await apiService.addToSyncQueue({
          type: 'update_flow',
          data: updatedFlow,
          flowId: flowId,
        });
        console.log('FlowsContext: Flow update queued for sync');
      }

      return updatedFlow;
    } catch (error) {
      console.error('FlowsContext: Failed to update flow:', error);
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
      console.log('🔄 Force complete refresh started...');
      
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
      
      console.log('✅ Force complete refresh completed');
    } catch (error) {
      console.error('❌ Force complete refresh failed:', error);
    }
  }, [syncWithBackend]);

  useEffect(() => {
    console.log('=== FLOWS CONTEXT MOUNT EFFECT START ===');
    console.log('FlowsContext: Initial load on mount');
    console.log('FlowsContext: About to call cleanupInvalidFlows()...');
    cleanupInvalidFlows(); // Clean up invalid flows first
    console.log('FlowsContext: cleanupInvalidFlows() completed');
    console.log('FlowsContext: About to call loadData()...');
    loadData();
    console.log('FlowsContext: loadData() call completed');
    console.log('=== FLOWS CONTEXT MOUNT EFFECT END ===');
  }, []); // Only run once on mount


  useEffect(() => {
    if (updateQueue.length > 0) {
      const processQueue = async () => {
        for (const { id, date, updates, type } of updateQueue) {
          console.log('Processing queue item:', { id, date, updates, type });
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
        console.log('FlowsContext: addFlow called with:', flow);
        console.log('FlowsContext: Current flows count before adding:', flows.length);
        
        // Validate title length
        if (!flow.title || flow.title.trim().length < 3) {
          throw new Error('Title must be at least 3 characters long');
        }
        
        if (flow.title.trim().length > 10) {
          throw new Error('Title must be 10 characters or less');
        }
        
        // Check for duplicate title (exclude deleted and archived flows)
        console.log('FlowsContext: Checking for duplicates. Current flows:', flows.map(f => ({ 
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
            console.log('FlowsContext: Error comparing titles:', error, 'existingFlow.title:', existingFlow.title, 'flow.title:', flow.title);
            return false;
          }
        });
        
        if (existingFlow) {
          console.log('FlowsContext: Duplicate title found:', flow.title, 'Existing flow:', existingFlow);
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
        console.log('FlowsContext: Saving flows to storage:', newFlows.length, 'flows');
        console.log('FlowsContext: Current flows before adding:', flows.map(f => ({ id: f.id, title: f.title })));
        console.log('FlowsContext: New flow being added:', { id: newFlow.id, title: newFlow.title });
        
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(newFlows));
        setFlows(newFlows);
        
        // If authenticated and sync enabled, add to sync queue for backend
        if (isAuthenticated && syncService.canSync()) {
          console.log('FlowsContext: Adding flow to sync queue for backend');
          await syncService.addToSyncQueue({
            type: 'CREATE_FLOW',
            data: newFlow,
            flowId: newFlow.id,
          });
        }
        
        // Verify the save worked
        const savedFlows = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
        const parsedSavedFlows = savedFlows ? JSON.parse(savedFlows) : [];
        console.log('FlowsContext: Verified saved flows count:', parsedSavedFlows.length);
        console.log('FlowsContext: Verified saved flows:', parsedSavedFlows.map(f => ({ id: f.id, title: f.title })));
        
        console.log('FlowsContext: Flow added successfully:', newFlow.title);
        console.log('FlowsContext: New flows count after adding:', newFlows.length);
        console.log('FlowsContext: Latest flows:', newFlows.slice(-3).map(f => ({ id: f.id, title: f.title, groupId: f.groupId })));
      } catch (e) {
        console.error('FlowsContext: Failed to add flow:', e);
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
            symbol: '/',
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
            newStatus.symbol = updates.symbol || '/';
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
        console.log('Updated flow status:', { id, date, updates, updatedFlows: updatedFlows.find(f => f.id === id)?.status[date] });

        // If authenticated and sync enabled, add to sync queue for backend
        if (isAuthenticated && syncService.canSync() && !fromQueue) {
          console.log('FlowsContext: Adding flow status update to sync queue for backend');
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
        }
      } catch (e) {
        console.error('Failed to update flow status:', e);
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
        console.log('FlowContext: updateFlow called with:', { id, updates, fromQueue });
        
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
              console.log('FlowsContext: Error comparing titles during update:', error, 'existingFlow.title:', existingFlow.title, 'updates.title:', updates.title);
              return false;
            }
          });
          
          if (existingFlow) {
            console.log('FlowContext: Duplicate title found during update:', updates.title);
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
        console.log('FlowContext: Updated flows array:', updatedFlows.find(f => f.id === id));
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
        setFlows(updatedFlows);
        console.log('FlowContext: Flow updated successfully:', { id, updates });

        // If authenticated and sync enabled, add to sync queue for backend
        if (isAuthenticated && syncService.canSync() && !fromQueue) {
          console.log('FlowContext: Adding flow update to sync queue for backend');
          await syncService.addToSyncQueue({
            type: 'UPDATE_FLOW',
            data: updates,
            flowId: id,
          });
        }
      } catch (e) {
        console.error('FlowContext: Failed to update flow:', e);
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
        console.log('FlowsContext: deleteFlow called with id:', id, 'softDelete:', softDelete);
        console.log('FlowsContext: Current flows before deletion:', flows.map(f => ({ 
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
          console.log('FlowsContext: Updated flows after soft delete:', updatedFlows.map(f => ({ 
            id: f.id, 
            title: f.title, 
            deletedAt: f.deletedAt 
          })));
          await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
          setFlows(updatedFlows);
          console.log('Soft deleted flow:', id);
          
          // If authenticated and sync enabled, add to sync queue for backend
          if (isAuthenticated && syncService.canSync()) {
            console.log('FlowsContext: Adding flow deletion to sync queue for backend');
            await syncService.addToSyncQueue({
              type: 'DELETE_FLOW',
              flowId: id,
            });
          }
          
          // Verify the state was updated
          console.log('FlowsContext: State after delete - flows count:', updatedFlows.length);
          console.log('FlowsContext: Deleted flow should have deletedAt:', updatedFlows.find(f => f.id === id)?.deletedAt);
        } else {
          // Hard delete - remove from array
          const updatedFlows = flows.filter((flow) => flow.id !== id);
          await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
          setFlows(updatedFlows);
          console.log('Hard deleted flow:', id);
        }
      } catch (e) {
        console.error('Failed to delete flow:', e);
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
        console.log('Restored flow:', id);
      } catch (e) {
        console.error('Failed to restore flow:', e);
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
      console.log('Updating timebased:', { id, date, timeUpdate });
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

  console.log('FlowsProvider: Providing context value:', {
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
