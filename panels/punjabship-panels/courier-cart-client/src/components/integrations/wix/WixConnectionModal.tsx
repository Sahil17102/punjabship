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
import type { WixForm } from "./WixIntegration";

interface IWixConnectionModalProps {
  openModal: boolean;
  onSetOpen: () => void;
  handleConnect?: () => void;
  integrating?: boolean;
  wixDetails: WixForm;
  setWixDetails: Dispatch<SetStateAction<WixForm>>;
  inputErrors?: Partial<WixForm>;
  isEditing?: boolean;
  forOnboarding?: boolean;
  handleDelete?: () => void;
  deleting?: boolean;
}

const WixConnectionModal = ({
  openModal,
  onSetOpen,
  handleConnect,
  integrating = false,
  wixDetails,
  setWixDetails,
  inputErrors,
  isEditing = false,
  handleDelete,
  deleting = false,
}: IWixConnectionModalProps) => {
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
          <FaConnectdevelop /> Connect your Wix store
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
              How to get your Wix API details
            </Typography>
            <List dense>
              {[
                { primary: "1. Log in to your Wix Developer Console" },
                { primary: "2. Create a new app or select an existing one" },
                {
                  primary:
                    "3. Add scopes like 'Orders.Read', 'Stores.Read', etc. to your app",
                },
                {
                  primary: "4. Get Site ID and Access Token from the app page",
                },
                {
                  primary:
                    "5. Ensure the app is installed on the correct Wix site",
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
              Enter Wix API Credentials
            </Typography>

            <Stack spacing={2}>
              <CustomInput
                required
                prefix={<BiLink />}
                label="Wix Site ID"
                placeholder="your-site-id"
                value={wixDetails.siteId}
                onChange={(e) =>
                  setWixDetails((prev) => ({
                    ...prev,
                    siteId: e.target.value,
                  }))
                }
                error={!!inputErrors?.siteId}
                helperText={inputErrors?.siteId}
              />

              <CustomInput
                required
                prefix={<BiKey />}
                label="Wix Access Token"
                placeholder="Paste Access Token"
                type="password"
                value={wixDetails.accessToken}
                onChange={(e) =>
                  setWixDetails((prev) => ({
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

export default WixConnectionModal;
