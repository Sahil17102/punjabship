/* eslint-disable */
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  Tabs,
  Text,
  Tooltip,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import B2BForm from 'components/Tools/RateCalculator/B2BForm'
import B2CForm from 'components/Tools/RateCalculator/B2CForm'
import { useAvailableCouriersMutation, useCouriers } from 'hooks/useCouriers'
import { useLocations } from 'hooks/useLocations'
import { usePlans } from 'hooks/usePlans'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BiRupee, BiTachometer } from 'react-icons/bi'
import { TbDiscountCheck } from 'react-icons/tb'
import { b2bAdminService } from 'services/b2bAdmin.service'
import { getExactLocation, normalizePincodeInput } from 'services/location.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const normalizeCourierResults = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value.data)) return value.data
  if (Array.isArray(value.couriers)) return value.couriers
  if (Array.isArray(value.availableCouriers)) return value.availableCouriers
  if (Array.isArray(value.results)) return value.results
  return []
}

const toAmount = (value) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const BOX_TEMPLATE = {
  lengthCm: '',
  breadthCm: '',
  heightCm: '',
  weightKg: '',
  quantity: '1',
}

const normalizeRateCalculatorBoxes = (boxes) => {
  if (!Array.isArray(boxes) || !boxes.length) return [{ ...BOX_TEMPLATE }]
  return boxes.map((box) => ({
    lengthCm: box?.lengthCm ?? '',
    breadthCm: box?.breadthCm ?? '',
    heightCm: box?.heightCm ?? '',
    weightKg: box?.weightKg ?? '',
    quantity: box?.quantity ?? '1',
  }))
}

const buildB2BBoxSummary = (boxes) =>
  normalizeRateCalculatorBoxes(boxes).reduce(
    (summary, box) => {
      const quantity = Math.max(1, Number(box.quantity || 1))
      const length = Math.max(0, Number(box.lengthCm || 0))
      const breadth = Math.max(0, Number(box.breadthCm || 0))
      const height = Math.max(0, Number(box.heightCm || 0))
      const weight = Math.max(0, Number(box.weightKg || 0))
      return {
        boxes: [
          ...summary.boxes,
          {
            lengthCm: length,
            breadthCm: breadth,
            heightCm: height,
            weightKg: weight,
            quantity,
          },
        ],
        totalUnits: summary.totalUnits + quantity,
        totalActualWeight: summary.totalActualWeight + weight * quantity,
        maxLength: Math.max(summary.maxLength, length),
        maxBreadth: Math.max(summary.maxBreadth, breadth),
        maxHeight: Math.max(summary.maxHeight, height),
      }
    },
    {
      boxes: [],
      totalUnits: 0,
      totalActualWeight: 0,
      maxLength: 0,
      maxBreadth: 0,
      maxHeight: 0,
    },
  )

const buildB2BChargeSummary = (entry = {}) => {
  const baseFreight = toAmount(entry?.charges?.baseFreight)
  const gstPercent = toAmount(entry?.charges?.gstPercent)
  const gstAmount = toAmount(entry?.charges?.gstAmount)
  const subtotalBeforeGst = toAmount(entry?.charges?.totalWithoutGst ?? entry?.charges?.total)
  const finalRate = toAmount(entry?.charges?.totalWithGst ?? subtotalBeforeGst + gstAmount)
  const breakdown = Array.isArray(entry?.charges?.overheads) ? entry.charges.overheads : []

  const codRows = []
  const otherRows = []
  const demurrageRows = []

  breakdown.forEach((charge) => {
    const amount = toAmount(charge?.amount)
    if (amount <= 0) return

    const code = String(charge?.code || '').trim().toUpperCase()
    const label = String(charge?.name || charge?.code || 'Additional Charge')

    if (code === 'COD' || /(^|[^a-z])cod([^a-z]|$)/i.test(label)) {
      codRows.push({ label, value: amount })
      return
    }

    if (code === 'DEMURRAGE' || /demurrage/i.test(label)) {
      demurrageRows.push({ label, value: amount })
      return
    }

    otherRows.push({ label, value: amount })
  })

  const codCharge = codRows.reduce((sum, row) => sum + row.value, 0)
  const otherCharges = otherRows.reduce((sum, row) => sum + row.value, 0)
  const demurrageCharge =
    demurrageRows.reduce((sum, row) => sum + row.value, 0) || toAmount(entry?.charges?.demurrage)

  const breakdownRows = [
    { label: 'Base Freight', value: baseFreight },
    ...codRows,
    ...otherRows,
    ...demurrageRows,
    ...(demurrageRows.length === 0 && demurrageCharge > 0
      ? [{ label: 'Demurrage', value: demurrageCharge }]
      : []),
    { label: 'Subtotal Before GST', value: subtotalBeforeGst, emphasized: true },
    { label: gstPercent > 0 ? `GST (${gstPercent.toFixed(2)}%)` : 'GST', value: gstAmount },
    { label: 'Final Rate', value: finalRate, total: true },
  ].filter((row) => row.value > 0 || row.emphasized || row.total || row.label === 'COD Charges')

  return {
    baseFreight,
    codCharge,
    otherCharges,
    demurrageCharge,
    subtotalBeforeGst,
    gstAmount,
    finalRate,
    breakdownRows,
    demurrageDetails: entry?.breakdown?.demurrage ?? null,
  }
}

