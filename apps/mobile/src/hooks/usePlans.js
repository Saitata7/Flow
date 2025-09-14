// hooks/usePlans.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import planService from '../services/planService';
import { generateIdempotencyKey } from '../utils/idempotency';
import useAuth from './useAuth';

const usePlans = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user's personal plans
  const { data: personalPlans, isLoading: personalPlansLoading } = useQuery({
    queryKey: ['plans', 'personal', user?.id],
    queryFn: () => planService.getUserPlans(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  // Get public plans
  const { data: publicPlans, isLoading: publicPlansLoading } = useQuery({
    queryKey: ['plans', 'public'],
    queryFn: () => planService.getPublicPlans(),
    staleTime: 5 * 60 * 1000,
    cacheTime: 24 * 60 * 60 * 1000,
  });

  // Get favourite plans
  const { data: favouritePlans, isLoading: favouritePlansLoading } = useQuery({
    queryKey: ['plans', 'favourites', user?.id],
    queryFn: () => planService.getFavouritePlans(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 24 * 60 * 60 * 1000,
  });

  // Get plan details
  const getPlanDetails = (planId) => {
    return useQuery({
      queryKey: ['plans', 'detail', planId],
      queryFn: () => planService.getPlanById(planId),
      enabled: !!planId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 1000,
    });
  };

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (planData) => {
      const idempotencyKey = generateIdempotencyKey('create-plan', user?.id, new Date());
      return planService.createPlan(planData, idempotencyKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plans', 'personal', user?.id]);
    },
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, updateData }) => {
      const idempotencyKey = generateIdempotencyKey('update-plan', planId, new Date());
      return planService.updatePlan(planId, updateData, idempotencyKey);
    },
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries(['plans', 'detail', planId]);
      queryClient.invalidateQueries(['plans', 'personal', user?.id]);
    },
  });

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (planId) => {
      const idempotencyKey = generateIdempotencyKey('delete-plan', planId, new Date());
      return planService.deletePlan(planId, idempotencyKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plans', 'personal', user?.id]);
    },
  });

  // Join plan mutation
  const joinPlanMutation = useMutation({
    mutationFn: async (planId) => {
      const idempotencyKey = generateIdempotencyKey('join-plan', planId, new Date());
      return planService.joinPlan(planId, user?.id, idempotencyKey);
    },
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries(['plans', 'detail', planId]);
      queryClient.invalidateQueries(['plans', 'public']);
    },
  });

  // Leave plan mutation
  const leavePlanMutation = useMutation({
    mutationFn: async (planId) => {
      const idempotencyKey = generateIdempotencyKey('leave-plan', planId, new Date());
      return planService.leavePlan(planId, user?.id, idempotencyKey);
    },
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries(['plans', 'detail', planId]);
      queryClient.invalidateQueries(['plans', 'personal', user?.id]);
    },
  });

  // Add to favourites mutation
  const addToFavouritesMutation = useMutation({
    mutationFn: async (planId) => {
      const idempotencyKey = generateIdempotencyKey('favourite-plan', planId, new Date());
      return planService.addToFavourites(planId, user?.id, idempotencyKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plans', 'favourites', user?.id]);
    },
  });

  // Remove from favourites mutation
  const removeFromFavouritesMutation = useMutation({
    mutationFn: async (planId) => {
      const idempotencyKey = generateIdempotencyKey('unfavourite-plan', planId, new Date());
      return planService.removeFromFavourites(planId, user?.id, idempotencyKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plans', 'favourites', user?.id]);
    },
  });

  // Search plans mutation
  const searchPlansMutation = useMutation({
    mutationFn: ({ query, filters }) => planService.searchPlans(query, filters),
  });

  // Get plan analytics
  const getPlanAnalytics = (planId) => {
    return useQuery({
      queryKey: ['plans', 'analytics', planId],
      queryFn: () => planService.getPlanAnalytics(planId),
      enabled: !!planId,
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 60 * 60 * 1000, // 1 hour
    });
  };

  // Get plan leaderboard
  const getPlanLeaderboard = (planId, type = 'strict') => {
    return useQuery({
      queryKey: ['plans', 'leaderboard', planId, type],
      queryFn: () => planService.getPlanLeaderboard(planId, type),
      enabled: !!planId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000, // 30 minutes
    });
  };

  // Get plan participants
  const getPlanParticipants = (planId) => {
    return useQuery({
      queryKey: ['plans', 'participants', planId],
      queryFn: () => planService.getPlanParticipants(planId),
      enabled: !!planId,
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
    });
  };

  // Update plan progress mutation
  const updatePlanProgressMutation = useMutation({
    mutationFn: async ({ planId, progressData }) => {
      const idempotencyKey = generateIdempotencyKey('update-progress', planId, new Date());
      return planService.updatePlanProgress(planId, user?.id, progressData, idempotencyKey);
    },
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries(['plans', 'detail', planId]);
      queryClient.invalidateQueries(['plans', 'analytics', planId]);
      queryClient.invalidateQueries(['plans', 'leaderboard', planId]);
    },
  });

  return {
    // Data
    personalPlans: personalPlans || [],
    publicPlans: publicPlans || [],
    favouritePlans: favouritePlans || [],
    
    // Loading states
    isLoading: personalPlansLoading || publicPlansLoading || favouritePlansLoading,
    personalPlansLoading,
    publicPlansLoading,
    favouritePlansLoading,
    
    // Mutations
    createPlan: createPlanMutation.mutateAsync,
    updatePlan: updatePlanMutation.mutateAsync,
    deletePlan: deletePlanMutation.mutateAsync,
    joinPlan: joinPlanMutation.mutateAsync,
    leavePlan: leavePlanMutation.mutateAsync,
    addToFavourites: addToFavouritesMutation.mutateAsync,
    removeFromFavourites: removeFromFavouritesMutation.mutateAsync,
    searchPlans: searchPlansMutation.mutateAsync,
    updatePlanProgress: updatePlanProgressMutation.mutateAsync,
    
    // Mutation states
    isCreating: createPlanMutation.isLoading,
    isUpdating: updatePlanMutation.isLoading,
    isDeleting: deletePlanMutation.isLoading,
    isJoining: joinPlanMutation.isLoading,
    isLeaving: leavePlanMutation.isLoading,
    isAddingToFavourites: addToFavouritesMutation.isLoading,
    isRemovingFromFavourites: removeFromFavouritesMutation.isLoading,
    isSearching: searchPlansMutation.isLoading,
    isUpdatingProgress: updatePlanProgressMutation.isLoading,
    
    // Errors
    createError: createPlanMutation.error,
    updateError: updatePlanMutation.error,
    deleteError: deletePlanMutation.error,
    joinError: joinPlanMutation.error,
    leaveError: leavePlanMutation.error,
    favouriteError: addToFavouritesMutation.error || removeFromFavouritesMutation.error,
    searchError: searchPlansMutation.error,
    progressError: updatePlanProgressMutation.error,
    
    // Query functions
    getPlanDetails,
    getPlanAnalytics,
    getPlanLeaderboard,
    getPlanParticipants,
    
    // Utility functions
    validatePlanData: planService.validatePlanData,
  };
};

export default usePlans;