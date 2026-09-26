import {
  Box,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react'
import { memo } from 'react'

const getRenderableFields = (customFields = {}, fieldDefinitions = {}) =>
  Object.entries(customFields)
    .filter(([fieldKey]) => fieldDefinitions?.[fieldKey]?.group === 'Workbook Imported Rates')
    .sort((left, right) => {
      const leftOrder = fieldDefinitions?.[left[0]]?.order ?? Number.MAX_SAFE_INTEGER
      const rightOrder = fieldDefinitions?.[right[0]]?.order ?? Number.MAX_SAFE_INTEGER
      return leftOrder - rightOrder
    })

const WorkbookImportedRatesSection = memo(
  ({ customFields = {}, fieldDefinitions = {}, onCustomFieldChange }) => {
    const importedFields = getRenderableFields(customFields, fieldDefinitions)

    if (!importedFields.length) {
      return null
    }

    return (
      <Box>
        <Text fontSize="md" fontWeight="bold" color="teal.600" mb={4}>
          Imported Workbook Rates
        </Text>
        <Text fontSize="sm" color="gray.600" mb={4}>
          These Delhivery-only rows were imported from the Excel rate sheet and stay editable here
          for future updates.
        </Text>

        <VStack spacing={4} align="stretch">
          {importedFields.map(([fieldKey, rawValue]) => {
            const fieldDef = fieldDefinitions?.[fieldKey] || {}
            const value =
              rawValue && typeof rawValue === 'object'
                ? rawValue
                : {
                    unitCharge: rawValue ?? '',
                  }

            const hasWeightRange =
              (value.lowerLimitKg !== '' && value.lowerLimitKg !== undefined) ||
              (value.upperLimitKg !== '' && value.upperLimitKg !== undefined)

            return (
              <Box key={fieldKey} p={4} borderWidth="1px" borderRadius="md" borderColor="gray.200">
                <Text fontSize="sm" fontWeight="semibold" mb={3}>
                  {fieldDef.label || fieldKey}
                </Text>
                {fieldDef.description && (
                  <Text fontSize="xs" color="gray.500" mb={3}>
                    {fieldDef.description}
                  </Text>
                )}

                <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">Remark</FormLabel>
                    <Input
                      size="sm"
                      value={value.remark ?? ''}
                      onChange={(e) => onCustomFieldChange(fieldKey, 'remark', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Calculation</FormLabel>
                    <Input
                      size="sm"
                      value={value.calculation ?? ''}
                      onChange={(e) => onCustomFieldChange(fieldKey, 'calculation', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Unit Charge</FormLabel>
                    <Input
                      size="sm"
                      value={value.unitCharge ?? ''}
                      onChange={(e) => onCustomFieldChange(fieldKey, 'unitCharge', e.target.value)}
                    />
                    <FormHelperText fontSize="xs">
                      {fieldDef.unit ? `Workbook unit: ${fieldDef.unit}` : 'Imported workbook value'}
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Min</FormLabel>
                    <Input
                      size="sm"
                      value={value.min ?? ''}
                      onChange={(e) => onCustomFieldChange(fieldKey, 'min', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Max</FormLabel>
                    <Input
                      size="sm"
                      value={value.max ?? ''}
                      onChange={(e) => onCustomFieldChange(fieldKey, 'max', e.target.value)}
                    />
                  </FormControl>
                </SimpleGrid>

                {hasWeightRange && (
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Lower Limit (kg)</FormLabel>
                      <Input
                        size="sm"
                        value={value.lowerLimitKg ?? ''}
                        onChange={(e) =>
                          onCustomFieldChange(fieldKey, 'lowerLimitKg', e.target.value)
                        }
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Upper Limit (kg)</FormLabel>
                      <Input
                        size="sm"
                        value={value.upperLimitKg ?? ''}
                        onChange={(e) =>
                          onCustomFieldChange(fieldKey, 'upperLimitKg', e.target.value)
                        }
                      />
                    </FormControl>
                  </SimpleGrid>
                )}
              </Box>
            )
          })}
        </VStack>
      </Box>
    )
  },
)

WorkbookImportedRatesSection.displayName = 'WorkbookImportedRatesSection'

export default WorkbookImportedRatesSection
