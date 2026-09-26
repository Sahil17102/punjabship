import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdRefresh, MdTune } from 'react-icons/md'
import ActionItemsCard from '../../components/dashboard/ActionItemsCard'
import CourierComparisonChart from '../../components/dashboard/CourierComparisonChart'
import CourierPerformanceCard from '../../components/dashboard/CourierPerformanceCard'
import DashboardCustomizationDialog from '../../components/dashboard/DashboardCustomizationDialog'
import FinancialHealthCard from '../../components/dashboard/FinancialHealthCard'
import InsightsCard from '../../components/dashboard/InsightsCard'
import MetricsOverviewCard from '../../components/dashboard/MetricsOverviewCard'
import OrderStatusChart from '../../components/dashboard/OrderStatusChart'
import OrdersTrendChart from '../../components/dashboard/OrdersTrendChart'
import PerformanceMetricsCard from '../../components/dashboard/PerformanceMetricsCard'
import QuickActionsCard from '../../components/dashboard/QuickActionsCard'
import QuickStatsCards from '../../components/dashboard/QuickStatsCards'
import RecentActivityCard from '../../components/dashboard/RecentActivityCard'
import TodaysOperationsCard from '../../components/dashboard/TodaysOperationsCard'
import TopDestinationsCard from '../../components/dashboard/TopDestinationsCard'
import { useMerchantDashboardStats } from '../../hooks/useDashboard'
import { useDashboardPreferences } from '../../hooks/useDashboardPreferences'
import PageHeading from '../../components/UI/heading/PageHeading'

// Widget mapping
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const widgetComponents: Record<string, React.ComponentType<any>> = {
  quickStats: QuickStatsCards,
  quickActions: QuickActionsCard,
  insights: InsightsCard,
  actionItems: ActionItemsCard,
  performanceMetrics: PerformanceMetricsCard,
  ordersTrend: OrdersTrendChart,
  financialHealth: FinancialHealthCard,
  recentActivity: RecentActivityCard,
  todaysOperations: TodaysOperationsCard,
  orderStatusChart: OrderStatusChart,
  courierComparison: CourierComparisonChart,
  metricsOverview: MetricsOverviewCard,
  courierPerformance: CourierPerformanceCard,
  topDestinations: TopDestinationsCard,
}

