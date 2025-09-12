// hooks/usePlans.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as IAP from 'react-native-iap'; // Assume installed

const usePlans = () => {
  const queryClient = useQueryClient();

  const { data: currentPlan } = useQuery({
    queryKey: ['plan'],
    queryFn: async () => IAP.getSubscriptions(/* productIds */),
  });

  const upgradePlanMutation = useMutation({
    mutationFn: (planId) => IAP.purchaseSubscription(planId),
    onSuccess: () => queryClient.invalidateQueries(['plan']),
  });

  // Add restore, etc.

  return {
    currentPlan,
    upgradePlan: upgradePlanMutation.mutate,
    // etc.
  };
};

export default usePlans;