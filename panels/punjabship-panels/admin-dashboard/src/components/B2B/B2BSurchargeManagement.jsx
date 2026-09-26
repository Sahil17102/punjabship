import { AddIcon, DeleteIcon, EditIcon, SearchIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Spinner,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useCouriers } from '../../hooks/useCouriers'
import { b2bAdminService } from '../../services/b2bAdmin.service'
import { PlansService } from '../../services/plan.service'
import Card from '../Card/Card'
import CardBody from '../Card/CardBody'
import CardHeader from '../Card/CardHeader'

const B2BSurchargeManagement = ({
  planId,
  courierId: propCourierId = '',
  serviceProvider: propServiceProvider = '',
}) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedRule, setSelectedRule] = useState(null)

  // Use props if provided, otherwise fallback to local state (for backward compatibility)
  const [localPlanId, setLocalPlanId] = useState('')
  const [localCourierId, setLocalCourierId] = useState('')
  const [localServiceProvider, setLocalServiceProvider] = useState('')
  const effectivePlanId = planId || localPlanId
  const courierId = propCourierId || localCourierId
  const serviceProvider = propServiceProvider || localServiceProvider
  const isCourierScopeLocked = Boolean(propCourierId || propServiceProvider)

  const [searchQuery, setSearchQuery] = useState('')
  const { data: b2bPlans = [] } = useQuery({
    queryKey: ['plans', { businessType: 'b2b', status: 'active' }],
    queryFn: () => PlansService.getPlans({ businessType: 'b2b', status: 'active' }),
  })
  const { data: couriers = [] } = useCouriers({ businessType: 'b2b' })
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.800')

  useEffect(() => {
    if (planId || localPlanId || !b2bPlans.length) {
      return
    }

    const basicPlan =
      b2bPlans.find((plan) => String(plan.name || '').trim().toLowerCase() === 'basic') ||
      b2bPlans[0]

    if (basicPlan?.id) {
      setLocalPlanId(basicPlan.id)
    }
  }, [b2bPlans, localPlanId, planId])

  useEffect(() => {
    if (isCourierScopeLocked || courierId || !couriers.length) {
      return
    }

    const preferredCourier =
      couriers.find((courier) => {
        const provider = String(courier.serviceProvider || courier.service_provider || '')
          .trim()
          .toLowerCase()
        const name = String(courier.name || '').trim().toLowerCase()
        return provider === 'delhivery' && name.includes('surface')
      }) ||
      couriers.find((courier) => {
        const provider = String(courier.serviceProvider || courier.service_provider || '')
          .trim()
          .toLowerCase()
        return provider === 'delhivery'
      }) ||
      couriers[0]

    if (preferredCourier) {
      const provider = preferredCourier.serviceProvider || preferredCourier.service_provider || ''
      setLocalCourierId(String(preferredCourier.id))
      setLocalServiceProvider(provider)
    }
  }, [courierId, couriers, isCourierScopeLocked])

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['b2b-overheads', courierId, serviceProvider, effectivePlanId],
    queryFn: () =>
      b2bAdminService.getOverheads({
        courier_id: courierId || undefined,
        service_provider: serviceProvider || undefined,
        plan_id: effectivePlanId,
      }),
    enabled: !!effectivePlanId,
  })

  // Handle combined courier-service provider selection
  const handleCourierServiceChange = (value) => {
    if (!value) {
      setLocalCourierId('')
      setLocalServiceProvider('')
      return
    }
    const [id, provider] = value.split('|')
    setLocalCourierId(id)
    setLocalServiceProvider(provider || '')
  }

  const getCombinedCourierValue = () => {
    if (!courierId) return ''
    return `${courierId}|${serviceProvider || ''}`
  }

  const handleAdd = () => {
    setSelectedRule(null)
    onOpen()
  }

  const handleEdit = (rule) => {
    setSelectedRule(rule)
    onOpen()
  }

  const handleDelete = (ruleId) => {
    if (window.confirm('Are you sure you want to delete this surcharge rule?')) {
      b2bAdminService
        .deleteOverhead(ruleId)
        .then(() => {
          queryClient.invalidateQueries(['b2b-overheads'])
          toast({
            title: 'Surcharge deleted',
            status: 'success',
            duration: 3000,
          })
        })
        .catch((error) => {
          toast({
            title: 'Failed to delete surcharge',
            description: error.message,
            status: 'error',
            duration: 5000,
          })
        })
    }
  }

  const filteredRules = rules.filter((rule) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      rule.name?.toLowerCase().includes(query) ||
      rule.code?.toLowerCase().includes(query) ||
      rule.description?.toLowerCase().includes(query)
    )
  })

  return (
    <VStack spacing={6} align="stretch">
      {/* Info Card */}
      <Card
        bg={useColorModeValue('blue.50', 'blue.900')}
        borderWidth="1px"
        borderColor={useColorModeValue('blue.200', 'blue.700')}
      >
        <CardBody>
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" fontWeight="bold" color="blue.700">
              💡 About Surcharges
            </Text>
            <Text fontSize="xs" color="blue.600">
              Use this section only for <strong>custom conditional charges</strong> (special cases
              by zone, weight, payment type, etc.). Most merchants only need the Overhead Charges
              tab.
            </Text>
            <Box
              mt={2}
              p={3}
              bg={useColorModeValue('orange.50', 'orange.900')}
              borderRadius="md"
              borderLeft="4px solid"
              borderColor="orange.500"
            >
              <Text fontSize="xs" fontWeight="bold" color="orange.900" mb={1}>
                ⚠️ Important:
              </Text>
              <Text fontSize="xs" color="orange.700">
                Standard fees (AWB, Fuel, COD, ODA, ROV, Insurance, Mall, Handling, etc.) should be
                configured in the <strong>Overhead Charges</strong> tab to avoid double-charging.
                These advanced rules are for special cases only.
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: !isCourierScopeLocked ? 3 : 2 }} spacing={4}>
            {/* Only show courier selector if not using global props (for backward compatibility) */}
            {!isCourierScopeLocked && (
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="medium">
                  Courier
                </FormLabel>
                <Select
                  value={getCombinedCourierValue()}
                  onChange={(e) => handleCourierServiceChange(e.target.value)}
                  placeholder="All Couriers"
                  size="md"
                >
                  <option value="">All Couriers</option>
                  {couriers.map((courier) => (
                    <option
                      key={courier.id}
                      value={`${courier.id}|${courier.serviceProvider || ''}`}
                    >
                      {courier.name} - {courier.serviceProvider || 'N/A'}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="medium">
                Search
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, code, or description..."
                  size="md"
                />
              </InputGroup>
            </FormControl>
            <Flex align="end">
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                onClick={handleAdd}
                size="md"
                w="full"
              >
                Add Surcharge Rule
              </Button>
            </Flex>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Rules Table */}
      {isLoading ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" color="blue.500" />
        </Box>
      ) : filteredRules.length === 0 ? (
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} py={8}>
              <Text fontSize="lg" fontWeight="medium" color="gray.500">
                {searchQuery ? 'No surcharges found' : 'No surcharge rules yet'}
              </Text>
              <Text fontSize="sm" color="gray.400" textAlign="center" maxW="400px">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Create custom conditional charges for unique business rules'}
              </Text>
              {!searchQuery && (
                <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleAdd} size="md">
                  Add Your First Surcharge
                </Button>
              )}
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={3}>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                Surcharge Rules ({filteredRules.length})
              </Text>
            </Flex>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Amount</Th>
                  <Th>Conditions</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredRules.map((rule) => (
                  <Tr key={rule.id} _hover={{ bg: hoverBg }}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {rule.name}
                        </Text>
                        {rule.code && (
                          <Text fontSize="xs" color="gray.500">
                            {rule.code}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          rule.type === 'flat'
                            ? 'blue'
                            : rule.type === 'percent'
                            ? 'green'
                            : rule.type === 'per_kg'
                            ? 'purple'
                            : 'orange'
                        }
                        fontSize="xs"
                      >
                        {rule.type === 'flat'
                          ? 'Flat'
                          : rule.type === 'percent'
                          ? 'Percent'
                          : rule.type === 'per_kg'
                          ? 'Per Kg'
                          : rule.type === 'flat_awb'
                          ? 'Per AWB'
                          : rule.type === 'per_awb_day'
                          ? 'Per Day'
                          : rule.type}
                      </Badge>
                    </Td>
                    <Td>
                      {rule.type === 'percent' ? (
                        <Text fontSize="sm">{rule.percent}%</Text>
                      ) : (
                        <Text fontSize="sm">₹{rule.amount || '0'}</Text>
                      )}
                    </Td>
                    <Td>
                      {rule.condition ? (
                        <Tooltip
                          label={
                            typeof rule.condition === 'string'
                              ? rule.condition
                              : JSON.stringify(rule.condition)
                          }
                          hasArrow
                        >
                          <Badge colorScheme="gray" fontSize="xs" cursor="help">
                            Conditional
                          </Badge>
                        </Tooltip>
                      ) : (
                        <Badge colorScheme="green" fontSize="xs">
                          Always
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <Badge colorScheme={rule.is_active !== false ? 'green' : 'red'} fontSize="xs">
                        {rule.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="Edit"
                          icon={<EditIcon />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={() => handleEdit(rule)}
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(rule.id)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      <SurchargeModal
        isOpen={isOpen}
        onClose={onClose}
        rule={selectedRule}
        courierId={courierId}
        serviceProvider={serviceProvider}
        planId={effectivePlanId}
      />
    </VStack>
  )
}

const SurchargeModal = ({ isOpen, onClose, rule, courierId, serviceProvider, planId }) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.800')

  // Fetch zones for zone selection
  const { data: zones = [] } = useQuery({
    queryKey: ['b2b-zones'],
    queryFn: () => b2bAdminService.getZones({ business_type: 'B2B' }),
    enabled: isOpen,
  })

  // Fetch couriers for courier selection
  const { data: couriers = [] } = useCouriers()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'flat',
    amount: '',
    percent: '',
    appliesTo: 'freight',
    // User-friendly condition fields
    conditionPaymentMode: '', // 'COD', 'PREPAID', or ''
    conditionIsOda: false,
    conditionIsRemote: false,
    conditionIsMall: false,
    conditionIsHoliday: false,
    conditionIsExpress: false,
    conditionIsTimeSpecific: false,
    conditionIsFragile: false,
    conditionIsInsurance: false,
    conditionZones: [], // Array of zone IDs
    conditionMinWeight: '',
    conditionMaxWeight: '',
    conditionMinValue: '', // Minimum order value
    conditionMaxValue: '', // Maximum order value
    conditionCourierId: '', // Specific courier
    priority: 0,
    isActive: true,
  })

  // Auto-generate code from name
  const generateCode = (name) => {
    if (!name) return ''
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  // Parse condition JSON to user-friendly fields
  const parseCondition = (condition) => {
    if (!condition) return {}
    try {
      const parsed = typeof condition === 'string' ? JSON.parse(condition) : condition
      return {
        conditionPaymentMode: parsed.paymentMode || '',
        conditionIsOda: parsed.isOda === true,
        conditionIsRemote: parsed.isRemote === true,
        conditionIsMall: parsed.isMall === true,
        conditionIsHoliday: parsed.isHoliday === true,
        conditionIsExpress: parsed.isExpress === true,
        conditionIsTimeSpecific: parsed.isTimeSpecific === true,
        conditionIsFragile: parsed.isFragile === true,
        conditionIsInsurance: parsed.isInsurance === true,
        conditionZones: Array.isArray(parsed.zones) ? parsed.zones : [],
        conditionMinWeight: parsed.minWeight?.toString() || '',
        conditionMaxWeight: parsed.maxWeight?.toString() || '',
        conditionMinValue: parsed.minValue?.toString() || '',
        conditionMaxValue: parsed.maxValue?.toString() || '',
        conditionCourierId: parsed.courierId?.toString() || '',
      }
    } catch {
      return {}
    }
  }

  // Build condition JSON from user-friendly fields
  const buildCondition = () => {
    const condition = {}
    if (formData.conditionPaymentMode) {
      condition.paymentMode = formData.conditionPaymentMode
    }
    if (formData.conditionIsOda) condition.isOda = true
    if (formData.conditionIsRemote) condition.isRemote = true
    if (formData.conditionIsMall) condition.isMall = true
    if (formData.conditionIsHoliday) condition.isHoliday = true
    if (formData.conditionIsExpress) condition.isExpress = true
    if (formData.conditionIsTimeSpecific) condition.isTimeSpecific = true
    if (formData.conditionIsFragile) condition.isFragile = true
    if (formData.conditionIsInsurance) condition.isInsurance = true
    if (formData.conditionZones.length > 0) {
      condition.zones = formData.conditionZones
    }
    if (formData.conditionMinWeight) {
      condition.minWeight = Number(formData.conditionMinWeight)
    }
    if (formData.conditionMaxWeight) {
      condition.maxWeight = Number(formData.conditionMaxWeight)
    }
    if (formData.conditionMinValue) {
      condition.minValue = Number(formData.conditionMinValue)
    }
    if (formData.conditionMaxValue) {
      condition.maxValue = Number(formData.conditionMaxValue)
    }
    if (formData.conditionCourierId) {
      condition.courierId = Number(formData.conditionCourierId)
    }
    return Object.keys(condition).length > 0 ? condition : null
  }

  useEffect(() => {
    if (rule) {
      const parsedCondition = parseCondition(rule.condition)
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        type: rule.type || 'flat',
        amount: rule.amount || '',
        percent: rule.percent || '',
        appliesTo: rule.applies_to || rule.applies_on || 'freight',
        ...parsedCondition,
        priority: rule.priority || 0,
        isActive: rule.is_active !== false,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'flat',
        amount: '',
        percent: '',
        appliesTo: 'freight',
        conditionPaymentMode: '',
        conditionIsOda: false,
        conditionIsRemote: false,
        conditionIsMall: false,
        conditionIsHoliday: false,
        conditionIsExpress: false,
        conditionIsTimeSpecific: false,
        conditionIsFragile: false,
        conditionIsInsurance: false,
        conditionZones: [],
        conditionMinWeight: '',
        conditionMaxWeight: '',
        conditionMinValue: '',
        conditionMaxValue: '',
        conditionCourierId: '',
        priority: 0,
        isActive: true,
      })
    }
  }, [rule])

  // Check for overlap with Additional Charges
  const checkOverlap = () => {
    const name = formData.name.toUpperCase()
    const type = formData.type

    const overlaps = [
      { pattern: 'AWB', message: 'AWB charge' },
      { pattern: 'FUEL', message: 'Fuel surcharge' },
      { pattern: 'ODA', message: 'ODA charge' },
      { pattern: 'COD', message: 'COD charge' },
      { pattern: 'ROV', message: 'ROV charge' },
      { pattern: 'INSURANCE', message: 'Insurance' },
      { pattern: 'MALL', message: 'Mall delivery charge' },
      { pattern: 'HANDLING', message: 'Handling charges' },
      { pattern: 'ATTEMPT', message: 'Attempt charge' },
      { pattern: 'DEMURRAGE', message: 'Demurrage' },
      { pattern: 'TIME_SPECIFIC', message: 'Time-specific delivery charge' },
    ]

    for (const { pattern, message } of overlaps) {
      if (
        name.includes(pattern) ||
        (type === 'flat_awb' && pattern === 'AWB') ||
        (type === 'per_awb_day' && pattern === 'DEMURRAGE')
      ) {
        return {
          overlaps: true,
          message: `${message} is already configured in Additional Charges. Use Additional Charges instead to avoid double-charging.`,
        }
      }
    }

    return { overlaps: false, message: '' }
  }

  const overlapWarning = checkOverlap()

  const saveMutation = useMutation({
    mutationFn: (data) =>
      b2bAdminService.upsertOverhead({
        ...data,
        id: rule?.id,
        courier_id: courierId || undefined,
        service_provider: serviceProvider || undefined,
        plan_id: planId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['b2b-overheads'])
      toast({
        title: rule ? 'Surcharge updated' : 'Surcharge created',
        status: 'success',
        duration: 3000,
      })
      onClose()
    },
    onError: (error) => {
      toast({
        title: 'Failed to save surcharge',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  const handleSubmit = () => {
    const code = generateCode(formData.name)
    const condition = buildCondition()

    if (!formData.name.trim()) {
      toast({
        title: 'Name is required',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (formData.type === 'percent' && !formData.percent) {
      toast({
        title: 'Percentage is required',
        status: 'error',
        duration: 3000,
      })
      return
    }

    if (formData.type !== 'percent' && !formData.amount) {
      toast({
        title: 'Amount is required',
        status: 'error',
        duration: 3000,
      })
      return
    }

    saveMutation.mutate({
      code,
      name: formData.name,
      description: formData.description,
      type: formData.type,
      amount: formData.amount || null,
      percent: formData.percent || null,
      applies_to: formData.appliesTo,
      condition: condition,
      priority: formData.priority,
      is_active: formData.isActive,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(2px)" />
      <ModalContent maxH="90vh">
        <ModalHeader
          bg={useColorModeValue('blue.50', 'gray.700')}
          borderBottomWidth="1px"
          borderBottomColor={borderColor}
        >
          <HStack>
            <Text fontSize="lg" fontWeight="bold">
              {rule ? 'Edit Surcharge Rule' : 'Create New Surcharge Rule'}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody py={6}>
          {overlapWarning.overlaps && (
            <Box
              mb={6}
              p={4}
              bg="orange.50"
              borderRadius="md"
              borderLeft="4px solid"
              borderColor="orange.500"
            >
              <Text fontSize="sm" fontWeight="bold" color="orange.900" mb={1}>
                ⚠️ Overlap Detected
              </Text>
              <Text fontSize="xs" color="orange.700">
                {overlapWarning.message}
              </Text>
            </Box>
          )}

          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={3}>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  Basic Information
                </Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Surcharge Name
                    </FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Weekend Delivery Charge"
                      size="md"
                    />
                    <FormHelperText fontSize="xs">
                      A clear name for this surcharge (e.g., "Weekend Delivery", "Express Service")
                    </FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Description
                    </FormLabel>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe when this surcharge applies..."
                      rows={2}
                      size="md"
                    />
                    <FormHelperText fontSize="xs">
                      Optional: Explain when and why this charge is applied
                    </FormHelperText>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Charge Configuration */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={3}>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  How Much to Charge?
                </Text>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Charge Type
                    </FormLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      size="md"
                    >
                      <option value="flat">Fixed Amount (e.g., ₹50 per shipment)</option>
                      <option value="flat_awb">Per Shipment (e.g., ₹20 per AWB)</option>
                      <option value="percent">Percentage (e.g., 2% of shipping cost)</option>
                      <option value="per_kg">Per Kilogram (e.g., ₹5 per kg)</option>
                      <option value="per_awb_day">Per Day (e.g., ₹10 per day for storage)</option>
                    </Select>
                    <FormHelperText fontSize="xs">
                      How should this charge be calculated?
                    </FormHelperText>
                  </FormControl>
                  {formData.type === 'percent' ? (
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="medium">
                        Percentage (%)
                      </FormLabel>
                      <NumberInput
                        value={formData.percent}
                        onChange={(_, value) => setFormData({ ...formData, percent: value })}
                        min={0}
                        max={100}
                        precision={2}
                        size="md"
                      >
                        <NumberInputField />
                      </NumberInput>
                      <FormHelperText fontSize="xs">Example: Enter 2.5 for 2.5%</FormHelperText>
                    </FormControl>
                  ) : (
                    <FormControl isRequired>
                      <FormLabel fontSize="sm" fontWeight="medium">
                        Amount (₹)
                      </FormLabel>
                      <NumberInput
                        value={formData.amount}
                        onChange={(_, value) => setFormData({ ...formData, amount: value })}
                        min={0}
                        precision={2}
                        size="md"
                      >
                        <NumberInputField />
                      </NumberInput>
                      <FormHelperText fontSize="xs">
                        Enter the charge amount in rupees
                      </FormHelperText>
                    </FormControl>
                  )}
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Apply Charge On
                    </FormLabel>
                    <Select
                      value={formData.appliesTo}
                      onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                      size="md"
                    >
                      <option value="freight">Base Shipping Cost</option>
                      <option value="total">Total Amount (including all charges)</option>
                      <option value="cod">COD Amount Only</option>
                      <option value="all">All Charges</option>
                    </Select>
                    <FormHelperText fontSize="xs">
                      What should this charge be calculated on?
                    </FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Priority (Order)
                    </FormLabel>
                    <NumberInput
                      value={formData.priority}
                      onChange={(_, value) => setFormData({ ...formData, priority: value })}
                      min={0}
                      max={100}
                      size="md"
                    >
                      <NumberInputField />
                    </NumberInput>
                    <FormHelperText fontSize="xs">
                      Lower numbers apply first. Leave as 0 for default order.
                    </FormHelperText>
                  </FormControl>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* When to Apply */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={3}>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  When Should This Charge Apply?
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Leave all unchecked to apply to all shipments
                </Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Payment Type
                    </FormLabel>
                    <Select
                      value={formData.conditionPaymentMode}
                      onChange={(e) =>
                        setFormData({ ...formData, conditionPaymentMode: e.target.value })
                      }
                      size="md"
                    >
                      <option value="">Apply to All Payment Types</option>
                      <option value="COD">COD (Cash on Delivery) Only</option>
                      <option value="PREPAID">Prepaid Only</option>
                    </Select>
                    <FormHelperText fontSize="xs">
                      Select if this charge should only apply to specific payment types
                    </FormHelperText>
                  </FormControl>

                  <SimpleGrid columns={3} spacing={4}>
                    <FormControl>
                      <HStack>
                        <Checkbox
                          isChecked={formData.conditionIsOda}
                          onChange={(e) =>
                            setFormData({ ...formData, conditionIsOda: e.target.checked })
                          }
                          colorScheme="blue"
                        >
                          <Text fontSize="sm">ODA Only</Text>
                        </Checkbox>
                      </HStack>
                      <FormHelperText fontSize="xs">
                        Apply only to ODA (Out of Delivery Area) shipments
                      </FormHelperText>
                    </FormControl>
                    <FormControl>
                      <HStack>
                        <Checkbox
                          isChecked={formData.conditionIsRemote}
                          onChange={(e) =>
                            setFormData({ ...formData, conditionIsRemote: e.target.checked })
                          }
                          colorScheme="blue"
                        >
                          <Text fontSize="sm">Remote Only</Text>
                        </Checkbox>
                      </HStack>
                      <FormHelperText fontSize="xs">
                        Apply only to remote area shipments
                      </FormHelperText>
                    </FormControl>
                    <FormControl>
                      <HStack>
                        <Checkbox
                          isChecked={formData.conditionIsMall}
                          onChange={(e) =>
                            setFormData({ ...formData, conditionIsMall: e.target.checked })
                          }
                          colorScheme="blue"
                        >
                          <Text fontSize="sm">Mall Delivery</Text>
                        </Checkbox>
                      </HStack>
                      <FormHelperText fontSize="xs">Apply only to mall deliveries</FormHelperText>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Specific Zones (Optional)
                    </FormLabel>
                    <Select
                      value={formData.conditionZones.length > 0 ? formData.conditionZones[0] : ''}
                      onChange={(e) => {
                        const selectedZone = e.target.value
                        if (selectedZone) {
                          setFormData({
                            ...formData,
                            conditionZones: [selectedZone],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            conditionZones: [],
                          })
                        }
                      }}
                      size="md"
                      placeholder="Select a zone (leave empty for all zones)"
                    >
                      <option value="">All Zones</option>
                      {zones.map((zone) => (
                        <option key={zone.id} value={zone.code || zone.name}>
                          {zone.name} {zone.code && `(${zone.code})`}
                        </option>
                      ))}
                    </Select>
                    <FormHelperText fontSize="xs" mt={2}>
                      Leave empty to apply to all zones. Select a specific zone if this charge only
                      applies to that area.
                    </FormHelperText>
                  </FormControl>

                  <SimpleGrid columns={2} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium">
                        Minimum Weight (kg)
                      </FormLabel>
                      <NumberInput
                        value={formData.conditionMinWeight}
                        onChange={(_, value) =>
                          setFormData({ ...formData, conditionMinWeight: value })
                        }
                        min={0}
                        precision={2}
                        size="md"
                      >
                        <NumberInputField placeholder="Leave empty for no minimum" />
                      </NumberInput>
                      <FormHelperText fontSize="xs">
                        Only apply if weight is above this (optional)
                      </FormHelperText>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium">
                        Maximum Weight (kg)
                      </FormLabel>
                      <NumberInput
                        value={formData.conditionMaxWeight}
                        onChange={(_, value) =>
                          setFormData({ ...formData, conditionMaxWeight: value })
                        }
                        min={0}
                        precision={2}
                        size="md"
                      >
                        <NumberInputField placeholder="Leave empty for no maximum" />
                      </NumberInput>
                      <FormHelperText fontSize="xs">
                        Only apply if weight is below this (optional)
                      </FormHelperText>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium">
                        Minimum Order Value (₹)
                      </FormLabel>
                      <NumberInput
                        value={formData.conditionMinValue}
                        onChange={(_, value) =>
                          setFormData({ ...formData, conditionMinValue: value })
                        }
                        min={0}
                        precision={2}
                        size="md"
                      >
                        <NumberInputField placeholder="Leave empty for no minimum" />
                      </NumberInput>
                      <FormHelperText fontSize="xs">
                        Only apply if order value is above this (optional)
                      </FormHelperText>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="medium">
                        Maximum Order Value (₹)
                      </FormLabel>
                      <NumberInput
                        value={formData.conditionMaxValue}
                        onChange={(_, value) =>
                          setFormData({ ...formData, conditionMaxValue: value })
                        }
                        min={0}
                        precision={2}
                        size="md"
                      >
                        <NumberInputField placeholder="Leave empty for no maximum" />
                      </NumberInput>
                      <FormHelperText fontSize="xs">
                        Only apply if order value is below this (optional)
                      </FormHelperText>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="medium">
                      Specific Courier (Optional)
                    </FormLabel>
                    <Select
                      value={formData.conditionCourierId}
                      onChange={(e) =>
                        setFormData({ ...formData, conditionCourierId: e.target.value })
                      }
                      size="md"
                      placeholder="All Couriers"
                    >
                      <option value="">All Couriers</option>
                      {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.name} - {courier.serviceProvider || 'N/A'}
                        </option>
                      ))}
                    </Select>
                    <FormHelperText fontSize="xs">
                      Leave empty to apply to all couriers. Select a specific courier if this charge
                      only applies to that courier.
                    </FormHelperText>
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Status */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={3}>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                  Status
                </Text>
              </CardHeader>
              <CardBody>
                <FormControl>
                  <HStack justify="space-between">
                    <Box>
                      <FormLabel fontSize="sm" fontWeight="medium" mb={1}>
                        Enable This Surcharge
                      </FormLabel>
                      <Text fontSize="xs" color="gray.500">
                        Disable to temporarily stop applying this charge
                      </Text>
                    </Box>
                    <Switch
                      isChecked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      colorScheme="green"
                      size="lg"
                    />
                  </HStack>
                </FormControl>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>
        <ModalFooter
          bg={useColorModeValue('gray.50', 'gray.700')}
          borderTopWidth="1px"
          borderTopColor={borderColor}
        >
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} size="md">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={saveMutation.isPending}
              size="md"
              leftIcon={rule ? <EditIcon /> : <AddIcon />}
            >
              {rule ? 'Save Changes' : 'Create Surcharge'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default B2BSurchargeManagement
