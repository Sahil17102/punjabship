import { alpha, Box, Button, Card, CardActions, CardContent, Grid, Stack, Typography } from '@mui/material'
import ShopifyIntegration from '../integrations/ShopifyIntegration'
import WooCommerceIntegration from '../integrations/woocommerce/WooCommerceIntegration'

interface IAllChannelOptions {
  fromChannelList?: boolean;
}
const AllChannelOptions = ({ fromChannelList = false }: IAllChannelOptions) => {
  const connectedPlatforms = [
    {
      name: "Shopify",
      enabled: true,
      component: (
        <ShopifyIntegration fullWidth fromChannelList={fromChannelList} />
      ),
    },
    {
      name: "WooCommerce",
      enabled: true,
      component: (
        <WooCommerceIntegration fullWidth fromChannelList={fromChannelList} />
      ),
    },
    {
      name: "Magento V2",
      enabled: false,
    },
    {
      name: "BigCommerce",
      enabled: false,
    },
    {
      name: "Wix",
      enabled: false,
    },
    // {
    //   name: "Amazon",
    //   logo: "/logos/amazon.svg",
    //   popular: true,
    // },
    // {
    //   name: "Flipkart",
    //   logo: "/logos/flipkart.svg",
    //   popular: true,
    // },
    // {
    //   name: "Myntra",
    //   logo: "/logos/myntra.svg",
    // },
    // {
    //   name: "Meesho",
    //   logo: "/logos/meesho.svg",
    // },
    // {
    //   name: "Snapdeal",
    //   logo: "/logos/snapdeal.svg",
    // },
    // {
    //   name: "Magento",
    //   logo: "/logos/magento.svg",
    // },
    // {
    //   name: "eBay",
    //   logo: "/logos/ebay.svg",
    // },
  ];
  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 3,
        borderColor: 'rgba(17,17,19,0.08)',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF7F5 100%)',
        boxShadow: '0 18px 34px rgba(17, 17, 19, 0.06)',
      }}
    >
      <Stack spacing={0.75} mb={2.5}>
        <Typography fontWeight={800} fontSize="1.05rem" color="text.primary">
          Store connections
        </Typography>
        <Typography color="text.secondary" fontSize="0.9rem">
          Connect storefronts and marketplaces into the PunjabShip admin workflow.
        </Typography>
      </Stack>
      <Grid container spacing={2}>
        {connectedPlatforms.map((platform) => (
          <Grid size={{ md: 3, xs: 12 }} key={platform.name}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                borderRadius: "10px",
                backdropFilter: "blur(12px)",
                transition: "0.3s ease",
                "&:hover": {
                  boxShadow: "0 0 0 1px rgba(217, 4, 22, 0.16)",
                },
              }}
            >
              {platform.enabled ? (
                platform.component
              ) : (
                <Card
                  variant="outlined"
                  sx={{
                    bgcolor: '#FFFFFF',
                    borderColor: 'rgba(17,17,19,0.08)',
                    color: 'inherit',
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    opacity: 1,
                    cursor: "not-allowed",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                    <Typography fontWeight={700}>{platform.name}</Typography>
                    <Typography sx={{ mt: 0.8, fontSize: '0.84rem', color: 'text.secondary' }}>
                      Integration setup will be available soon.
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: "center", pb: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      disabled
                      sx={{
                        borderRadius: 2,
                        borderColor: alpha('#111113', 0.1),
                      }}
                    >
                      Coming Soon
                    </Button>
                  </CardActions>
                </Card>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
};

export default AllChannelOptions;
