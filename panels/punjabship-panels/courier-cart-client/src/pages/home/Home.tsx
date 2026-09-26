import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import {
  MdAccessTime,
  MdArrowForward,
  MdCheckCircle,
  MdContactMail,
  MdErrorOutline,
  MdHeadsetMic,
  MdLocalShipping,
  MdOutlineAddShoppingCart,
  MdOutlineAssignment,
  MdOutlineLocalShipping,
  MdPercent,
  MdReceiptLong,
  MdSyncProblem,
  MdWarning,
} from 'react-icons/md'
import { RiRefreshLine } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'
import { isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'
import { useAuth } from '../../context/auth/AuthContext'
import { useMerchantDashboardStats } from '../../hooks/useDashboard'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'
import AccountSetup from '../../components/home/AccountSetup'

const BRAND_PRIMARY = '#0877C9'
const BRAND_TEXT = '#111827'
const TEXT_MUTED = '#6B7280'

const CARD_STYLE = {
  borderRadius: 3,
  bgcolor: '#ffffff',
  border: '1px solid rgba(17, 24, 39, 0.08)',
  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.05)',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const formatDelta = (value: number, suffix = '%') => {
  const numeric = Number(value || 0)
  if (numeric === 0) return `0${suffix}`
  return `${numeric > 0 ? '+' : ''}${numeric.toFixed(1)}${suffix}`
}

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isReady: isMerchantReady } = useMerchantReadiness()
  const todayDateInput = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMerchantDashboardStats(undefined, {
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  })
  const isAllTime = stats?.isAllTime !== false && !fromDate && !toDate
  const displayName =
    user?.displayName?.trim() ||
    user?.employeeName?.trim() ||
    user?.companyInfo?.contactPerson?.trim() ||
    'User'

  const quickActions = [
    {
      label: 'Create Shipment',
      icon: MdOutlineAddShoppingCart,
      path: '/orders/create',
      color: '#EF4444',
      desc: 'Start a new order',
    },
    {
      label: 'All Shipments',
      icon: MdOutlineAssignment,
      path: '/orders/list',
      color: '#3B82F6',
      desc: 'Track every order',
    },
    {
      label: 'Track Shipment',
      icon: MdOutlineLocalShipping,
      path: '/tools/order_tracking',
      color: '#06B6D4',
      desc: 'Check live movement',
    },
    {
      label: 'NDR Management',
      icon: MdErrorOutline,
      path: '/ops/ndr',
      color: '#F59E0B',
      desc: 'Resolve exceptions',
    },
    {
      label: 'Manage Pickups',
      icon: MdContactMail,
      path: '/settings/manage_pickups',
      color: '#EC4899',
      desc: 'Organize origins',
    },
    {
      label: 'COD Remittance',
      icon: MdLocalShipping,
      path: isEmbeddedShopifyContext() ? '/cod-remittance' : '/cod-settlement',
      color: '#F97316',
      desc: 'Check COD flow',
    },
  ]

  const getStatusColor = (status: string) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized.includes('deliver')) {
      return { bg: alpha('#10B981', 0.1), text: '#10B981', icon: <MdCheckCircle size={14} /> }
    }
    if (normalized.includes('transit') || normalized.includes('pickup')) {
      return { bg: alpha('#3B82F6', 0.1), text: '#3B82F6', icon: <MdAccessTime size={14} /> }
    }
    if (normalized.includes('ndr') || normalized.includes('rto') || normalized.includes('fail')) {
      return { bg: alpha('#F59E0B', 0.12), text: '#D97706', icon: <MdWarning size={14} /> }
    }
    return { bg: alpha(TEXT_MUTED, 0.1), text: TEXT_MUTED, icon: null }
  }

  const todayOps = stats?.todayOperations || { orders: 0, pending: 0, inTransit: 0, delivered: 0 }
  const financial = stats?.financial || {
    walletBalance: 0,
    totalShippingCharges: 0,
    codAmount: 0,
    codRemittanceDue: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    totalFreightCharges: 0,
    profit: 0,
    codRemittanceCredited: 0,
  }
  const operational = stats?.operational || {
    deliverySuccessRate: 0,
    ndrRate: 0,
    rtoRate: 0,
    avgDeliveryTime: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    ndrCount: 0,
    rtoCount: 0,
  }
  const actions = stats?.actions || {
    ndrCount: 0,
    rtoCount: 0,
    weightDiscrepancyCount: 0,
    openTickets: 0,
    inProgressTickets: 0,
    pendingInvoices: 0,
    pendingInvoiceAmount: 0,
    overdueInvoices: 0,
    overdueInvoiceAmount: 0,
  }
  const trends = stats?.trends || {
    ordersGrowth: 0,
    revenueGrowth: 0,
    thisWeekOrders: 0,
    lastWeekOrders: 0,
    thisWeekRevenue: 0,
    lastWeekRevenue: 0,
  }
  const metrics = stats?.metrics || {
    avgOrderValue: 0,
    totalPrepaidOrders: 0,
    totalCodOrders: 0,
    prepaidRevenue: 0,
    codRevenue: 0,
    topRevenueCities: [],
  }

  const topDestinations = stats?.geographic?.topDestinations || []
  const destinationMax = Math.max(
    ...topDestinations.map((destination) => Number(destination.count || 0)),
    1,
  )
  const recentOrders = stats?.recentActivity?.recentOrders || []

  const primaryCards = [
    {
      label: 'Active Orders',
      value: todayOps.pending + todayOps.inTransit,
      hint: `${todayOps.pending} pending, ${todayOps.inTransit} in transit`,
      icon: MdOutlineAssignment,
      color: '#3B82F6',
      change: formatDelta(trends.ordersGrowth),
    },
    {
      label: isAllTime ? 'Delivered Orders' : 'Delivered In Range',
      value: todayOps.delivered,
      hint: `${todayOps.orders} total orders ${isAllTime ? 'all time' : 'in range'}`,
      icon: MdCheckCircle,
      color: '#10B981',
      change: `${operational.deliverySuccessRate.toFixed(1)}% success`,
    },
    {
      label: 'Average Delivery',
      value: `${(operational.avgDeliveryTime / 24 || 0).toFixed(1)}`,
      unit: 'days',
      hint: 'Average across delivered shipments',
      icon: MdAccessTime,
      color: '#F59E0B',
      change: `${operational.rtoRate.toFixed(1)}% RTO`,
    },
    {
      label: 'Pending Invoices',
      value: actions.pendingInvoices,
      hint: formatCurrency(actions.pendingInvoiceAmount),
      icon: MdReceiptLong,
      color: '#8B5CF6',
      change: `${actions.overdueInvoices} overdue`,
    },
  ]

  const bottomMetrics = [
    {
      label: 'Total Shipments',
      value: operational.totalOrders,
      hint: formatDelta(trends.ordersGrowth),
      icon: MdOutlineAssignment,
      color: '#3B82F6',
    },
    {
      label: 'Average Order Value',
      value: formatCurrency(metrics.avgOrderValue),
      hint: `${metrics.totalPrepaidOrders} prepaid / ${metrics.totalCodOrders} COD`,
      icon: MdPercent,
      color: '#14B8A6',
    },
    {
      label: 'NDR Count',
      value: operational.ndrCount,
      hint: `${operational.ndrRate.toFixed(1)}% of orders`,
      icon: MdSyncProblem,
      color: '#F59E0B',
    },
    {
      label: 'COD Due',
      value: formatCurrency(financial.codRemittanceDue),
      hint: formatCurrency(financial.codAmount),
      icon: MdLocalShipping,
      color: '#10B981',
    },
    {
      label: 'Open Tickets',
      value: actions.openTickets,
      hint: `${actions.inProgressTickets} in progress`,
      icon: MdHeadsetMic,
      color: '#F97316',
    },
  ]

  if (isError && !stats) {
    return (
      <Stack spacing={2} sx={{ py: 4, alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 700, color: BRAND_TEXT }}>
          We could not load your home dashboard.
        </Typography>
        <Button variant="contained" onClick={() => refetch()} sx={{ textTransform: 'none' }}>
          Retry
        </Button>
      </Stack>
    )
  }

  const dashboardRefreshWarning = isError && Boolean(stats)

  return (
    <Stack spacing={3} sx={{ pb: 4 }}>
      {dashboardRefreshWarning ? (
        <Box sx={{ px: 2, py: 1.25, borderRadius: 2, bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}>
          <Typography sx={{ color: '#9A3412', fontSize: 13 }}>
            Dashboard data could not be refreshed. Showing the last successful snapshot.
          </Typography>
        </Box>
      ) : null}
      <Box
        sx={{
          ...CARD_STYLE,
          p: { xs: 2, md: 2.5 },
          background:
            'linear-gradient(135deg, rgba(8,119,201,0.05) 0%, rgba(255,255,255,0.94) 45%, rgba(59,130,246,0.05) 100%)',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', lg: 'center' }}
          gap={2}
        >
          <Box>
            <Typography
              sx={{ fontSize: { xs: '1rem', md: '1.2rem' }, fontWeight: 800, color: BRAND_TEXT }}
            >
              Welcome back, {displayName}
            </Typography>
            <Typography
              sx={{ mt: 0.6, fontSize: { xs: '0.82rem', md: '0.88rem' }, color: TEXT_MUTED }}
            >
              Your shipment & billing dashboard
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.2}
            width={{ xs: '100%', lg: 'auto' }}
          >
            <TextField
              type="date"
              size="small"
              label="From"
              value={fromDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => {
                const nextFromDate = event.target.value
                setFromDate(nextFromDate)
                if (toDate && nextFromDate && nextFromDate > toDate) setToDate(nextFromDate)
              }}
              inputProps={{ max: todayDateInput }}
              sx={{
                minWidth: { xs: '100%', sm: 185 },
                '& .MuiInputBase-root': {
                  bgcolor: '#FFFFFF',
                  cursor: 'pointer',
                },
              }}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              value={toDate}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => setToDate(event.target.value)}
              inputProps={{ min: fromDate || undefined, max: todayDateInput }}
              sx={{
                minWidth: { xs: '100%', sm: 185 },
                '& .MuiInputBase-root': {
                  bgcolor: '#FFFFFF',
                  cursor: 'pointer',
                },
              }}
            />
            <Button
              variant="outlined"
              onClick={() => {
                setFromDate('')
                setToDate('')
                setTimeout(() => refetch(), 0)
              }}
              disabled={isRefetching || (!fromDate && !toDate)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              All time
            </Button>
            <Button
              variant="outlined"
              onClick={() => refetch()}
              disabled={isRefetching}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {isRefetching ? 'Refreshing...' : <RiRefreshLine style={{ fontSize: 25 }} />}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/orders/create')}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                boxShadow: '0 12px 24px rgba(8,119,201,0.16)',
              }}
            >
              Create Shipment
            </Button>
          </Stack>
        </Stack>
      </Box>

      {isLoading && !stats ? (
        <Box sx={{ ...CARD_STYLE, p: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      ) : null}

      {!isMerchantReady && (
        <Box sx={{ ...CARD_STYLE, p: { xs: 1.5, md: 2.2 } }}>
          <AccountSetup />
        </Box>
      )}

      <Grid container spacing={2}>
        {primaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Box sx={{ ...CARD_STYLE, p: 2.2 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={1.4}
                >
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.4,
                      bgcolor: alpha(card.color, 0.1),
                      color: card.color,
                      display: 'flex',
                    }}
                  >
                    <Icon size={20} />
                  </Box>
                  <Chip
                    label={card.change}
                    size="small"
                    sx={{
                      bgcolor: alpha(card.color, 0.09),
                      color: card.color,
                      fontWeight: 700,
                    }}
                  />
                </Stack>
                <Typography
                  sx={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: TEXT_MUTED,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {card.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.6, mt: 0.7 }}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: BRAND_TEXT }}>
                    {card.value}
                  </Typography>
                  {card.unit ? (
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: TEXT_MUTED }}>
                      {card.unit}
                    </Typography>
                  ) : null}
                </Box>
                <Typography sx={{ mt: 0.6, fontSize: '0.8rem', color: TEXT_MUTED }}>
                  {card.hint}
                </Typography>
              </Box>
            </Grid>
          )
        })}
      </Grid>

      <Box>
        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BRAND_TEXT, mb: 1.6 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={1.5}>
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Grid key={action.label} size={{ xs: 6, md: 3, lg: 2 }}>
                <Box
                  onClick={() => navigate(action.path)}
                  sx={{
                    ...CARD_STYLE,
                    p: 1.2,
                    cursor: 'pointer',
                    minHeight: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 0.6,
                    '&:hover': {
                      borderColor: alpha(action.color, 0.35),
                      boxShadow: `0 14px 30px ${alpha(action.color, 0.12)}`,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: alpha(action.color, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: action.color,
                    }}
                  >
                    <Icon size={18} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: BRAND_TEXT, lineHeight: 1.2 }}>
                      {action.label}
                    </Typography>
                    <Typography sx={{ mt: 0.25, fontSize: '0.65rem', color: TEXT_MUTED, lineHeight: 1.2 }}>
                      {action.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )
          })}
        </Grid>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
          <Box sx={{ ...CARD_STYLE, p: 2.1, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.6}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BRAND_TEXT }}>
                Recent Shipments
              </Typography>
              <Button
                size="small"
                endIcon={<MdArrowForward size={14} />}
                onClick={() => navigate('/orders/list')}
                sx={{ textTransform: 'none', color: BRAND_PRIMARY, fontWeight: 700 }}
              >
                View all
              </Button>
            </Stack>
            <Stack spacing={1}>
              {recentOrders.length === 0 ? (
                <Typography sx={{ fontSize: '0.82rem', color: TEXT_MUTED }}>
                  No recent shipments yet.
                </Typography>
              ) : (
                recentOrders.slice(0, 5).map((order) => {
                  const statusColor = getStatusColor(order.status)
                  return (
                    <Box
                      key={order.id}
                      sx={{
                        p: 1.2,
                        borderRadius: 1.5,
                        bgcolor: alpha('#000', 0.018),
                        border: '1px solid rgba(17, 24, 39, 0.06)',
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        gap={1}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{ fontSize: '0.84rem', fontWeight: 700, color: BRAND_TEXT }}
                          >
                            {order.orderNumber}
                          </Typography>
                          <Typography sx={{ mt: 0.25, fontSize: '0.72rem', color: TEXT_MUTED }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.45,
                            borderRadius: 999,
                            bgcolor: statusColor.bg,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.4,
                          }}
                        >
                          {statusColor.icon}
                          <Typography
                            sx={{ fontSize: '0.68rem', fontWeight: 700, color: statusColor.text }}
                          >
                            {order.status}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )
                })
              )}
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
          <Box sx={{ ...CARD_STYLE, p: 2.1, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.6}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BRAND_TEXT }}>
                Top Destinations
              </Typography>
              <Chip
                label={`${topDestinations.length} active lanes`}
                size="small"
                sx={{ bgcolor: alpha('#3B82F6', 0.08), color: '#2563EB', fontWeight: 700 }}
              />
            </Stack>
            <Stack spacing={1.2}>
              {topDestinations.length === 0 ? (
                <Typography sx={{ fontSize: '0.82rem', color: TEXT_MUTED }}>
                  Destination trends will appear after more orders are shipped.
                </Typography>
              ) : (
                topDestinations.slice(0, 5).map((route, idx) => (
                  <Box key={`${route.city}-${route.state}-${idx}`}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={0.5}
                    >
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BRAND_TEXT }}>
                        {route.city}, {route.state}
                      </Typography>
                      <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: '#2563EB' }}>
                        {route.count} orders
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(Number(route.count || 0) / destinationMax) * 100}
                      sx={{
                        height: 7,
                        borderRadius: 999,
                        bgcolor: alpha('#3B82F6', 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, #60A5FA 0%, #2563EB 100%)',
                        },
                      }}
                    />
                  </Box>
                ))
              )}
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
          <Box sx={{ ...CARD_STYLE, p: 2.1, height: '100%' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: BRAND_TEXT, mb: 1.6 }}>
              Billing Overview
            </Typography>
            <Stack spacing={1.4}>
              <Box sx={{ p: 1.4, borderRadius: 2, bgcolor: alpha(BRAND_PRIMARY, 0.05) }}>
                <Typography
                  sx={{
                    fontSize: '0.74rem',
                    color: TEXT_MUTED,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Wallet Balance
                </Typography>
                <Typography
                  sx={{ mt: 0.45, fontSize: '1.7rem', fontWeight: 800, color: BRAND_TEXT }}
                >
                  {formatCurrency(financial.walletBalance)}
                </Typography>
              </Box>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: '0.8rem', color: TEXT_MUTED }}>
                    Shipping Charges
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: BRAND_TEXT }}>
                    {formatCurrency(financial.totalShippingCharges)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: '0.8rem', color: TEXT_MUTED }}>
                    Pending Invoice Amount
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#D97706' }}>
                    {formatCurrency(actions.pendingInvoiceAmount)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: '0.8rem', color: TEXT_MUTED }}>
                    COD Remittance Due
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                    {formatCurrency(financial.codRemittanceDue)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: '0.8rem', color: TEXT_MUTED }}>
                    This Week Revenue
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: BRAND_TEXT }}>
                    {formatCurrency(trends.thisWeekRevenue)}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        {bottomMetrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Grid key={metric.label} size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <Box sx={{ ...CARD_STYLE, p: 1.8 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={1}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.25,
                      bgcolor: alpha(metric.color, 0.1),
                      color: metric.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </Box>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: metric.color }}>
                    {metric.hint}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: TEXT_MUTED,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {metric.label}
                </Typography>
                <Typography
                  sx={{ mt: 0.6, fontSize: '1.45rem', fontWeight: 800, color: BRAND_TEXT }}
                >
                  {metric.value}
                </Typography>
              </Box>
            </Grid>
          )
        })}
      </Grid>
    </Stack>
  )
}

export default Home
