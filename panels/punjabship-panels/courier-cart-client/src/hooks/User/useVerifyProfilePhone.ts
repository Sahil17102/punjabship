// src/hooks/useRequestPasswordLogin.ts

import { useMutation } from "@tanstack/react-query";
import {
  requestProfilePhoneVerification,
  verifyProfilePhone,
} from "../../api/userProfile.api";

export const useRequestProfilePhoneVerify = () => {
  return useMutation({
    mutationFn: ({ phone }: { phone?: string }) =>
      requestProfilePhoneVerification(phone),
  });
};

export const useVerifyProfilePhoneOtp = () =>
  useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      verifyProfilePhone(phone, otp),
  });
