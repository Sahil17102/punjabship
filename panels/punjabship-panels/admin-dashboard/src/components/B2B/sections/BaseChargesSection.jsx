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
 * Base Charges Section Component
 * Handles AWB Charges, CFT Factor, and Minimum Chargeable
 */
const BaseChargesSection = memo(({ formData, onFieldChange }) => {
  return (
    <Box>
      <Text fontSize="md" fontWeight="bold" color="blue.600" mb={4}>
        1. Base Charges
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            AWB Charges (₹)
          </FormLabel>
          <NumberInput
            value={formData.awbCharges}
            onChange={(_, value) => onFieldChange('awbCharges', value)}
            size="sm"
          >
            <NumberInputField />
          </NumberInput>
          <FormHelperText fontSize="xs">Per AWB / per LR</FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            CFT Factor
          </FormLabel>
          <NumberInput
            value={formData.cftFactor}
            onChange={(_, value) => onFieldChange('cftFactor', value)}
            size="sm"
          >
            <NumberInputField />
          </NumberInput>
          <FormHelperText fontSize="xs">Higher of volumetric vs actual weight</FormHelperText>
        </FormControl>
      </SimpleGrid>

      {/* Minimum Chargeable - All in one row on large screens */}
      <Box
        mt={4}
        p={4}
        bg={useColorModeValue('blue.50', 'blue.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('blue.200', 'blue.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="blue.700" mb={3}>
          Minimum Chargeable
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Minimum Chargeable Amount (₹)
            </FormLabel>
            <NumberInput
              value={formData.minimumChargeableAmount}
              onChange={(_, value) => onFieldChange('minimumChargeableAmount', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs amount</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Minimum Chargeable Weight (kg)
            </FormLabel>
            <NumberInput
              value={formData.minimumChargeableWeight}
              onChange={(_, value) => onFieldChange('minimumChargeableWeight', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Weight in kg (multiplied by rate per kg)</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Minimum Chargeable Calculation Method
            </FormLabel>
            <Select
              value={formData.minimumChargeableMethod || 'whichever_is_higher'}
              onChange={(e) => onFieldChange('minimumChargeableMethod', e.target.value)}
              size="sm"
            >
              <option value="whichever_is_higher">Whichever is Higher</option>
              <option value="whichever_is_lower">Whichever is Lower</option>
            </Select>
            <FormHelperText fontSize="xs">
              Compares Rs amount vs (Weight × Rate per Kg)
            </FormHelperText>
          </FormControl>
        </SimpleGrid>
      </Box>
    </Box>
  )
})

BaseChargesSection.displayName = 'BaseChargesSection'

export default BaseChargesSection
