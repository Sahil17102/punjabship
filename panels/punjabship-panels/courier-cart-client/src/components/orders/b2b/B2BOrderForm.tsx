import { Box, Button, Stack, Typography, alpha } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { FormProvider, useForm, type FieldErrors } from 'react-hook-form'
import { BiRupee } from 'react-icons/bi'
import { FaBox, FaFileInvoice, FaTruck, FaUser } from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'

const ACCENT = '#0877C9'
const TEXT_PRIMARY = '#17171A'
import type { CreateB2BShipmentParams } from '../../../api/order.service'
import { useCreateB2BShipment } from '../../../hooks/Orders/useOrders'
import { usePaymentOptions } from '../../../hooks/usePaymentOptions'
import FormSectionAccordion from '../../UI/accordion/FormSectionAccordion'
import AmountSummaryCard from '../AmountSummaryCard'
import DeliveryDetailsForm from '../DeliveryDetailsForm'
import OptionalChargesForm from '../OptionalChargesForm'
import OrderDetailsForm from '../OrderDetailsForm'
import PickupLocationForm from '../PickupLocationForm'
import { SelectCourierForm } from '../SelectCourierForm'
import B2BInvoicesForm from './B2BInvoicesForm'
import B2BProductsForm from './B2BProductsForm'
// Box structure - top level array
export type Box = {
  lengthCm: number
  breadthCm: number
  heightCm: number
  weightKg: number
  quantity: number
}

// Invoice structure - array of invoices
export type Invoice = {
  invoiceNumber: string
  invoiceDate: string
  invoiceValue: number
  invoiceFileUrl?: string
}

// Main Form Data
export type B2BFormData = {
  // Buyer details
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  address: string
  pincode: string
  companyName: string
  gstin?: string
  city: string
  state: string
  country: string

  // Boxes array (top level)
  boxes: Box[]

  // Invoices array
  invoices: Invoice[]

  // Shipment package info (optional if using boxes)
  weight?: number
  length?: number
  breadth?: number
  height?: number

  // Order details
  orderId: string
  orderDate: string
  orderType: 'prepaid' | 'cod'
  freightMode: 'fop' | 'fod'
  rovType: 'owner' | 'courier' | 'none'
  orderAmount: number
  codAmount?: number

  // Courier details
  courierPartner: string
  courierPartnerId: string
  courierOptionKey?: string
  shippingCharges?: number
  transactionFee?: number
  giftWrap?: number
  discount?: number
  prepaidAmount?: number
  courierCod?: number
  courierCost?: number | null // Estimated courier cost from serviceability (what platform pays courier)
  forwardCharges?: number
  otherCharges?: number
  integrationType?: 'delhivery' | 'ekart' | 'shadowfax' | 'xpressbees' | 'amazon' | 'indiapost' | 'icarry'
  amazonRequestToken?: string | null
  amazonRateId?: string | null
  amazonServiceId?: string | null
  amazonCarrierId?: string | null
  shadowfaxForwardMode?: 'marketplace' | 'warehouse'
  shadowfaxServiceMode?: 'regular' | 'surface'

  // Pickup location (optional)
  pickupLocationId?: string
  pickupLocationPincode?: string
  pickupLocationName?: string
  pickupAddress?: string
  pickupLocationPOCName?: string
  pickupLocationPOCPhone?: string
  pickupCity?: string
  pickupState?: string
  pickupDate?: string
  pickupTime?: string

  // RTO location (for B2B, typically same as pickup)
  isRtoSame?: boolean
  rtoLocationPincode?: string
  rtoLocationName?: string
  rtoAddress?: string
  rtoLocationPOCName?: string
  rtoLocationPOCPhone?: string
  rtoCity?: string
  rtoState?: string

  // Insurance
  isInsurance?: boolean
  zone?: string
  zoneId?: string
}

