import React from 'react'
import { Card, CardContent, Typography, alpha, useTheme } from '@mui/material'
import { MdTrendingUp } from 'react-icons/md'

interface RevenueChartProps {
  chartData: { date: string; revenue: number }[]
  ChartComponent: React.ComponentType<{ options: unknown; series: unknown; type: string; height: number }> | null
  formatCurrency: (amount: number) => string
}

export default function RevenueChart({ chartData, ChartComponent, formatCurrency }: RevenueChartProps) {
  const theme = useTheme()
  const formatChartDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return value
    return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
  }

  const chartOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    colors: [theme.palette.success.main],
    xaxis: {
      categories: chartData?.map((d) => formatChartDate(d.date)) || [],
      labels: { style: { colors: theme.palette.text.secondary } },
    },
    yaxis: {
      labels: {
        style: { colors: theme.palette.text.secondary },
        formatter: (val: number) => `₹${(val / 1000).toFixed(1)}k`,
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    grid: {
      borderColor: alpha(theme.palette.divider, 0.1),
    },
  }

  const chartSeries = [
    {
      name: 'Revenue',
      data: chartData?.map((d) => d.revenue) || [],
    },
  ]

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, transparent 100%)`
          : 'white',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          <MdTrendingUp style={{ marginRight: 8, verticalAlign: 'middle', color: theme.palette.success.main }} />
          Revenue Trend (Last 7 Days)
        </Typography>
        {ChartComponent && <ChartComponent options={chartOptions} series={chartSeries} type="bar" height={300} />}
      </CardContent>
    </Card>
  )
}
