import axiosInstance from "./axiosInstance";
import { getAuthTokens } from "./tokenVault";

export interface RequestOtpResponse {
  message: string;
  demoOtp?: string;
  demoOtpExpiresAt?: string;
}

export const requestOtpApi = async (email: string) => {
  const { data } = await axiosInstance.post<RequestOtpResponse>("/auth/request-otp", { email });
  return data;
};

export const verifyOtpApi = async (email: string, otp: string) => {
  const { data } = await axiosInstance.post("/auth/verify-otp", {
    email,
    otp,
  });
  return data;
};

export const requestPasswordLoginApi = async (
  email: string,
  password?: string
) => {
  const { data } = await axiosInstance.post("/auth/request-password-login", {
    email,
    password,
  });
  return data;
};

export const verifyEmailOtpApi = async (
  email: string,
  otp: string,
  password: string
) => {
  const { data } = await axiosInstance.post("/auth/verify-user-email", {
    email,
    token: otp,
    password,
  });
  return data;
};

export const requestPasswordResetApi = async (email: string) => {
  const { data } = await axiosInstance.post("/auth/forgot-password/request", { email });
  return data as { message: string };
};

export const verifyPasswordResetOtpApi = async (email: string, otp: string) => {
  const { data } = await axiosInstance.post("/auth/forgot-password/verify", {
    email,
    otp,
  });
  return data as { message: string; resetToken: string };
};

export const resetPasswordApi = async (
  email: string,
  resetToken: string,
  newPassword: string,
) => {
  const { data } = await axiosInstance.post("/auth/forgot-password/reset", {
    email,
    resetToken,
    newPassword,
  });
  return data as { message: string };
};

export const googleLoginApi = async (code: string) => {
  const { data } = await axiosInstance.post("/auth/signin-with-google", {
    code,
  });
  return data;
};

export const logoutApi = async () => {
  const { refreshToken } = getAuthTokens();
  if (!refreshToken) return;

  await axiosInstance.post(
    "/auth/logout",
    {},
    {
      headers: { "x-refresh-token": refreshToken },
    }
  );
};

/** Payload accepted by the backend */
export interface ChangePasswordPayload {
  newPassword: string;
  currentPassword?: string; // optional when the user has no existing password
}

/**
 * PATCH /api/account/password
 * (Auth cookie / bearer handled by interceptors)
 */
export const changePassword = (data: ChangePasswordPayload) =>
  axiosInstance.patch("/profile/profile-password", data);
