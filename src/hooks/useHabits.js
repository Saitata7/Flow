// hooks/useHabits.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

// Assume habitService with getHabits, createHabit, completeHabit, etc.

const useHabits = () => {
  const queryClient = useQueryClient();

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: habitService.getHabits,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const createHabitMutation = useMutation({
    mutationFn: habitService.createHabit,
    onMutate: async (newHabit) => {
      await queryClient.cancelQueries(['habits']);
      const previousHabits = queryClient.getQueryData(['habits']);
      queryClient.setQueryData(['habits'], (old) => [...old, newHabit]);
      return { previousHabits };
    },
    onError: (err, newHabit, context) => {
      queryClient.setQueryData(['habits'], context.previousHabits);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    onSettled: () => queryClient.invalidateQueries(['habits']),
  });

  const completeHabitMutation = useMutation({
    mutationFn: habitService.completeHabit,
    onMutate: async ({ id }) => {
      const previousHabits = queryClient.getQueryData(['habits']);
      queryClient.setQueryData(['habits'], (old) => 
        old.map(h => h.id === id ? { ...h, completed: true } : h)
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { previousHabits };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(['habits'], context.previousHabits);
    },
    onSettled: () => queryClient.invalidateQueries(['habits']),
  });

  // Calculate derived state
  const todayHabits = habits.filter(h => /* logic for today */);
  const streaks = {}; // Calculate streaks

  return {
    habits,
    todayHabits,
    isLoading,
    createHabit: createHabitMutation.mutate,
    completeHabit: completeHabitMutation.mutate,
    // Add update, delete, etc.
    refetch: () => queryClient.refetchQueries(['habits']),
  };
};

export default useHabits;