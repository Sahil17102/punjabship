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
import {} from "react-icons/fa";
import { useState } from "react";
// import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/auth/AuthContext";
import { useIntegrateBigCommerce } from "../../../hooks/useIntegrations";
import { toast } from "../../UI/Toast";
import { SiBigcommerce } from "react-icons/si";
import BigCommerceConnectionModal from "./BigCommerceConnectionModal";

export interface BigCommerceForm {
  storeHash: string;
  accessToken: string;
  userId?: string;
  status?: "active" | "inactive";
}

export default function BigCommerceIntegration({
  fullWidth = false,
  // fromChannelList = false,
  forOnboarding = false,
}) {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [bcDetails, setBcDetails] = useState<BigCommerceForm>({
    storeHash: "",
    accessToken: "",
    userId: user?.userId ?? "",
    status: "active",
  });
  const [errors, setErrors] = useState<Partial<BigCommerceForm>>({});
  const { mutate: integrateBC, isPending } = useIntegrateBigCommerce();

  const validate = () => {
    const errs: Partial<BigCommerceForm> = {};
    if (!bcDetails.storeHash.trim()) errs.storeHash = "Store Hash is required";
    if (!bcDetails.accessToken.trim())
      errs.accessToken = "Access Token is required";
    setErrors(errs);
    return Object.values(errs).every((e) => !e);
  };

  const handleConnect = () => {
    if (!validate()) return;
    integrateBC(bcDetails, {
      onSuccess: (data) => {
        toast.open({ message: data.message, severity: "success" });
        setOpenModal(false);
        if (forOnboarding) navigate("/channels/connected");
      },
      onError: () => {
        toast.open({
          message: "Failed to connect BigCommerce",
          severity: "error",
        });
      },
    });
  };

  const isConnected = user?.salesChannels?.bigcommerce;

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
            <SiBigcommerce size={28} />
          </Box>
          <Typography fontWeight={600}>BigCommerce</Typography>
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
      <BigCommerceConnectionModal
        openModal={openModal}
        onSetOpen={() => setOpenModal(false)}
        bigCommerceDetails={bcDetails}
        setBigCommerceDetails={setBcDetails}
        inputErrors={errors}
        handleConnect={handleConnect}
        integrating={isPending}
      />
    </>
  );
}
