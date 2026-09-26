import { Box, Button, Flex, Text } from '@chakra-ui/react'

export const adminShipmentStageGroups = [
  {
    label: 'Shipment Booking',
    stages: [
      { label: 'New', value: 'pending', statuses: ['pending', 'new', 'draft'] },
      { label: 'Courier Assigned', value: 'booked', statuses: ['booked', 'shipment_created'] },
      { label: 'Pickup & Manifest', value: 'pickup_initiated', statuses: ['pickup_initiated', 'picked_up', 'pickup_scheduled', 'manifested'] },
      { label: 'Manifest Failed', value: 'manifest_failed' },
    ],
  },
  {
    label: 'Shipment Journey',
    stages: [
      { label: 'In Transit', value: 'in_transit' },
      { label: 'Out For Delivery', value: 'out_for_delivery' },
      { label: 'Delivered', value: 'delivered', statuses: ['delivered', 'ndr_delivered'] },
    ],
  },
  {
    label: 'NDR Exceptions',
    stages: [
      { label: 'NDR', value: 'ndr', statuses: ['ndr', 'undelivered'] },
      { label: 'RTO In-Transit', value: 'rto_in_transit', statuses: ['rto', 'rto_in_transit'] },
      { label: 'RTO Delivered', value: 'rto_delivered' },
    ],
  },
  {
    label: 'Records',
    stages: [
      { label: 'All', value: '', statuses: ['all'] },
      { label: 'Cancelled', value: 'cancelled', statuses: ['cancelled', 'cancellation_requested'] },
    ],
  },
]

const ShipmentStageFilter = ({ value = '', onChange, groups = adminShipmentStageGroups, counts = {} }) => (
  <Box
    role="group"
    aria-label="Shipment stage"
    w="full"
    overflowX="auto"
    overflowY="hidden"
    pb={1}
    sx={{
      scrollbarWidth: 'thin',
      '&::-webkit-scrollbar': { height: '4px' },
      '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: '2px' },
    }}
  >
    <Flex align="flex-end" gap={3} minW="max-content">
      {groups.map((group) => (
        <Box key={group.label}>
          <Text mb="5px" pl="2px" color="#64748B" fontSize="10px" fontWeight="650" lineHeight="1.2">
            {group.label}
          </Text>
          <Flex align="stretch">
            {group.stages.map((stage, index) => {
              const selected = value === stage.value
              const stageStatuses = stage.statuses || [stage.value]
              const count = stageStatuses.reduce(
                (total, status) => total + Number(counts[status] || 0),
                0,
              )
              const first = index === 0
              const last = index === group.stages.length - 1
              const radius = first && last ? '7px' : first ? '7px 0 0 7px' : last ? '0 7px 7px 0' : '0'

              return (
                <Button
                  key={`${group.label}-${stage.value}`}
                  aria-pressed={selected}
                  onClick={() => onChange(stage.value)}
                  minH="36px"
                  minW="68px"
                  h="36px"
                  px="11px"
                  py="6px"
                  ml={first ? 0 : '-1px'}
                  border="1px solid"
                  borderColor={selected ? '#0877C9' : '#D8E0E9'}
                  borderRadius={radius}
                  bg={selected ? '#0877C9' : '#FFFFFF'}
                  color={selected ? '#FFFFFF' : '#2A3547'}
                  fontSize="11px"
                  fontWeight={selected ? '700' : '500'}
                  lineHeight="1.15"
                  whiteSpace="nowrap"
                  zIndex={selected ? 1 : 0}
                  boxShadow="none"
                  transition="background-color 140ms ease, border-color 140ms ease, color 140ms ease"
                  _hover={{
                    bg: selected ? '#5940DE' : '#F7F5FF',
                    borderColor: selected ? '#5940DE' : '#B8ADF8',
                    zIndex: 2,
                  }}
                  _focusVisible={{ outline: '2px solid #0877C9', outlineOffset: '2px', zIndex: 3 }}
                >
                  <Flex as="span" align="center" gap="6px">
                    <Text as="span">{stage.label}</Text>
                    <Flex
                      as="span"
                      minW="20px"
                      h="20px"
                      px="6px"
                      align="center"
                      justify="center"
                      borderRadius="full"
                      bg={selected ? 'rgba(255,255,255,0.2)' : '#EEF1F6'}
                      color={selected ? '#FFFFFF' : '#475569'}
                      fontSize="10px"
                      fontWeight="800"
                    >
                      {count.toLocaleString('en-IN')}
                    </Flex>
                  </Flex>
                </Button>
              )
            })}
          </Flex>
        </Box>
      ))}
    </Flex>
  </Box>
)

export default ShipmentStageFilter
