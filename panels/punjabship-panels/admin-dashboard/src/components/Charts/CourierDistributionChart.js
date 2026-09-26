import React from 'react'
import Chart from 'react-apexcharts'
import { useColorModeValue, VStack, HStack, Text, Badge, Box } from '@chakra-ui/react'

const CourierDistributionChart = ({ data = {} }) => {
  const textColor = useColorModeValue('gray.700', 'white')
  const textColorSecondary = useColorModeValue('gray.500', 'gray.400')
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Enhanced color palette with gradients
  const chartColors = useColorModeValue(
    ['#3182CE', '#319795', '#805AD5', '#D53F8C', '#DD6B20'],
    ['#4FD1C7', '#63B3ED', '#9F7AEA', '#F687B3', '#FC8181']
  )

  // Process data to extract orders count for each aggregator
  const chartData = Object.entries(data).map(([name, stats]) => {
    if (typeof stats === 'object' && stats !== null && 'count' in stats) {
      return stats.count || 0
    }
    return stats || 0
  })
  const chartLabels = Object.keys(data)

  const totalOrders = Object.values(data).reduce((sum, stats) => {
    if (typeof stats === 'object' && stats !== null && 'count' in stats) {
      return sum + (stats.count || 0)
    }
    return sum + (stats || 0)
  }, 0)

  // Calculate percentages for each aggregator
  const aggregatorData = Object.entries(data).map(([name, stats], index) => {
    const count = typeof stats === 'object' && stats !== null && 'count' in stats ? stats.count || 0 : stats || 0
    const percentage = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : 0
    const revenue = typeof stats === 'object' && stats !== null && 'revenue' in stats ? stats.revenue || 0 : 0
    const deliveryRate = typeof stats === 'object' && stats !== null && 'deliveryRate' in stats ? stats.deliveryRate || 0 : 0
    
    return {
      name,
      count,
      percentage: parseFloat(percentage),
      revenue,
      deliveryRate,
      color: chartColors[index % chartColors.length],
    }
  })

  // Sort by count descending
  aggregatorData.sort((a, b) => b.count - a.count)

  const tooltipBg = useColorModeValue('#fff', '#1a202c')
  const tooltipTextColor = useColorModeValue('#1a202c', '#fff')

  const chartOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '60%',
        borderRadius: 8,
        distributed: true,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: {
        colors: [bgColor],
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 600,
      },
      formatter: (val, opts) => {
        const index = opts.dataPointIndex
        const item = aggregatorData[index]
        return `${item.count} orders (${item.percentage}%)`
      },
      offsetX: 10,
      dropShadow: {
        enabled: false,
      },
    },
    colors: aggregatorData.map(item => item.color),
    xaxis: {
      categories: aggregatorData.map(item => item.name),
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
        },
      },
      axisBorder: {
        color: borderColor,
      },
      axisTicks: {
        color: borderColor,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
        },
      },
    },
    grid: {
      borderColor: borderColor,
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    },
    tooltip: {
      theme: useColorModeValue('light', 'dark'),
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif',
      },
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const item = aggregatorData[dataPointIndex]
        return `
          <div style="padding: 12px; background: ${tooltipBg}; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); color: ${tooltipTextColor};">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px; color: ${item.color};">${item.name}</div>
            <div style="font-size: 12px; margin-bottom: 4px;">Orders: <strong>${item.count}</strong> (${item.percentage}%)</div>
            <div style="font-size: 12px; margin-bottom: 4px;">Revenue: <strong>₹${item.revenue.toLocaleString('en-IN')}</strong></div>
            <div style="font-size: 12px;">Delivery Rate: <strong>${item.deliveryRate}%</strong></div>
          </div>
        `
      },
      marker: {
        show: true,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              barHeight: '50%',
            },
          },
          dataLabels: {
            style: {
              fontSize: '10px',
            },
          },
        },
      },
    ],
  }

  const summaryBg = useColorModeValue('gray.50', 'gray.700')
  const summaryItemBg = useColorModeValue('white', 'gray.800')

  return (
    <VStack align="stretch" spacing={4}>
      <Chart
        options={chartOptions}
        series={[{ name: 'Orders', data: aggregatorData.map(item => item.count) }]}
        type="bar"
        width="100%"
        height="300px"
      />
      {/* Additional metrics summary */}
      <Box
        mt={4}
        p={4}
        bg={summaryBg}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <HStack spacing={4} flexWrap="wrap" justify="center">
          {aggregatorData.map((item, index) => (
            <HStack
              key={index}
              spacing={2}
              p={2}
              bg={summaryItemBg}
              borderRadius="md"
              borderWidth="1px"
              borderColor={item.color + '40'}
            >
              <Box w={3} h={3} bg={item.color} borderRadius="full" />
              <VStack align="flex-start" spacing={0}>
                <Text fontSize="xs" color={textColorSecondary} fontWeight="medium">
                  {item.name}
                </Text>
                <HStack spacing={2}>
                  <Badge colorScheme="blue" fontSize="xs">
                    {item.count}
                  </Badge>
                  <Badge colorScheme="green" fontSize="xs">
                    {item.deliveryRate}%
                  </Badge>
                </HStack>
              </VStack>
            </HStack>
          ))}
        </HStack>
      </Box>
    </VStack>
  )
}

export default CourierDistributionChart
