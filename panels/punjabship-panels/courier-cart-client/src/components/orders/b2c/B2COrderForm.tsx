import {
  Alert,
  Box,
  Button,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { BiRupee } from 'react-icons/bi'
import { FaBox, FaTruck, FaUser } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchAvailableCouriers } from '../../../api/courier'
import { fetchLocations } from '../../../api/locations'
import type { CreateShipmentParams } from '../../../api/order.service'
import { useCreateShipment } from '../../../hooks/Orders/useOrders'
import { usePaymentOptions } from '../../../hooks/usePaymentOptions'
import { getDefaultPickupSlot } from '../../../utils/pickupSchedule'
import { toast } from '../../UI/Toast'
import FormSectionAccordion from '../../UI/accordion/FormSectionAccordion'
import DeliveryDetailsForm from '../DeliveryDetailsForm'
import OrderDetailsForm from '../OrderDetailsForm'
import PickupLocationForm from '../PickupLocationForm'
import { SelectCourierForm } from '../SelectCourierForm'
import PackageDetailsForm from './PackageDetailsForm'
import PackageDimensionsForm from './PackageDimensionsForm'

const ACCENT = '#0877C9'
const TEXT_PRIMARY = '#17171A'
const TEXT_MUTED = '#496189'

const toMoney = (value: unknown) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export type Product = {
  productName: string
  price: number
  quantity: number
  discount?: number
  taxRate?: number
  hsnCode?: string
  sku?: string
}

export type B2CFormData = {
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  address: string
  addressLocality?: string
  pincode: string
  city: string
  state: string
  country: string
  products: Product[]
  weight: number
  length: number
  breadth: number
  height: number
  orderId: string
  orderDate: string
  orderType: 'prepaid' | 'cod'
  courierPartner: string
  shippingCharges?: number
  transactionFee?: number
  isRtoSame?: boolean
  giftWrap?: number
  discount?: number
  prepaidAmount?: number
  courierCod?: number
  otherCharges?: number
  forwardCharges?: number
  courierCost?: number | null // Estimated courier cost from serviceability (what platform pays courier)

  rtoLocationPincode?: string
  rtoLocationName?: string
  pickupCity?: string
  pickupState?: string
  rtoCity?: string
  rtoState?: string
  rtoLocationPOCName?: string
  rtoLocationPOCPhone?: string
  rtoAddress?: string
  pickupLocationPOCPhone?: string
  pickupLocationId?: string
  pickupLocationPincode?: string
  pickupLocationName?: string
  integrationType?:
    | 'delhivery'
    | 'ekart'
    | 'shadowfax'
    | 'xpressbees'
    | 'amazon'
    | 'indiapost'
    | 'velocity'
    | 'icarry'
  pickupAddress?: string
  pickupLocationPOCName?: string
  courierPartnerId: string
  courierOptionKey?: string
  amazonRequestToken?: string | null
  amazonRateId?: string | null
  amazonServiceId?: string | null
  amazonCarrierId?: string | null
  shadowfaxForwardMode?: 'marketplace' | 'warehouse'
  shadowfaxServiceMode?: 'regular' | 'surface'
  selectedMaxSlabWeight?: number | null
  orderAmount: number
  pickupDate: string
  pickupTime: string
  chargeableWeight?: number | null
  volumetricWeight?: number | null
  slabs?: number | null
  zone?: string
  zoneId?: string
}

