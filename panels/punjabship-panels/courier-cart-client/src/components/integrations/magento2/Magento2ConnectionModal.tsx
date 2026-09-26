import {
  Box,
  Card,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { type Dispatch, type SetStateAction } from "react";
import { FcInfo } from "react-icons/fc";
import { BiLink, BiKey } from "react-icons/bi";
import { FaConnectdevelop } from "react-icons/fa6";
import CustomDialog from "../../UI/modal/CustomModal";
import CustomIconLoadingButton from "../../UI/button/CustomLoadingButton";
import CustomInput from "../../UI/inputs/CustomInput";
import type { MagentoForm } from "./Magento2Integration";

interface IMagentoConnectionModalProps {
  openModal: boolean;
  onSetOpen: () => void;
  handleConnect?: () => void;
  integrating?: boolean;
  magentoDetails: MagentoForm;
  setMagentoDetails: Dispatch<SetStateAction<MagentoForm>>;
  inputErrors?: Partial<MagentoForm>;
  isEditing?: boolean;
  forOnboarding?: boolean;
  handleDelete?: () => void;
  deleting?: boolean;
}

const Magento2ConnectionModal = ({
  openModal,
  onSetOpen,
  handleConnect,
  integrating = false,
  magentoDetails,
  setMagentoDetails,
  //   forOnboarding = false,
  inputErrors,
  isEditing = false,
  handleDelete,
  deleting = false,
}: IMagentoConnectionModalProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <CustomDialog
      width="100%"
      maxWidth="lg"
      open={openModal}
      onClose={onSetOpen}
      title={
        <Stack direction="row" alignItems="center" gap={2}>
          <FaConnectdevelop /> Connect your Magento 2 store
        </Stack>
      }
      footer={
        <Stack direction="row" spacing={1}>
          {isEditing && (
            <CustomIconLoadingButton
              size={isMobile ? "large" : "medium"}
              onClick={handleDelete}
              disabled={integrating}
              loading={deleting}
              icon={<BiKey />}
              text="Remove"
              loadingText="Removing..."
            />
          )}
          <CustomIconLoadingButton
            size={isMobile ? "large" : "medium"}
            onClick={handleConnect}
            disabled={integrating}
            loading={integrating}
            text={isEditing ? "Update" : "Connect"}
            loadingText={isEditing ? "Saving..." : "Connecting..."}
          />
        </Stack>
      }
    >
      <Grid container spacing={4}>
        {/* Instructions Section */}
        <Grid size={{ md: 5, xs: 12 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 1,
              overflowY: "auto",
            }}
          >
            <Typography variant="h6" gutterBottom>
              <FcInfo style={{ marginRight: 8 }} />
              How to generate Magento API token
            </Typography>
            <List dense>
              {[
                { primary: "1. Log in to your Magento Admin panel" },
                { primary: "2. Go to System > Extensions > Integrations" },
                { primary: "3. Click on 'Add New Integration'" },
                {
                  primary:
                    "4. Fill in name & callback URL (you can leave callback blank)",
                },
                {
                  primary:
                    "5. Under API tab, give access to 'Sales', 'Orders', and 'Products'",
                },
                { primary: "6. Save and activate the integration" },
                {
                  primary:
                    "7. Copy Access Token from the generated credentials",
                },
              ].map((step, i) => (
                <ListItem key={i}>
                  <ListItemText primary={step.primary} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>

        {/* Input Form */}
        <Grid size={{ md: 7, xs: 12 }}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Enter Magento 2 Credentials
            </Typography>

            <Stack spacing={2}>
              <CustomInput
                required
                prefix={<BiLink />}
                label="Magento Store URL"
                placeholder="yourstore.com"
                value={magentoDetails.storeUrl}
                onChange={(e) =>
                  setMagentoDetails((prev) => ({
                    ...prev,
                    storeUrl: e.target.value,
                  }))
                }
                error={!!inputErrors?.storeUrl}
                helperText={inputErrors?.storeUrl}
              />

              <CustomInput
                required
                prefix={<BiKey />}
                label="Magento Access Token"
                placeholder="Paste Admin Access Token"
                type="password"
                value={magentoDetails.accessToken}
                onChange={(e) =>
                  setMagentoDetails((prev) => ({
                    ...prev,
                    accessToken: e.target.value,
                  }))
                }
                error={!!inputErrors?.accessToken}
                helperText={inputErrors?.accessToken}
              />
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </CustomDialog>
  );
};

export default Magento2ConnectionModal;
