// TrackingPage.tsx
import {
  Box,
  Container,
  Grid,
  Paper,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  styled,
  Typography,
} from '@mui/material'
import {
  FaBoxOpen,
  FaBuilding,
  FaExclamationTriangle,
  FaShippingFast,
  FaStore,
  FaTruck,
} from 'react-icons/fa'
import { useTracking } from '../../hooks/Orders/useTracking'

const stages = [
  { label: 'Booked', icon: <FaStore /> },
  { label: 'Pending Pickup', icon: <FaBuilding /> },
  { label: 'In Transit', icon: <FaTruck /> },
  { label: 'Out for Delivery', icon: <FaShippingFast /> },
  { label: 'Delivered', icon: <FaBoxOpen /> },
]

// const couriers = [
//   { name: 'Delhivery', icon: <FaTruck /> },
//   { name: 'Bluedart', icon: <FaShippingFast /> },
//   { name: 'DHL', icon: <FaDhl /> },
//   { name: 'FedEx', icon: <FaFedex /> },
//   { name: 'Ekart', icon: <FaAmazon /> },
// ]

const statusLabels: Record<string, string> = {
  PP: 'Pending Pickup',
  IT: 'In Transit',
  OFD: 'Out for Delivery',
  DL: 'Delivered',
  CAN: 'Cancelled',
  RT: 'RTO',
  'RT-IT': 'RTO In Transit',
  'RT-DL': 'RTO Delivered',
  EX: 'Exception',
  NDR: 'NDR',
}

const normalizeStatus = (value?: string | null) =>
  String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

const getStageIndexFromStatus = (value?: string | null) => {
  const status = normalizeStatus(value)
  if (!status) return -1
  if (['dl', 'delivered', 'rto_delivered', 'rt_dl'].includes(status)) return 4
  if (['ofd', 'out_for_delivery', 'out_for_delivery_pending'].includes(status)) return 3
  if (['ndr', 'undelivered', 'exception', 'ex'].includes(status)) return 3
  if (['it', 'in_transit', 'rt', 'rto', 'rt_it', 'rto_in_transit'].includes(status)) return 2
  if (['pp', 'picked_up', 'pickup_done', 'pickup_initiated', 'manifested'].includes(status)) return 1
  if (['booked', 'new', 'pending', 'shipment_created', 'order_created'].includes(status)) return 0
  if (['can', 'cancelled', 'canceled'].includes(status)) return 0
  return -1
}

const ColorConnector = styled(StepConnector)(() => ({
  '& .MuiStepConnector-alternativeLabel': { top: 22 },
  '&.Mui-active .MuiStepConnector-line': { backgroundColor: '#0877C9' },
  '&.Mui-completed .MuiStepConnector-line': { backgroundColor: '#3DD598' },
  '& .MuiStepConnector-line': { height: 4, border: 0, backgroundColor: '#E0E6ED', borderRadius: 2 },
}))

