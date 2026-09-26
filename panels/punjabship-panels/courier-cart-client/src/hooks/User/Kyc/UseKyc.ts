import { useMutation, useQuery } from "@tanstack/react-query";
import type { KycDetails } from "../../../types/user.types";
import { getKyc, submitKyc } from "../../../api/kyc";

export const useSubmitKyc = () =>
  useMutation({
    mutationFn: ({ details }: { details: Partial<KycDetails> }) =>
      submitKyc(details),
  });

export const useUserKyc = () =>
  useQuery({
    queryKey: ["userKyc"],
    queryFn: () => getKyc(),
    refetchOnWindowFocus: false,
  });
