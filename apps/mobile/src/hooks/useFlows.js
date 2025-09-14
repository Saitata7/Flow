// hooks/useFlows.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

// Assume flowService with getFlows, createFlow, completeFlow, etc.

const useFlows = () => {
  const queryClient = useQueryClient();

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ['flows'],
    queryFn: flowService.getFlows,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const createFlowMutation = useMutation({
    mutationFn: async (flowData) => {
      // Ensure new flow has v2 schema fields
      const now = new Date().toISOString();
      const enhancedFlowData = {
        ...flowData,
        schemaVersion: 2,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        
        // Set defaults for new v2 fields
        planId: flowData.planId || null,
        goal: flowData.goal || null,
        progressMode: flowData.progressMode || 'sum',
        tags: flowData.tags || [],
        archived: flowData.archived || false,
        visibility: flowData.visibility || 'private'
      };
      
      return flowService.createFlow(enhancedFlowData);
    },
    onMutate: async (newFlow) => {
      await queryClient.cancelQueries(['flows']);
      const previousFlows = queryClient.getQueryData(['flows']);
      queryClient.setQueryData(['flows'], (old) => [...old, newFlow]);
      return { previousFlows };
    },
    onError: (err, newFlow, context) => {
      queryClient.setQueryData(['flows'], context.previousFlows);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    onSettled: () => queryClient.invalidateQueries(['flows']),
  });

  const completeFlowMutation = useMutation({
    mutationFn: async ({ flowId, date, entryData }) => {
      // Ensure flow entry has v2 schema fields
      const now = new Date().toISOString();
      const enhancedEntryData = {
        ...entryData,
        id: entryData.id || Date.now().toString(),
        flowId,
        date,
        schemaVersion: 2,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        
        // Set defaults for new v2 fields
        moodScore: entryData.moodScore || null,
        device: entryData.device || 'mobile',
        geo: entryData.geo || null,
        streakCount: entryData.streakCount || 0,
        edited: false,
        editedBy: null,
        editedAt: null
      };
      
      return flowService.completeFlow(enhancedEntryData);
    },
    onMutate: async ({ flowId, date, entryData }) => {
      const previousFlows = queryClient.getQueryData(['flows']);
      queryClient.setQueryData(['flows'], (old) => 
        old.map(f => {
          if (f.id === flowId) {
            const updatedStatus = {
              ...f.status,
              [date]: {
                ...f.status[date],
                ...entryData,
                timestamp: new Date().toISOString()
              }
            };
            return { ...f, status: updatedStatus };
          }
          return f;
        })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { previousFlows };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['flows'], context.previousFlows);
    },
    onSettled: () => queryClient.invalidateQueries(['flows']),
  });

  // Calculate derived state
  const todayFlows = flows.filter(f => !f.deletedAt && !f.archived);
  const activeFlows = flows.filter(f => !f.deletedAt && !f.archived);
  const archivedFlows = flows.filter(f => !f.deletedAt && f.archived);
  const deletedFlows = flows.filter(f => f.deletedAt);
  
  // Helper functions
  const getFlowsByPlan = (planId) => flows.filter(f => !f.deletedAt && f.planId === planId);
  const getFlowsByTag = (tag) => flows.filter(f => !f.deletedAt && f.tags?.includes(tag));
  const getFlowsByVisibility = (visibility) => flows.filter(f => !f.deletedAt && f.visibility === visibility);

  return {
    // Data
    flows,
    activeFlows,
    archivedFlows,
    deletedFlows,
    todayFlows,
    isLoading,
    
    // Actions
    createFlow: createFlowMutation.mutate,
    completeFlow: completeFlowMutation.mutate,
    refetch: () => queryClient.refetchQueries(['flows']),
    
    // Filters
    getFlowsByPlan,
    getFlowsByTag,
    getFlowsByVisibility,
  };
};

export default useFlows;