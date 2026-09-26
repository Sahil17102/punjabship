import React from 'react'
import Chart from 'react-apexcharts'

const formatDate = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const SERIES = [
  ['Created', 'created', '#0877C9'],
  ['Pickup generated', 'pickupGenerated', '#D58B17'],
  ['Picked up', 'pickedUp', '#2389B7'],
  ['Shipped', 'shipped', '#3569C8'],
  ['OFD', 'ofd', '#A958A0'],
  ['Delivered', 'delivered', '#168D68'],
  ['RTO', 'rto', '#C65D43'],
  ['NDR', 'ndr', '#A9364D'],
]

export default function AdminStatusChart({ data = [] }) {
  const series = SERIES.map(([name, key]) => ({ name, data: data.map((row) => Number(row[key]) || 0) }))
  const options = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, animations: { speed: 450 } },
    colors: SERIES.map(([, , color]) => color),
    plotOptions: { bar: { borderRadius: 2, columnWidth: '58%' } },
    dataLabels: { enabled: false },
    stroke: { width: 1, colors: ['#FFFFFF'] },
    xaxis: {
      categories: data.map((row) => formatDate(row.date)),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#596174', fontSize: '11px', fontFamily: 'Epilogue, sans-serif' } },
    },
    yaxis: { labels: { style: { colors: '#596174', fontSize: '11px' }, formatter: (value) => Math.round(value) } },
    grid: { borderColor: '#D7DDE8', strokeDashArray: 3, padding: { left: 2, right: 8 } },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '11px', fontFamily: 'Epilogue, sans-serif', markers: { radius: 2 } },
    tooltip: { theme: 'light' },
  }

  return <Chart options={options} series={series} type="bar" width="100%" height="100%" />
}
