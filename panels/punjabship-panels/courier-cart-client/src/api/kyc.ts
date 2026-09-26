import type { KycDetails } from "../types/user.types";
import axiosInstance from "./axiosInstance";

export const submitKyc = async (details: Partial<KycDetails>) => {
  const { data } = await axiosInstance.post("/profile/kyc", details);
  return data;
};

export const getKyc = async () => {
  const { data } = await axiosInstance.get("/profile/kyc");
  return data;
};

// services/kycOCR.ts
export interface ExtractTextResponse {
  text: string;
}
