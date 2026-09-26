'use client'

import {
  Box,
  Container,
  Flex,
  Grid,
  HStack,
  Icon,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import {
  FaBoxOpen,
  FaBuilding,
  FaExclamationTriangle,
  FaShippingFast,
  FaStore,
  FaTruck,
} from 'react-icons/fa'

const stages = [
  { label: 'Booked', icon: FaStore },
  { label: 'Pending Pickup', icon: FaBuilding },
  { label: 'In Transit', icon: FaTruck },
  { label: 'Out for Delivery', icon: FaShippingFast },
  { label: 'Delivered', icon: FaBoxOpen },
]

const statusLabels = {
  PP: 'Pending Pickup',
  IT: 'In Transit',
  OFD: 'Out for Delivery',
  DL: 'Delivered',
  CAN: 'Cancelled',
  RT: 'RTO',
  'RT-IT': 'RTO In Transit',
  'RT-DL': 'RTO Delivered',
  EX: 'Exception',
  NDR: 'NDR',
}

const normalizeStatus = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const getStageIndexFromStatus = (value) => {
  const status = normalizeStatus(value)
  if (!status) return -1
  if (['dl', 'delivered', 'rto_delivered', 'rt_dl'].includes(status)) return 4
  if (['ofd', 'out_for_delivery', 'out_for_delivery_pending'].includes(status)) return 3
  if (['ndr', 'undelivered', 'exception', 'ex'].includes(status)) return 3
  if (['it', 'in_transit', 'rt', 'rto', 'rt_it', 'rto_in_transit'].includes(status)) return 2
  if (['pp', 'picked_up', 'pickup_done', 'pickup_initiated', 'manifested'].includes(status)) return 1
  if (['booked', 'new', 'pending', 'shipment_created', 'order_created'].includes(status)) return 0
  if (['can', 'cancelled', 'canceled'].includes(status)) return 0
  return -1
}

const getCurrentStage = (tracking) => {
  const directStage = getStageIndexFromStatus(tracking?.status)
  if (directStage >= 0) return directStage

  return Math.max(
    0,
    ...(tracking?.history || []).map((event) =>
      Math.max(
        getStageIndexFromStatus(event?.status_code),
        getStageIndexFromStatus(event?.message),
      ),
    ),
  )
}

const formatTrackingEventTime = (value) =>
  new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const getEventHub = (event) =>
  String(event?.hub_name || event?.location || 'Hub unavailable').trim()

export default function TrackingDetails({ data, isLoading, error }) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const detailItemBg = useColorModeValue('gray.50', 'gray.700')
  const historyBorderColor = useColorModeValue('gray.200', 'gray.600')
  if (isLoading) {
    return (
      <Flex direction="column" align="center" justify="center" py={12}>
        <Spinner size="xl" thickness="4px" color="blue.500" />
        <Text mt={4} fontWeight="medium">
          Fetching your tracking details…
        </Text>
      </Flex>
    )
  }

  if (error || !data) {
    return (
      <Box bg="red.50" border="1px" borderColor="red.200" rounded="lg" p={6} textAlign="center">
        <Icon as={FaExclamationTriangle} boxSize={10} color="red.500" mb={2} />
        <Text fontWeight="bold" fontSize="lg" color="red.700">
          {error ? 'Something went wrong' : 'Tracking Not Found'}
        </Text>
        <Text fontSize="sm" mt={1} color="red.600">
          {error?.message || 'Please check your AWB / Order details and try again.'}
        </Text>
      </Box>
    )
  }

  const currentStage = getCurrentStage(data)
  const isCancelled = ['can', 'cancelled', 'canceled'].includes(normalizeStatus(data?.status))
  const isRto = normalizeStatus(data?.status).includes('rto') || normalizeStatus(data?.status).startsWith('rt')

  return (
    <Container maxW="6xl" py={8}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 2fr' }} gap={6}>
        {/* Shipment Details */}
        <Box bg={cardBg} rounded="lg" shadow="md" p={6}>
          <Text fontSize="xl" fontWeight="bold" mb={4}>
            Shipment Details
          </Text>
          <VStack spacing={3} align="stretch">
            {[
              { label: 'Courier', value: data.courier_name },
              { label: 'AWB No', value: data.awb_number },
              { label: 'Order Number', value: data.order_number },
              { label: 'Payment Type', value: data.payment_type },
              { label: 'Expected Delivery', value: data.edd },
            ].map((item) => (
              <Box
                key={item.label}
                p={3}
                rounded="md"
                bg={detailItemBg}
              >
                <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                  {item.label}
                </Text>
                <Text fontWeight="semibold">{item.value || '-'}</Text>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Tracking Progress + History */}
        <VStack spacing={6} align="stretch">
          {/* Progress */}
          <Box bg={cardBg} rounded="lg" shadow="md" p={6}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Travel pipeline
            </Text>
            <HStack justify="space-between">
              {stages.map((stage, index) => {
                const active = !isCancelled && index <= currentStage
                const stageLabel =
                  isRto && index === stages.length - 1
                    ? normalizeStatus(data?.status).includes('delivered')
                      ? 'RTO Delivered'
                      : 'RTO'
                    : stage.label
                return (
                  <VStack key={stage.label} spacing={2} flex="1">
                    <Flex
                      w={10}
                      h={10}
                      rounded="full"
                      align="center"
                      justify="center"
                      bg={active ? 'blue.500' : isCancelled && index === 0 ? 'red.500' : 'gray.300'}
                      color="white"
                    >
                      <Icon as={stage.icon} />
                    </Flex>
                    <Text
                      fontSize="xs"
                      fontWeight={active || (isCancelled && index === 0) ? 'bold' : 'normal'}
                      color={active ? 'blue.600' : isCancelled && index === 0 ? 'red.600' : 'gray.500'}
                      textAlign="center"
                    >
                      {isCancelled && index === 0 ? 'Cancelled' : stageLabel}
                    </Text>
                  </VStack>
                )
              })}
            </HStack>
          </Box>

          {/* History */}
          <Box bg={cardBg} rounded="lg" shadow="md" p={6}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Tracking History
            </Text>
            <VStack spacing={4} align="stretch">
              {data.history.map((h, idx) => (
                <Box
                  key={idx}
                  p={4}
                  border="1px"
                  borderColor={historyBorderColor}
                  rounded="md"
                >
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    {h.message || 'Status update'}
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold">
                    <strong>Hub:</strong> {getEventHub(h)}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Time:</strong>{' '}
                    {formatTrackingEventTime(h.event_time)}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </VStack>
      </Grid>
    </Container>
  )
}
