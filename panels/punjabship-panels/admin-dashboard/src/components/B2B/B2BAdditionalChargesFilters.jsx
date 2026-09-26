import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Select,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { IconCheck } from '@tabler/icons-react'

const B2BAdditionalChargesFilters = ({
  couriers,
  courierId,
  serviceProvider,
  onCourierChange,
  getCombinedCourierValue,
  onSave,
  onConfigureFields,
  isSaving,
  charges,
  showCourierSelector = true, // New prop to control visibility
  onImportClick, // New prop for import button
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      gap={3}
      align={{ base: 'stretch', md: 'end' }}
      bg={cardBg}
      p={4}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
    >
      {showCourierSelector && (
        <FormControl flex={1} minW="200px">
          <FormLabel fontSize="xs" fontWeight="medium" mb={1}>
            Courier Scope
          </FormLabel>
          <Select
            placeholder="Global (All Couriers)"
            value={getCombinedCourierValue()}
            onChange={(e) => onCourierChange(e.target.value)}
            size="sm"
            borderColor={borderColor}
          >
            {couriers.map((courier) => {
              const provider = courier.serviceProvider || courier.service_provider || ''
              const displayText = provider ? `${courier.name} - ${provider}` : courier.name
              const value = `${courier.id}|${provider}`
              return (
                <option key={courier.id} value={value}>
                  {displayText}
                </option>
              )
            })}
          </Select>
        </FormControl>
      )}
      <HStack spacing={2}>
        {onImportClick && (
          <Button
            colorScheme="teal"
            onClick={onImportClick}
            size="sm"
            variant="outline"
            leftIcon={<Text>📥</Text>}
          >
            Import CSV
          </Button>
        )}
        <Button
          colorScheme="blue"
          onClick={onSave}
          isLoading={isSaving}
          size="sm"
          leftIcon={<Icon as={IconCheck} boxSize={4} />}
          minW="140px"
        >
          Save Charges
        </Button>
      </HStack>
    </Flex>
  )
}

export default B2BAdditionalChargesFilters