export default function B2COrderFormSteps({ onClose }: { onClose?: () => void }) {
  const createShipmentMutation = useCreateShipment(onClose)
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(0)
  const steps = ['Order & Delivery', 'Courier Selection']
  const { data: paymentOptions } = usePaymentOptions()

  const defaultPickupSlot = getDefaultPickupSlot()

  // Determine default order type based on enabled payment options
  const getDefaultOrderType = (): 'prepaid' | 'cod' => {
    if (!paymentOptions) return 'prepaid' // Default fallback
    if (paymentOptions.codEnabled) return 'cod'
    if (paymentOptions.prepaidEnabled) return 'prepaid'
    return 'prepaid' // Final fallback
  }

  const methods = useForm<B2CFormData>({
    defaultValues: {
      products: [{ productName: '', price: 0, quantity: 1 }],
      weight: 0,
      length: 0,
      breadth: 0,
      height: 0,
      courierPartnerId: '',
      amazonRequestToken: null,
      amazonRateId: null,
      amazonServiceId: null,
      amazonCarrierId: null,
      pickupDate: defaultPickupSlot.pickupDate,
      pickupTime: defaultPickupSlot.pickupTime,
      orderType: getDefaultOrderType(),
      selectedMaxSlabWeight: null,
    },
  })

  const {
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    trigger,
    register,
    formState: { errors },
  } = methods
  const { fields, append, remove } = useFieldArray({ control, name: 'products' })

  const shippingCharges = Number(watch('shippingCharges') || 0)
  const transactionFee = Number(watch('transactionFee') || 0)
  const giftWrap = Number(watch('giftWrap') || 0)
  const discount = Number(watch('discount') || 0)
  const prepaidAmount = Number(watch('prepaidAmount') || 0)
  const orderType = watch('orderType') || getDefaultOrderType()
  const cloneState = location.state as
    | {
        cloneOrder?: Partial<B2CFormData>
        cloneMode?: 'clone' | 'reship'
        sourceOrderNumber?: string
      }
    | null

  useEffect(() => {
    if (!cloneState?.cloneOrder) return
    reset({
      products: [{ productName: '', price: 0, quantity: 1 }],
      weight: 0,
      length: 0,
      breadth: 0,
      height: 0,
      courierPartner: '',
      courierPartnerId: '',
      courierOptionKey: '',
      amazonRequestToken: null,
      amazonRateId: null,
      amazonServiceId: null,
      amazonCarrierId: null,
      pickupDate: defaultPickupSlot.pickupDate,
      pickupTime: defaultPickupSlot.pickupTime,
      orderType: getDefaultOrderType(),
      selectedMaxSlabWeight: null,
      ...cloneState.cloneOrder,
      orderId: `ORD-${Date.now()}`,
      orderDate: new Date().toISOString().slice(0, 10),
    })
  }, [cloneState?.cloneOrder, defaultPickupSlot.pickupDate, defaultPickupSlot.pickupTime, reset])

  // Ensure orderType is valid based on payment options
  useEffect(() => {
    if (paymentOptions && orderType) {
      const isCurrentTypeEnabled =
        (orderType === 'cod' && paymentOptions.codEnabled) ||
        (orderType === 'prepaid' && paymentOptions.prepaidEnabled)

      if (!isCurrentTypeEnabled) {
        const newOrderType = paymentOptions.codEnabled
          ? 'cod'
          : paymentOptions.prepaidEnabled
            ? 'prepaid'
            : 'prepaid'
        setValue('orderType', newOrderType)
      }
    }
  }, [paymentOptions, orderType, setValue])

  const subtotal = fields.reduce(
    (sum, _, idx) =>
      sum +
      Math.max(
        0,
        toMoney(watch(`products.${idx}.price`)) *
          Math.max(1, toMoney(watch(`products.${idx}.quantity`))) -
          toMoney(watch(`products.${idx}.discount`)),
      ),
    0,
  )
  const productTax = fields.reduce((sum, _, idx) => {
    const lineTaxable = Math.max(
      0,
      toMoney(watch(`products.${idx}.price`)) *
        Math.max(1, toMoney(watch(`products.${idx}.quantity`))) -
        toMoney(watch(`products.${idx}.discount`)),
    )
    return sum + lineTaxable * (Math.max(0, toMoney(watch(`products.${idx}.taxRate`))) / 100)
  }, 0)
  const productTotalWithTax = subtotal + productTax

  // Calculate total order value (customer-facing)
  // Includes: subtotal + item tax + shipping + transaction_fee + gift_wrap - discount
  const totalOrderValue = productTotalWithTax + shippingCharges + transactionFee + giftWrap - discount
  const totalCollectable = totalOrderValue - prepaidAmount

  useEffect(() => {
    setValue('courierPartner', '')
    setValue('courierPartnerId', '')
    setValue('courierOptionKey', '')
    setValue('amazonRequestToken', null)
    setValue('amazonRateId', null)
    setValue('amazonServiceId', null)
    setValue('amazonCarrierId', null)
    setValue('selectedMaxSlabWeight', null)
    setValue('courierCod', 0)
    setValue('forwardCharges', 0)
    setValue('otherCharges', 0)
    setValue('courierCost', null)
    setValue('integrationType', undefined)
    setValue('shadowfaxForwardMode', undefined)
    setValue('shadowfaxServiceMode', undefined)
    setValue('zone', '')
    setValue('zoneId', '')
    setValue('chargeableWeight', null)
    setValue('volumetricWeight', null)
    setValue('slabs', null)
  }, [setValue])

  const onSubmit = async (data: B2CFormData) => {
    try {
      const normalizedOrderId = data.orderId.trim()

      if (!normalizedOrderId) {
        methods.setError('orderId', {
          type: 'manual',
          message: 'Order ID is required',
        })
        return
      }

      if (!data.courierPartnerId) {
        methods.setError('courierPartnerId', {
          type: 'manual',
          message: 'Please select a courier partner',
        })
        return
      }

      let amazonRequestToken = data.amazonRequestToken ?? undefined
      let amazonRateId = data.amazonRateId ?? undefined
      let amazonServiceId = data.amazonServiceId ?? undefined
      let amazonCarrierId = data.amazonCarrierId ?? undefined
      const shipmentPaymentType = data.orderType
      const packageWeightForBooking = data.weight

      if (data.integrationType === 'amazon' && (!amazonRequestToken || !amazonRateId)) {
        try {
          const refreshedCouriers = await fetchAvailableCouriers({
            origin: data.pickupLocationPincode,
            destination: data.pincode,
            pickupId: data.pickupLocationId,
            pickupName: data.pickupLocationName,
            pickupPhone: data.pickupLocationPOCPhone,
            pickupAddress: data.pickupAddress,
            pickupCity: data.pickupCity,
            pickupState: data.pickupState,
            deliveryName: data.buyerName,
            deliveryPhone: data.buyerPhone,
            deliveryAddress: data.address,
            deliveryCity: data.city,
            deliveryState: data.state,
            payment_type: shipmentPaymentType,
            order_amount: totalCollectable,
            cod: shipmentPaymentType === 'cod' ? 1 : 0,
            weight: data.weight,
            length: data.length,
            breadth: data.breadth,
            height: data.height,
            shipment_type: 'b2c',
            context: 'shipment_courier_selection',
          })

          const selectedCourierOptionKey = String(data.courierOptionKey ?? '')
          const selectedCourierId = String(data.courierPartnerId ?? '')
          const refreshedAmazonCourier = refreshedCouriers.find((courier) => {
            const isAmazon = String(courier?.integration_type || '')
              .trim()
              .toLowerCase() === 'amazon'
            if (!isAmazon || !courier?.amazon_request_token || !courier?.amazon_rate_id) {
              return false
            }

            const courierOptionKey = String(
              courier?.courier_option_key ?? courier?.id ?? courier?.courier_id ?? '',
            )
            return selectedCourierOptionKey
              ? courierOptionKey === selectedCourierOptionKey
              : String(courier?.id ?? courier?.courier_id ?? '') === selectedCourierId
          })

          if (refreshedAmazonCourier) {
            amazonRequestToken = refreshedAmazonCourier.amazon_request_token
            amazonRateId = refreshedAmazonCourier.amazon_rate_id
            amazonServiceId = refreshedAmazonCourier.amazon_service_id ?? amazonServiceId
            amazonCarrierId = refreshedAmazonCourier.amazon_carrier_id ?? amazonCarrierId

            setValue('amazonRequestToken', amazonRequestToken)
            setValue('amazonRateId', amazonRateId)
            setValue('amazonServiceId', amazonServiceId ?? null)
            setValue('amazonCarrierId', amazonCarrierId ?? null)
          }
        } catch (error) {
          console.error('Failed to refresh Amazon rate token before booking:', error)
        }

        if (!amazonRequestToken || !amazonRateId) {
          console.warn(
            'Amazon booking is continuing without a freshly refreshed live token pair; backend recovery will be used if available.',
          )
          toast.open({
            message:
              'Amazon live rate could not be refreshed right now. Continuing with the selected courier.',
            severity: 'warning',
          })
        }
      }

      const payload: CreateShipmentParams = {
        order_number: normalizedOrderId,
        payment_type: shipmentPaymentType,
        order_amount: productTotalWithTax,
        order_date: data?.orderDate,
        package_weight: packageWeightForBooking,
        package_length: data.length,
        cod_charges: shipmentPaymentType === 'cod' ? data?.courierCod : 0,
        package_breadth: data.breadth,
        package_height: data.height,
        shipping_charges: Number(data?.shippingCharges ?? 0), // What seller charges customer
        freight_charges: Number(data?.forwardCharges ?? 0), // What platform charges seller (based on rate card)
        courier_cost: data?.courierCost ? Number(data.courierCost) : undefined, // Estimated courier cost from serviceability (what platform pays courier)
        prepaid_amount: data?.prepaidAmount,
        is_rto_different: data?.isRtoSame ? 'no' : 'yes',
        discount: data.discount ?? 0,
        integration_type: data?.integrationType,
        transaction_fee: data?.transactionFee,
        gift_wrap: data?.giftWrap,
        consignee: {
          name: data.buyerName,
          address: data.address,
          address_line_1: data.address,
          locality: data.addressLocality || undefined,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          email: data?.buyerEmail,
          phone: data.buyerPhone,
        },
        pickup_location_id: data.pickupLocationId,
        pickup: {
          warehouse_name: data?.pickupLocationName ?? '',
          address: data?.pickupAddress ?? '',
          name: data?.pickupLocationPOCName ?? '',
          phone: data?.pickupLocationPOCPhone ?? '',
          city: data?.pickupCity ?? '',
          state: data?.pickupState ?? '',
          pincode: data.pickupLocationPincode ?? data.pincode,
          pickup_date: data.pickupDate,
          pickup_time: data.pickupTime,
        },
        ...(!data?.isRtoSame && {
          rto: {
            warehouse_name: data?.rtoLocationName ?? '',
            address: data?.rtoAddress ?? '',
            name: data?.rtoLocationPOCName ?? '',
            phone: data?.rtoLocationPOCPhone ?? '',
            city: data?.rtoCity ?? '',
            state: data?.rtoState ?? '',
            pincode: data?.rtoLocationPincode ?? '',
          },
        }),
        order_items: data.products.map((p) => ({
          name: p.productName,
          sku: p.sku ?? 'NA',
          qty: p.quantity,
          price: p.price,
          hsn: p.hsnCode ?? '',
          discount: p.discount ?? 0,
          tax_rate: p.taxRate ?? 0,
        })),
        courier_id: Number(data.courierPartnerId),
        courier_partner: data.courierPartner,
        courier_option_key: data.courierOptionKey,
        amazon_request_token: amazonRequestToken,
        amazon_rate_id: amazonRateId,
        amazon_service_id: amazonServiceId,
        amazon_carrier_id: amazonCarrierId,
        shadowfax_forward_mode: data.shadowfaxForwardMode,
        shadowfax_service_mode: data.shadowfaxServiceMode,
        selected_max_slab_weight:
          data.selectedMaxSlabWeight !== undefined && data.selectedMaxSlabWeight !== null
            ? Number(data.selectedMaxSlabWeight)
            : undefined,
        pickup_date: data.pickupDate,
        pickup_time: data.pickupTime,
        delivery_location: data.zone,
        zone_id: data.zoneId,
        chargedWeight: data.chargeableWeight ?? undefined,
        volumetricWeight: data.volumetricWeight ?? undefined,
      }
      createShipmentMutation.mutate(payload, {
        onSuccess: () => {
          if (location.pathname === '/orders/create') {
            navigate('/orders/list?status=pending')
          }
        },
      })
    } catch (error) {
      console.error('Error submitting B2C order:', error)
    }
  }

  const validateStep = async () => {
    if (currentStep === 0) {
      const productFields = fields.flatMap((_, idx) =>
        ['productName', 'price', 'quantity'].map(
          (key) => `products.${idx}.${key}` as keyof B2CFormData,
        ),
      )

      const step1Fields: (keyof B2CFormData)[] = [
        'buyerName',
        'buyerPhone',
        'address',
        'pincode',
        'orderType',
        'city',
        'state',
        'country',
        ...productFields,
        'weight',
        'length',
        'breadth',
        'height',
      ]

      const baseValid = await trigger(step1Fields)
      if (!baseValid) return false

      const pincode = watch('pincode')

      try {
        const resp = await fetchLocations({ pincode })
        const serviceable = Array.isArray(resp?.data) ? resp.data.length > 0 : !!resp?.data

        if (!serviceable) {
          methods.setError('pincode', {
            type: 'manual',
            message: 'Destination pincode not serviceable by any courier',
          })
          return false
        }
      } catch (error) {
        console.log('error', error)
      }

      return true
    }

    if (currentStep === 1) {
      return await trigger(['courierPartnerId'])
    }

    return true
  }

  const nextStep = async () => {
    const valid = await validateStep()
    if (valid) setCurrentStep((prev) => Math.min(prev + 1, 1))
  }
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  useEffect(() => {
    setValue('orderAmount', totalCollectable, { shouldValidate: true })
  }, [setValue, totalCollectable])

  useEffect(() => {
    register('courierPartnerId', {
      required: 'Please select a courier partner',
    })
    register('amazonRequestToken')
    register('amazonRateId')
    register('amazonServiceId')
    register('amazonCarrierId')
  }, [register])

  const compactChargeFieldSx = {
    '& .MuiInputBase-root': {
      minHeight: 34,
      fontSize: '0.82rem',
    },
    '& .MuiInputBase-input': {
      py: 0.55,
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.78rem',
    },
  }

  return (
    <FormProvider {...methods}>
      <Stack
        gap={0.75}
        sx={{
          height: '100%',
          position: 'relative',
          p: { xs: 0.45, sm: 0.55, md: 0.65 },
          borderRadius: 2,
          border: `1px solid ${alpha(ACCENT, 0.14)}`,
          background: '#ffffff',
          boxShadow: `0 12px 30px ${alpha(ACCENT, 0.08)}`,
        }}
      >
        {cloneState?.cloneOrder && (
          <Alert
            severity={cloneState.cloneMode === 'reship' ? 'warning' : 'info'}
            sx={{ borderRadius: 2, py: 0.5 }}
          >
            {cloneState.cloneMode === 'reship'
              ? `Reshipping ${cloneState.sourceOrderNumber || 'the selected order'}. Select a courier and book a fresh shipment.`
              : `Cloning ${cloneState.sourceOrderNumber || 'the selected order'}. Review the copied details before booking.`}
          </Alert>
        )}
        <Stack direction="row" sx={{ flex: 1, minHeight: 0, gap: 0 }}>
          {/* Main Form Content */}
          <Box
            component="form"
            onSubmit={(e) => e.preventDefault()}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: { xs: 0.1, sm: 0.2, md: 0.3 },
              pr: { xs: 0.4, sm: 0.65, md: 0.8 },
              minHeight: 0,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(ACCENT, 0.35),
                borderRadius: '999px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: alpha(ACCENT, 0.08),
                borderRadius: '999px',
              },
            }}
          >
            {/* Step content */}
            {currentStep === 0 && (
              <Stack gap={0.75} mb={0.75}>
                {/* Order Information */}
                <Box>
                  <Stack direction="row" alignItems="center" gap={0.6} sx={{ mb: 0.4 }}>
                    <FaBox size={14} color={ACCENT} />
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{ color: TEXT_PRIMARY, fontSize: '0.86rem' }}
                    >
                      Order Information
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      px: { xs: 0.75, md: 0.9 },
                      py: 0.65,
                      borderRadius: 2,
                      border: `1px solid ${alpha(ACCENT, 0.1)}`,
                      background: '#f9f9f9',
                    }}
                  >
                    <OrderDetailsForm />
                  </Box>
                </Box>

                {/* Main Content - 2 Column Grid Layout */}
                <Grid container spacing={0.75}>
                  {/* Left Column (8 cols) - Form Fields */}
                  <Grid size={{ xs: 12, xl: 8 }}>
                    <Stack gap={0.75}>
                      {/* Recipient Details */}
                      <Box>
                        <Stack direction="row" alignItems="center" gap={0.6} sx={{ mb: 0.4 }}>
                          <FaUser size={14} color={ACCENT} />
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ color: TEXT_PRIMARY, fontSize: '0.84rem' }}
                          >
                            Recipient Details
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            px: { xs: 0.75, md: 0.9 },
                            py: 0.65,
                            borderRadius: 2,
                            border: `1px solid ${alpha(ACCENT, 0.1)}`,
                            background: '#f9f9f9',
                          }}
                        >
                          <DeliveryDetailsForm />
                        </Box>
                      </Box>

                      {/* Shipment Details */}
                      <Box>
                        <Stack direction="row" alignItems="center" gap={0.6} sx={{ mb: 0.4 }}>
                          <FaBox size={14} color={ACCENT} />
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ color: TEXT_PRIMARY, fontSize: '0.84rem' }}
                          >
                            Shipment Details
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            px: { xs: 0.75, md: 0.9 },
                            py: 0.65,
                            borderRadius: 2,
                            border: `1px solid ${alpha(ACCENT, 0.1)}`,
                            background: '#f9f9f9',
                          }}
                        >
                          <Stack spacing={0.7}>
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{
                                  color: TEXT_MUTED,
                                  mb: 0.45,
                                  display: 'block',
                                  fontSize: '0.74rem',
                                }}
                              >
                                Products
                              </Typography>
                              <PackageDetailsForm
                                append={append}
                                control={control}
                                fields={fields}
                                remove={remove}
                              />
                            </Box>
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{
                                  color: TEXT_MUTED,
                                  mb: 0.45,
                                  display: 'block',
                                  fontSize: '0.74rem',
                                }}
                              >
                                Package Details
                              </Typography>
                              <PackageDimensionsForm />
                            </Box>
                          </Stack>
                        </Box>
                      </Box>
                    </Stack>
                  </Grid>

                  {/* Right Column (4 cols) - Order Summary */}
                  <Grid size={{ xs: 12, xl: 4 }}>
                    <Stack gap={0.75} sx={{ position: { xl: 'sticky' }, top: 4 }}>
                      <Box>
                        <Stack direction="row" alignItems="center" gap={0.6} sx={{ mb: 0.4 }}>
                          <BiRupee size={14} color={ACCENT} />
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{ color: TEXT_PRIMARY, fontSize: '0.84rem' }}
                          >
                            Order Summary
                          </Typography>
                        </Stack>

                        {/* Charges Section */}
                        <Paper
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            border: `1px solid ${alpha(ACCENT, 0.1)}`,
                            background: '#ffffff',
                            mb: 0.75,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: TEXT_MUTED,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              fontSize: '0.68rem',
                              display: 'block',
                              mb: 0.7,
                            }}
                          >
                            Additional Charges
                          </Typography>
                          <Grid container spacing={0.65}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Controller
                                name="shippingCharges"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    type="number"
                                    label="Shipping Charge"
                                    size="small"
                                    variant="outlined"
                                    InputProps={{
                                      startAdornment: (
                                        <BiRupee
                                          size={14}
                                          color={ACCENT}
                                          style={{ marginRight: 8 }}
                                        />
                                      ),
                                    }}
                                    sx={compactChargeFieldSx}
                                  />
                                )}
                              />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Controller
                                name="transactionFee"
                                control={control}
                                render={({ field }) => (
                                  <TextField
                                    {...field}
                                    fullWidth
                                    type="number"
                                    label="Transaction Fee"
                                    size="small"
                                    variant="outlined"
                                    InputProps={{
                                      startAdornment: (
                                        <BiRupee
                                          size={14}
                                          color={ACCENT}
                                          style={{ marginRight: 8 }}
                                        />
                                      ),
                                    }}
                                    sx={compactChargeFieldSx}
                                  />
                                )}
                              />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Controller
                                name="discount"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  type="number"
                                  label="Discount"
                                  size="small"
                                  variant="outlined"
                                  InputProps={{
                                    startAdornment: (
                                      <Typography sx={{ color: ACCENT, fontSize: '0.9rem', mr: 1 }}>
                                        -₹
                                      </Typography>
                                    ),
                                  }}
                                  sx={compactChargeFieldSx}
                                />
                              )}
                              />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Controller
                                name="prepaidAmount"
                              control={control}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  fullWidth
                                  type="number"
                                  label="Prepaid Amount"
                                  size="small"
                                  variant="outlined"
                                  InputProps={{
                                    startAdornment: (
                                      <Typography sx={{ color: ACCENT, fontSize: '0.9rem', mr: 1 }}>
                                        -₹
                                      </Typography>
                                    ),
                                  }}
                                  sx={compactChargeFieldSx}
                                />
                              )}
                              />
                            </Grid>
                          </Grid>
                        </Paper>

                        {/* Summary Section */}
                        <Paper
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            border: `2px solid ${ACCENT}`,
                            background: alpha(ACCENT, 0.04),
                            overflow: 'hidden',
                          }}
                        >
                          <Stack gap={0.65}>
                            <Box sx={{ pb: 0.65, borderBottom: `1px solid ${alpha(ACCENT, 0.2)}` }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_MUTED, fontSize: '0.76rem' }}
                                >
                                  Product Subtotal
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_PRIMARY, fontWeight: 600, fontSize: '0.8rem' }}
                                >
                                  ₹{' '}
                                  {subtotal.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box sx={{ pb: 0.65, borderBottom: `1px solid ${alpha(ACCENT, 0.12)}` }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_MUTED, fontSize: '0.76rem' }}
                                >
                                  Product Tax
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_PRIMARY, fontWeight: 600, fontSize: '0.8rem' }}
                                >
                                  Rs{' '}
                                  {productTax.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box sx={{ pb: 0.65, borderBottom: `1px solid ${alpha(ACCENT, 0.12)}` }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_MUTED, fontSize: '0.76rem' }}
                                >
                                  Shipping Charges
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_PRIMARY, fontWeight: 600, fontSize: '0.8rem' }}
                                >
                                  Rs{' '}
                                  {shippingCharges.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box sx={{ pb: 0.65, borderBottom: `1px solid ${alpha(ACCENT, 0.12)}` }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_MUTED, fontSize: '0.76rem' }}
                                >
                                  Transaction Fee
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_PRIMARY, fontWeight: 600, fontSize: '0.8rem' }}
                                >
                                  Rs{' '}
                                  {transactionFee.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box sx={{ pb: 0.65, borderBottom: `1px solid ${alpha(ACCENT, 0.12)}` }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_MUTED, fontSize: '0.76rem' }}
                                >
                                  Gift Wrap
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_PRIMARY, fontWeight: 600, fontSize: '0.8rem' }}
                                >
                                  Rs{' '}
                                  {giftWrap.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box sx={{ pb: 0.65, borderBottom: `1px solid ${alpha(ACCENT, 0.12)}` }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#B42318', fontSize: '0.76rem' }}
                                >
                                  Discount
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#B42318', fontWeight: 600, fontSize: '0.8rem' }}
                                >
                                  -Rs{' '}
                                  {discount.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box sx={{ pb: 0.65, borderBottom: `1px solid ${alpha(ACCENT, 0.12)}` }}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#B42318', fontSize: '0.76rem' }}
                                >
                                  Prepaid Amount
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: '#B42318', fontWeight: 600, fontSize: '0.8rem' }}
                                >
                                  -Rs{' '}
                                  {prepaidAmount.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_MUTED, fontSize: '0.76rem' }}
                                >
                                  Total Order Value
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: TEXT_PRIMARY, fontWeight: 600, fontSize: '0.8rem' }}
                                >
                                  ₹{' '}
                                  {totalOrderValue.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Stack>
                            </Box>

                            <Box
                              sx={{
                                pt: 0.75,
                                mt: 0.25,
                                borderTop: `2px solid ${ACCENT}`,
                                background: alpha(ACCENT, 0.08),
                                px: 1.5,
                                py: 0.75,
                                borderRadius: 1.5,
                                my: -0.5,
                                mx: -0.5,
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: ACCENT, fontWeight: 800, fontSize: '0.8rem' }}
                                >
                                  Amount Collectable
                                </Typography>
                                <Typography
                                  sx={{ color: ACCENT, fontWeight: 800, fontSize: '0.9rem' }}
                                >
                                  ₹{' '}
                                  {totalCollectable.toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </Paper>

                        <Box sx={{ mt: 0.7 }}>
                          <Stack direction="row" alignItems="center" gap={0.6} sx={{ mb: 0.4 }}>
                            <FaTruck size={14} color={ACCENT} />
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              sx={{ color: TEXT_PRIMARY, fontSize: '0.84rem' }}
                            >
                              Pickup Information
                            </Typography>
                          </Stack>
                          <Box
                            sx={{
                              px: { xs: 0.75, md: 0.9 },
                              py: 0.65,
                              borderRadius: 2,
                              border: `1px solid ${alpha(ACCENT, 0.1)}`,
                              background: '#f9f9f9',
                            }}
                          >
                            <PickupLocationForm compact />
                          </Box>
                        </Box>
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            )}

            {currentStep === 1 && (
              <FormSectionAccordion title="Courier Selection" icon={<FaTruck />} defaultExpanded compact>
                {errors.courierPartnerId && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.courierPartnerId.message as string}
                  </Alert>
                )}
                <SelectCourierForm shipment_type="b2c" />

                {/* Error shown as Alert */}
              </FormSectionAccordion>
            )}

            {/* Sticky footer inside scroll */}
            <Box
              sx={{
                py: 0.45,
                px: { xs: 0.75, sm: 1 },
                background: '#ffffff',
                border: `1px solid ${alpha(ACCENT, 0.16)}`,
                borderRadius: '14px',
                position: 'sticky',
                bottom: 0,
                zIndex: 10,
                mt: 0.65,
                boxShadow: `0 10px 20px ${alpha(ACCENT, 0.08)}`,
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
                gap={1}
              >
                <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>
                  {steps[currentStep]}
                </Typography>
                {currentStep > 0 && (
                  <Button
                    type="button" // ✅ no accidental submit
                    loading={createShipmentMutation?.isPending}
                    variant="outlined"
                    onClick={prevStep}
                    fullWidth={false}
                    size="small"
                    sx={{
                      minWidth: { xs: '100%', sm: 120 },
                      borderColor: alpha(ACCENT, 0.35),
                      color: ACCENT,
                      '&:hover': { borderColor: ACCENT, backgroundColor: alpha(ACCENT, 0.07) },
                    }}
                  >
                    Back
                  </Button>
                )}
                {currentStep < 1 ? (
                  <Button
                    type="button" // ✅ no accidental submit
                    variant="contained"
                    onClick={nextStep}
                    size="small"
                    sx={{
                      minWidth: { xs: '100%', sm: 130 },
                      fontWeight: 700,
                      background: ACCENT,
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button" // ✅ prevent browser reload
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit(onSubmit)} // ✅ react-hook-form submit
                    loading={createShipmentMutation?.isPending}
                    size="small"
                    sx={{
                      minWidth: { xs: '100%', sm: 210 },
                      fontWeight: 800,
                      background: ACCENT,
                    }}
                  >
                    Create & Book Order
                  </Button>
                )}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Stack>
    </FormProvider>
  )
}
