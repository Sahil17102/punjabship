import { DeleteIcon, EditIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Center,
  Flex,
  IconButton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react'
import { useDeleteB2BCourier, useDeleteB2BZone } from 'hooks/useCouriers'

export const B2BTable = ({ data, onEdit, planId }) => {
  const deleteB2BZoneMutation = useDeleteB2BZone(planId)
  const deleteB2BCourierMutation = useDeleteB2BCourier(planId)

  const cardBg = useColorModeValue('white', 'gray.800')
  const headerBg = useColorModeValue('gray.50', 'gray.700')
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600')

  // Debug: Log first courier data to see structure
  if (data?.length > 0) {
    console.log('B2B Table - First courier data:', data[0])
    console.log('Service provider field:', data[0]?.service_provider, data[0]?.serviceProvider)
  }

  if (!data?.length) {
    return (
      <Center py={20}>
        <Text color="gray.500">No rate card data available</Text>
      </Center>
    )
  }

  return (
    <Stack spacing={6}>
      {data.map((courier) => {
        const courierZones = Object.keys(courier.rates || {})?.map((zoneName) => ({
          name: zoneName,
          rates: courier.rates[zoneName],
          id: courier?.zone_id, // optional if available
        }))

        return (
          <Box
            key={courier.courier_id}
            borderRadius="md"
            p={4}
            bg={cardBg}
            boxShadow="sm"
            border="1px solid"
            borderColor={cardBorderColor}
          >
            {/* Header */}
            <Flex
              justify="space-between"
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'flex-start', md: 'center' }}
              mb={4}
              gap={2}
            >
              <Box>
                <Text fontWeight="bold" fontSize="lg">
                  {courier.courier_name}
                </Text>
                {(courier.service_provider || courier.serviceProvider) && (
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Service Provider:{' '}
                    <Badge variant="solid" colorScheme="green" ml={1}>
                      {courier.service_provider || courier.serviceProvider}
                    </Badge>
                  </Text>
                )}
              </Box>
              <Flex gap={4} wrap="wrap" align="center">
                <Text fontSize="sm" color="gray.600">
                  Min Weight:{' '}
                  <Badge variant="solid" colorScheme="blackAlpha">
                    {courier.min_weight ?? 'NA'} kg
                  </Badge>
                </Text>
                <Text fontSize="sm" color="gray.600">
                  COD:{' '}
                  <Badge variant="solid" colorScheme="blackAlpha">
                    ₹{courier.cod_charges ?? '0'} | {courier.cod_percent ?? '0'}%
                  </Badge>
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Other:{' '}
                  <Badge variant="solid" colorScheme="blackAlpha">
                    ₹{courier.other_charges ?? '0'}
                  </Badge>
                </Text>
                <IconButton
                  aria-label="Edit"
                  icon={<EditIcon />}
                  size="sm"
                  colorScheme="yellow"
                  onClick={() => onEdit(courier)}
                />
                <IconButton
                  aria-label="Delete Courier"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  onClick={() => deleteB2BCourierMutation.mutate(courier.courier_id)}
                />
              </Flex>
            </Flex>

            {/* Zones Table */}
            {courierZones.length ? (
              <Table size="sm" variant="striped">
                <Thead bg={headerBg}>
                  <Tr>
                    <Th>Zone</Th>
                    <Th>Forward</Th>
                    <Th>RTO</Th>
                    <Th>Min Weight</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {courierZones?.map((zone) => (
                    <Tr key={zone.name}>
                      <Td>{zone.name}</Td>
                      <Td>₹{zone.rates.forward ?? 'NA'}</Td>
                      <Td>₹{zone.rates.rto ?? 'NA'}</Td>
                      <Td>{zone.rates.min_weight ?? courier.min_weight ?? 'NA'} kg</Td>
                      <Td>
                        <IconButton
                          aria-label="Delete Zone"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => {
                            console.log('zone', zone)
                            deleteB2BZoneMutation.mutate({
                              courierId: courier.courier_id,
                              zoneId: zone.id,
                            })
                          }}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Center py={4}>
                <Text color="gray.500">No zones available for this courier</Text>
              </Center>
            )}
          </Box>
        )
      })}
    </Stack>
  )
}
