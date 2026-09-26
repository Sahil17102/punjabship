import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "../../components/UI/Toast";
import { changePassword } from "../../api/auth";

/**
 * Hook consumed by <PasswordSettingsForm />
 */
export const useChangePassword = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { currentPassword?: string; newPassword: string }) =>
      changePassword(data),
    onSuccess: () => {
      toast.open({ message: "Password updated", severity: "success" });
      // If you cache user info (e.g. /me) invalidate it here
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      toast.open({
        message: err?.response?.data?.message ?? "Password change failed",
        severity: "error",
      });
    },
  });
};
