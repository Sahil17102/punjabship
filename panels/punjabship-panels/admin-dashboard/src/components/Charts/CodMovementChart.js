import React from 'react'
import Chart from 'react-apexcharts'

const formatDate = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function CodMovementChart({ data = [] }) {
  const options = {
    chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, animations: { speed: 450 } },
    colors: ['#C98900', '#168D68'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.04, stops: [0, 95] } },
    xaxis: {
      categories: data.map((row) => formatDate(row.date)),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#665F4B', fontSize: '11px' } },
    },
    yaxis: { labels: { style: { colors: '#665F4B', fontSize: '11px' }, formatter: (value) => `₹${Math.round(value / 1000)}k` } },
    grid: { borderColor: '#E5D49B', strokeDashArray: 3 },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '11px' },
    tooltip: { y: { formatter: (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value) } },
  }
  const series = [
    { name: 'COD collected', data: data.map((row) => Number(row.collected) || 0) },
    { name: 'Remitted', data: data.map((row) => Number(row.remitted) || 0) },
  ]
  return <Chart options={options} series={series} type="area" width="100%" height="100%" />
}
