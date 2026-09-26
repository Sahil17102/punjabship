import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useState } from "react";
// import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/auth/AuthContext";
import { toast } from "../../UI/Toast";
import { SiWix } from "react-icons/si";
import WixConnectionModal from "./WixConnectionModal";
import { useIntegrateWix } from "../../../hooks/useIntegrations";

export interface WixForm {
  siteId: string;
  accessToken: string;
  userId?: string;
  status?: "active" | "inactive";
}

interface WixIntegrationProps {
  fullWidth?: boolean;
  fromChannelList?: boolean;
  forOnboarding?: boolean;
}

export default function WixIntegration({
  fullWidth = false,
  //   fromChannelList = false,
  forOnboarding = false,
}: WixIntegrationProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  //   const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [wixDetails, setWixDetails] = useState<WixForm>({
    siteId: "",
    accessToken: "",
    userId: user?.userId ?? "",
    status: "active",
  });

  const [errors, setErrors] = useState<Partial<WixForm>>({});
  const { mutate: integrateWix, isPending } = useIntegrateWix();

  const validate = () => {
    const errs: Partial<WixForm> = {};
    if (!wixDetails.siteId.trim()) errs.siteId = "Site ID is required";
    if (!wixDetails.accessToken.trim())
      errs.accessToken = "Access Token is required";
    setErrors(errs);
    return Object.values(errs).every((e) => !e);
  };

  const handleConnect = () => {
    if (!validate()) return;
    integrateWix(wixDetails, {
      onSuccess: (data) => {
        toast.open({ message: data.message, severity: "success" });
        setOpenModal(false);
        if (forOnboarding) navigate("/channels/connected");
      },
      onError: () => {
        toast.open({
          message: "Failed to connect Wix store",
          severity: "error",
        });
      },
    });
  };

  const isConnected = user?.salesChannels?.wix;

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          bgcolor: "transparent",
          borderColor: "rgba(255,255,255,0.1)",
          color: "inherit",
          height: "100%",
          width: fullWidth ? "100%" : "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
          <Box display="flex" justifyContent="center" mb={1}>
            <SiWix size={28} />
          </Box>
          <Typography fontWeight={600}>Wix</Typography>
        </CardContent>

        <CardActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            size="small"
            variant="contained"
            color={isConnected && forOnboarding ? "success" : "inherit"}
            onClick={() => setOpenModal(true)}
            fullWidth={isMobile}
          >
            {forOnboarding && isConnected ? "Connected" : "Connect"}
          </Button>
        </CardActions>
      </Card>

      <WixConnectionModal
        openModal={openModal}
        onSetOpen={() => setOpenModal(false)}
        wixDetails={wixDetails}
        setWixDetails={setWixDetails}
        inputErrors={errors}
        handleConnect={handleConnect}
        integrating={isPending}
      />
    </>
  );
}
