import { Box, Button, Card, Grid, Skeleton, Stack, Typography } from '@mui/material'
import { TbInvoice } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { useInvoiceStatus } from '../../hooks/useDashboard'
import PageHeading from '../UI/heading/PageHeading'

const InvoiceStatus = () => {
  const navigate = useNavigate()
  const { data: invoiceStatus, isLoading } = useInvoiceStatus()

  const statuses = [
    {
      label: 'Pending',
      count: invoiceStatus?.pending.count || 0,
      amount: invoiceStatus?.pending.totalAmount || 0,
      color: '#F59E0B',
    },
    {
      label: 'Paid',
      count: invoiceStatus?.paid.count || 0,
      amount: invoiceStatus?.paid.totalAmount || 0,
      color: '#10B981',
    },
    {
      label: 'Overdue',
      count: invoiceStatus?.overdue.count || 0,
      amount: invoiceStatus?.overdue.totalAmount || 0,
      color: '#EF4444',
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalInvoices = (invoiceStatus?.pending.count || 0) + (invoiceStatus?.paid.count || 0) + (invoiceStatus?.overdue.count || 0)

  return (
    <Stack gap={3}>
      <PageHeading title="Invoice Status" fontSize="18px" />
      <Card
        sx={{
          p: 3,
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {isLoading ? (
          <Grid container spacing={2}>
            {[1, 2, 3].map((i) => (
              <Grid size={{ xs: 12, md: 4 }} key={i}>
                <Skeleton height={120} variant="rectangular" />
              </Grid>
            ))}
          </Grid>
        ) : totalInvoices === 0 ? (
          <Box textAlign="center" py={4}>
            <TbInvoice size={48} style={{ color: '#9CA3AF', margin: '0 auto 12px' }} />
            <Typography color="gray.500" fontSize="14px" mb={2}>
              No invoices yet
            </Typography>
            <Button variant="contained" size="small" onClick={() => navigate('/billing/invoice_management')}>
              View Invoices
            </Button>
          </Box>
        ) : (
          <>
            <Grid container spacing={2} mb={3}>
              {statuses.map((status, index) => (
                <Grid size={{ xs: 12, md: 4 }} key={index}>
                  <Card
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: `1px solid ${status.color}40`,
                      background: `${status.color}10`,
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={2} mb={2}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          bgcolor: status.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        <TbInvoice size={20} />
                      </Box>
                      <Box flex={1}>
                        <Typography fontSize="12px" color="gray.600" mb={0.5}>
                          {status.label}
                        </Typography>
                        <Typography fontSize="20px" fontWeight={700} sx={{ color: '#0877C9' }}>
                          {status.count}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography fontSize="14px" fontWeight={600} sx={{ color: status.color }}>
                      {formatCurrency(status.amount)}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/billing/invoice_management')}
              sx={{
                borderColor: '#0877C9',
                color: '#0877C9',
                '&:hover': { borderColor: '#0877C9', bgcolor: '#0877C910' },
              }}
            >
              View All Invoices →
            </Button>
          </>
        )}
      </Card>
    </Stack>
  )
}

export default InvoiceStatus