// ✅ Shared common fields
function CommonFields({
  formData,
  handleChange,
  loadingPickup,
  loadingDelivery,
  plans,
  loadingPlans,
}) {
  const panelBg = useColorModeValue('white', '#111E37')
  const panelBorder = useColorModeValue('rgba(148,163,184,0.3)', 'rgba(148,163,184,0.24)')
  const inputBg = useColorModeValue('white', 'rgba(15, 35, 66, 0.8)')
  const headingColor = useColorModeValue('gray.800', 'gray.100')
  const isCod = String(formData.paymentType || '').toLowerCase() === 'cod'

  return (
    <>
      <Box bg={panelBg} borderRadius="16px" p={{ base: 4, md: 5 }} mb={5} borderWidth="1px" borderColor={panelBorder}>
        <Heading size="sm" mb={4} color={headingColor} fontWeight="800">
          Pickup & Delivery
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <FormControl isRequired>
            <FormLabel color={headingColor}>Pickup Pincode</FormLabel>
            <Input
              value={formData.pickupPincode}
              onChange={(e) => handleChange('pickupPincode', e.target.value)}
              placeholder="Enter pickup pincode"
              bg={inputBg}
              borderColor={panelBorder}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </FormControl>
          <FormControl>
            <FormLabel color={headingColor}>Pickup City</FormLabel>
            <InputGroup>
              <Input value={formData.pickupCity} isDisabled bg={inputBg} borderColor={panelBorder} />
              {loadingPickup && (
                <InputRightElement>
                  <Spinner size="sm" />
                </InputRightElement>
              )}
            </InputGroup>
          </FormControl>
          <FormControl>
            <FormLabel color={headingColor}>Pickup State</FormLabel>
            <Input value={formData.pickupState} isDisabled bg={inputBg} borderColor={panelBorder} />
          </FormControl>

          <FormControl isRequired>
            <FormLabel color={headingColor}>Delivery Pincode</FormLabel>
            <Input
              value={formData.deliveryPincode}
              onChange={(e) => handleChange('deliveryPincode', e.target.value)}
              placeholder="Enter delivery pincode"
              bg={inputBg}
              borderColor={panelBorder}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </FormControl>
          <FormControl>
            <FormLabel color={headingColor}>Delivery City</FormLabel>
            <InputGroup>
              <Input value={formData.deliveryCity} isDisabled bg={inputBg} borderColor={panelBorder} />
              {loadingDelivery && (
                <InputRightElement>
                  <Spinner size="sm" />
                </InputRightElement>
              )}
            </InputGroup>
          </FormControl>
          <FormControl>
            <FormLabel color={headingColor}>Delivery State</FormLabel>
            <Input value={formData.deliveryState} isDisabled bg={inputBg} borderColor={panelBorder} />
          </FormControl>
        </SimpleGrid>
      </Box>

      <Box bg={panelBg} borderRadius="16px" p={{ base: 4, md: 5 }} mb={5} borderWidth="1px" borderColor={panelBorder}>
        <Heading size="sm" mb={4} color={headingColor} fontWeight="800">
          Plan
        </Heading>
        <FormControl isRequired>
          <Select
            placeholder={loadingPlans ? 'Loading plans...' : 'Select a plan'}
            value={formData.planId}
            onChange={(e) => handleChange('planId', e.target.value)}
            bg={inputBg}
            borderColor={panelBorder}
            _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
          >
            {plans?.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box bg={panelBg} borderRadius="16px" p={{ base: 4, md: 5 }} mb={2} borderWidth="1px" borderColor={panelBorder}>
        <Heading size="sm" mb={4} color={headingColor} fontWeight="800">
          Payment & Shipment Value
        </Heading>
        <FormControl mb={6}>
          <FormLabel color={headingColor}>Payment Type</FormLabel>
          <ButtonGroup isAttached width={{ base: '100%', md: '56%' }}>
            <Button
              flex={1}
              variant={formData.paymentType === 'prepaid' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => handleChange('paymentType', 'prepaid')}
            >
              Prepaid
            </Button>
            <Button
              flex={1}
              variant={formData.paymentType === 'cod' ? 'solid' : 'outline'}
              colorScheme="blue"
              onClick={() => handleChange('paymentType', 'cod')}
            >
              COD
            </Button>
          </ButtonGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel color={headingColor}>
            {isCod ? 'Shipment Amount (Rs.)' : 'Total Shipment Value (Rs.)'}
          </FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none" color="gray.400">
              <BiRupee />
            </InputLeftElement>
            <Input
              type="number"
              value={formData.orderAmount}
              onChange={(e) => handleChange('orderAmount', e.target.value)}
              placeholder="Enter order amount"
              bg={inputBg}
              borderColor={panelBorder}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
            />
          </InputGroup>
          <FormHelperText color={useColorModeValue('gray.600', 'gray.400')}>
            {isCod
              ? 'Used as the shipment amount for COD rate calculation.'
              : 'Total shipment value used for this rate calculation.'}
          </FormHelperText>
        </FormControl>
      </Box>
    </>
  )
}

export default function RateCalculatorPage() {
  const { mutateAsync, isPending, isError, error } = useAvailableCouriersMutation()
  const [shipmentType, setShipmentType] = useState('b2c')
  const { data: plans, isLoading: loadingPlans } = usePlans({
    businessType: shipmentType,
    status: 'active',
  })
  const { data: courierCatalog = [] } = useCouriers()
  const couriersRef = useRef(null)
  const [availableCouriers, setAvailableCouriers] = useState([])
  const [selectedB2BCourier, setSelectedB2BCourier] = useState('')

  const [formData, setFormData] = useState({
    pickupPincode: '',
    pickupCity: '',
    pickupState: '',
    deliveryPincode: '',
    deliveryCity: '',
    deliveryState: '',
    planId: '',
    paymentType: 'cod',
    orderAmount: '',
    weight: '',
    length: '',
    width: '',
    height: '',
    numberOfBoxes: '',
    pieceCount: '',
    totalWeight: '',
    boxes: [{ ...BOX_TEMPLATE }],
    freightMode: 'fod',
    rovType: 'owner',
    pickupLocationId: '',
    deliveryAddress: '',
    deliveryTimeType: '',
    deliveryTime: '',
    deliveryTimeEnd: '',
    pickupDate: '',
    orderId: '',
    awbNumber: '',
  })

  const handleChange = (field, value) => {
    if (field === 'pickupPincode') {
      const pincode = normalizePincodeInput(value)
      setFormData((prev) => ({
        ...prev,
        pickupPincode: pincode,
        ...(pincode.length === 6 ? {} : { pickupCity: '', pickupState: '' }),
      }))
      return
    }

    if (field === 'deliveryPincode') {
      const pincode = normalizePincodeInput(value)
      setFormData((prev) => ({
        ...prev,
        deliveryPincode: pincode,
        ...(pincode.length === 6 ? {} : { deliveryCity: '', deliveryState: '' }),
      }))
      return
    }

    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleBulkChange = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  useEffect(() => {
    setAvailableCouriers([])
    setSelectedB2BCourier('')
  }, [shipmentType])

  useEffect(() => {
    if (!plans?.length) {
      setFormData((prev) => ({ ...prev, planId: '' }))
      return
    }

    setFormData((prev) => {
      if (plans.some((plan) => plan.id === prev.planId)) {
        return prev
      }
      return { ...prev, planId: plans[0].id }
    })
  }, [plans])

  // fetch locations...
  const { data: pickupLocation, isFetching: loadingPickup } = useLocations(
    formData.pickupPincode?.length === 6 ? { pincode: formData.pickupPincode } : null,
    !!formData.pickupPincode,
    ['pickupLocation', formData.pickupPincode],
  )
  useEffect(() => {
    if (formData.pickupPincode?.length !== 6) return

    const location = getExactLocation(pickupLocation, formData.pickupPincode)
    if (location?.city && location?.state) {
      setFormData((prev) => ({
        ...prev,
        pickupCity: location.city,
        pickupState: location.state,
      }))
    } else if (pickupLocation) {
      setFormData((prev) => ({ ...prev, pickupCity: '', pickupState: '' }))
    }
  }, [pickupLocation, formData.pickupPincode])

  const { data: deliveryLocation, isFetching: loadingDelivery } = useLocations(
    formData.deliveryPincode?.length === 6 ? { pincode: formData.deliveryPincode } : null,
    !!formData.deliveryPincode,
    ['deliveryLocation', formData.deliveryPincode],
  )
  useEffect(() => {
    if (formData.deliveryPincode?.length !== 6) return

    const location = getExactLocation(deliveryLocation, formData.deliveryPincode)
    if (location?.city && location?.state) {
      setFormData((prev) => ({
        ...prev,
        deliveryCity: location.city,
        deliveryState: location.state,
      }))
    } else if (deliveryLocation) {
      setFormData((prev) => ({ ...prev, deliveryCity: '', deliveryState: '' }))
    }
  }, [deliveryLocation, formData.deliveryPincode])

  const [isCalculatingB2B, setIsCalculatingB2B] = useState(false)

  const parseEddToDays = (edd) => {
    if (!edd) return Infinity
    if (/^\d{4}-\d{2}-\d{2}/.test(edd)) {
      const diff = new Date(edd).getTime() - Date.now()
      return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0
    }
    const match = edd.match(/(\d+)/)
    return match ? Number(match[1]) : Infinity
  }

  const formatCurrency = (value) => `₹ ${Number(value || 0).toFixed(2)}`
  const getCourierDisplayName = (courier) => courier?.displayName || courier?.name || '—'
  const formatFreightMode = (value) => {
    const normalized = String(value || '').toLowerCase()
    if (normalized === 'fop') return 'Bill to Client'
    if (normalized === 'fod') return 'Freight on Delivery'
    return '-'
  }
  const formatRovType = (value) => {
    const normalized = String(value || '').toLowerCase()
    if (normalized === 'courier' || normalized === 'carrier') return 'Courier Insurance'
    if (normalized === 'none') return 'No Insurance'
    return 'Owner Risk / Insurance'
  }
  const resolveCodCharge = (forward = {}, orderAmount = 0) => {
    const fixedCharge = Number(forward.cod_charges ?? 0)
    const codPercent = Number(forward.cod_percent ?? 0)
    const percentageCharge = Number(orderAmount) > 0 ? (Number(orderAmount) * codPercent) / 100 : 0
    return Math.max(fixedCharge, percentageCharge)
  }
  const normalizedAvailableCouriers = useMemo(
    () => normalizeCourierResults(availableCouriers),
    [availableCouriers],
  )

  const highlights = useMemo(() => {
    if (shipmentType !== 'b2c' || !normalizedAvailableCouriers.length) return null

    const enriched = normalizedAvailableCouriers.map((courier) => {
      const forward = courier.localRates?.forward || {}
      const slabbedRate =
        courier?.rate !== undefined && courier?.rate !== null
          ? Number(courier.rate)
          : Number(forward.rate ?? 0)
      const codCharge = resolveCodCharge(forward, formData.orderAmount)
      const total = formData.paymentType === 'cod' ? slabbedRate + codCharge : slabbedRate
      return {
        ...courier,
        displayName: getCourierDisplayName(courier),
        baseRate: slabbedRate,
        total,
        eddDays: parseEddToDays(courier.edd),
      }
    })

    const cheapest = enriched.reduce((best, entry) => (entry.total < best.total ? entry : best))
    const fastest = enriched.reduce((best, entry) => (entry.eddDays < best.eddDays ? entry : best))

    return {
      cheapest,
      fastest,
    }
  }, [normalizedAvailableCouriers, shipmentType, formData.paymentType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (shipmentType === 'b2b') {
        setIsCalculatingB2B(true)
        const courierMeta = courierCatalog.find(
          (c) => c.id?.toString() === selectedB2BCourier?.toString(),
        )
        const boxSummary = buildB2BBoxSummary(formData.boxes)
        const fallbackWeight = Number(formData.totalWeight || formData.weight || 0)
        const fallbackPieceCount = Number(formData.pieceCount || formData.numberOfBoxes || 0)

        const payload = {
          originPincode: formData.pickupPincode,
          destinationPincode: formData.deliveryPincode,
          weightKg: boxSummary.totalActualWeight || fallbackWeight,
          paymentMode: formData.paymentType === 'cod' ? 'COD' : 'PREPAID',
          invoiceValue: formData.orderAmount ? Number(formData.orderAmount) : undefined,
          freightMode: formData.freightMode || 'fod',
          rovType: formData.rovType || 'owner',
          courierId: selectedB2BCourier ? Number(selectedB2BCourier) : undefined,
          serviceProvider:
            courierMeta?.serviceProvider ?? courierMeta?.service_provider ?? undefined,
          planId: formData.planId || undefined,
          length: boxSummary.maxLength || (formData.length ? Number(formData.length) : undefined),
          width: boxSummary.maxBreadth || (formData.width ? Number(formData.width) : undefined),
          height: boxSummary.maxHeight || (formData.height ? Number(formData.height) : undefined),
          pieceCount: boxSummary.totalUnits || fallbackPieceCount || undefined,
          isSinglePiece: (boxSummary.totalUnits || fallbackPieceCount || 0) === 1,
          boxes: boxSummary.boxes.length ? boxSummary.boxes : undefined,
          deliveryAddress: formData.deliveryAddress || undefined,
          deliveryTime: (() => {
            if (!formData.deliveryTimeType || !formData.deliveryTime) return undefined
            if (formData.deliveryTimeType === 'timeframe' && formData.deliveryTimeEnd) {
              return `${formData.deliveryTime}-${formData.deliveryTimeEnd}`
            }
            if (formData.deliveryTimeType === 'before' || formData.deliveryTimeType === 'after') {
              return formData.deliveryTime // Already includes prefix
            }
            return formData.deliveryTime
          })(),
          pickupDate: formData.pickupDate || undefined,
          orderId: formData.orderId || undefined,
          awbNumber: formData.awbNumber || undefined,
        }

        const result = await b2bAdminService.calculateRate(payload)

        setAvailableCouriers([
          {
            id: selectedB2BCourier || 'global',
            name: courierMeta?.name || 'Global Rate',
            charges: result.charges,
            calculation: result.calculation,
            breakdown: result.breakdown,
            origin: result.origin,
            destination: result.destination,
            rate: result.rate,
            freightMode: payload.freightMode,
            rovType: payload.rovType,
          },
        ])

        if (couriersRef.current) {
          setTimeout(() => {
            couriersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 300)
        }

        return
      }

      const payload = {
        ...formData,
        shipmentType,
        weight: shipmentType === 'b2c' ? formData?.weight : formData?.totalWeight,
        cod: formData.paymentType === 'cod' ? Number(formData.orderAmount) || 0 : 0,
        paymentType: formData.paymentType,
        pickupId: formData.pickupLocationId || undefined,
        orderAmount: Number(formData.orderAmount || 0),
        context: 'rate_calculator',
        planId: formData.planId || undefined,
      }
      const result = await mutateAsync(payload)
      const normalizedResult = normalizeCourierResults(result)
      setAvailableCouriers(normalizedResult)
      if (normalizedResult.length && couriersRef.current) {
        setTimeout(() => {
          couriersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 300)
      }
    } catch (err) {
      setAvailableCouriers([])
    } finally {
      if (shipmentType === 'b2b') {
        setIsCalculatingB2B(false)
      }
    }
  }
  console.log('availableCouriers', availableCouriers)

  const tableConfig =
    shipmentType === 'b2b'
      ? {
          data: normalizedAvailableCouriers.map((entry, idx) => {
            const chargeSummary = buildB2BChargeSummary(entry)
            return {
              sno: idx + 1,
              name: entry?.name,
              originZone: entry?.origin?.zoneCode ?? entry?.origin?.zoneName ?? '-',
              destinationZone: entry?.destination?.zoneCode ?? entry?.destination?.zoneName ?? '-',
              freightMode: entry?.freightMode,
              rovType: entry?.rovType,
              billableWeight: entry?.calculation?.billableWeight ?? '-',
              baseFreight: chargeSummary.baseFreight,
              codCharges: chargeSummary.codCharge,
              otherCharges: chargeSummary.otherCharges,
              demurrage: chargeSummary.demurrageCharge,
              subtotalBeforeGst: chargeSummary.subtotalBeforeGst,
              gst: chargeSummary.gstAmount,
              finalRate: chargeSummary.finalRate,
              finalBreakdown: chargeSummary.breakdownRows,
              demurrageDetails: chargeSummary.demurrageDetails,
            }
          }),
          captions: [
            'S.No',
            'Courier',
            'Origin Zone',
            'Dest Zone',
            'Freight Mode',
            'ROV / Insurance',
            'Billable Weight',
            'Base Freight',
            'COD',
            'Other Charges Total',
            'Demurrage',
            'Subtotal',
            'GST',
            'Final Rate',
            'Final Breakdown',
          ],
          columnKeys: [
            'sno',
            'name',
            'originZone',
            'destinationZone',
            'freightMode',
            'rovType',
            'billableWeight',
            'baseFreight',
            'codCharges',
            'otherCharges',
            'demurrage',
            'subtotalBeforeGst',
            'gst',
            'finalRate',
            'finalBreakdown',
          ],
          renderers: {
            freightMode: (val) => formatFreightMode(val),
            rovType: (val) => formatRovType(val),
            billableWeight: (val) => (val !== '-' ? `${Number(val).toFixed(2)} kg` : '-'),
            baseFreight: (val) => formatCurrency(val),
            codCharges: (val) => (val > 0 ? formatCurrency(val) : '-'),
            otherCharges: (val) => (val > 0 ? formatCurrency(val) : '-'),
            demurrage: (val) => (val > 0 ? formatCurrency(val) : '—'),
            gst: (val) => (val > 0 ? formatCurrency(val) : '—'),
            subtotalBeforeGst: (val) => (
              <Text fontWeight="semibold">{formatCurrency(val)}</Text>
            ),
            finalRate: (val) => (
              <Text fontWeight="bold" color="green.600">
                {formatCurrency(val)}
              </Text>
            ),
            finalBreakdown: (value, row) => {
              const items = Array.isArray(value) && value.length ? value : []
              const demurrageInfo = row.demurrageDetails
              if (!items.length) return <Text>-</Text>

              return (
                <Box>
                  <VStack align="stretch" spacing={1}>
                    <HStack justify="space-between" align="start" spacing={3} pb={1} borderBottom="1px solid" borderColor="gray.200">
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        Charge Name
                      </Text>
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        Amount
                      </Text>
                    </HStack>
                    {items.map((item, idx) => (
                      <HStack key={`${item.label}-${idx}`} justify="space-between" align="start" spacing={3}>
                        <Text
                          fontSize="xs"
                          color={item.total ? 'gray.800' : 'gray.600'}
                          fontWeight={item.total || item.emphasized ? 'semibold' : 'medium'}
                        >
                          {item.label}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="gray.800"
                          fontWeight={item.total ? 'bold' : item.emphasized ? 'semibold' : 'medium'}
                        >
                          {formatCurrency(item.value)}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                  {demurrageInfo?.applied && (
                    <Box mt={2} pt={2} borderTop="1px solid" borderColor="gray.200">
                      <Text fontSize="xs" color="gray.600">
                        Demurrage days: {demurrageInfo.storedDays} | Free: {demurrageInfo.freeStorageDays} | Extra: {demurrageInfo.extraDays}
                      </Text>
                    </Box>
                  )}
                </Box>
              )

            },
          },
        }
      : {
          data: normalizedAvailableCouriers.map((c, idx) => {
            const forward = c.localRates?.forward || {}
            const baseRate =
              c?.rate !== undefined && c?.rate !== null ? Number(c.rate) : Number(forward?.rate ?? 0)
            const codTotal =
              formData.paymentType === 'cod' ? resolveCodCharge(forward, formData.orderAmount) : 0
            return {
              sno: idx + 1,
              name: getCourierDisplayName(c),
              freight_charges: baseRate,
              cod_charges: codTotal,
              total_charges: baseRate + codTotal,
              edd: c.edd,
              zone: c?.approxZone?.code,
              max_slab_weight: forward?.max_slab_weight ?? c?.max_slab_weight ?? null,
              chargeable_weight: c.chargeable_weight || null,
              volumetric_weight: c.volumetric_weight || null,
              slabs: c.slabs || null,
            }
          }),
          captions: [
            'S.No',
            'Courier Name',
            'Freight Charges (Slabbed)',
            'COD Charges',
            'Total Charges',
            'EDD',
            'Max Slab Weight (kg)',
            'Chargeable Weight (g)',
            'Volumetric Weight (g)',
            'Slabs',
            'Zone Code',
          ],
          columnKeys: [
            'sno',
            'name',
            'freight_charges',
            'cod_charges',
            'total_charges',
            'edd',
            'max_slab_weight',
            'chargeable_weight',
            'volumetric_weight',
            'slabs',
            'zone',
          ],
          renderers: {
            freight_charges: (val) => formatCurrency(val),
            cod_charges: (val) => formatCurrency(val),
            total_charges: (val) => formatCurrency(val),
            zone: (val) => (
              <Badge variant="subtle" colorScheme="orange">
                {val}
              </Badge>
            ),
            edd: (val) => <Text color="purple.500">{val}</Text>,
            max_slab_weight: (val) => (val != null ? `${val} kg` : '—'),
            chargeable_weight: (val) =>
              val ? (
                <Text fontWeight="semibold" color="blue.600">
                  {val} g
                </Text>
              ) : (
                <Text color="gray.400">—</Text>
              ),
            volumetric_weight: (val) =>
              val ? (
                <Text fontWeight="semibold" color="teal.600">
                  {val} g
                </Text>
              ) : (
                <Text color="gray.400">—</Text>
              ),
            slabs: (val) =>
              val ? (
                <Badge colorScheme="purple" variant="subtle">
                  {val}
                </Badge>
              ) : (
                <Text color="gray.400">—</Text>
              ),
          },
        }

  return (
    <Stack
      spacing={8}
      pt={{ base: '120px', md: '75px' }}
      bg={useColorModeValue('gray.100', 'gray.900')}
      minH="100vh"
      p={4}
    >
      <Box bg={useColorModeValue('white', 'gray.800')} p={8} borderRadius="2xl" shadow="xl">
        <Heading size="lg" mb={8} color={useColorModeValue('purple.600', 'purple.300')}>
          Rate Calculator
        </Heading>

        <form onSubmit={handleSubmit}>
          {/* Shipment Type FIRST */}
          <Box
            bg={useColorModeValue('gray.50', 'gray.700')}
            borderRadius="2xl"
            p={6}
            mb={6}
            shadow="lg"
          >
            <Heading
              size="sm"
              mb={4}
              color={useColorModeValue('purple.600', 'purple.300')}
              borderBottom="1px solid"
              borderColor={useColorModeValue('gray.200', 'gray.600')}
              pb={2}
            >
              Shipment Type
            </Heading>
            <Tabs
              variant="soft-rounded"
              colorScheme="purple"
              onChange={(index) => setShipmentType(index === 0 ? 'b2c' : 'b2b')}
            >
              <TabList>
                <Tab>B2C</Tab>
                <Tab>B2B</Tab>
              </TabList>
            </Tabs>

            <Box mt={4}>
              {shipmentType === 'b2c' ? (
                <B2CForm shipmentType="b2c" formData={formData} onChange={handleChange} />
              ) : (
                <B2BForm
                  shipmentType="b2b"
                  formData={formData}
                  onChange={handleChange}
                  onBulkChange={handleBulkChange}
                  couriers={courierCatalog}
                  selectedCourier={selectedB2BCourier}
                  onCourierChange={setSelectedB2BCourier}
                />
              )}
            </Box>
          </Box>

          {/* Shared Fields */}
          <CommonFields
            formData={formData}
            handleChange={handleChange}
            loadingPickup={loadingPickup}
            loadingDelivery={loadingDelivery}
            plans={plans}
            loadingPlans={loadingPlans}
          />

          <HStack justify="flex-end" spacing={4}>
            {normalizedAvailableCouriers.length ? (
              <Button variant="outline" onClick={() => setAvailableCouriers([])}>
                Clear Results
              </Button>
            ) : null}
            <Button
              type="submit"
              isLoading={isPending || isCalculatingB2B}
              colorScheme="purple"
              loadingText="Calculating"
            >
              Calculate Rates
            </Button>
          </HStack>
        </form>
      </Box>

      {isError && (
        <Box bg="red.50" borderRadius="lg" borderWidth="1px" borderColor="red.200" p={4}>
          <Text color="red.600">{error?.message || 'Failed to fetch couriers'}</Text>
        </Box>
      )}

      {shipmentType === 'b2c' && highlights && normalizedAvailableCouriers.length ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box
            shadow="lg"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={useColorModeValue('green.100', 'green.900')}
          >
            <Box
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor={useColorModeValue('green.100', 'green.800')}
            >
              <HStack spacing={2}>
                <Icon as={TbDiscountCheck} color="green.400" boxSize={5} />
                <Text fontWeight="bold">Cheapest Option</Text>
              </HStack>
            </Box>
            <Box px={4} py={4}>
              <Stack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  {highlights.cheapest?.displayName}
                </Text>
                <Text color="gray.500">Zone {highlights.cheapest?.approxZone?.code || '—'}</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.500">
                  {formatCurrency(highlights.cheapest?.total)}
                </Text>
                <HStack spacing={4}>
                  <Tooltip label="Base Freight">
                    <Text>Freight: {formatCurrency(highlights.cheapest?.baseRate)}</Text>
                  </Tooltip>
                  {formData.paymentType === 'cod' && (
                    <Tooltip label="COD Charges">
                      <Text>
                        COD:{' '}
                        {formatCurrency(highlights.cheapest?.total - highlights.cheapest?.baseRate)}
                      </Text>
                    </Tooltip>
                  )}
                </HStack>
              </Stack>
            </Box>
          </Box>
          <Box
            shadow="lg"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={useColorModeValue('purple.100', 'purple.900')}
          >
            <Box
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor={useColorModeValue('purple.100', 'purple.800')}
            >
              <HStack spacing={2}>
                <Icon as={BiTachometer} color="purple.400" boxSize={5} />
                <Text fontWeight="bold">Fastest Option</Text>
              </HStack>
            </Box>
            <Box px={4} py={4}>
              <Stack spacing={2}>
                <Text fontSize="lg" fontWeight="semibold">
                  {highlights.fastest?.displayName}
                </Text>
                <Text color="gray.500">Zone {highlights.fastest?.approxZone?.code || '—'}</Text>
                <Text fontSize="xl" fontWeight="bold" color="purple.500">
                  {highlights.fastest?.edd || '—'}
                </Text>
                <Text color="gray.600">Total: {formatCurrency(highlights.fastest?.total)}</Text>
              </Stack>
            </Box>
          </Box>
        </SimpleGrid>
      ) : null}

      <Box ref={couriersRef}>
        <GenericTable
          title={shipmentType === 'b2b' ? 'B2B Calculated Rates' : 'B2C Available Couriers'}
          data={tableConfig.data}
          captions={tableConfig.captions}
          columnKeys={tableConfig.columnKeys}
          renderers={tableConfig.renderers}
          loading={isPending || isCalculatingB2B}
          paginated={false}
        />
      </Box>
    </Stack>
  )
}
