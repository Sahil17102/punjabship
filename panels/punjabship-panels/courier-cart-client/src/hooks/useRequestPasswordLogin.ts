// src/hooks/useRequestPasswordLogin.ts

import { useMutation } from "@tanstack/react-query";
import { requestPasswordLoginApi, verifyEmailOtpApi } from "../api/auth";

export const useRequestPasswordLogin = () => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password?: string }) =>
      requestPasswordLoginApi(email, password),
  });
};

export const useVerifyEmailOtp = () =>
  useMutation({
    mutationFn: ({
      email,
      otp,
      password,
    }: {
      email: string;
      otp: string;
      password: string;
    }) => verifyEmailOtpApi(email, otp, password),
  });
