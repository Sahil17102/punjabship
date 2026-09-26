// src/services/storeService.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserStoreIntegrations } from "../../api/integrations";
import axiosInstance from "../../api/axiosInstance";

export const useUserChannelIntegrations = () => {
  return useQuery({
    queryKey: ["stores"],
    queryFn: () => getUserStoreIntegrations(),
    staleTime: 1000 * 60 * 5, // optional: cache for 5 mins
    refetchOnWindowFocus: false,
  });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storeId, platformId }: { storeId: string; platformId: number | null }) =>
      axiosInstance.delete(
        platformId === 1
          ? `/integrations/shopify/stores/${storeId}`
          : `/integrations/stores/${storeId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
};
