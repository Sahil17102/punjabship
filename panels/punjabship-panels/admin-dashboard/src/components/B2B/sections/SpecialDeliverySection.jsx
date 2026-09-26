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
 * Special Delivery Charges Section Component
 * Handles Time Specific, Mall Delivery, and Delivery Reattempt
 */
const SpecialDeliverySection = memo(({ formData, onFieldChange }) => {
  return (
    <Box>
      <Text fontSize="md" fontWeight="bold" color="pink.600" mb={4}>
        5. Special Delivery Charges
      </Text>

      {/* Time Specific Delivery - All in one row on large screens */}
      <Box
        mb={4}
        p={4}
        bg={useColorModeValue('pink.50', 'pink.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('pink.200', 'pink.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="pink.700" mb={3}>
          Time Specific Delivery Charges
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Time Specific Per Kg (₹)
            </FormLabel>
            <NumberInput
              value={formData.timeSpecificPerKg}
              onChange={(_, value) => onFieldChange('timeSpecificPerKg', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per Kg</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Time Specific Per AWB (₹)
            </FormLabel>
            <NumberInput
              value={formData.timeSpecificPerAwb}
              onChange={(_, value) => onFieldChange('timeSpecificPerAwb', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per AWB</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Time Specific Calculation Method
            </FormLabel>
            <Select
              value={formData.timeSpecificMethod || 'whichever_is_higher'}
              onChange={(e) => onFieldChange('timeSpecificMethod', e.target.value)}
              size="sm"
            >
              <option value="whichever_is_higher">Whichever is Higher</option>
              <option value="whichever_is_lower">Whichever is Lower</option>
            </Select>
          </FormControl>
        </SimpleGrid>
      </Box>

      {/* Mall Delivery - All in one row on large screens */}
      <Box
        mb={4}
        p={4}
        bg={useColorModeValue('pink.50', 'pink.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('pink.200', 'pink.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="pink.700" mb={3}>
          Mall Delivery Charges
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Mall Delivery Per Kg (₹)
            </FormLabel>
            <NumberInput
              value={formData.mallDeliveryPerKg}
              onChange={(_, value) => onFieldChange('mallDeliveryPerKg', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per Kg</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Mall Delivery Per AWB (₹)
            </FormLabel>
            <NumberInput
              value={formData.mallDeliveryPerAwb}
              onChange={(_, value) => onFieldChange('mallDeliveryPerAwb', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per AWB</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Mall Delivery Calculation Method
            </FormLabel>
            <Select
              value={formData.mallDeliveryMethod || 'whichever_is_higher'}
              onChange={(e) => onFieldChange('mallDeliveryMethod', e.target.value)}
              size="sm"
            >
              <option value="whichever_is_higher">Whichever is Higher</option>
              <option value="whichever_is_lower">Whichever is Lower</option>
            </Select>
          </FormControl>
        </SimpleGrid>
      </Box>

      {/* Delivery Reattempt - All in one row on large screens */}
      <Box
        mb={4}
        p={4}
        bg={useColorModeValue('pink.50', 'pink.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('pink.200', 'pink.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="pink.700" mb={3}>
          Delivery Reattempt Charges
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Delivery Reattempt Per Kg (₹)
            </FormLabel>
            <NumberInput
              value={formData.deliveryReattemptPerKg}
              onChange={(_, value) => onFieldChange('deliveryReattemptPerKg', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per Kg</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Delivery Reattempt Per AWB (₹)
            </FormLabel>
            <NumberInput
              value={formData.deliveryReattemptPerAwb}
              onChange={(_, value) => onFieldChange('deliveryReattemptPerAwb', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Rs per AWB</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Delivery Reattempt Calculation Method
            </FormLabel>
            <Select
              value={formData.deliveryReattemptMethod || 'whichever_is_higher'}
              onChange={(e) => onFieldChange('deliveryReattemptMethod', e.target.value)}
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

SpecialDeliverySection.displayName = 'SpecialDeliverySection'

export default SpecialDeliverySection
