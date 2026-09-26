/* eslint-disable */
import { useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Collapse,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react'
import { AiOutlineDelete } from 'react-icons/ai'
import { FaBoxOpen } from 'react-icons/fa'

const ACCENT = '#0877C9'
const BOX_TEMPLATE = {
  lengthCm: '',
  breadthCm: '',
  heightCm: '',
  weightKg: '',
  quantity: '1',
}

const fieldDefinitions = [
  { name: 'lengthCm', label: 'Length (cm)', min: 0, helper: 'Box length in centimeters' },
  { name: 'breadthCm', label: 'Breadth (cm)', min: 0, helper: 'Box breadth in centimeters' },
  { name: 'heightCm', label: 'Height (cm)', min: 0, helper: 'Box height in centimeters' },
  { name: 'weightKg', label: 'Weight (kg)', min: 0, helper: 'Actual weight for one box' },
  { name: 'quantity', label: 'Quantity', min: 1, helper: 'How many boxes have these same dimensions' },
]

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeBoxes = (boxes) => {
  if (!Array.isArray(boxes) || !boxes.length) return [{ ...BOX_TEMPLATE }]
  return boxes.map((box) => ({
    lengthCm: box?.lengthCm ?? '',
    breadthCm: box?.breadthCm ?? '',
    heightCm: box?.heightCm ?? '',
    weightKg: box?.weightKg ?? '',
    quantity: box?.quantity ?? '1',
  }))
}

const buildBoxSummary = (boxes) => {
  const normalizedBoxes = normalizeBoxes(boxes)
  return normalizedBoxes.reduce(
    (summary, box) => {
      const quantity = Math.max(1, toNumber(box.quantity, 1))
      const length = Math.max(0, toNumber(box.lengthCm, 0))
      const breadth = Math.max(0, toNumber(box.breadthCm, 0))
      const height = Math.max(0, toNumber(box.heightCm, 0))
      const weight = Math.max(0, toNumber(box.weightKg, 0))
      return {
        totalUnits: summary.totalUnits + quantity,
        totalActualWeight: summary.totalActualWeight + weight * quantity,
        maxLength: Math.max(summary.maxLength, length),
        maxBreadth: Math.max(summary.maxBreadth, breadth),
        maxHeight: Math.max(summary.maxHeight, height),
      }
    },
    { totalUnits: 0, totalActualWeight: 0, maxLength: 0, maxBreadth: 0, maxHeight: 0 },
  )
}

export default function B2BForm({
  formData,
  onChange,
  onBulkChange,
  shipmentType,
  couriers = [],
  selectedCourier,
  onCourierChange,
}) {
  const { isOpen: isAdvancedOpen, onToggle: onAdvancedToggle } = useDisclosure()
  const sectionBg = useColorModeValue('white', '#111E37')
  const borderColor = useColorModeValue('rgba(148,163,184,0.3)', 'rgba(148,163,184,0.24)')
  const labelColor = useColorModeValue('gray.700', 'gray.200')
  const mutedText = useColorModeValue('gray.600', 'gray.400')
  const inputBg = useColorModeValue('white', 'rgba(15, 35, 66, 0.8)')
  const boxes = normalizeBoxes(formData.boxes)
  const boxSummary = buildBoxSummary(boxes)

  useEffect(() => {
    if (formData.rovType === 'none') {
      onChange('rovType', 'owner')
    }
  }, [formData.rovType, onChange])

  useEffect(() => {
    if (!Array.isArray(formData.boxes) || formData.boxes.length === 0) {
      onBulkChange?.({ boxes: [{ ...BOX_TEMPLATE }] })
    }
  }, [formData.boxes, onBulkChange])

  useEffect(() => {
    const derivedValues = {
      totalWeight:
        boxSummary.totalActualWeight > 0 ? boxSummary.totalActualWeight.toFixed(2) : '',
      pieceCount: boxSummary.totalUnits > 0 ? String(boxSummary.totalUnits) : '',
      length: boxSummary.maxLength > 0 ? String(boxSummary.maxLength) : '',
      width: boxSummary.maxBreadth > 0 ? String(boxSummary.maxBreadth) : '',
      height: boxSummary.maxHeight > 0 ? String(boxSummary.maxHeight) : '',
    }

    if (
      String(formData.totalWeight || '') !== derivedValues.totalWeight ||
      String(formData.pieceCount || '') !== derivedValues.pieceCount ||
      String(formData.length || '') !== derivedValues.length ||
      String(formData.width || '') !== derivedValues.width ||
      String(formData.height || '') !== derivedValues.height
    ) {
      onBulkChange?.(derivedValues)
    }
  }, [
    boxSummary.maxBreadth,
    boxSummary.maxHeight,
    boxSummary.maxLength,
    boxSummary.totalActualWeight,
    boxSummary.totalUnits,
    formData.height,
    formData.length,
    formData.pieceCount,
    formData.totalWeight,
    formData.width,
    onBulkChange,
  ])

  const updateBox = (index, field, value) => {
    const nextBoxes = normalizeBoxes(formData.boxes)
    nextBoxes[index] = {
      ...nextBoxes[index],
      [field]: value,
    }
    onChange('boxes', nextBoxes)
  }

  const addBox = () => {
    onChange('boxes', [...boxes, { ...BOX_TEMPLATE }])
  }

  const removeBox = (index) => {
    if (boxes.length === 1) return
    onChange(
      'boxes',
      boxes.filter((_, boxIndex) => boxIndex !== index),
    )
  }

  return (
    <VStack spacing={5} align="stretch">
      <Box bg={sectionBg} borderRadius="16px" p={{ base: 4, md: 5 }} borderWidth="1px" borderColor={borderColor}>
        <HStack justify="space-between" mb={4}>
          <Text fontWeight="800" color={labelColor}>
            B2B Core Inputs
          </Text>
          <Badge bg="brand.100" color="brand.700" borderRadius="full" px={2.5} py={1}>
            Charge Simulation
          </Badge>
        </HStack>

        <Box
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="16px"
          p={{ base: 4, md: 5 }}
          bg={useColorModeValue('orange.50', 'rgba(232,85,0,0.08)')}
          mb={4}
        >
          <HStack justify="space-between" align={{ base: 'start', md: 'center' }} flexDir={{ base: 'column', md: 'row' }} spacing={3} mb={4}>
            <Box>
              <Text fontWeight="800" color={labelColor}>
                Shipment Boxes
              </Text>
              <Text fontSize="sm" color={mutedText}>
                Add one or more boxes. Each box can have its own dimensions, weight, and quantity.
              </Text>
            </Box>
            <Button variant="outline" onClick={addBox} borderColor={ACCENT} color={ACCENT}>
              Add Another Box
            </Button>
          </HStack>

          <VStack spacing={4} align="stretch">
            {boxes.map((box, boxIndex) => (
              <Box
                key={`box-${boxIndex}`}
                borderWidth="1px"
                borderColor={useColorModeValue('orange.100', 'rgba(61,213,152,0.3)')}
                borderRadius="16px"
                bg={sectionBg}
                p={4}
                boxShadow="sm"
              >
                <HStack justify="space-between" align="start" mb={4}>
                  <HStack spacing={3} align="start">
                    <Box
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg={useColorModeValue('orange.100', 'rgba(232,85,0,0.16)')}
                      color={ACCENT}
                    >
                      <FaBoxOpen size={16} />
                    </Box>
                    <Box>
                      <Text fontWeight="700" color={labelColor}>{`Box ${boxIndex + 1}`}</Text>
                      <Text fontSize="xs" color={mutedText}>
                        Use this when this box has dimensions different from the others.
                      </Text>
                    </Box>
                  </HStack>
                  <IconButton
                    aria-label={`Remove box ${boxIndex + 1}`}
                    icon={<AiOutlineDelete />}
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => removeBox(boxIndex)}
                    isDisabled={boxes.length === 1}
                  />
                </HStack>

                <SimpleGrid columns={{ base: 1, sm: 2, xl: 5 }} spacing={4}>
                  {fieldDefinitions.map((fieldDef) => (
                    <FormControl key={`${fieldDef.name}-${boxIndex}`}>
                      <FormLabel color={labelColor}>{fieldDef.label}</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        min={fieldDef.min}
                        value={box[fieldDef.name]}
                        onChange={(e) => updateBox(boxIndex, fieldDef.name, e.target.value)}
                        placeholder={fieldDef.label}
                        bg={inputBg}
                        borderColor={borderColor}
                        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                      />
                      <Text fontSize="xs" color={mutedText} mt={1}>
                        {fieldDef.helper}
                      </Text>
                    </FormControl>
                  ))}
                </SimpleGrid>
              </Box>
            ))}
          </VStack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
          <Box borderWidth="1px" borderColor={borderColor} borderRadius="12px" p={4} bg={useColorModeValue('gray.50', 'rgba(15, 35, 66, 0.35)')}>
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={mutedText}>
              Box Summary
            </Text>
            <Text fontWeight="800" color={labelColor} mt={1}>
              {`${boxes.length} configuration${boxes.length > 1 ? 's' : ''} | ${boxSummary.totalUnits} total unit${boxSummary.totalUnits === 1 ? '' : 's'}`}
            </Text>
          </Box>
          <Box borderWidth="1px" borderColor={borderColor} borderRadius="12px" p={4} bg={useColorModeValue('gray.50', 'rgba(15, 35, 66, 0.35)')}>
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={mutedText}>
              Actual Weight
            </Text>
            <Text fontWeight="800" color={labelColor} mt={1}>
              {`${boxSummary.totalActualWeight.toFixed(2)} kg`}
            </Text>
          </Box>
          <Box borderWidth="1px" borderColor={borderColor} borderRadius="12px" p={4} bg={useColorModeValue('gray.50', 'rgba(15, 35, 66, 0.35)')}>
            <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.08em" color={mutedText}>
              Representative Dimensions
            </Text>
            <Text fontWeight="800" color={labelColor} mt={1}>
              {boxSummary.maxLength > 0 || boxSummary.maxBreadth > 0 || boxSummary.maxHeight > 0
                ? `${boxSummary.maxLength} x ${boxSummary.maxBreadth} x ${boxSummary.maxHeight} cm`
                : 'Add dimensions to calculate'}
            </Text>
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 5 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel color={labelColor}>
              Total Weight (Kg)
              <Tooltip label="Derived automatically from all box weights">
                <InfoIcon ml={2} boxSize={3} color="gray.400" />
              </Tooltip>
            </FormLabel>
            <Input
              name="totalWeight"
              type="number"
              value={formData.totalWeight || ''}
              readOnly
              placeholder="Calculated from boxes"
              bg={useColorModeValue('gray.50', 'rgba(15, 35, 66, 0.45)')}
              borderColor={borderColor}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>
              Number of Boxes
              <Tooltip label="Total units from all box quantities">
                <InfoIcon ml={2} boxSize={3} color="gray.400" />
              </Tooltip>
            </FormLabel>
            <Input
              name="pieceCount"
              type="number"
              value={formData.pieceCount || ''}
              readOnly
              placeholder="Calculated from boxes"
              bg={useColorModeValue('gray.50', 'rgba(15, 35, 66, 0.45)')}
              borderColor={borderColor}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Length Used (cm)</FormLabel>
            <Input
              name="length"
              type="number"
              value={formData.length || ''}
              readOnly
              placeholder="Largest box length"
              bg={useColorModeValue('gray.50', 'rgba(15, 35, 66, 0.45)')}
              borderColor={borderColor}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Width Used (cm)</FormLabel>
            <Input
              name="width"
              type="number"
              value={formData.width || ''}
              readOnly
              placeholder="Largest box width"
              bg={useColorModeValue('gray.50', 'rgba(15, 35, 66, 0.45)')}
              borderColor={borderColor}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Height Used (cm)</FormLabel>
            <Input
              name="height"
              type="number"
              value={formData.height || ''}
              readOnly
              placeholder="Largest box height"
              bg={useColorModeValue('gray.50', 'rgba(15, 35, 66, 0.45)')}
              borderColor={borderColor}
            />
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>
              Preferred Courier (Optional)
              <Tooltip label="Leave empty for global/default calculation">
                <InfoIcon ml={2} boxSize={3} color="gray.400" />
              </Tooltip>
            </FormLabel>
            <Select
              placeholder="Global / Default"
              value={selectedCourier || ''}
              onChange={(e) => onCourierChange?.(e.target.value)}
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            >
              <option value="">Global / Default</option>
              {couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.name}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Freight Mode</FormLabel>
            <Select
              value={formData.freightMode || 'fod'}
              onChange={(e) => onChange('freightMode', e.target.value)}
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            >
              <option value="fop">Bill to Client (FOP)</option>
              <option value="fod">Freight on Delivery (FOD)</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel color={labelColor}>Insurance Type</FormLabel>
            <Select
              value={formData.rovType || 'owner'}
              onChange={(e) => onChange('rovType', e.target.value)}
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            >
              <option value="owner">Owner Risk / Insurance</option>
              <option value="courier">Courier Insurance</option>
            </Select>
          </FormControl>
        </SimpleGrid>

        <Text fontSize="xs" color={mutedText} mt={3}>
          The rate calculator uses the combined box weight, total box units, and the largest box dimensions from this list.
        </Text>
      </Box>

      <Box bg={sectionBg} borderRadius="16px" p={{ base: 4, md: 5 }} borderWidth="1px" borderColor={borderColor}>
        <HStack justify="space-between" mb={3}>
          <VStack align="start" spacing={0}>
            <Text fontWeight="800" color={labelColor}>
              Advanced Inputs
            </Text>
            <Text fontSize="xs" color={mutedText}>
              Holiday, CSD, time-window, demurrage simulation
            </Text>
          </VStack>
          <Button
            size="sm"
            variant="outline"
            borderColor={borderColor}
            onClick={onAdvancedToggle}
            rightIcon={isAdvancedOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          >
            {isAdvancedOpen ? 'Hide' : 'Show'}
          </Button>
        </HStack>

        <Collapse in={isAdvancedOpen} animateOpacity>
          <VStack spacing={4} align="stretch" mt={2}>
            <Divider borderColor={borderColor} />

            <FormControl>
              <FormLabel color={labelColor}>
                Delivery Address
                <Tooltip label="CSD keywords in address can trigger CSD charges">
                  <InfoIcon ml={2} boxSize={3} color="gray.400" />
                </Tooltip>
              </FormLabel>
              <Textarea
                name="deliveryAddress"
                value={formData.deliveryAddress || ''}
                onChange={(e) => onChange('deliveryAddress', e.target.value)}
                placeholder="Full delivery address"
                rows={3}
                bg={inputBg}
                borderColor={borderColor}
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={labelColor}>
                Delivery Time Window
                <Tooltip label="Specific windows can affect time-based charges">
                  <InfoIcon ml={2} boxSize={3} color="gray.400" />
                </Tooltip>
              </FormLabel>
              <VStack spacing={3} align="stretch">
                <Select
                  name="deliveryTimeType"
                  value={formData.deliveryTimeType || ''}
                  onChange={(e) => {
                    onChange('deliveryTimeType', e.target.value)
                    if (e.target.value === '') {
                      onChange('deliveryTime', '')
                      onChange('deliveryTimeEnd', '')
                    }
                  }}
                  placeholder="No time requirement"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                >
                  <option value="">No time requirement</option>
                  <option value="before">Before specific time</option>
                  <option value="after">After specific time</option>
                  <option value="specific">At specific time</option>
                  <option value="timeframe">Between two times</option>
                </Select>

                {formData.deliveryTimeType === 'before' && (
                  <Input
                    name="deliveryTime"
                    type="time"
                    value={
                      formData.deliveryTime?.startsWith('before ')
                        ? formData.deliveryTime.replace('before ', '')
                        : formData.deliveryTime || ''
                    }
                    onChange={(e) => onChange('deliveryTime', `before ${e.target.value}`)}
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                  />
                )}

                {formData.deliveryTimeType === 'after' && (
                  <Input
                    name="deliveryTime"
                    type="time"
                    value={
                      formData.deliveryTime?.startsWith('after ')
                        ? formData.deliveryTime.replace('after ', '')
                        : formData.deliveryTime || ''
                    }
                    onChange={(e) => onChange('deliveryTime', `after ${e.target.value}`)}
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                  />
                )}

                {formData.deliveryTimeType === 'specific' && (
                  <Input
                    name="deliveryTime"
                    type="time"
                    value={formData.deliveryTime || ''}
                    onChange={(e) => onChange('deliveryTime', e.target.value)}
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                  />
                )}

                {formData.deliveryTimeType === 'timeframe' && (
                  <SimpleGrid columns={2} spacing={3}>
                    <Input
                      name="deliveryTime"
                      type="time"
                      value={formData.deliveryTime || ''}
                      onChange={(e) => onChange('deliveryTime', e.target.value)}
                      bg={inputBg}
                      borderColor={borderColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                    />
                    <Input
                      name="deliveryTimeEnd"
                      type="time"
                      value={formData.deliveryTimeEnd || ''}
                      onChange={(e) => onChange('deliveryTimeEnd', e.target.value)}
                      bg={inputBg}
                      borderColor={borderColor}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                    />
                  </SimpleGrid>
                )}
              </VStack>
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <FormControl>
                <FormLabel color={labelColor}>Pickup Date</FormLabel>
                <Input
                  name="pickupDate"
                  type="date"
                  value={formData.pickupDate || ''}
                  onChange={(e) => onChange('pickupDate', e.target.value)}
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={labelColor}>Order ID</FormLabel>
                <Input
                  name="orderId"
                  value={formData.orderId || ''}
                  onChange={(e) => onChange('orderId', e.target.value)}
                  placeholder="Order ID"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                />
              </FormControl>
              <FormControl>
                <FormLabel color={labelColor}>AWB Number</FormLabel>
                <Input
                  name="awbNumber"
                  value={formData.awbNumber || ''}
                  onChange={(e) => onChange('awbNumber', e.target.value)}
                  placeholder="AWB"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
                />
              </FormControl>
            </SimpleGrid>
          </VStack>
        </Collapse>
      </Box>
    </VStack>
  )
}
