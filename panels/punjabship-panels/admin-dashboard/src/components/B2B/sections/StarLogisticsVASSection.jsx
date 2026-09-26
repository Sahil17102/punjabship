import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react'
import { memo } from 'react'

const ChargeInput = ({ label, helperText, value, onChange, precision }) => (
  <FormControl>
    <FormLabel fontSize="sm" fontWeight="medium">
      {label}
    </FormLabel>
    <NumberInput value={value} onChange={(_, nextValue) => onChange(nextValue)} size="sm" precision={precision}>
      <NumberInputField />
    </NumberInput>
    {helperText && <FormHelperText fontSize="xs">{helperText}</FormHelperText>}
  </FormControl>
)

const StarLogisticsVASSection = memo(({ formData, onFieldChange }) => {
  const bg = useColorModeValue('orange.50', 'orange.900')
  const border = useColorModeValue('orange.200', 'orange.700')

  return (
    <Box>
      <Box p={4} bg={bg} borderRadius="md" borderWidth="1px" borderColor={border}>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          <ChargeInput
            label="Processing Charges"
            helperText="Rs/LR"
            value={formData.awbCharges}
            onChange={(value) => onFieldChange('awbCharges', value)}
          />

          <ChargeInput
            label="Fuel Surcharge"
            helperText="% on base freight. Use 0 for NIL."
            value={formData.fuelSurchargePercentage}
            onChange={(value) => onFieldChange('fuelSurchargePercentage', value)}
            precision={2}
          />

          <ChargeInput
            label="CFT Factor"
            helperText="L x B x H divisor"
            value={formData.cftFactor}
            onChange={(value) => onFieldChange('cftFactor', value)}
          />

          <ChargeInput
            label="Minimum Chargeable Weight"
            helperText="Kg/LR"
            value={formData.minimumChargeableWeight}
            onChange={(value) => onFieldChange('minimumChargeableWeight', value)}
          />

          <ChargeInput
            label="Minimum Chargeable Freight"
            helperText="Base Freight + AWB + FM minimum"
            value={formData.minimumChargeableAmount}
            onChange={(value) => onFieldChange('minimumChargeableAmount', value)}
          />

          <ChargeInput
            label="Outside Delivery Area Per Kg"
            helperText="Rs/Kg"
            value={formData.odaPerKgCharge}
            onChange={(value) => onFieldChange('odaPerKgCharge', value)}
          />

          <ChargeInput
            label="Outside Delivery Area Minimum"
            helperText="Rs/LR"
            value={formData.odaCharges}
            onChange={(value) => onFieldChange('odaCharges', value)}
          />

          <ChargeInput
            label="Demurrage Per Kg Per Day"
            helperText="After free storage days"
            value={formData.demurragePerKgDay}
            onChange={(value) => onFieldChange('demurragePerKgDay', value)}
          />

          <ChargeInput
            label="Demurrage Minimum Per LR Per Day"
            helperText="After free storage days"
            value={formData.demurragePerAwbDay}
            onChange={(value) => onFieldChange('demurragePerAwbDay', value)}
          />

          <ChargeInput
            label="Free Storage Days"
            helperText="Days"
            value={formData.freeStorageDays}
            onChange={(value) => onFieldChange('freeStorageDays', value)}
          />

          <ChargeInput
            label="Re-attempt Per Kg"
            helperText="Rs/Kg per attempt after free attempts"
            value={formData.deliveryReattemptPerKg}
            onChange={(value) => onFieldChange('deliveryReattemptPerKg', value)}
          />

          <ChargeInput
            label="Re-attempt Minimum"
            helperText="Rs/LR per attempt"
            value={formData.deliveryReattemptPerAwb}
            onChange={(value) => onFieldChange('deliveryReattemptPerAwb', value)}
          />

          <ChargeInput
            label="Freight on Delivery (FOD) Charge"
            helperText="Rs/LR"
            value={formData.fodCharge}
            onChange={(value) => onFieldChange('fodCharge', value)}
          />

          <ChargeInput
            label="COD Percentage"
            helperText="% of collected COD amount"
            value={formData.codPercentage}
            onChange={(value) => onFieldChange('codPercentage', value)}
            precision={2}
          />

          <ChargeInput
            label="COD Minimum"
            helperText="Rs/LR"
            value={formData.codFixedAmount}
            onChange={(value) => onFieldChange('codFixedAmount', value)}
          />

          <ChargeInput
            label="ROV Owner Risk Minimum"
            helperText="Rs/LR"
            value={formData.rovOwnerMinimum}
            onChange={(value) => onFieldChange('rovOwnerMinimum', value)}
          />

          <ChargeInput
            label="ROV Courier Risk Percentage"
            helperText="% of declared invoice value"
            value={formData.rovCourierPercentage}
            onChange={(value) => onFieldChange('rovCourierPercentage', value)}
            precision={2}
          />

          <ChargeInput
            label="ROV Courier Risk Minimum"
            helperText="Rs/LR"
            value={formData.rovCourierMinimum}
            onChange={(value) => onFieldChange('rovCourierMinimum', value)}
          />

          <ChargeInput
            label="Package Handling 250-400kg"
            helperText="Rs/Kg"
            value={formData.packageHandling250To400PerKg}
            onChange={(value) => onFieldChange('packageHandling250To400PerKg', value)}
          />

          <ChargeInput
            label="Package Handling >=400kg"
            helperText="Rs/Kg"
            value={formData.packageHandling400PlusPerKg}
            onChange={(value) => onFieldChange('packageHandling400PlusPerKg', value)}
          />

          <ChargeInput
            label="Green Tax Per Kg"
            helperText="Rs/Kg"
            value={formData.greenTaxPerKg}
            onChange={(value) => onFieldChange('greenTaxPerKg', value)}
            precision={2}
          />

          <ChargeInput
            label="Green Tax Minimum"
            helperText="Rs/LR"
            value={formData.greenTaxMinimum}
            onChange={(value) => onFieldChange('greenTaxMinimum', value)}
          />

          <ChargeInput
            label="Appointment / CSD / Army / Mall Per Kg"
            helperText="One combined charge"
            value={formData.specialDeliveryPerKg}
            onChange={(value) => onFieldChange('specialDeliveryPerKg', value)}
          />

          <ChargeInput
            label="Appointment / CSD / Army / Mall Minimum"
            helperText="One combined minimum per LR"
            value={formData.specialDeliveryMinimum}
            onChange={(value) => onFieldChange('specialDeliveryMinimum', value)}
          />

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium">
              COD Calculation
            </FormLabel>
            <Select
              value={formData.codMethod || 'whichever_is_higher'}
              onChange={(event) => onFieldChange('codMethod', event.target.value)}
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

StarLogisticsVASSection.displayName = 'StarLogisticsVASSection'

export default StarLogisticsVASSection
