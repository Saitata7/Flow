import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays } from 'date-fns';

const FLOWS_STORAGE_KEY = 'flows';

export const FlowsContext = createContext();

export const FlowsProvider = ({ children }) => {
  const [flows, setFlows] = useState([]);
  const [updateQueue, setUpdateQueue] = useState([]);

  const generateStatusDates = useCallback((trackingType, unitText, hours, minutes, seconds, goal) => {
    const status = {};
    for (let i = 0; i < 7; i++) {
      const dateKey = format(addDays(new Date(), i), 'yyyy-MM-dd');
      status[dateKey] = {
        symbol: '➖',
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
      const flowsData = await AsyncStorage.getItem(FLOWS_STORAGE_KEY);
      if (flowsData) {
        const loadedFlows = JSON.parse(flowsData);
        setFlows(loadedFlows);
        console.log('Loaded flows:', loadedFlows);
      }
    } catch (e) {
      console.error('Failed to load flows:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
          
          // Optional fields with defaults
          description: flow.description || '',
          everyDay: flow.everyDay || false,
          daysOfWeek: flow.daysOfWeek || [],
          reminderTime: flow.time || null,
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
          goal: flow.trackingType === 'Quantitative' ? flow.goal || 0 : undefined,
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
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(newFlows));
        setFlows(newFlows);
        console.log('Added flow:', newFlow);
      } catch (e) {
        console.error('Failed to add flow:', e);
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
            symbol: '➖',
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
            newStatus.symbol = count >= goal ? '✅' : count >= goal * 0.5 ? '🌗' : count > 0 ? '❌' : '➖';
          } else if (flow.trackingType === 'Time-based' && updates.timebased) {
            newStatus.timebased = { ...currentStatus.timebased, ...updates.timebased };
            const duration = newStatus.timebased.totalDuration || 0;
            const goalSeconds = ((flow.hours || 0) * 3600) + ((flow.minutes || 0) * 60) + (flow.seconds || 0);
            newStatus.symbol = duration >= goalSeconds ? '✅' : duration >= goalSeconds * 0.5 ? '🌗' : duration > 0 ? '❌' : '➖';
          } else {
            newStatus.symbol = updates.symbol || '➖';
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
        const now = new Date().toISOString();
        const updatedFlows = flows.map((flow) =>
          flow.id === id ? { 
            ...flow, 
            ...updates, 
            updatedAt: now,
            schemaVersion: 2 // Ensure schema version is updated
          } : flow
        );
        await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
        setFlows(updatedFlows);
        console.log('Updated flow:', { id, updates });
      } catch (e) {
        console.error('Failed to update flow:', e);
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
          await AsyncStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
          setFlows(updatedFlows);
          console.log('Soft deleted flow:', id);
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

  return (
    <FlowsContext.Provider
      value={{
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
        
        // Filters
        getFlowsByPlan,
        getFlowsByTag,
        getActiveFlows,
        getArchivedFlows,
        getDeletedFlows
      }}
    >
      {children}
    </FlowsContext.Provider>
  );
};