const BRAND_PRIMARY = '#0877C9'
const BRAND_TEXT = '#17171A'
const TEXT_MUTED = '#6B7280'
const CARD_BORDER = 'rgba(17, 24, 39, 0.08)'
const CARD_SHADOW = '0 2px 12px rgba(15, 23, 42, 0.06)'

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading, error, refetch, isRefetching } = useMerchantDashboardStats()
  const { data: preferences } = useDashboardPreferences()
  const [ChartComponent, setChartComponent] = useState<
    typeof import('react-apexcharts').default | null
  >(null)
  const [customizeOpen, setCustomizeOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-apexcharts').then((mod) => {
        setChartComponent(() => mod.default)
      })
    }
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatPercentage = (value: number) => `${value}%`

  // Widget sizing map
  const WIDGET_SIZES: Record<string, { xs: number; md: number }> = {
    quickStats: { xs: 12, md: 12 },
    quickActions: { xs: 12, md: 6 },
    insights: { xs: 12, md: 6 },
    actionItems: { xs: 12, md: 8 },
    performanceMetrics: { xs: 12, md: 4 },
    ordersTrend: { xs: 12, md: 8 },
    financialHealth: { xs: 12, md: 6 },
    recentActivity: { xs: 12, md: 6 },
    todaysOperations: { xs: 12, md: 6 },
    orderStatusChart: { xs: 12, md: 6 },
    courierComparison: { xs: 12, md: 5 },
    metricsOverview: { xs: 12, md: 7 },
    courierPerformance: { xs: 12, md: 6 },
    topDestinations: { xs: 12, md: 6 },
  }

  // Default widget order
  const DEFAULT_WIDGETS = [
    'quickStats',
    'quickActions',
    'insights',
    'actionItems',
    'performanceMetrics',
    'ordersTrend',
    'financialHealth',
    'recentActivity',
    'todaysOperations',
    'orderStatusChart',
    'courierComparison',
    'metricsOverview',
    'courierPerformance',
    'topDestinations',
  ]

  // All memoized values must be called before any conditional returns
  const todayOps = stats?.todayOperations || { orders: 0, pending: 0, inTransit: 0, delivered: 0 }
  const financial = stats?.financial || { walletBalance: 0, todayRevenue: 0, totalRevenue: 0, totalShippingCharges: 0, totalFreightCharges: 0, profit: 0, codAmount: 0, codRemittanceDue: 0, codRemittanceCredited: 0 }
  const operational = stats?.operational || { deliverySuccessRate: 0, ndrRate: 0, rtoRate: 0, avgDeliveryTime: 0, totalOrders: 0, deliveredOrders: 0, ndrCount: 0, rtoCount: 0 }
  const actions = stats?.actions || { ndrCount: 0, rtoCount: 0, weightDiscrepancyCount: 0, openTickets: 0, inProgressTickets: 0, pendingInvoices: 0, pendingInvoiceAmount: 0, overdueInvoices: 0, overdueInvoiceAmount: 0 }
  const couriers = stats?.couriers || { performance: {}, distribution: [] }
  const charts = stats?.charts || { ordersByDate: [], revenueByDate: [], ordersByDate30: [], revenueByDate30: [], ordersByStatus: [], revenueByOrderType: [], ordersByCourier: [], revenueByCourier: [] }
  const isAllTime = stats?.isAllTime !== false

  // Memoized recommendations
  const recommendations = useMemo(() => {
    const recs: Array<{
      message: string
      action: string
      path: string
      priority: 'high' | 'medium' | 'low'
    }> = []

    if (actions.ndrCount > 0) {
      recs.push({
        message: `${actions.ndrCount} orders need your attention (NDR)`,
        action: 'Review NDRs',
        path: '/ops/ndr',
        priority: 'high',
      })
    }

    if (actions.rtoCount > 0) {
      recs.push({
        message: `${actions.rtoCount} orders returned (RTO)`,
        action: 'Check RTOs',
        path: '/ops/rto',
        priority: 'high',
      })
    }

    if (financial.walletBalance < 1000) {
      recs.push({
        message: 'Low wallet balance. Recharge to avoid service interruptions',
        action: 'Recharge Wallet',
        path: '/billing/wallet_transactions',
        priority: 'high',
      })
    }

    if (actions.pendingInvoices > 0) {
      recs.push({
        message: `${actions.pendingInvoices} invoice(s) pending payment`,
        action: 'View Invoices',
        path: '/billing/invoice_management',
        priority: 'medium',
      })
    }

    if (todayOps.pending > 5) {
      recs.push({
        message: `${todayOps.pending} orders pending. Review and process them`,
        action: 'View Orders',
        path: '/orders/list',
        priority: 'medium',
      })
    }

    return recs
  }, [actions.ndrCount, actions.rtoCount, financial.walletBalance, actions.pendingInvoices, todayOps.pending])

  // Memoized widget visibility
  const visibleWidgetOrder = useMemo(() => {
    const order = preferences?.widgetOrder || DEFAULT_WIDGETS
    const visibility = preferences?.widgetVisibility || {}
    return order.filter((widgetId) => visibility[widgetId] !== false)
  }, [preferences])

  // Memoized widget props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetProps: Record<string, any> = useMemo(() => {
    return {
      quickStats: {
        todayOps,
        financial,
        trends: stats?.trends || {
          ordersGrowth: 0,
          thisWeekOrders: 0,
          lastWeekOrders: 0,
        },
        formatCurrency,
      },
      quickActions: {},
      insights: {
        operational,
        trends: stats?.trends || {
          ordersGrowth: 0,
          thisWeekOrders: 0,
          lastWeekOrders: 0,
        },
        actions,
      },
      actionItems: { actions, formatCurrency },
      performanceMetrics: { operational, formatPercentage },
      ordersTrend: {
        chartData: charts.ordersByDate,
        ChartComponent,
      },
      financialHealth: {
        financial,
        trends: stats?.trends || {
          ordersGrowth: 0,
          thisWeekOrders: 0,
          lastWeekOrders: 0,
        },
        formatCurrency,
      },
      recentActivity: {
        recentActivity: stats?.recentActivity || { transactions: [], recentOrders: [] },
        formatCurrency,
      },
      todaysOperations: { todayOps },
      orderStatusChart: {
        chartData: charts.ordersByStatus,
        ChartComponent,
      },
      courierComparison: {
        ordersData: charts.ordersByCourier,
        ChartComponent,
      },
      metricsOverview: {
        metrics: stats?.metrics || {
          avgOrderValue: 0,
          totalPrepaidOrders: 0,
          totalCodOrders: 0,
        },
        formatCurrency,
      },
      courierPerformance: {
        courierPerformance: couriers.performance,
      },
      topDestinations: {
        topDestinations: stats?.geographic?.topDestinations || [],
      },
    }
  }, [
    todayOps,
    financial,
    operational,
    actions,
    couriers,
    charts,
    stats?.trends,
    stats?.recentActivity,
    stats?.metrics,
    stats?.geographic,
    ChartComponent,
  ])

  const heroMetrics = useMemo(() => {
    return [
      {
        label: 'Orders queued',
        value: (todayOps.orders || 0).toLocaleString(),
        helper: isAllTime ? 'All time pipeline' : 'Selected range',
      },
      {
        label: 'NDR watchlist',
        value: (actions.ndrCount || 0).toLocaleString(),
        helper: 'Actionable exceptions',
      },
      {
        label: 'RTO shipments',
        value: (actions.rtoCount || operational.rtoCount || 0).toLocaleString(),
        helper: 'Returned shipments',
      },
      {
        label: 'Pending invoices',
        value: (actions.pendingInvoices || 0).toLocaleString(),
        helper: 'Finance follow-ups',
      },
    ]
  }, [todayOps.orders, actions.ndrCount, actions.pendingInvoices, isAllTime])

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '58vh',
          borderRadius: 3,
          display: 'grid',
          placeItems: 'center',
          border: `1px solid ${CARD_BORDER}`,
          bgcolor: '#ffffff',
          boxShadow: CARD_SHADOW,
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={44} sx={{ color: BRAND_PRIMARY }} />
          <Typography color="text.secondary" sx={{ mt: 1.2 }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (error || !stats) {
    return (
      <Box
        sx={{
          minHeight: '58vh',
          borderRadius: 3,
          display: 'grid',
          placeItems: 'center',
          border: `1px solid ${CARD_BORDER}`,
          bgcolor: '#ffffff',
          boxShadow: CARD_SHADOW,
        }}
      >
        <Box textAlign="center">
          <Typography color="error" variant="h6">
            Error loading dashboard
          </Typography>
          <Button
            variant="contained"
            onClick={() => refetch()}
            sx={{
              mt: 1.2,
              bgcolor: BRAND_PRIMARY,
              '&:hover': { bgcolor: '#B8040E' },
            }}
          >
            Retry
          </Button>
        </Box>
      </Box>
    )
  }
  const spacing = preferences?.layout?.spacing || 2.2
  const showGridLines = preferences?.layout?.showGridLines || false

  return (
    <Box sx={{ minHeight: '100%', pb: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 2.5 }}>
        <PageHeading
          title="Shipping control center"
          subtitle="Real-time shipment, exception, finance, and courier performance in one workspace."
          badge="MERCHANT DASHBOARD"
          actions={
            <Stack direction="row" gap={1}>
            <Button
              startIcon={<MdRefresh size={18} />}
              onClick={() => refetch()}
              disabled={isRefetching}
              variant="outlined"
              sx={{
                textTransform: 'none',
                borderRadius: 1.5,
                fontWeight: 600,
              }}
            >
              {isRefetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              startIcon={<MdTune size={18} />}
              onClick={() => setCustomizeOpen(true)}
              variant="contained"
              sx={{
                textTransform: 'none',
                borderRadius: 1.5,
                fontWeight: 600,
                bgcolor: BRAND_PRIMARY,
                '&:hover': { bgcolor: '#0564AD' },
              }}
            >
              Customize
            </Button>
          </Stack>
          }
          meta={heroMetrics.map(({ label, value }) => ({ label, value }))}
        />
      </Box>
      <Box onClick={() => navigate('/ops/rto')} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') navigate('/ops/rto') }} sx={{ mb: 2.5, p: 2, border: '1px solid #E8BCC4', bgcolor: '#FFF1F3', cursor: 'pointer', transition: 'transform 160ms ease, box-shadow 160ms ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(113, 28, 48, 0.12)' } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box><Typography fontWeight={800} color="#7D243A">RTO overview</Typography><Typography variant="body2" color="#6B3A46">{actions.rtoCount || operational.rtoCount || 0} returned shipments · {operational.rtoRate || 0}% return rate</Typography></Box>
          <Button size="small" onClick={() => navigate('/ops/rto')}>Open RTO report</Button>
        </Stack>
      </Box>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <Box
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 3,
            bgcolor: '#ffffff',
            border: `1px solid ${CARD_BORDER}`,
            boxShadow: CARD_SHADOW,
          }}
        >
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: BRAND_TEXT, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ Action Items
          </Typography>
          <Stack spacing={1}>
            {recommendations.slice(0, 3).map((item) => (
              <Box
                key={item.message}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: item.priority === 'high' ? alpha('#EF4444', 0.05) : alpha('#3B82F6', 0.05),
                  border: `1px solid ${item.priority === 'high' ? alpha('#EF4444', 0.2) : alpha('#3B82F6', 0.2)}`,
                  transition: 'all 200ms ease',
                  '&:hover': {
                    boxShadow: `0 4px 12px ${alpha(item.priority === 'high' ? '#EF4444' : '#3B82F6', 0.1)}`,
                  },
                }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: item.priority === 'high' ? '#EF4444' : '#3B82F6', mb: 0.2 }}>
                  {item.action}
                </Typography>
                <Typography sx={{ color: TEXT_MUTED, fontSize: '0.8rem', lineHeight: 1.4 }}>
                  {item.message}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Widgets Grid */}
      <Box sx={{ position: 'relative' }}>
        {showGridLines && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              zIndex: 0,
              backgroundImage: `
                repeating-linear-gradient(
                  to right,
                  transparent 0,
                  transparent calc((100% / 12) - 1px),
                  ${alpha('#0877C9', 0.08)} calc((100% / 12) - 1px),
                  ${alpha('#0877C9', 0.08)} calc(100% / 12)
                )
              `,
            }}
          />
        )}
        <Grid container spacing={spacing} sx={{ position: 'relative', zIndex: 1 }}>
          {visibleWidgetOrder
            .filter((widgetId) => widgetId !== 'revenueChart' && widgetId !== 'revenueByTypeChart')
            .map((widgetId) => {
              const WidgetComponent = widgetComponents[widgetId]
              const gridSize = WIDGET_SIZES[widgetId] || { xs: 12, md: 6 }

              if (!WidgetComponent) return null

              return (
                <Grid size={gridSize} key={widgetId}>
                  <WidgetComponent {...(widgetProps[widgetId] || {})} />
                </Grid>
              )
            })}
        </Grid>
      </Box>

      {/* Customization Dialog */}
      <DashboardCustomizationDialog open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
    </Box>
  )
}
