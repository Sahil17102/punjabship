// src/hooks/useCompleteUserOnboarding.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeUserOnboarding } from "../api/user";
import { toast } from "../components/UI/Toast";

export const useCompleteUserOnboarding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      step,
      data,
    }: {
      step: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: Record<string, any>;
    }) => completeUserOnboarding(step, data),

    onSuccess: (data) => {
      if (data)
        queryClient.invalidateQueries({
          queryKey: ["userInfo"],
        });
      return data;
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.open({
        message: error?.response?.data?.error ?? "Error saving details",
        severity: "error",
        duration: 8000,
      });
      console.error("Onboarding error", error);
    },
  });
};
