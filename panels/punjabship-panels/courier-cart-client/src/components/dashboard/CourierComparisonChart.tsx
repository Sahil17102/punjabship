import React from 'react'
import { Card, CardContent, Typography, alpha, useTheme } from '@mui/material'
import { MdLocalShipping } from 'react-icons/md'

interface CourierComparisonChartProps {
  ordersData: { courier: string; count: number }[]
  ChartComponent: React.ComponentType<{ options: unknown; series: unknown; type: string; height: number }> | null
}

export default function CourierComparisonChart({
  ordersData,
  ChartComponent,
}: CourierComparisonChartProps) {
  const theme = useTheme()

  // Get top couriers by order count
  const topCouriers = [...ordersData].sort((a, b) => b.count - a.count).slice(0, 5)
  const courierNames = topCouriers.map((d) => d.courier)

  const ordersSeries = topCouriers.map((d) => d.count)

  const chartOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: { show: false },
      stacked: false,
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    colors: [theme.palette.primary.main],
    xaxis: {
      categories: courierNames.map((name) => name.charAt(0).toUpperCase() + name.slice(1)),
      labels: {
        style: { colors: theme.palette.text.secondary },
        fontSize: '11px',
      },
    },
    yaxis: {
      title: {
        text: 'Orders',
        style: { color: theme.palette.primary.main },
      },
      labels: {
        style: { colors: theme.palette.primary.main },
      },
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '50%',
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      shared: true,
      intersect: false,
    },
    legend: {
      show: true,
      position: 'top' as const,
      labels: {
        colors: theme.palette.text.primary,
      },
    },
    grid: {
      borderColor: alpha(theme.palette.divider, 0.1),
      strokeDashArray: 4,
    },
  }

  const chartSeries = [
    {
      name: 'Orders',
      type: 'column',
      data: ordersSeries,
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
          ? `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, transparent 100%)`
          : 'white',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          <MdLocalShipping style={{ marginRight: 8, verticalAlign: 'middle', color: theme.palette.info.main }} />
          Courier Performance Comparison
        </Typography>
        {ChartComponent && (
          <ChartComponent options={chartOptions} series={chartSeries} type="bar" height={290} />
        )}
      </CardContent>
    </Card>
  )
}
