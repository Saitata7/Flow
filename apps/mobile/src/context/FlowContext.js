import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';

const FLOWS_STORAGE_KEY = 'flows';

export const FlowsContext = createContext();

export const FlowsProvider = ({ children }) => {
  const [flows, setFlows] = useState([]);
  const [updateQueue, setUpdateQueue] = useState([]);

  console.log('FlowsProvider: Initializing with', flows.length, 'flows');

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
      console.log('FlowsContext: loadData called - current flows count:', flows.length);
      const flowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      if (flowsData) {
        const loadedFlows = JSON.parse(flowsData);
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
    } catch (e) {
      console.error('FlowsContext: Failed to load flows:', e);
    }
  }, []);

  useEffect(() => {
    console.log('FlowsContext: Initial load on mount');
    loadData();
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
        
        const existingFlow = flows.find(existingFlow => 
          !existingFlow.deletedAt && 
          !existingFlow.archived &&
          existingFlow.title.toLowerCase().trim() === flow.title.toLowerCase().trim()
        );
        
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
          ownerId: flow.ownerId || 'user123', // TODO: Get from auth context
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
        const newFlows = [...flows, newFlow];
        console.log('FlowsContext: Saving flows to storage:', newFlows.length, 'flows');
        console.log('FlowsContext: Current flows before adding:', flows.map(f => ({ id: f.id, title: f.title })));
        console.log('FlowsContext: New flow being added:', { id: newFlow.id, title: newFlow.title });
        
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(newFlows));
        setFlows(newFlows);
        
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
    [flows, generateStatusDates]
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
      } catch (e) {
        console.error('Failed to update flow status:', e);
        if (!fromQueue) {
          setUpdateQueue((prev) => [...prev, { id, date, updates, type: 'status' }]);
        }
      }
    },
    [flows]
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
          const existingFlow = flows.find(existingFlow => 
            existingFlow.id !== id && 
            !existingFlow.deletedAt && 
            !existingFlow.archived &&
            existingFlow.title.toLowerCase().trim() === updates.title.toLowerCase().trim()
          );
          
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
      } catch (e) {
        console.error('FlowContext: Failed to update flow:', e);
        if (!fromQueue) {
          setUpdateQueue((prev) => [...prev, { id, updates, type: 'flow' }]);
        }
      }
    },
    [flows]
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
    [flows]
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
    [flows]
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
    
    // Actions
    addFlow,
    updateFlow,
    updateFlowStatus,
    deleteFlow,
    restoreFlow,
    updateCount,
    updateTimeBased,
    setFlows,
    loadData,
    
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
