import React from 'react'
import CardHeader from 'components/Card/CardHeader'
import CardBody from 'components/Card/CardBody'
import Chart from 'react-apexcharts'
import { useColorModeValue, HStack, Text, Icon, Box } from '@chakra-ui/react'
import { IconWorld } from '@tabler/icons-react'

const AggregatorTrendChart = ({ data = [] }) => {
  const textColor = useColorModeValue('gray.700', 'white')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400')
  const gridColor = useColorModeValue('gray.200', 'gray.700')

  // Enhanced color scheme for each aggregator
  const aggregatorColors = {
    Delhivery: { color: '#319795', gradient: ['#319795', '#38B2AC'] },
  }

  const aggregatorNames = ['Delhivery']
  const seriesData = aggregatorNames.map((name) => ({
    name,
    data: data.map((item) => item[name] || 0),
  }))

  const chartOptions = {
    chart: {
      type: 'area',
      stacked: true,
      toolbar: {
        show: false,
      },
      height: '100%',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2.5,
      lineCap: 'round',
      colors: aggregatorNames.map((name) => aggregatorColors[name]?.color || '#3182CE'),
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'vertical',
        shadeIntensity: 0.5,
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 50, 100],
      },
    },
    colors: aggregatorNames.map((name) => aggregatorColors[name]?.color || '#3182CE'),
    markers: {
      size: 4,
      hover: {
        size: 6,
      },
    },
    xaxis: {
      categories: data.map((item) => {
        const date = new Date(item.date)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      labels: {
        style: {
          colors: textColorSecondary,
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: textColorSecondary,
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
        },
        formatter: (val) => Math.round(val).toString(),
      },
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
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
      y: {
        formatter: (val) => `${val} orders`,
      },
      marker: {
        show: true,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      floating: false,
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 600,
      labels: {
        colors: textColor,
        useSeriesColors: false,
      },
      markers: {
        width: 12,
        height: 12,
        radius: 6,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 4,
      },
    },
  }

  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <>
      <CardHeader
        bg={useColorModeValue('purple.50', 'purple.900')}
        borderBottom="1px"
        borderColor={borderColor}
        py={4}
        px={6}
      >
        <HStack>
          <Icon as={IconWorld} w={5} h={5} color={useColorModeValue('purple.600', 'purple.300')} />
          <Text fontSize="md" color={textColor} fontWeight="600">
            Orders by Shipping Aggregator
          </Text>
        </HStack>
        <Text fontSize="xs" color={textColorSecondary} mt={1}>
          Last 7 days trend
        </Text>
      </CardHeader>
      <CardBody p={6}>
        <Box h={{ base: '250px', md: '320px' }}>
          <Chart options={chartOptions} series={seriesData} type="area" width="100%" height="100%" />
        </Box>
      </CardBody>
    </>
  )
}

export default AggregatorTrendChart
