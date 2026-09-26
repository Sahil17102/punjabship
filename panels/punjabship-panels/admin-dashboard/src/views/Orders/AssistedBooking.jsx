import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  Grid,
  HStack,
  Icon,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react'
import MetricTile from 'components/Admin/MetricTile'
import PageHeader from 'components/Admin/PageHeader'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import OrdersTable from 'components/Tables/OrdersTable'
import { useOrders } from 'hooks/useOrders'
import { useEffect, useMemo, useState } from 'react'
import {
  FiCheckCircle,
  FiPlus,
  FiTrash2,
  FiDownload,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiTruck,
  FiUser,
} from 'react-icons/fi'
import { useHistory } from 'react-router-dom'
import {
  checkAssistedBookingRates,
  createAssistedBooking,
  fetchAssistedBookingSellers,
  fetchAssistedSellerWarehouses,
} from 'services/order.service'

const today = () => new Date().toISOString().slice(0, 10)

const initialForm = {
  order_date: today(),
  payment_type: 'prepaid',
  buyer_name: '',
  buyer_phone: '',
  buyer_email: '',
  address: '',
  address_locality: '',
  city: '',
  state: '',
  pincode: '',
  products: [{ product_name: '', sku: '', quantity: '1', price: '', hsn: '', discount: '0', tax_rate: '0' }],
  weight: '',
  length: '',
  breadth: '',
  height: '',
  shipping_charges: '0',
  transaction_fee: '0',
  gift_wrap: '0',
  discount: '0',
  prepaid_amount: '0',
  is_rto_same: true,
  rto_name: '',
  rto_phone: '',
  rto_address: '',
  rto_city: '',
  rto_state: '',
  rto_pincode: '',
  pickup_date: today(),
  pickup_time: '14:00',
}

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const normalizeObject = (value) => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

const normalizeProducts = (value) => {
  const raw = (() => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  })()

  const products = raw.map((item) => ({
    product_name: item?.product_name || item?.productName || item?.name || 'Product',
    sku: item?.sku || 'NA',
    quantity: String(item?.quantity ?? item?.qty ?? 1),
    price: String(item?.price ?? 0),
    hsn: item?.hsn || item?.hsnCode || '',
    discount: String(item?.discount ?? 0),
    tax_rate: String(item?.tax_rate ?? item?.taxRate ?? 0),
  }))

  return products.length
    ? products
    : [{ product_name: 'Product', sku: 'NA', quantity: '1', price: '0', hsn: '', discount: '0', tax_rate: '0' }]
}

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

