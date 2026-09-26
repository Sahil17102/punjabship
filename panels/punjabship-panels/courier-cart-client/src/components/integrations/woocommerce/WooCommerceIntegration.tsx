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
import { SiWoo } from "react-icons/si";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/auth/AuthContext";
import { toast } from "../../UI/Toast";
import WooCommerceConnectionModal from "./WooCommerceConnectionModal";
import { useIntegrateWooCommerce } from "../../../hooks/useIntegrations";

export interface WooCommerceForm {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  userId?: string;
  status?: "active" | "inactive";
  settings?: {
    autoUpdateStatus?: boolean;
    autoUpdateShipmentStatus?: boolean;
    markCodPaid?: boolean;
    historicalTerminalSyncDays?: number;
  };
}

interface IWooCommerceIntegrationProps {
  fullWidth?: boolean;
  forOnboarding?: boolean;
  fromChannelList?: boolean;
}

export default function WooCommerceIntegration({
  fullWidth,
  forOnboarding = false,
  fromChannelList = false,
}: IWooCommerceIntegrationProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [wooDetails, setWooDetails] = useState<WooCommerceForm>({
    storeUrl: "",
    consumerKey: "",
    consumerSecret: "",
    userId: user?.userId ?? "",
    status: "active",
    settings: {
      autoUpdateStatus: true,
      autoUpdateShipmentStatus: true,
      markCodPaid: false,
      historicalTerminalSyncDays: 10,
    },
  });

  const [inputErrors, setInputErrors] = useState<Partial<WooCommerceForm>>({});
  const { mutate: integrateWooCommerce, isPending: integrating } =
    useIntegrateWooCommerce();

  const validateFields = () => {
    const errors: Partial<WooCommerceForm> = {};
    if (!wooDetails.storeUrl.trim()) {
      errors.storeUrl = "Store URL is required";
    } else if (
      !/^(https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(
        wooDetails.storeUrl.trim()
      )
    ) {
      errors.storeUrl = "Enter a valid store URL";
    }
    if (!wooDetails.consumerKey.trim()) {
      errors.consumerKey = "Consumer Key is required";
    } else if (!wooDetails.consumerKey.trim().startsWith("ck_")) {
      errors.consumerKey = "Consumer Key should start with ck_";
    }
    if (!wooDetails.consumerSecret.trim()) {
      errors.consumerSecret = "Consumer Secret is required";
    } else if (!wooDetails.consumerSecret.trim().startsWith("cs_")) {
      errors.consumerSecret = "Consumer Secret should start with cs_";
    }
    setInputErrors(errors);
    return Object.values(errors).every((val) => !val);
  };

  const handleConnect = () => {
    if (!validateFields()) return;
    integrateWooCommerce(
      { ...wooDetails, userId: user?.userId },
      {
        onSuccess: (data) => {
          toast.open({
            message: data?.warning ? `${data.message}. ${data.warning}` : data.message,
            severity: data?.warning ? "warning" : "success",
          });
          setOpenModal(false);
          if (!forOnboarding && !fromChannelList) {
            queryClient.invalidateQueries({ queryKey: ["stores"] });
          }
          if (fromChannelList && !forOnboarding) {
            navigate("/channels/connected");
          }
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "Error connecting WooCommerce store";
          toast.open({
            message,
            severity: "error",
          });
        },
      }
    );
  };

  const isConnected: boolean = user?.salesChannels?.woocommerce;

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
            <SiWoo size={28} />
          </Box>
          <Typography fontWeight={600}>WooCommerce</Typography>
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

      <WooCommerceConnectionModal
        openModal={openModal}
        onSetOpen={() => setOpenModal(false)}
        wooDetails={wooDetails}
        setWooDetails={setWooDetails}
        inputErrors={inputErrors}
        handleConnect={handleConnect}
        integrating={integrating}
        forOnboarding={forOnboarding}
      />
    </>
  );
}
