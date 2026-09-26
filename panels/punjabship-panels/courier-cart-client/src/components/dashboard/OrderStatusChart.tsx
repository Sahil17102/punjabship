import React from 'react'
import { Card, CardContent, Typography, Stack, Box, alpha, useTheme } from '@mui/material'
import { MdPieChart } from 'react-icons/md'

interface OrderStatusChartProps {
  chartData: { status: string; count: number }[]
  ChartComponent: React.ComponentType<{ options: unknown; series: unknown; type: string; height: number }> | null
}

export default function OrderStatusChart({ chartData, ChartComponent }: OrderStatusChartProps) {
  const theme = useTheme()

  const statusColors: Record<string, string> = {
    delivered: theme.palette.success.main,
    pending: theme.palette.warning.main,
    'in_transit': theme.palette.info.main,
    'shipment_created': theme.palette.primary.main,
    cancelled: theme.palette.error.main,
    'out_for_delivery': theme.palette.secondary.main,
    default: theme.palette.grey[500],
  }

  const total = chartData?.reduce((sum, d) => sum + d.count, 0) || 0

  const chartOptions = {
    chart: {
      type: 'donut' as const,
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
      fontFamily: theme.typography.fontFamily,
    },
    labels: chartData?.map((d) => {
      const status = d.status.charAt(0).toUpperCase() + d.status.slice(1).replace(/_/g, ' ')
      return status
    }) || [],
    colors: chartData?.map((d) => statusColors[d.status.toLowerCase()] || statusColors.default) || [],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontWeight: 600,
              color: theme.palette.text.primary,
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: theme.palette.text.primary,
              offsetY: 10,
              formatter: () => {
                return total.toLocaleString()
              },
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total Orders',
              fontSize: '14px',
              fontWeight: 600,
              color: theme.palette.text.secondary,
              formatter: () => {
                return total.toLocaleString()
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number, opts: { w: { config: { labels: string[] }; globals: { series: number[] } }; seriesIndex: number }) => {
        const label = opts.w.config.labels[opts.seriesIndex]
        const value = opts.w.globals.series[opts.seriesIndex]
        return `${label}\n${value} (${val.toFixed(1)}%)`
      },
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#fff'],
        dropShadow: {
          enabled: true,
          top: 1,
          left: 1,
          blur: 1,
          opacity: 0.45,
        },
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        opacity: 0.45,
      },
    },
    legend: {
      show: true,
      position: 'bottom' as const,
      fontSize: '13px',
      fontWeight: 500,
      labels: {
        colors: theme.palette.text.primary,
        useSeriesColors: false,
      },
      markers: {
        width: 14,
        height: 14,
        radius: 7,
        strokeWidth: 2,
        strokeColor: theme.palette.background.paper,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 8,
      },
      formatter: (seriesName: string, opts: { w: { globals: { series: number[] } }; seriesIndex: number }) => {
        const value = opts.w.globals.series[opts.seriesIndex]
        const percentage = ((value / total) * 100).toFixed(1)
        return `${seriesName}: ${value} (${percentage}%)`
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      style: {
        fontSize: '13px',
      },
      y: {
        formatter: (val: number) => {
          const percentage = ((val / total) * 100).toFixed(1)
          return `${val.toLocaleString()} orders (${percentage}%)`
        },
      },
    },
    stroke: {
      show: true,
      width: 3,
      colors: [theme.palette.background.paper],
    },
  }

  const chartSeries = chartData?.map((d) => d.count) || []

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`
          : 'white',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: '10px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MdPieChart size={20} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Order Status Distribution
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Breakdown of orders by status
            </Typography>
          </Box>
        </Stack>
        {ChartComponent && (
          <Box sx={{ position: 'relative' }}>
            <ChartComponent options={chartOptions} series={chartSeries} type="donut" height={400} />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

