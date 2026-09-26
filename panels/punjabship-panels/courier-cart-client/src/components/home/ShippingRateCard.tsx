import { Box, Button, Card, Typography, useMediaQuery, useTheme } from '@mui/material'
import { FaShippingFast } from 'react-icons/fa'

const ShippingRateCard = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleNavigate = () => {
    window.location.href = '/tools/rate_calculator'
  }

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        px: isMobile ? 2 : 4,
        py: isMobile ? 3 : 4,
        color: '#fff',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 3,
        boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
        background: 'linear-gradient(135deg, #0877C9 0%, #2F3B5F 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '190%',
          backgroundImage: 'url(/images/locations-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          zIndex: 0,
        },
      }}
    >
      {/* Content */}
      <Box
        sx={{ position: 'relative', zIndex: 1 }}
        display="flex"
        flex={1}
        gap={2}
        flexDirection="column"
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              backgroundColor: '#fff',
              borderRadius: '50%',
              width: 50,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mt: 0.5,
            }}
          >
            <FaShippingFast style={{ color: '#0877C9', fontSize: 28 }} />
          </Box>

          <Box>
            <Typography fontSize="16px" fontWeight={600} sx={{ color: '#FFFFFF' }}>
              Want to know your shipping rate?
            </Typography>
          </Box>
        </Box>

        {/* Decorative Glow Bar */}
        <Box
          sx={{
            mt: 1.5,
            mb: 1.5,
            height: '2px',
            width: '100%',
            background: 'linear-gradient(to right, rgba(255,255,255,0.3), rgba(255,255,255,0.5))',
            borderRadius: '4px',
            opacity: 0.4,
          }}
        />

        {/* Description */}
        <Typography
          variant="body2"
          sx={{ fontSize: 13, color: '#FFFFFF', mb: 0.5, fontWeight: 500 }}
        >
          Enter your pickup & delivery pincodes and shipment weight to calculate exact charges.
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontSize: 12.5,
            color: '#FFFFFF',
            fontStyle: 'italic',
            opacity: 0.9,
            fontWeight: 500,
          }}
        >
          Supports top couriers: Delhivery, XpressBees, BlueDart, and more.
        </Typography>

        <Typography
          variant="body2"
          sx={{ fontSize: 12, mt: 0.5, color: '#FFFFFF', opacity: 0.85, fontWeight: 500 }}
        >
          Know delivery timelines, zones, and expected COD charges instantly.
        </Typography>
      </Box>

      {/* CTA Button */}
      <Button
        variant="contained"
        onClick={handleNavigate} // ✅ navigation here
        sx={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: '#FFFFFF',
          color: '#0877C9',
          fontWeight: 600,
          px: 3,
          py: 1,
          fontSize: '14px',
          borderRadius: '8px',
          textTransform: 'none',
          mt: isMobile ? 1.5 : 0,
          alignSelf: isMobile ? 'stretch' : 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          '&:hover': {
            backgroundColor: '#F5F7FA',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          },
        }}
      >
        Calculate Now
      </Button>
    </Card>
  )
}

export default ShippingRateCard
