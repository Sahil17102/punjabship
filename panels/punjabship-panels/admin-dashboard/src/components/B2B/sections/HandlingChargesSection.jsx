import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  NumberInput,
  NumberInputField,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { memo } from 'react'

/**
 * Handling Charges Section Component
 */
const HandlingChargesSection = memo(({ formData, onFieldChange }) => {
  return (
    <Box>
      <Text fontSize="md" fontWeight="bold" color="teal.600" mb={4}>
        6. Handling Charges
      </Text>

      {/* Single Piece Handling */}
      <Box
        mb={4}
        p={4}
        bg={useColorModeValue('teal.50', 'teal.900')}
        borderRadius="md"
        borderWidth="1px"
        borderColor={useColorModeValue('teal.200', 'teal.700')}
      >
        <Text fontSize="sm" fontWeight="semibold" color="teal.700" mb={3}>
          Handling Charges (Single Piece)
        </Text>
        <FormControl>
          <FormLabel fontSize="sm" fontWeight="medium">
            Single Piece Handling Charge (₹)
          </FormLabel>
          <NumberInput
            value={formData.handlingSinglePiece}
            onChange={(_, value) => onFieldChange('handlingSinglePiece', value)}
            size="sm"
          >
            <NumberInputField />
          </NumberInput>
          <FormHelperText fontSize="xs">
            Applicable only when shipment is a single piece
          </FormHelperText>
        </FormControl>
      </Box>

      {/* Weight-based Handling */}
      <Box>
        <Text fontSize="sm" fontWeight="semibold" color="teal.700" mb={3}>
          Handling Charges (by Weight)
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Handling Below 100 Kg (₹)
            </FormLabel>
            <NumberInput
              value={formData.handlingBelow100Kg}
              onChange={(_, value) => onFieldChange('handlingBelow100Kg', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Applied when weight &lt; 100 kg</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Handling 100 To 200 Kg (₹)
            </FormLabel>
            <NumberInput
              value={formData.handling100To200Kg}
              onChange={(_, value) => onFieldChange('handling100To200Kg', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Applied when weight is 100–200 kg</FormHelperText>
          </FormControl>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              Handling Above 200 Kg (₹)
            </FormLabel>
            <NumberInput
              value={formData.handlingAbove200Kg}
              onChange={(_, value) => onFieldChange('handlingAbove200Kg', value)}
              size="sm"
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">Applied when weight &gt; 200 kg</FormHelperText>
          </FormControl>
        </SimpleGrid>
      </Box>
    </Box>
  )
})

HandlingChargesSection.displayName = 'HandlingChargesSection'

export default HandlingChargesSection
