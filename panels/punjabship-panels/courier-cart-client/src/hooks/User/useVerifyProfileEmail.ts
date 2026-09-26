// src/hooks/useRequestPasswordLogin.ts

import { useMutation } from "@tanstack/react-query";
import {
  requestProfileEmailVerification,
  verifyProfileEmail,
} from "../../api/userProfile.api";

export const useRequestProfileEmailVerify = () => {
  return useMutation({
    mutationFn: ({ updatedEmail }: { updatedEmail?: string }) =>
      requestProfileEmailVerification(updatedEmail),
  });
};

export const useVerifyProfileEmailOtp = () =>
  useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifyProfileEmail(email, otp),
  });
