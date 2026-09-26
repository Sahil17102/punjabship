import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Text,
} from '@chakra-ui/react'
import { memo } from 'react'

/**
 * Surcharges Section Component
 */
const SurchargesSection = memo(({ formData, onFieldChange }) => {
  return (
    <Box>
      <Text fontSize="md" fontWeight="bold" color="yellow.600" mb={4}>
        3. Surcharges
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Public Holiday Pickup Charge (₹)
          </FormLabel>
          <NumberInput
            value={formData.publicHolidayPickupCharge}
            onChange={(_, value) => onFieldChange('publicHolidayPickupCharge', value)}
            size="sm"
          >
            <NumberInputField />
          </NumberInput>
          <FormHelperText fontSize="xs">Rs Additional</FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Fuel Surcharge Percentage (%)
          </FormLabel>
          <NumberInput
            value={formData.fuelSurchargePercentage}
            onChange={(_, value) => onFieldChange('fuelSurchargePercentage', value)}
            size="sm"
            precision={2}
          >
            <NumberInputField />
          </NumberInput>
          <FormHelperText fontSize="xs">% on basic freight</FormHelperText>
        </FormControl>

        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Green Tax (₹)
          </FormLabel>
          <NumberInput
            value={formData.greenTax}
            onChange={(_, value) => onFieldChange('greenTax', value)}
            size="sm"
          >
            <NumberInputField />
          </NumberInput>
          <FormHelperText fontSize="xs">Rs Additional</FormHelperText>
        </FormControl>
      </SimpleGrid>
    </Box>
  )
})

SurchargesSection.displayName = 'SurchargesSection'

export default SurchargesSection
