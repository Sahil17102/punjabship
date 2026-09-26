import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { formatDistanceToNow } from 'date-fns'
import { MdAccountBalanceWallet, MdArrowForward, MdHistory, MdShoppingCart } from 'react-icons/md'
import { TbCurrencyRupee } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

interface RecentActivityCardProps {
  recentActivity: {
    transactions: Array<{
      id: string
      type: 'credit' | 'debit'
      amount: number
      reason: string | null
      createdAt: Date | null
    }>
    recentOrders: Array<{
      id: string
      orderNumber: string
      status: string
      amount: number
      createdAt: Date | string
    }>
  }
  formatCurrency: (amount: number) => string
}

export default function RecentActivityCard({
  recentActivity,
  formatCurrency,
}: RecentActivityCardProps) {
  const theme = useTheme()
  const navigate = useNavigate()

  const formatTime = (date: Date | string | null) => {
    if (!date) return 'Just now'
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return formatDistanceToNow(dateObj, { addSuffix: true })
    } catch {
      return 'Just now'
    }
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes('delivered')) return theme.palette.success.main
    if (statusLower.includes('pending') || statusLower.includes('booked'))
      return theme.palette.warning.main
    if (statusLower.includes('transit') || statusLower.includes('shipped'))
      return theme.palette.info.main
    return theme.palette.text.secondary
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.1),
              borderRadius: '10px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MdHistory size={24} color={theme.palette.info.main} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Recent Activity
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Latest orders & transactions
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={2.5}>
          {/* Recent Orders */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle2" fontWeight="600" color="text.secondary">
                Recent Orders
              </Typography>
              {(recentActivity.recentOrders || []).length > 0 && (
                <Button
                  size="small"
                  endIcon={<MdArrowForward size={16} />}
                  onClick={() => navigate('/orders/list')}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                  }}
                >
                  View All
                </Button>
              )}
            </Stack>
            <Stack spacing={1.5}>
              {(recentActivity.recentOrders || []).slice(0, 3).map((order) => (
                <Box
                  key={order.id}
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: '12px',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'translateX(4px)',
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                  }}
                  onClick={() => navigate('/orders/list')}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          borderRadius: '8px',
                          p: 0.75,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MdShoppingCart size={16} color={theme.palette.primary.main} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="600" noWrap>
                          {order.orderNumber || 'Order'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(order.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={order.status || 'Pending'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: alpha(getStatusColor(order.status || ''), 0.1),
                          color: getStatusColor(order.status || ''),
                          border: `1px solid ${alpha(getStatusColor(order.status || ''), 0.2)}`,
                        }}
                      />
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {formatCurrency(order.amount || 0)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              ))}
              {(recentActivity.recentOrders || []).length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent orders
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.1) }} />

          {/* Recent Transactions */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="subtitle2" fontWeight="600" color="text.secondary">
                Wallet Transactions
              </Typography>
              {(recentActivity.transactions || []).length > 0 && (
                <Button
                  size="small"
                  endIcon={<MdArrowForward size={16} />}
                  onClick={() => navigate('/billing/wallet_transactions')}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                  }}
                >
                  View All
                </Button>
              )}
            </Stack>
            <Stack spacing={1.5}>
              {(recentActivity.transactions || []).slice(0, 3).map((tx) => (
                <Box
                  key={tx.id}
                  sx={{
                    p: 2,
                    bgcolor: alpha(
                      tx.type === 'credit' ? theme.palette.success.main : theme.palette.error.main,
                      0.05,
                    ),
                    borderRadius: '12px',
                    border: `1px solid ${alpha(
                      tx.type === 'credit' ? theme.palette.success.main : theme.palette.error.main,
                      0.1,
                    )}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(
                        tx.type === 'credit'
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                        0.1,
                      ),
                      transform: 'translateX(4px)',
                      boxShadow: `0 2px 8px ${alpha(
                        tx.type === 'credit'
                          ? theme.palette.success.main
                          : theme.palette.error.main,
                        0.15,
                      )}`,
                    },
                  }}
                  onClick={() => navigate('/billing/wallet_transactions')}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          bgcolor: alpha(
                            tx.type === 'credit'
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                            0.1,
                          ),
                          borderRadius: '8px',
                          p: 0.75,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {tx.type === 'credit' ? (
                          <MdAccountBalanceWallet size={16} color={theme.palette.success.main} />
                        ) : (
                          <TbCurrencyRupee size={16} color={theme.palette.error.main} />
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight="600" noWrap>
                          {tx.reason || (tx.type === 'credit' ? 'Credit' : 'Debit')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(tx.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={tx.type === 'credit' ? 'success.main' : 'error.main'}
                    >
                      {tx.type === 'credit' ? '+' : '-'}
                      {formatCurrency(tx.amount || 0)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
              {(recentActivity.transactions || []).length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent transactions
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
