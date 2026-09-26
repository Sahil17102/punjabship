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
 * COD, ROV, Insurance & Liability Section Component
 */
const CODRovLiabilitySection = memo(({ formData, onFieldChange }) => {
  return (
    <Box>
      <Text fontSize="md" fontWeight="bold" color="green.600" mb={4}>
        7. COD, ROV, Insurance & Liability
      </Text>

      {/* COD Charges - All in one row on large screens */}
      <Box
        mb={4}
        p={4}
        bg={useColorModeValue('green.50', 'green.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('green.200', 'green.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="green.700" mb={3}>
          COD Charges
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              COD Fixed Amount (₹)
            </FormLabel>
            <NumberInput
              value={formData.codFixedAmount}
              onChange={(_, value) => onFieldChange('codFixedAmount', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Fixed amount (INR 50)</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              COD Percentage (%)
            </FormLabel>
            <NumberInput
              value={formData.codPercentage}
              onChange={(_, value) => onFieldChange('codPercentage', value)}
              size="sm"
              precision={2}
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">% of Invoice Value (1%)</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              COD Calculation Method
            </FormLabel>
            <Select
              value={formData.codMethod || 'whichever_is_higher'}
              onChange={(e) => onFieldChange('codMethod', e.target.value)}
              size="sm"
            >
              <option value="whichever_is_higher">Whichever is Higher</option>
              <option value="whichever_is_lower">Whichever is Lower</option>
            </Select>
          </FormControl>
        </SimpleGrid>
      </Box>

      {/* ROV Charges - All in one row on large screens */}
      <Box
        mb={4}
        p={4}
        bg={useColorModeValue('green.50', 'green.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('green.200', 'green.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="green.700" mb={3}>
          ROV Charges
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              ROV Fixed Amount (₹)
            </FormLabel>
            <NumberInput
              value={formData.rovFixedAmount}
              onChange={(_, value) => onFieldChange('rovFixedAmount', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Fixed amount (100)</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              ROV Percentage (%)
            </FormLabel>
            <NumberInput
              value={formData.rovPercentage}
              onChange={(_, value) => onFieldChange('rovPercentage', value)}
              size="sm"
              precision={2}
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">% of Invoice Value (0.5%)</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              ROV Calculation Method
            </FormLabel>
            <Select
              value={formData.rovMethod || 'whichever_is_higher'}
              onChange={(e) => onFieldChange('rovMethod', e.target.value)}
              size="sm"
            >
              <option value="whichever_is_higher">Whichever is Higher</option>
              <option value="whichever_is_lower">Whichever is Lower</option>
            </Select>
          </FormControl>
        </SimpleGrid>
      </Box>

      {/* Insurance Charge */}
      <FormControl mb={4}>
        <FormLabel fontSize="sm" fontWeight="medium">
          Insurance Charge (₹)
        </FormLabel>
        <NumberInput
          value={formData.insuranceCharge}
          onChange={(_, value) => onFieldChange('insuranceCharge', value)}
          size="sm"
        >
          <NumberInputField />
        </NumberInput>
        <FormHelperText fontSize="xs">Optional</FormHelperText>
      </FormControl>

      {/* Liability Charge - All in one row on large screens */}
      <Box
        mb={4}
        p={4}
        bg={useColorModeValue('green.50', 'green.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('green.200', 'green.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="green.700" mb={3}>
          Liability per Consignment
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Liability Limit (₹)
            </FormLabel>
            <NumberInput
              value={formData.liabilityLimit}
              onChange={(_, value) => onFieldChange('liabilityLimit', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Liability limit (5000)</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Liability Calculation Method
            </FormLabel>
            <Select
              value={formData.liabilityMethod || 'whichever_is_lower'}
              onChange={(e) => onFieldChange('liabilityMethod', e.target.value)}
              size="sm"
            >
              <option value="whichever_is_higher">Whichever is Higher</option>
              <option value="whichever_is_lower">Whichever is Lower</option>
            </Select>
            <FormHelperText fontSize="xs">Compares limit vs actual invoice value</FormHelperText>
          </FormControl>
        </SimpleGrid>
      </Box>
    </Box>
  )
})

CODRovLiabilitySection.displayName = 'CODRovLiabilitySection'

export default CODRovLiabilitySection
