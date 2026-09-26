import type { IUserProfileDB } from "../types/user.types";
import axiosInstance from "./axiosInstance";

export const fetchUserProfile = async (): Promise<IUserProfileDB> => {
  const response = await axiosInstance.get<IUserProfileDB>("/profile/user/");
  return response.data;
};

/**
 * PATCH /api/v1/user-profiles/me
 * Update user profile (can be partial)
 */
export const updateUserProfile = async (
  payload: Partial<IUserProfileDB>
): Promise<{ message: string; user: IUserProfileDB }> => {
  const { data } = await axiosInstance.patch<{
    message: string;
    user: IUserProfileDB;
  }>("/profile/", payload);
  return data;
};

export const requestProfileEmailVerification = async (
  updatedEmail?: string
) => {
  const { data } = await axiosInstance.post(
    "/profile/request-email-verification",
    {
      updatedEmail,
    }
  );
  return data;
};

export const verifyProfileEmail = async (updatedEmail: string, otp: string) => {
  const { data } = await axiosInstance.post("/profile/verify-profile-email", {
    email: updatedEmail,
    otp,
  });
  return data;
};

export const requestProfilePhoneVerification = async (
  updatedPhone?: string
) => {
  const { data } = await axiosInstance.post(
    "/profile/request-phone-verification",
    {
      updatedPhone,
    }
  );
  return data;
};

export const verifyProfilePhone = async (phone: string, otp: string) => {
  const { data } = await axiosInstance.post("/profile/verify-profile-phone", {
    phone,
    otp,
  });
  return data;
};
