import { Box, Button, Card, Grid, Skeleton, Stack, Typography } from '@mui/material'
import { MdSyncProblem, MdKeyboardReturn } from 'react-icons/md'
import { FaBalanceScaleLeft } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { usePendingActions } from '../../hooks/useDashboard'
import PageHeading from '../UI/heading/PageHeading'

const PendingActions = () => {
  const navigate = useNavigate()
  const { data: pendingActions, isLoading } = usePendingActions()

  const actions = [
    {
      label: 'Pending NDRs',
      count: pendingActions?.ndrCount || 0,
      icon: <MdSyncProblem size={24} />,
      color: '#F59E0B',
      path: '/ops/ndr',
    },
    {
      label: 'Pending RTOs',
      count: pendingActions?.rtoCount || 0,
      icon: <MdKeyboardReturn size={24} />,
      color: '#EF4444',
      path: '/ops/rto',
    },
    {
      label: 'Weight Discrepancies',
      count: pendingActions?.weightDiscrepancyCount || 0,
      icon: <FaBalanceScaleLeft size={24} />,
      color: '#3B82F6',
      path: '/reconciliation/weight',
    },
  ]

  const totalPending = (pendingActions?.ndrCount || 0) + (pendingActions?.rtoCount || 0) + (pendingActions?.weightDiscrepancyCount || 0)

  return (
    <Stack gap={3}>
      <PageHeading title="Pending Actions" fontSize="18px" />
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
        ) : totalPending === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="gray.500" fontSize="14px">
              No pending actions
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {actions.map((action, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    background: action.count > 0 ? `${action.color}10` : '#F9FAFB',
                    transition: 'all 0.2s ease',
                    cursor: action.count > 0 ? 'pointer' : 'default',
                    '&:hover': action.count > 0 ? { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } : {},
                  }}
                  onClick={() => action.count > 0 && navigate(action.path)}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box sx={{ color: action.color }}>{action.icon}</Box>
                    {action.count > 0 && (
                      <Box
                        sx={{
                          bgcolor: action.color,
                          color: 'white',
                          borderRadius: '12px',
                          px: 1.5,
                          py: 0.5,
                          fontSize: '14px',
                          fontWeight: 600,
                        }}
                      >
                        {action.count}
                      </Box>
                    )}
                  </Stack>
                  <Typography fontSize="14px" fontWeight={600} sx={{ color: '#0877C9', mb: 0.5 }}>
                    {action.label}
                  </Typography>
                  {action.count > 0 ? (
                    <Button
                      size="small"
                      variant="text"
                      sx={{
                        mt: 1,
                        color: action.color,
                        fontSize: '12px',
                        textTransform: 'none',
                        '&:hover': { bgcolor: `${action.color}20` },
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(action.path)
                      }}
                    >
                      View Details →
                    </Button>
                  ) : (
                    <Typography fontSize="12px" color="gray.500" mt={1}>
                      All clear
                    </Typography>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Card>
    </Stack>
  )
}

export default PendingActions

