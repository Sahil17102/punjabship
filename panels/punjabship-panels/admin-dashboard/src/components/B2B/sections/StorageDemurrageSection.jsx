import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { memo } from 'react'

/**
 * Storage & Demurrage Section Component
 */
const StorageDemurrageSection = memo(({ formData, onFieldChange }) => {
  return (
    <Box>
      <Text fontSize="md" fontWeight="bold" color="orange.600" mb={4}>
        2. Storage & Demurrage
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Free Storage Days
          </FormLabel>
          <NumberInput
            value={formData.freeStorageDays}
            onChange={(_, value) => onFieldChange('freeStorageDays', value)}
            size="sm"
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>
      </SimpleGrid>

      {/* Demurrage Charges - All in one row on large screens */}
      <Box
        mt={4}
        p={4}
        bg={useColorModeValue('orange.50', 'orange.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('orange.200', 'orange.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="orange.700" mb={3}>
          Demurrage Charges
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Demurrage Per AWB/Day (₹)
            </FormLabel>
            <NumberInput
              value={formData.demurragePerAwbDay}
              onChange={(_, value) => onFieldChange('demurragePerAwbDay', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per AWB/day</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Demurrage Per Kg/Day (₹)
            </FormLabel>
            <NumberInput
              value={formData.demurragePerKgDay}
              onChange={(_, value) => onFieldChange('demurragePerKgDay', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per Kg/day</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Demurrage Calculation Method
            </FormLabel>
            <Select
              value={formData.demurrageMethod || 'whichever_is_higher'}
              onChange={(e) => onFieldChange('demurrageMethod', e.target.value)}
              size="sm"
            >
              <option value="whichever_is_higher">Whichever is Higher</option>
              <option value="whichever_is_lower">Whichever is Lower</option>
            </Select>
          </FormControl>
        </SimpleGrid>
      </Box>
    </Box>
  )
})

StorageDemurrageSection.displayName = 'StorageDemurrageSection'

export default StorageDemurrageSection