export default function B2BOrderForm({ onClose }: { onClose?: () => void }) {
  const createShipmentMutation = useCreateB2BShipment(onClose)
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState(0)
  const steps = ['Order & Delivery', 'Pickup Location', 'Courier Selection']
  const { data: paymentOptions } = usePaymentOptions()

  // Determine default order type based on enabled payment options
  const getDefaultOrderType = (): 'prepaid' | 'cod' => {
    if (!paymentOptions) return 'prepaid' // Default fallback
    if (paymentOptions.codEnabled) return 'cod'
    if (paymentOptions.prepaidEnabled) return 'prepaid'
    return 'prepaid' // Final fallback
  }

  const methods = useForm<B2BFormData>({
    defaultValues: {
      boxes: [
        {
          lengthCm: 0,
          breadthCm: 0,
          heightCm: 0,
          weightKg: 0,
          quantity: 1,
        },
      ],
      invoices: [
        {
          invoiceNumber: '',
          invoiceDate: '',
          invoiceValue: 0,
          invoiceFileUrl: '',
        },
      ],
      weight: 0,
      length: 0,
      breadth: 0,
      height: 0,
      orderType: getDefaultOrderType(),
      freightMode: 'fod',
      rovType: 'owner',
      orderAmount: 0,
      codAmount: 0,
    },
  })

  const {
    getValues,
    watch,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors },
  } = methods

  const shippingCharges = Number(watch('shippingCharges') || 0)
  const transactionFee = Number(watch('transactionFee') || 0)
  const discount = Number(watch('discount') || 0)
  const prepaidAmount = Number(watch('prepaidAmount') || 0)
  const codAmount = Number(watch('codAmount') || 0)
  const orderType = watch('orderType')
  const lastSuggestedCodAmountRef = useRef<number | null>(null)

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

  // Calculate subtotal from invoices
  const subtotal = (watch('invoices') || []).reduce(
    (sum, invoice) => sum + Number(invoice.invoiceValue || 0),
    0,
  )

  const totalOrderValue = subtotal + shippingCharges + transactionFee - discount
  const suggestedCollectable = Math.max(totalOrderValue - prepaidAmount, 0)
  const onSubmit = async (data: B2BFormData) => {
    try {
      const normalizedOrderId = data.orderId.trim()
      const shipmentValue = Math.max(0, Number(data.orderAmount ?? subtotal ?? 0))
      const codCollectableAmount =
        data.orderType === 'cod'
          ? Number(data.codAmount ?? suggestedCollectable ?? 0)
          : 0

      if (!normalizedOrderId) {
        methods.setError('orderId', {
          type: 'manual',
          message: 'Order ID is required',
        })
        return
      }

      if (data.orderType === 'cod' && (!Number.isFinite(codCollectableAmount) || codCollectableAmount <= 0)) {
        methods.setError('codAmount', {
          type: 'manual',
          message: 'Amount to collect is required for COD orders',
        })
        return
      }

      // Prepare B2B shipment payload
      const payload: CreateB2BShipmentParams = {
        order_number: normalizedOrderId,
        order_date: data.orderDate,
        payment_type: data.orderType,
        freight_mode: data.freightMode || 'fod',
        rov_type: data.rovType || 'owner',
        order_amount: shipmentValue,
        cod_amount: codCollectableAmount,
        shipping_charges: data.shippingCharges ?? 0,
        freight_charges: data.forwardCharges ?? 0, // What platform charges seller (based on rate card)
        other_charges: data.otherCharges ?? 0,
        cod_charges: data.courierCod ?? 0,
        courier_cost: data.courierCost ? Number(data.courierCost) : undefined, // Estimated courier cost from serviceability (what platform pays courier)
        transaction_fee: data.transactionFee ?? 0,
        discount: data.discount ?? 0,
        gift_wrap: data.giftWrap ?? 0,
        prepaid_amount: data.prepaidAmount ?? 0,
        consignee: {
          name: data.buyerName,
          phone: data.buyerPhone,
          email: data.buyerEmail,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          company_name: data.companyName,
          gstin: data.gstin,
        },

        pickup: {
          warehouse_name: data.pickupLocationName ?? '',
          address: data.pickupAddress ?? '',
          name: data.pickupLocationPOCName ?? '',
          city: data.pickupCity ?? data.city,
          state: data.pickupState ?? data.state,
          pincode: data.pickupLocationPincode ?? data.pincode,
          phone: data.pickupLocationPOCPhone ?? data.buyerPhone,
          ...(data.pickupDate ? { pickup_date: data.pickupDate } : {}),
          ...(data.pickupTime ? { pickup_time: data.pickupTime } : {}),
        },
        pickup_location_id: data.pickupLocationId,
        // Boxes array
        boxes:
          data?.boxes?.map((box) => ({
            lengthCm: Number(box.lengthCm || 0),
            breadthCm: Number(box.breadthCm || 0),
            heightCm: Number(box.heightCm || 0),
            weightKg: Number(box.weightKg || 0),
            quantity: Math.max(1, Number(box.quantity || 1)),
          })) ?? [],

        // Invoices array
        invoices:
          data?.invoices?.map((invoice) => ({
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            invoiceValue: Number(invoice.invoiceValue || 0),
            invoiceFileUrl: invoice.invoiceFileUrl || undefined,
          })) ?? [],
        courier_id: Number(data.courierPartnerId),
        courier_partner: data.courierPartner,
        is_insurance: data.isInsurance ? 1 : 0,
        is_rto_different: data.isRtoSame === false ? 'yes' : 'no',
        request_auto_pickup: 'no',
        tags: '',
        delivery_location: data.zone,
        zone_id: data.zoneId,
      }

      // Add RTO details if RTO is different from pickup
      if (data.isRtoSame === false && data.rtoLocationPincode) {
        payload.rto = {
          warehouse_name: data.rtoLocationName ?? '',
          name: data.rtoLocationPOCName ?? '',
          address: data.rtoAddress ?? '',
          city: data.rtoCity ?? '',
          state: data.rtoState ?? '',
          pincode: data.rtoLocationPincode ?? '',
          phone: data.rtoLocationPOCPhone ?? data.buyerPhone,
        }
      }

      // Add pickup date/time if provided
      if (data.pickupDate) {
        payload.pickup_date = data.pickupDate
      }
      if (data.pickupTime) {
        payload.pickup_time = data.pickupTime
      }

      // Add integration type if provided
      if (data.integrationType) {
        payload.integration_type = data.integrationType
      }
      if (data.shadowfaxForwardMode) {
        payload.shadowfax_forward_mode = data.shadowfaxForwardMode
      }
      if (data.shadowfaxServiceMode) {
        payload.shadowfax_service_mode = data.shadowfaxServiceMode
      }

      // Call the mutation
      createShipmentMutation.mutate(payload, {
        onSuccess: () => {
          if (location.pathname === '/orders/create') {
            navigate('/orders/list?status=pending')
          }
        },
      })
    } catch (error) {
      console.error('Error preparing B2B shipment payload:', error)
    }
  }

  const nextStep = async () => {
    const valid = await trigger()
    if (valid) setCurrentStep((prev) => Math.min(prev + 1, 2))
  }

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0))

  useEffect(() => {
    setValue('orderAmount', subtotal, { shouldValidate: true })
  }, [setValue, subtotal])

  useEffect(() => {
    if (orderType !== 'cod') {
      const currentCodAmount = Number(getValues('codAmount') || 0)
      if (currentCodAmount !== 0) {
        setValue('codAmount', 0, { shouldValidate: true })
      }
      lastSuggestedCodAmountRef.current = null
      return
    }

    const currentCodAmount = Number(getValues('codAmount') || 0)
    const lastSuggestedCodAmount = lastSuggestedCodAmountRef.current
    const shouldSyncSuggestedAmount =
      currentCodAmount <= 0 ||
      (lastSuggestedCodAmount !== null &&
        Math.abs(currentCodAmount - lastSuggestedCodAmount) < 0.01)

    if (shouldSyncSuggestedAmount) {
      setValue('codAmount', suggestedCollectable, { shouldValidate: true })
    }

    lastSuggestedCodAmountRef.current = suggestedCollectable
  }, [getValues, orderType, setValue, suggestedCollectable])

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
        {/* Step Indicator */}
        <Box
          sx={{
            px: { xs: 0.75, sm: 0.9 },
            py: { xs: 0.45, sm: 0.55 },
            borderRadius: 2,
            background: alpha(ACCENT, 0.05),
            border: `1px solid ${alpha(ACCENT, 0.1)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            flexWrap: 'wrap',
          }}
        >
          {steps.map((label, index) => (
            <Stack key={label} direction="row" alignItems="center" gap={0.55}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    index < currentStep
                      ? ACCENT
                      : index === currentStep
                      ? alpha(ACCENT, 0.2)
                      : alpha(TEXT_PRIMARY, 0.08),
                  color: index < currentStep || index === currentStep ? ACCENT : TEXT_PRIMARY,
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  transition: 'all 0.2s ease',
                }}
              >
                {index < currentStep ? '✓' : index + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: '0.76rem',
                  fontWeight: index === currentStep ? 600 : 500,
                  color: index === currentStep ? TEXT_PRIMARY : alpha(TEXT_PRIMARY, 0.7),
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </Typography>
              {index < steps.length - 1 && (
                <Box
                  sx={{
                    width: 12,
                    height: '1px',
                    background: index < currentStep ? ACCENT : alpha(TEXT_PRIMARY, 0.2),
                    transition: 'all 0.2s ease',
                    display: { xs: 'none', sm: 'block' },
                  }}
                />
              )}
            </Stack>
          ))}
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ flex: 1, overflowY: 'auto', p: { xs: 0.1, sm: 0.2, md: 0.3 } }}
        >

          {currentStep === 0 && (
            <Stack gap={0.75} mb={0.75}>
              <FormSectionAccordion title="Order Details" icon={<FaBox />} defaultExpanded compact>
                <OrderDetailsForm shipmentType="b2b" />
              </FormSectionAccordion>

              <FormSectionAccordion title="Recipient Details" icon={<FaUser />} defaultExpanded compact>
                <DeliveryDetailsForm type="b2b" />
              </FormSectionAccordion>

              {/* Boxes */}
              <FormSectionAccordion title="Boxes" icon={<FaBox />} defaultExpanded compact>
                <B2BProductsForm />
              </FormSectionAccordion>

              {/* Invoices */}
              <FormSectionAccordion title="Invoices" icon={<FaFileInvoice />} defaultExpanded compact>
                <B2BInvoicesForm />
              </FormSectionAccordion>

              <FormSectionAccordion
                title="Optional Charges & Summary"
                icon={<BiRupee />}
                defaultExpanded
                compact
              >
                <OptionalChargesForm />
              </FormSectionAccordion>

              <AmountSummaryCard
                subtotal={subtotal}
                totalCollectable={orderType === 'cod' ? codAmount : totalOrderValue}
                totalOrderValue={totalOrderValue}
                errors={errors as FieldErrors<B2BFormData>}
                subtotalLabel="Total Shipment Value"
                totalOrderValueLabel="Adjusted Shipment Value"
                totalCollectableLabel={
                  orderType === 'cod' ? 'Amount to Collect' : 'Net Shipment Value'
                }
                subtotalErrorField="invoices"
                totalCollectableErrorField={orderType === 'cod' ? 'codAmount' : 'prepaidAmount'}
              />
            </Stack>
          )}

          {currentStep === 1 && <PickupLocationForm />}

          {currentStep === 2 && (
            <FormSectionAccordion title="Courier Selection" icon={<FaTruck />} defaultExpanded compact>
              <SelectCourierForm shipment_type="b2b" />
            </FormSectionAccordion>
          )}

          <Box
            sx={{
              py: 0.45,
              px: { xs: 0.75, sm: 1 },
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '15px',
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Stack direction="row" justifyContent="space-between" gap={1}>
              {currentStep > 0 && (
                <Button
                  loading={createShipmentMutation?.isPending}
                  variant="outlined"
                  onClick={prevStep}
                  size="small"
                >
                  Back
                </Button>
              )}
              {currentStep < 2 ? (
                <Button variant="contained" onClick={nextStep} size="small">
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="contained"
                  onClick={handleSubmit(onSubmit)}
                  color="primary"
                  loading={createShipmentMutation?.isPending}
                  size="small"
                >
                  Create & Book Order
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Stack>
    </FormProvider>
  )
}
