import React from 'react'
import { Card, CardContent, Typography, alpha, useTheme } from '@mui/material'
import { MdMonetizationOn } from 'react-icons/md'

interface RevenueByTypeChartProps {
  chartData: { type: string; revenue: number }[]
  ChartComponent: React.ComponentType<{ options: unknown; series: unknown; type: string; height: number }> | null
  formatCurrency: (amount: number) => string
}

export default function RevenueByTypeChart({
  chartData,
  ChartComponent,
  formatCurrency,
}: RevenueByTypeChartProps) {
  const theme = useTheme()

  const chartOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: { show: false },
      stacked: false,
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    colors: [theme.palette.primary.main, theme.palette.success.main],
    xaxis: {
      categories: chartData?.map((d) => d.type.charAt(0).toUpperCase() + d.type.slice(1)) || [],
      labels: {
        style: { colors: theme.palette.text.secondary },
        fontSize: '12px',
      },
    },
    yaxis: {
      labels: {
        style: { colors: theme.palette.text.secondary },
        formatter: (val: number) => `₹${(val / 1000).toFixed(1)}k`,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => formatCurrency(val),
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: [theme.palette.mode === 'dark' ? '#fff' : '#000'],
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '60%',
        dataLabels: {
          position: 'top',
        },
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
      strokeDashArray: 4,
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
          <MdMonetizationOn style={{ marginRight: 8, verticalAlign: 'middle', color: theme.palette.success.main }} />
          Revenue by Order Type
        </Typography>
        {ChartComponent && (
          <ChartComponent options={chartOptions} series={chartSeries} type="bar" height={300} />
        )}
      </CardContent>
    </Card>
  )
}

