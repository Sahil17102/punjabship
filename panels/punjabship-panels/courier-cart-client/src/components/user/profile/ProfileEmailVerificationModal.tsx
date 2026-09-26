import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  TextField,
} from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { toast } from "../../UI/Toast";
import {
  useRequestProfileEmailVerify,
  useVerifyProfileEmailOtp,
} from "../../../hooks/User/useVerifyProfileEmail";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onClose: () => void;
  email: string;
}

export default function ProfileEmailVerificationModal({
  open,
  onClose,
  email,
}: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ otp: string }>();

  const { mutateAsync: sendOTP } = useRequestProfileEmailVerify();
  const { mutateAsync: verifyOTP, isPending: verifying } =
    useVerifyProfileEmailOtp();

  useEffect(() => {
    if (open && email) {
      sendOTP({ updatedEmail: email }).then(() => {
        toast.open({ message: "OTP sent to email", severity: "info" });
      });
    }
  }, [open, email, sendOTP]);

  const handleVerify = async (data: { otp: string }) => {
    try {
      await verifyOTP({ email, otp: data.otp });
      toast.open({ message: "Email verified!", severity: "success" });
      onClose();
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.open({
        message: error?.response?.data?.message || "Invalid OTP",
        severity: "error",
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Verify Your Email</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            Enter the OTP sent to <strong>{email}</strong>
          </Typography>
          <TextField
            label="OTP"
            fullWidth
            {...register("otp", { required: "OTP is required" })}
            error={!!errors.otp}
            helperText={errors.otp?.message}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit(handleVerify)}
          disabled={verifying}
        >
          Verify
        </Button>
      </DialogActions>
    </Dialog>
  );
}
