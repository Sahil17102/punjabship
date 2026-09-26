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
 * ODA & CSD Charges Section Component
 */
const ODAAndCSDSection = memo(({ formData, onFieldChange }) => {
  return (
    <Box>
      <Text fontSize="md" fontWeight="bold" color="purple.600" mb={4}>
        4. ODA & CSD Charges
      </Text>

      {/* ODA Charges - All in one row on large screens */}
      <Box
        mb={4}
        p={4}
        bg={useColorModeValue('purple.50', 'purple.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('purple.200', 'purple.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={3}>
          ODA Charges
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              ODA Charges Per AWB (₹)
            </FormLabel>
            <NumberInput
              value={formData.odaCharges}
              onChange={(_, value) => onFieldChange('odaCharges', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per AWB</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              ODA Charges Per Kg (₹)
            </FormLabel>
            <NumberInput
              value={formData.odaPerKgCharge}
              onChange={(_, value) => onFieldChange('odaPerKgCharge', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per Kg</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              ODA Calculation Method
            </FormLabel>
            <Select
              value={formData.odaMethod || 'whichever_is_higher'}
              onChange={(e) => onFieldChange('odaMethod', e.target.value)}
              size="sm"
            >
              <option value="whichever_is_higher">Whichever is Higher</option>
              <option value="whichever_is_lower">Whichever is Lower</option>
            </Select>
          </FormControl>
        </SimpleGrid>
      </Box>

      {/* CSD Delivery Charge */}
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="medium">
          CSD Delivery Charge (₹)
        </FormLabel>
        <NumberInput
          value={formData.csdDeliveryCharge}
          onChange={(_, value) => onFieldChange('csdDeliveryCharge', value)}
          size="sm"
        >
          <NumberInputField />
        </NumberInput>
        <FormHelperText fontSize="xs">Rs Additional per AWB</FormHelperText>
      </FormControl>
    </Box>
  )
})

ODAAndCSDSection.displayName = 'ODAAndCSDSection'

export default ODAAndCSDSection
