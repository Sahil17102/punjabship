import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { FaMagento } from "react-icons/fa";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/auth/AuthContext";
import { toast } from "../../UI/Toast";
import { useIntegrateMagento } from "../../../hooks/useIntegrations";
import Magento2ConnectionModal from "./Magento2ConnectionModal";

export interface MagentoForm {
  storeUrl: string;
  accessToken: string;
  userId?: string;
  status?: "active" | "inactive";
  settings?: {
    autoUpdateStatus?: boolean;
    syncInventory?: boolean;
  };
}

interface IMagentoIntegrationProps {
  fullWidth?: boolean;
  forOnboarding?: boolean;
  fromChannelList?: boolean;
}

export default function Magento2Integration({
  fullWidth,
  forOnboarding = false,
  fromChannelList = false,
}: IMagentoIntegrationProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [magentoDetails, setMagentoDetails] = useState<MagentoForm>({
    storeUrl: "",
    accessToken: "",
    userId: user?.userId ?? "",
    status: "active",
  });

  const [inputErrors, setInputErrors] = useState<Partial<MagentoForm>>({});
  const { mutate: integrateMagento, isPending: integrating } =
    useIntegrateMagento();

  const validateFields = () => {
    const errors: Partial<MagentoForm> = {};
    if (!magentoDetails.storeUrl.trim()) {
      errors.storeUrl = "Store URL is required";
    } else if (!/^https?:\/\/.+/.test(magentoDetails.storeUrl)) {
      errors.storeUrl = "Enter a valid URL with http or https";
    }
    if (!magentoDetails.accessToken.trim()) {
      errors.accessToken = "Access Token is required";
    }
    setInputErrors(errors);
    return Object.values(errors).every((val) => !val);
  };

  const handleConnect = () => {
    if (!validateFields()) return;

    integrateMagento(
      { ...magentoDetails, userId: magentoDetails.userId! },
      {
        onSuccess: (data) => {
          toast.open({ message: data.message, severity: "success" });
          setOpenModal(false);
          if (!forOnboarding && !fromChannelList) {
            queryClient.invalidateQueries({ queryKey: ["stores"] });
          }
          if (fromChannelList && !forOnboarding) {
            navigate("/channels/connected");
          }
        },
        onError: () => {
          toast.open({
            message: "Error connecting Magento store",
            severity: "error",
          });
        },
      }
    );
  };

  const isConnected: boolean = user?.salesChannels?.magento;

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
            <FaMagento size={28} />
          </Box>
          <Typography fontWeight={600}>Magento 2</Typography>
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

      <Magento2ConnectionModal
        openModal={openModal}
        onSetOpen={() => setOpenModal(false)}
        magentoDetails={magentoDetails}
        setMagentoDetails={setMagentoDetails}
        inputErrors={inputErrors}
        handleConnect={handleConnect}
        integrating={integrating}
        forOnboarding={forOnboarding}
      />
    </>
  );
}