export default function TrackingPage() {
  const searchParams = new URLSearchParams(window.location.search)
  const awb = searchParams.get('awb')
  const order = searchParams.get('orderNumber')
  const contact = searchParams.get('contact')
  const { data: trackingData, isLoading, error } = useTracking(awb, order, contact)

  const currentStage = Math.max(
    getStageIndexFromStatus(trackingData?.status),
    ...(trackingData?.history || []).map((event) =>
      Math.max(getStageIndexFromStatus(event.status_code), getStageIndexFromStatus(event.message)),
    ),
    0,
  )

  // Loading Screen
  if (isLoading)
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          bgcolor: '#F5F7FA',
          color: '#0877C9',
          px: 2,
        }}
      >
        {/* Animated Ring */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '6px solid rgba(51, 51, 105, 0.1)',
            borderTopColor: '#0877C9',
            animation: 'spin 1s linear infinite',
            mb: 3,
          }}
        />

        {/* Animated Loading Text */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            letterSpacing: 0.5,
            textAlign: 'center',
            color: '#0877C9',
            '&::after': {
              content: '"..."',
              animation: 'dots 1.5s steps(5, end) infinite',
              display: 'inline-block',
            },
          }}
        >
          Fetching your tracking details
        </Typography>

        {/* Keyframes for animations */}
        <style>
          {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes dots {
            0%, 20% { content: ""; }
            40% { content: "."; }
            60% { content: ".."; }
            80%, 100% { content: "..."; }
          }
        `}
        </style>
      </Box>
    )

  if (error || !trackingData)
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
          px: 2,
          bgcolor: '#F5F7FA',
        }}
      >
        <Paper
          sx={{
            p: 5,
            borderRadius: 3,
            textAlign: 'center',
            backgroundColor: '#FFFFFF',
            maxWidth: 450,
            width: '100%',
            boxShadow: '0 4px 20px rgba(231, 76, 60, 0.1)',
            border: '1px solid rgba(231, 76, 60, 0.2)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: '#E74C3C',
              borderRadius: '12px 12px 0 0',
            },
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(231, 76, 60, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <FaExclamationTriangle size={40} color="#E74C3C" />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom color="#1A1A1A">
            {error ? 'Oops! Something went wrong' : 'Tracking Not Found'}
          </Typography>
          <Typography variant="body1" sx={{ color: '#4A5568', mt: 2 }}>
            {error
              ? error.message
              : 'We could not find any tracking information. Please check your AWB / Order details and try again.'}
          </Typography>
        </Paper>
      </Box>
    )

  return (
    <Box sx={{ bgcolor: '#F5F7FA', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="lg">
        {/* Cancelled Notice */}
        {trackingData.status === 'cancelled' && (
          <Paper
            sx={{
              p: 3,
              mb: 4,
              bgcolor: '#FFFFFF',
              borderRadius: 3,
              border: '2px solid #E74C3C',
              boxShadow: '0 4px 12px rgba(231, 76, 60, 0.1)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: '#E74C3C',
                borderRadius: '12px 12px 0 0',
              },
            }}
          >
            <Typography variant="h6" fontWeight={700} color="#E74C3C" mb={1}>
              Shipment Cancelled
            </Typography>
            <Typography variant="body2" color="#4A5568">
              This shipment has been cancelled and cannot be tracked further.
            </Typography>
          </Paper>
        )}

        <Grid container spacing={4}>
          {/* Left Column: Shipment Details */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                bgcolor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #E0E6ED',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #0877C9 0%, #3DD598 100%)',
                  borderRadius: '12px 12px 0 0',
                },
              }}
            >
              <Typography variant="h5" fontWeight={700} color="#0877C9" gutterBottom sx={{ mb: 3 }}>
                Shipment Details
              </Typography>

              <Grid container spacing={2}>
                {[
                  { label: 'Courier', value: trackingData.courier_name },
                  { label: 'AWB No', value: trackingData.awb_number },
                  { label: 'Order Number', value: trackingData.order_number },
                  { label: 'Payment Type', value: trackingData.payment_type },
                  { label: 'Expected Delivery', value: trackingData.edd },
                ].map((item) => (
                  <Grid size={{ xs: 12 }} key={item.label}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        backgroundColor: '#F5F7FA',
                        border: '1px solid #E0E6ED',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        transition: 'all 0.3s',
                        '&:hover': {
                          backgroundColor: '#FFFFFF',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(51, 51, 105, 0.1)',
                        },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: '#4A5568', textTransform: 'uppercase', fontWeight: 600 }}
                      >
                        {item.label}
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="#1A1A1A">
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Right Column: Stepper + Tracking History */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Stepper Timeline */}
            <Box
              sx={{
                width: '100%',
                mb: 4,
                bgcolor: '#FFFFFF',
                p: 4,
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #E0E6ED',
              }}
            >
              <Stepper alternativeLabel activeStep={currentStage} connector={<ColorConnector />}>
                {stages.map((stage, index) => {
                  const stageHistory = trackingData.history[index]
                  const isCancelled = trackingData.status === 'cancelled' && index === currentStage

                  return (
                    <Step key={stage?.label}>
                      <StepLabel
                        slots={{
                          stepIcon: () => (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: isCancelled
                                  ? '#E74C3C'
                                  : index <= currentStage
                                  ? index === currentStage
                                    ? '#0877C9'
                                    : '#3DD598'
                                  : '#E0E6ED',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                fontSize: 18,
                                boxShadow:
                                  index <= currentStage
                                    ? '0 4px 12px rgba(51, 51, 105, 0.2)'
                                    : 'none',
                                transition: 'all 0.3s ease',
                              }}
                            >
                              {stage.icon}
                            </Box>
                          ),
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: index <= currentStage || isCancelled ? 700 : 500,
                            color: index <= currentStage || isCancelled ? '#0877C9' : '#4A5568',
                            mt: 1,
                          }}
                        >
                          {stageHistory
                            ? statusLabels[stageHistory.status_code] || stage.label
                            : stage.label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  )
                })}
              </Stepper>

              {/* Tracking History Timeline */}
              <Box sx={{ mt: 5 }}>
                <Typography variant="h6" fontWeight={700} color="#0877C9" mb={3}>
                  Tracking History
                </Typography>
                {trackingData.history.map((h, idx) => (
                  <Box key={idx} sx={{ display: 'flex', mb: 3 }}>
                    <Box sx={{ width: 12, mt: 0.5 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor:
                            h.status_code === 'CAN'
                              ? '#E74C3C'
                              : h.status_code === 'DL'
                              ? '#3DD598'
                              : '#0877C9',
                          mx: 'auto',
                          mb: 0.5,
                          boxShadow: '0 2px 6px rgba(51, 51, 105, 0.3)',
                        }}
                      />
                      {idx < trackingData.history.length - 1 && (
                        <Box sx={{ width: 2, height: '100%', mx: 'auto', bgcolor: '#E0E6ED' }} />
                      )}
                    </Box>
                    <Paper
                      sx={{
                        p: 3,
                        ml: 3,
                        flex: 1,
                        borderRadius: 2,
                        bgcolor: '#F5F7FA',
                        border: '1px solid #E0E6ED',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(51, 51, 105, 0.1)',
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                        {h.message || 'Status update'}
                      </Typography>
                      {h.location && (
                        <Typography variant="body2" sx={{ mb: 0.5, color: '#1A1A1A' }}>
                          <strong>Location:</strong> {h.location}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ mb: 0.5, color: '#4A5568' }}>
                        <strong>Time:</strong>{' '}
                        {new Date(h.event_time).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Stamp */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          minWidth: 120,
          px: 2.5,
          py: 2,
          borderRadius: 2,
          bgcolor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(51, 51, 105, 0.15)',
          border: '1px solid #E0E6ED',
        }}
      >
        <Box
          component="img"
          src="/logo/punjabship-mark.svg"
          alt="PunjabShip Logo"
          sx={{ width: 72, height: 'auto', mb: 0.5, borderRadius: 1.5 }}
        />
        <Typography
          variant="caption"
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: '#0877C9',
            textAlign: 'center',
            letterSpacing: 0.5,
          }}
        >
          Powered by PunjabShip
        </Typography>
      </Box>
    </Box>
  )
}
