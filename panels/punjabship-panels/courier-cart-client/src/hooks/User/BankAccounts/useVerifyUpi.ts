import { useMutation } from "@tanstack/react-query";
import { verifyUpi, type VerifyUpiPayload } from "../../../api/bank.api";

/**
 * Custom hook to verify UPI ID.
 */

export const useVerifyUpi = () => {
  return useMutation({
    mutationFn: (data: VerifyUpiPayload) => verifyUpi(data),
  });
};
