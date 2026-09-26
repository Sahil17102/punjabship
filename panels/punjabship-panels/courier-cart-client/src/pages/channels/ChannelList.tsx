import AllChannelOptions from "../../components/channels/AllChannelOptions";
import {
  Typography,
  Box,
  Paper,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import { FaPlug } from "react-icons/fa6";

const ChannelList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: theme.palette.mode === "dark" ? "#1e1e2f" : "#f9f9f9",
          color: theme.palette.text.primary,
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="center" mb={2} gap={1}>
          <FaPlug size={22} color={theme.palette.primary.main} />
          <Typography
            variant={isMobile ? "h6" : "h5"}
            fontWeight={700}
            component="h1"
          >
            Connect Your Sales Channels
          </Typography>
        </Box>

        {/* Subtext */}
        <Typography
          variant="body1"
          color="text.secondary"
          mb={3}
          maxWidth="70ch"
        >
          Integrate with top e-commerce platforms like Shopify, WooCommerce,
          Amazon and more to automate your order flow and boost productivity.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {/* Channel Integration Options */}
        <AllChannelOptions fromChannelList />
      </Paper>
    </Box>
  );
};

export default ChannelList;
