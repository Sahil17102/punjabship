import type { AxiosError } from "axios";
import type { BankAccount } from "../types/user.types";
import axiosInstance from "./axiosInstance";

export const getBankAccounts = async () => {
  const res = await axiosInstance.get("/bank-account");
  return res.data.accounts;
};

export const addBankAccount = async (data: BankAccount) => {
  const res = await axiosInstance.post("/bank-account", {
    ...data,
    mode: "manual",
  });
  return res.data;
};

export interface VerifyUpiPayload {
  vpa: string;
}

/**
 * What the backend sends back.
 */
export interface VerifyUpiResponse {
  success: boolean;
  name: string | null;
  vpa: string;
}

/**
 * Call POST /api/payment/verify-upi
 */
export async function verifyUpi(
  payload: VerifyUpiPayload
): Promise<VerifyUpiResponse> {
  try {
    const { data } = await axiosInstance.post<VerifyUpiResponse>(
      "/payments/verify-upi",
      payload
    );
    return data;
  } catch (err) {
    const axiosErr = err as AxiosError<{ message: string }>;
    throw new Error(
      axiosErr.response?.data?.message ??
        axiosErr.message ??
        "UPI verification failed"
    );
  }
}

export async function editBankAccount(
  id: string,
  patch: Partial<BankAccount>
): Promise<BankAccount> {
  try {
    const { data } = await axiosInstance.patch<{ account: BankAccount }>(
      `/bank-account/${id}`,
      patch
    );
    return data.account;
  } catch (err) {
    const axiosErr = err as AxiosError<{ message: string }>;
    throw new Error(
      axiosErr.response?.data?.message ??
        axiosErr.message ??
        "Bank‑account update failed"
    );
  }
}

export async function makePrimaryBankAccount(id: string): Promise<BankAccount> {
  const { data } = await axiosInstance.patch<{ account: BankAccount }>(
    `/bank-account/${id}`,
    { isPrimary: true }
  );
  return data.account;
}

export async function deleteBankAccountApi(id: string) {
  await axiosInstance.delete(`/bank-account/${id}`);
  return id;
}