const buildAddress = (order) => {
  const parts = [
    order?.address_line_1,
    order?.address_line_2,
    order?.address_landmark,
    order?.address_locality,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
  return (parts.length ? parts : [order?.address].filter(Boolean)).join(', ')
}

const buildCloneForm = (order) => {
  const rto = normalizeObject(order?.rto_details)
  return {
    ...initialForm,
    order_date: today(),
    payment_type: String(order?.order_type || '').toLowerCase() === 'cod' ? 'cod' : 'prepaid',
    buyer_name: order?.buyer_name || '',
    buyer_phone: normalizePhone(order?.buyer_phone),
    buyer_email: order?.buyer_email || '',
    address: buildAddress(order),
    address_locality: order?.address_locality || order?.address_landmark || '',
    city: order?.city || '',
    state: order?.state || '',
    pincode: order?.pincode || '',
    products: normalizeProducts(order?.products),
    weight: String(order?.weight ?? ''),
    length: String(order?.length ?? ''),
    breadth: String(order?.breadth ?? ''),
    height: String(order?.height ?? ''),
    shipping_charges: String(order?.shipping_charges ?? 0),
    transaction_fee: String(order?.transaction_fee ?? 0),
    gift_wrap: String(order?.gift_wrap ?? 0),
    discount: String(order?.discount ?? 0),
    prepaid_amount: String(order?.prepaid_amount ?? 0),
    is_rto_same: !rto?.pincode,
    rto_name: rto?.warehouse_name || rto?.name || '',
    rto_phone: normalizePhone(rto?.phone || rto?.poc_phone),
    rto_address: rto?.address || '',
    rto_city: rto?.city || '',
    rto_state: rto?.state || '',
    rto_pincode: rto?.pincode || '',
    pickup_date: today(),
    pickup_time: '14:00',
  }
}

const getCourierName = (rate) =>
  rate?.displayName || rate?.name || rate?.courier_name || rate?.courierPartner || 'Courier'

const getCourierId = (rate) => rate?.id ?? rate?.courier_id ?? rate?.courierId

const FormSection = ({ title, icon, children, helper, action }) => (
  <Box>
    <Flex align="center" justify="space-between" gap={3} mb={2} wrap="wrap">
      <HStack spacing={2} minW={0}>
        {icon ? <Icon as={icon} color="brand.500" /> : null}
        <Box minW={0}>
          <Text fontFamily="Hahmlet, serif" fontWeight="900" color="gray.900">
            {title}
          </Text>
          {helper ? (
            <Text fontSize="xs" color="gray.600">
              {helper}
            </Text>
          ) : null}
        </Box>
      </HStack>
      {action ? <Box flexShrink={0}>{action}</Box> : null}
    </Flex>
    <Box
      border="1px solid"
      borderColor="rgba(8,119,201, 0.14)"
      bg="rgba(255,255,255,0.92)"
      borderRadius="16px"
      p={{ base: 3, md: 4 }}
    >
      {children}
    </Box>
  </Box>
)

const AssistedBooking = () => {
  const toast = useToast()
  const history = useHistory()
  const [sellerSearch, setSellerSearch] = useState('')
  const [sellers, setSellers] = useState([])
  const [selectedSellerId, setSelectedSellerId] = useState('')
  const [warehouses, setWarehouses] = useState([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [form, setForm] = useState(initialForm)
  const [rates, setRates] = useState([])
  const [selectedRateKey, setSelectedRateKey] = useState('')
  const [loadingSellers, setLoadingSellers] = useState(false)
  const [loadingWarehouses, setLoadingWarehouses] = useState(false)
  const [checkingRates, setCheckingRates] = useState(false)
  const [booking, setBooking] = useState(false)
  const [lastShipment, setLastShipment] = useState(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [cloneContext, setCloneContext] = useState(null)

  const selectedSeller = sellers.find((seller) => seller.id === selectedSellerId) || null
  const selectedWarehouse =
    warehouses.find((warehouse) => warehouse.pickupId === selectedWarehouseId) || null
  const selectedRate = rates.find((rate) => {
    const key = rate?.courier_option_key || `${getCourierId(rate)}-${rate?.integration_type || ''}-${getCourierName(rate)}`
    return key === selectedRateKey
  })

  const { data: assistedOrdersData, isLoading: loadingOrders, isFetching, refetch } = useOrders(
    page,
    limit,
    { assistedOnly: true, sortBy: 'created_at', sortOrder: 'desc' },
  )

  useEffect(() => {
    const state = history.location?.state || {}
    const order = state.cloneOrder
    if (!order?.id) return

    setCloneContext({
      mode: state.cloneMode === 'reship' ? 'reship' : 'clone',
      orderNumber: order.order_number || order.order_id || '',
    })
    setForm(buildCloneForm(order))
    setRates([])
    setSelectedRateKey('')
    setLastShipment(null)
    if (order.user_id) setSelectedSellerId(order.user_id)
    setSellerSearch(order.merchantEmail || order.merchantName || order.buyer_name || '')
    history.replace(history.location.pathname)
  }, [history])

  useEffect(() => {
    let alive = true
    const load = async () => {
      setLoadingSellers(true)
      try {
        const data = await fetchAssistedBookingSellers(sellerSearch)
        if (alive) setSellers(data)
      } catch (error) {
        toast({
          title: 'Could not load sellers',
          description: error.response?.data?.message || error.message,
          status: 'error',
          duration: 3500,
          isClosable: true,
        })
      } finally {
        if (alive) setLoadingSellers(false)
      }
    }
    const timer = setTimeout(load, 250)
    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [sellerSearch, toast])

  useEffect(() => {
    if (!selectedSellerId) {
      setWarehouses([])
      setSelectedWarehouseId('')
      return
    }

    const loadWarehouses = async () => {
      setLoadingWarehouses(true)
      try {
        const data = await fetchAssistedSellerWarehouses(selectedSellerId)
        setWarehouses(data)
        setSelectedWarehouseId(data.find((item) => item.isPrimary)?.pickupId || data[0]?.pickupId || '')
      } catch (error) {
        toast({
          title: 'Could not load warehouses',
          description: error.response?.data?.message || error.message,
          status: 'error',
          duration: 3500,
          isClosable: true,
        })
      } finally {
        setLoadingWarehouses(false)
      }
    }
    loadWarehouses()
  }, [selectedSellerId, toast])

  const stats = useMemo(() => {
    const orders = assistedOrdersData?.orders || []
    return {
      total: assistedOrdersData?.totalCount || 0,
      booked: orders.filter((order) => ['booked', 'shipment_created', 'pickup_initiated'].includes(order.order_status)).length,
      delivered: orders.filter((order) => order.order_status === 'delivered').length,
    }
  }, [assistedOrdersData])

  const productSubtotal = useMemo(
    () =>
      form.products.reduce((sum, product) => {
        const qty = Math.max(1, toNumber(product.quantity, 1))
        const price = toNumber(product.price)
        const lineDiscount = toNumber(product.discount)
        return sum + Math.max(0, price * qty - lineDiscount)
      }, 0),
    [form.products],
  )

  const productTax = useMemo(
    () =>
      form.products.reduce((sum, product) => {
        const qty = Math.max(1, toNumber(product.quantity, 1))
        const taxable = Math.max(0, toNumber(product.price) * qty - toNumber(product.discount))
        return sum + taxable * (Math.max(0, toNumber(product.tax_rate)) / 100)
      }, 0),
    [form.products],
  )

  const productTotalWithTax = productSubtotal + productTax
  const totalOrderValue =
    productTotalWithTax +
    toNumber(form.shipping_charges) +
    toNumber(form.transaction_fee) +
    toNumber(form.gift_wrap) -
    toNumber(form.discount)
  const totalCollectable = Math.max(0, totalOrderValue - toNumber(form.prepaid_amount))

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setRates([])
    setSelectedRateKey('')
    setLastShipment(null)
  }

  const setProductField = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.map((product, idx) =>
        idx === index ? { ...product, [field]: value } : product,
      ),
    }))
    setRates([])
    setSelectedRateKey('')
    setLastShipment(null)
  }

  const addProduct = () => {
    setForm((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { product_name: '', sku: '', quantity: '1', price: '', hsn: '', discount: '0', tax_rate: '0' },
      ],
    }))
  }

  const removeProduct = (index) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.length > 1 ? prev.products.filter((_, idx) => idx !== index) : prev.products,
    }))
    setRates([])
    setSelectedRateKey('')
  }

  const validateShipmentDetails = () => {
    if (!selectedSellerId) return 'Select a seller first.'
    if (!selectedWarehouse) return 'Select a seller warehouse.'
    const required = [
      ['buyer_name', 'Buyer name'],
      ['buyer_phone', 'Buyer phone'],
      ['address', 'Delivery address'],
      ['city', 'City'],
      ['state', 'State'],
      ['pincode', 'Pincode'],
      ['weight', 'Weight'],
      ['length', 'Length'],
      ['breadth', 'Breadth'],
      ['height', 'Height'],
    ]
    const missing = required.find(([field]) => !String(form[field] || '').trim())
    if (missing) return `${missing[1]} is required.`
    const missingProduct = form.products.find(
      (product) => !String(product.product_name || '').trim() || !String(product.price || '').trim(),
    )
    if (missingProduct) return 'Product name and product price are required.'
    if (!/^\d{6}$/.test(String(form.pincode))) return 'Delivery pincode must be 6 digits.'
    if (!form.is_rto_same && !/^\d{6}$/.test(String(form.rto_pincode || ''))) {
      return 'RTO pincode must be 6 digits.'
    }
    if (!/^\d{6}$/.test(String(selectedWarehouse.pickup?.pincode || ''))) {
      return 'Selected warehouse pincode is invalid.'
    }
    return ''
  }

  const buildRatePayload = () => ({
    sellerId: selectedSellerId,
    origin: selectedWarehouse?.pickup?.pincode,
    destination: form.pincode,
    payment_type: form.payment_type,
    order_amount: totalCollectable,
    weight: toNumber(form.weight),
    length: toNumber(form.length),
    breadth: toNumber(form.breadth),
    height: toNumber(form.height),
    shipment_type: 'b2c',
    pickupId: selectedWarehouseId,
  })

  const buildShipmentPayload = () => {
    const rate = selectedRate || {}
    const courierId = getCourierId(rate)
    const courierName = getCourierName(rate)
    const pickup = selectedWarehouse.pickup
    return {
      order_number: '',
      payment_type: form.payment_type,
      order_amount: productTotalWithTax,
      order_date: form.order_date || today(),
      package_weight: toNumber(form.weight),
      package_length: toNumber(form.length),
      package_breadth: toNumber(form.breadth),
      package_height: toNumber(form.height),
      shipping_charges: toNumber(form.shipping_charges),
      freight_charges: toNumber(rate.total_charges_without_gst ?? rate.rate ?? rate.freight_charges),
      courier_cost: rate.courier_cost_estimate ? Number(rate.courier_cost_estimate) : undefined,
      cod_charges: form.payment_type === 'cod' ? toNumber(rate.cod_charges) : 0,
      prepaid_amount: toNumber(form.prepaid_amount),
      discount: toNumber(form.discount),
      transaction_fee: toNumber(form.transaction_fee),
      gift_wrap: toNumber(form.gift_wrap),
      integration_type: rate.integration_type || rate.service_provider,
      consignee: {
        name: form.buyer_name.trim(),
        address: form.address.trim(),
        address_line_1: form.address.trim(),
        locality: form.address_locality.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        email: form.buyer_email.trim() || undefined,
        phone: form.buyer_phone.trim(),
      },
      pickup_location_id: selectedWarehouseId,
      pickup: {
        warehouse_name: pickup.warehouse_name,
        address: pickup.address,
        name: pickup.name,
        phone: pickup.phone,
        city: pickup.city,
        state: pickup.state,
        pincode: pickup.pincode,
        gst_number: pickup.gst_number,
        pickup_date: form.pickup_date,
        pickup_time: form.pickup_time,
      },
      is_rto_different: form.is_rto_same ? 'no' : 'yes',
      ...(!form.is_rto_same && {
        rto: {
          warehouse_name: form.rto_name.trim() || 'RTO',
          name: form.rto_name.trim() || 'RTO',
          phone: form.rto_phone.trim(),
          address: form.rto_address.trim(),
          city: form.rto_city.trim(),
          state: form.rto_state.trim(),
          pincode: form.rto_pincode.trim(),
        },
      }),
      order_items: form.products.map((product) => ({
        name: product.product_name.trim(),
        sku: product.sku.trim() || 'NA',
        qty: Math.max(1, toNumber(product.quantity, 1)),
        price: toNumber(product.price),
        hsn: product.hsn.trim(),
        discount: toNumber(product.discount),
        tax_rate: toNumber(product.tax_rate),
      })),
      courier_id: courierId ? Number(courierId) : undefined,
      courier_partner: courierName,
      courier_option_key: rate.courier_option_key,
      selected_max_slab_weight: rate.max_slab_weight ? Number(rate.max_slab_weight) : undefined,
      chargedWeight: rate.chargeable_weight ? Number(rate.chargeable_weight) : undefined,
      volumetricWeight: rate.volumetric_weight ? Number(rate.volumetric_weight) : undefined,
      delivery_location: rate.approxZone?.name || rate.zone || undefined,
      zone_id: rate.approxZone?.id || undefined,
      pickup_date: form.pickup_date,
      pickup_time: form.pickup_time,
      tags: 'assisted_booking',
    }
  }

  const handleCheckRates = async () => {
    const error = validateShipmentDetails()
    if (error) {
      toast({ title: error, status: 'warning', duration: 3000, isClosable: true })
      return
    }

    setCheckingRates(true)
    setRates([])
    setSelectedRateKey('')
    try {
      const data = await checkAssistedBookingRates(buildRatePayload())
      setRates(data)
      if (data.length) {
        const first = data[0]
        setSelectedRateKey(first.courier_option_key || `${getCourierId(first)}-${first.integration_type || ''}-${getCourierName(first)}`)
      }
      toast({
        title: data.length ? 'Rates fetched' : 'No courier available',
        description: data.length
          ? `${data.length} courier option${data.length === 1 ? '' : 's'} found for this seller.`
          : 'Try another route, weight, or payment type.',
        status: data.length ? 'success' : 'warning',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Rate check failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 4500,
        isClosable: true,
      })
    } finally {
      setCheckingRates(false)
    }
  }

  const handleBookShipment = async () => {
    const error = validateShipmentDetails()
    if (error) {
      toast({ title: error, status: 'warning', duration: 3000, isClosable: true })
      return
    }
    if (!selectedRate) {
      toast({ title: 'Select a courier rate before booking.', status: 'warning', duration: 3000, isClosable: true })
      return
    }

    setBooking(true)
    try {
      const response = await createAssistedBooking({
        sellerId: selectedSellerId,
        shipment: buildShipmentPayload(),
      })
      setLastShipment(response.shipment || response)
      toast({
        title: 'Shipment booked',
        description: 'The order is now visible in Assisted Booking, All Orders, and the client panel.',
        status: 'success',
        duration: 4500,
        isClosable: true,
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Booking failed',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 5500,
        isClosable: true,
      })
    } finally {
      setBooking(false)
    }
  }

  const labelUrl =
    lastShipment?.shipment?.label ||
    lastShipment?.label ||
    lastShipment?.shipment?.order?.label ||
    lastShipment?.order?.label ||
    ''

  return (
    <Box pt={{ base: '120px', md: '75px' }}>
      <PageHeader
        eyebrow="Orders"
        title="Assisted booking"
        description="Book B2C shipments for approved sellers using their own warehouse, rate card, wallet and courier flow."
        meta={[
          { label: 'Assisted orders', value: stats.total.toLocaleString() },
          { label: 'Recently booked', value: stats.booked.toLocaleString() },
          { label: 'Delivered', value: stats.delivered.toLocaleString() },
        ]}
        actions={
          <HStack spacing={3}>
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={() => refetch()}
              isLoading={isFetching}
              variant="outline"
              size="sm"
              borderRadius="14px"
            >
              Refresh
            </Button>
            <Button
              leftIcon={<FiPackage />}
              onClick={() => history.push('/admin/orders')}
              bg="brand.500"
              color="white"
              size="sm"
              borderRadius="14px"
              _hover={{ bg: 'brand.600' }}
            >
              View All Orders
            </Button>
          </HStack>
        }
      />

      {cloneContext && (
        <Box
          mt={4}
          border="1px solid"
          borderColor={cloneContext.mode === 'reship' ? 'orange.200' : 'purple.200'}
          bg={cloneContext.mode === 'reship' ? 'orange.50' : 'purple.50'}
          borderRadius="16px"
          px={4}
          py={3}
        >
          <Text fontWeight="800" color="gray.900">
            {cloneContext.mode === 'reship' ? 'Reship order' : 'Clone order'}
          </Text>
          <Text fontSize="sm" color="gray.700">
            {cloneContext.mode === 'reship'
              ? `Copied details from ${cloneContext.orderNumber || 'the selected cancelled order'}. Select a fresh courier and book a new shipment.`
              : `Copied details from ${cloneContext.orderNumber || 'the selected order'}. Review all fields before booking.`}
          </Text>
        </Box>
      )}

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1fr) 360px' }} gap={5} mt={6}>
        <Stack spacing={4}>
          <Card>
            <CardBody>
              <Stack spacing={4} w="100%">
                <Flex justify="space-between" gap={3} wrap="wrap">
                  <Box>
                    <Text fontFamily="Hahmlet, serif" fontSize="xl" fontWeight="800">
                      Assisted B2C order form
                    </Text>
                    <Text color="gray.600" fontSize="sm">
                      Same booking parameters as the client panel. Order number is generated automatically.
                    </Text>
                  </Box>
                </Flex>

                <FormSection
                  title="Seller and Pickup"
                  icon={FiUser}
                  action={
                    <Badge
                      colorScheme={selectedSeller ? 'green' : 'purple'}
                      px={3}
                      py={1.5}
                      borderRadius="999px"
                      boxShadow="0 8px 18px rgba(8,119,201, 0.12)"
                    >
                      {selectedSeller ? `Seller #${selectedSeller.publicId || 'selected'}` : 'Select seller'}
                    </Badge>
                  }
                >
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <HStack>
                      <Icon as={FiSearch} color="brand.500" />
                      <Input value={sellerSearch} onChange={(event) => setSellerSearch(event.target.value)} placeholder="Search seller by company, email, phone" borderRadius="12px" />
                    </HStack>
                    <Select
                      value={selectedSellerId}
                      onChange={(event) => {
                        setSelectedSellerId(event.target.value)
                        setRates([])
                        setSelectedRateKey('')
                      }}
                      placeholder={loadingSellers ? 'Loading sellers...' : 'Select approved seller'}
                      borderRadius="12px"
                    >
                      {sellers.map((seller) => (
                        <option key={seller.id} value={seller.id}>
                          {seller.label} {seller.email ? `- ${seller.email}` : ''}
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={selectedWarehouseId}
                      onChange={(event) => {
                        setSelectedWarehouseId(event.target.value)
                        setRates([])
                        setSelectedRateKey('')
                      }}
                      placeholder={loadingWarehouses ? 'Loading warehouses...' : 'Select warehouse'}
                      borderRadius="12px"
                      isDisabled={!selectedSellerId}
                    >
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.pickupId} value={warehouse.pickupId}>
                          {warehouse.warehouseName} - {warehouse.pickup.city}, {warehouse.pickup.pincode}
                        </option>
                      ))}
                    </Select>
                    <HStack>
                      <Input type="date" value={form.pickup_date} onChange={(e) => setField('pickup_date', e.target.value)} borderRadius="12px" />
                      <Input type="time" value={form.pickup_time} onChange={(e) => setField('pickup_time', e.target.value)} borderRadius="12px" />
                    </HStack>
                  </SimpleGrid>
                </FormSection>

                <FormSection title="Order Information" icon={FiPackage}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Input type="date" value={form.order_date} onChange={(e) => setField('order_date', e.target.value)} borderRadius="12px" />
                    <Select value={form.payment_type} onChange={(e) => setField('payment_type', e.target.value)} borderRadius="12px">
                      <option value="prepaid">Prepaid</option>
                      <option value="cod">COD</option>
                    </Select>
                  </SimpleGrid>
                </FormSection>

                <FormSection title="Recipient Details" icon={FiUser}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Input value={form.buyer_name} onChange={(e) => setField('buyer_name', e.target.value)} placeholder="Buyer name" borderRadius="12px" />
                    <Input value={form.buyer_phone} onChange={(e) => setField('buyer_phone', e.target.value)} placeholder="Buyer phone" borderRadius="12px" />
                    <Input value={form.buyer_email} onChange={(e) => setField('buyer_email', e.target.value)} placeholder="Buyer email" borderRadius="12px" />
                    <Input value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} placeholder="Delivery pincode" borderRadius="12px" maxLength={6} />
                    <Input value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="Delivery city" borderRadius="12px" />
                    <Input value={form.state} onChange={(e) => setField('state', e.target.value)} placeholder="Delivery state" borderRadius="12px" />
                    <Input value={form.address_locality} onChange={(e) => setField('address_locality', e.target.value)} placeholder="Locality / landmark" borderRadius="12px" />
                    <Textarea value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Delivery address" borderRadius="12px" gridColumn={{ base: 'auto', md: '1 / -1' }} />
                  </SimpleGrid>
                </FormSection>

                <FormSection title="Shipment Details" icon={FiPackage}>
                  <Stack spacing={3}>
                    {form.products.map((product, index) => (
                      <Box key={index} border="1px solid" borderColor="gray.200" borderRadius="14px" p={3} bg="gray.50">
                        <Flex justify="space-between" align="center" mb={3}>
                          <Text fontWeight="800" fontSize="sm">Product {index + 1}</Text>
                          <Button size="xs" leftIcon={<FiTrash2 />} variant="ghost" colorScheme="red" onClick={() => removeProduct(index)} isDisabled={form.products.length === 1}>
                            Remove
                          </Button>
                        </Flex>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                          <Input value={product.product_name} onChange={(e) => setProductField(index, 'product_name', e.target.value)} placeholder="Product name" borderRadius="12px" />
                          <Input value={product.sku} onChange={(e) => setProductField(index, 'sku', e.target.value)} placeholder="SKU" borderRadius="12px" />
                          <Input value={product.hsn} onChange={(e) => setProductField(index, 'hsn', e.target.value)} placeholder="HSN" borderRadius="12px" />
                          <NumberInput value={product.quantity} onChange={(value) => setProductField(index, 'quantity', value)} min={1}>
                            <NumberInputField placeholder="Qty" borderRadius="12px" />
                          </NumberInput>
                          <NumberInput value={product.price} onChange={(value) => setProductField(index, 'price', value)} min={0}>
                            <NumberInputField placeholder="Product price" borderRadius="12px" />
                          </NumberInput>
                          <NumberInput value={product.tax_rate} onChange={(value) => setProductField(index, 'tax_rate', value)} min={0}>
                            <NumberInputField placeholder="Tax %" borderRadius="12px" />
                          </NumberInput>
                          <NumberInput value={product.discount} onChange={(value) => setProductField(index, 'discount', value)} min={0}>
                            <NumberInputField placeholder="Product discount" borderRadius="12px" />
                          </NumberInput>
                        </SimpleGrid>
                      </Box>
                    ))}
                    <Button alignSelf="flex-start" size="sm" leftIcon={<FiPlus />} variant="outline" borderRadius="12px" onClick={addProduct}>
                      Add Product
                    </Button>
                    <Divider />
                    <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
                      <NumberInput value={form.weight} onChange={(value) => setField('weight', value)} min={0}>
                        <NumberInputField placeholder="Weight" borderRadius="12px" />
                      </NumberInput>
                      <NumberInput value={form.length} onChange={(value) => setField('length', value)} min={0}>
                        <NumberInputField placeholder="Length" borderRadius="12px" />
                      </NumberInput>
                      <NumberInput value={form.breadth} onChange={(value) => setField('breadth', value)} min={0}>
                        <NumberInputField placeholder="Breadth" borderRadius="12px" />
                      </NumberInput>
                      <NumberInput value={form.height} onChange={(value) => setField('height', value)} min={0}>
                        <NumberInputField placeholder="Height" borderRadius="12px" />
                      </NumberInput>
                    </SimpleGrid>
                  </Stack>
                </FormSection>

                <FormSection title="RTO Details" icon={FiRefreshCw}>
                  <Stack spacing={3}>
                    <Checkbox isChecked={form.is_rto_same} onChange={(e) => setField('is_rto_same', e.target.checked)} colorScheme="purple">
                      RTO address is same as pickup address
                    </Checkbox>
                    {!form.is_rto_same ? (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        <Input value={form.rto_name} onChange={(e) => setField('rto_name', e.target.value)} placeholder="RTO contact / warehouse name" borderRadius="12px" />
                        <Input value={form.rto_phone} onChange={(e) => setField('rto_phone', e.target.value)} placeholder="RTO phone" borderRadius="12px" />
                        <Input value={form.rto_pincode} onChange={(e) => setField('rto_pincode', e.target.value)} placeholder="RTO pincode" borderRadius="12px" maxLength={6} />
                        <Input value={form.rto_city} onChange={(e) => setField('rto_city', e.target.value)} placeholder="RTO city" borderRadius="12px" />
                        <Input value={form.rto_state} onChange={(e) => setField('rto_state', e.target.value)} placeholder="RTO state" borderRadius="12px" />
                        <Textarea value={form.rto_address} onChange={(e) => setField('rto_address', e.target.value)} placeholder="RTO address" borderRadius="12px" />
                      </SimpleGrid>
                    ) : null}
                  </Stack>
                </FormSection>
              </Stack>
            </CardBody>
          </Card>
        </Stack>

        <Stack spacing={5} position={{ xl: 'sticky' }} top={{ xl: '92px' }} alignSelf="start">
          <Card>
            <CardBody>
              <Stack spacing={4} w="100%">
                <Text fontFamily="Hahmlet, serif" fontSize="xl" fontWeight="800">
                  Order Summary
                </Text>
                <SimpleGrid columns={2} spacing={3}>
                  <NumberInput value={form.shipping_charges} onChange={(value) => setField('shipping_charges', value)} min={0}>
                    <NumberInputField placeholder="Shipping charge" borderRadius="12px" />
                  </NumberInput>
                  <NumberInput value={form.transaction_fee} onChange={(value) => setField('transaction_fee', value)} min={0}>
                    <NumberInputField placeholder="Transaction fee" borderRadius="12px" />
                  </NumberInput>
                  <NumberInput value={form.gift_wrap} onChange={(value) => setField('gift_wrap', value)} min={0}>
                    <NumberInputField placeholder="Gift wrap" borderRadius="12px" />
                  </NumberInput>
                  <NumberInput value={form.discount} onChange={(value) => setField('discount', value)} min={0}>
                    <NumberInputField placeholder="Order discount" borderRadius="12px" />
                  </NumberInput>
                  <NumberInput value={form.prepaid_amount} onChange={(value) => setField('prepaid_amount', value)} min={0}>
                    <NumberInputField placeholder="Prepaid amount" borderRadius="12px" />
                  </NumberInput>
                </SimpleGrid>
                <Stack spacing={2} bg="brand.50" border="1px solid" borderColor="brand.100" borderRadius="16px" p={4}>
                  <Flex justify="space-between"><Text color="gray.600">Product subtotal</Text><Text fontWeight="800">Rs. {productSubtotal.toFixed(2)}</Text></Flex>
                  <Flex justify="space-between"><Text color="gray.600">Product tax</Text><Text fontWeight="800">Rs. {productTax.toFixed(2)}</Text></Flex>
                  <Flex justify="space-between"><Text color="gray.600">Customer order value</Text><Text fontWeight="900">Rs. {totalOrderValue.toFixed(2)}</Text></Flex>
                  <Divider />
                  <Flex justify="space-between"><Text fontWeight="900">Collectable value</Text><Text fontWeight="900" color="brand.600">Rs. {totalCollectable.toFixed(2)}</Text></Flex>
                </Stack>
                <HStack spacing={3} wrap="wrap">
                  <Button leftIcon={<FiTruck />} onClick={handleCheckRates} isLoading={checkingRates} variant="outline" borderRadius="14px">
                    Check rates
                  </Button>
                  <Button leftIcon={<FiCheckCircle />} onClick={handleBookShipment} isLoading={booking} bg="brand.500" color="white" borderRadius="14px" _hover={{ bg: 'brand.600' }}>
                    Book shipment
                  </Button>
                  {labelUrl ? (
                    <Button as="a" href={labelUrl} target="_blank" rel="noreferrer" leftIcon={<FiDownload />} variant="ghost" borderRadius="14px">
                      Print label
                    </Button>
                  ) : null}
                </HStack>
              </Stack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stack spacing={3} w="100%">
                <Flex justify="space-between" align="center">
                  <Text fontFamily="Hahmlet, serif" fontSize="lg" fontWeight="800">
                    Courier Selection
                  </Text>
                  <Badge colorScheme={rates.length ? 'green' : 'gray'} borderRadius="full" px={3}>
                    {rates.length} found
                  </Badge>
                </Flex>
                {rates.length ? (
                  <Stack spacing={3} maxH="360px" overflowY="auto" pr={1}>
                    {rates.map((rate) => {
                      const key = rate.courier_option_key || `${getCourierId(rate)}-${rate.integration_type || ''}-${getCourierName(rate)}`
                      const selected = key === selectedRateKey
                      return (
                        <Box key={key} onClick={() => setSelectedRateKey(key)} cursor="pointer" border="1px solid" borderColor={selected ? 'brand.500' : 'gray.200'} bg={selected ? 'brand.50' : 'white'} borderRadius="16px" p={4} transition="all .18s ease" _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}>
                          <Flex justify="space-between" gap={3}>
                            <Box>
                              <Text fontWeight="800">{getCourierName(rate)}</Text>
                              <Text fontSize="xs" color="gray.600">{(rate.integration_type || rate.service_provider || 'provider').toUpperCase()}</Text>
                            </Box>
                            <Text fontWeight="900" color="brand.600">Rs. {toNumber(rate.wallet_debit_amount ?? rate.total_charges_with_gst ?? rate.rate).toFixed(2)}</Text>
                          </Flex>
                          <HStack mt={3} spacing={2} wrap="wrap">
                            <Badge>{rate.edd || rate.estimated_delivery || 'EDD pending'}</Badge>
                            <Badge colorScheme="purple">{rate.chargeable_weight ? `${rate.chargeable_weight} kg` : 'Chargeable'}</Badge>
                            {rate.booking_blocked_reason ? <Badge colorScheme="red">Blocked</Badge> : null}
                          </HStack>
                        </Box>
                      )
                    })}
                  </Stack>
                ) : (
                  <Box border="1px dashed" borderColor="gray.300" borderRadius="16px" p={5}>
                    <Text color="gray.600" fontSize="sm">
                      Complete Order & Delivery details, then check rates to select a courier.
                    </Text>
                  </Box>
                )}
              </Stack>
            </CardBody>
          </Card>
        </Stack>
      </Grid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} my={5}>
        <MetricTile label="Seller" value={selectedSeller?.label || 'Not selected'} muted={selectedSeller?.email || 'Choose an approved seller'} icon={<Icon as={FiUser} />} />
        <MetricTile label="Warehouse" value={selectedWarehouse?.warehouseName || 'Not selected'} muted={selectedWarehouse?.pickup?.pincode || 'Choose pickup point'} icon={<Icon as={FiPackage} />} />
        <MetricTile label="Courier" value={selectedRate ? getCourierName(selectedRate) : 'Not selected'} muted={selectedRate ? 'Ready to book' : 'Check rates first'} icon={<Icon as={FiTruck} />} />
      </SimpleGrid>

      <Card>
        <CardBody>
          <Stack spacing={4} w="100%">
            <Flex justify="space-between" align="center" gap={3} wrap="wrap">
              <Box>
                <Text fontFamily="Hahmlet, serif" fontSize="xl" fontWeight="800">
                  Assisted booking orders
                </Text>
                <Text color="gray.600" fontSize="sm">
                  These same shipments also appear in All Orders and inside the selected client panel.
                </Text>
              </Box>
            </Flex>
            <OrdersTable
              orders={assistedOrdersData?.orders || []}
              totalCount={assistedOrdersData?.totalCount || 0}
              page={page}
              setPage={setPage}
              perPage={limit}
              setPerPage={setLimit}
              loading={loadingOrders || isFetching}
              onRefresh={refetch}
            />
          </Stack>
        </CardBody>
      </Card>
    </Box>
  )
}

export default AssistedBooking
