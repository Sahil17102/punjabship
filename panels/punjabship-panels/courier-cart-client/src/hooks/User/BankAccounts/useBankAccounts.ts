// hooks/useBankAccounts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addBankAccount,
  deleteBankAccountApi,
  editBankAccount,
  getBankAccounts,
  makePrimaryBankAccount,
} from "../../../api/bank.api";
import type { BankAccount } from "../../../types/user.types";

export const useBankAccounts = () => {
  return useQuery({
    queryKey: ["bankAccounts"],
    queryFn: getBankAccounts,
    refetchOnWindowFocus: false,
  });
};

export const useAddBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BankAccount) => addBankAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
    },
  });
};

export function useEditBankAccount() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; patch: Partial<BankAccount> }) =>
      editBankAccount(data?.id, data?.patch),
    onSuccess: (updated) => {
      // 1. Update the cached list returned by getBankAccounts()
      qc.setQueryData<BankAccount[]>(["bankAccounts"], (old) =>
        old
          ? old.map((acc) => (acc.id === updated.id ? updated : acc))
          : [updated]
      );

      // 2. Optionally cache the single account data if you query by id elsewhere
      qc.setQueryData(["bankAccount", updated.id], updated);
    },
  });
}

export function useMakePrimaryBankAccount() {
  const qc = useQueryClient();

  return useMutation<BankAccount, Error, string>({
    mutationFn: (id: string) => makePrimaryBankAccount(id),
    onSuccess: (updated: BankAccount) => {
      // update list cache
      qc.setQueryData<BankAccount[]>(["bankAccounts"], (old) =>
        old
          ? old.map((a) =>
              a.id === updated.id
                ? { ...updated, isPrimary: true }
                : { ...a, isPrimary: false }
            )
          : [updated]
      );
      // single‑item cache
      qc.setQueryData(["bankAccount", updated.id], updated);
    },
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: (id) => deleteBankAccountApi(id),
    onSuccess: (id) => {
      qc.setQueryData<BankAccount[]>(["bankAccounts"], (old) =>
        old ? old.filter((a) => a.id !== id) : []
      );
    },
  });
}
