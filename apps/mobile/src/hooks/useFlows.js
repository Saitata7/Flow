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
    mutationFn: flowService.createFlow,
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
    mutationFn: flowService.completeFlow,
    onMutate: async ({ id }) => {
      const previousFlows = queryClient.getQueryData(['flows']);
      queryClient.setQueryData(['flows'], (old) => 
        old.map(f => f.id === id ? { ...f, completed: true } : f)
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
  const todayFlows = flows.filter(f => /* logic for today */);
  const streaks = {}; // Calculate streaks

  return {
    flows,
    todayFlows,
    isLoading,
    createFlow: createFlowMutation.mutate,
    completeFlow: completeFlowMutation.mutate,
    // Add update, delete, etc.
    refetch: () => queryClient.refetchQueries(['flows']),
  };
};

export default useFlows;