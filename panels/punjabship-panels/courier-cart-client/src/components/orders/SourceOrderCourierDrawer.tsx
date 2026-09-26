import { Alert, Box, Button, Checkbox, Divider, FormControlLabel, Stack } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import { useEffect, useMemo, useState } from 'react'
import { fetchAvailableCouriers } from '../../api/courier'
import { useBookExistingB2COrderCourier } from '../../hooks/Orders/useOrders'
import { getDefaultPickupSlot } from '../../utils/pickupSchedule'
import { toast } from '../UI/Toast'
import CustomDrawer from '../UI/drawer/CustomDrawer'
import CustomSelect from '../UI/inputs/CustomSelect'
import DeliveryDetailsForm from './DeliveryDetailsForm'
import PickupLocationForm from './PickupLocationForm'
import { SelectCourierForm } from './SelectCourierForm'
import type { B2CFormData, Product } from './b2c/B2COrderForm'
import PackageDimensionsForm from './b2c/PackageDimensionsForm'

type SourceOrderCourierDrawerProps = {
  open: boolean
  order: Record<string, any> | null
  onClose: () => void
}

const PAYMENT_CONFIRMATION_MESSAGE =
  'Payment type could not be confirmed from store. Please choose prepaid or COD before booking.'

const paymentTypeOptions = [
  { key: 'prepaid', label: 'Prepaid' },
  { key: 'cod', label: 'Cash on Delivery' },
]

const normalizeProducts = (value: unknown): Product[] => {
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

  const products = raw.map((item: any) => ({
    productName: item?.productName ?? item?.name ?? item?.title ?? 'Product',
    price: Number(item?.price ?? 0),
    quantity: Number(item?.quantity ?? item?.qty ?? 1) || 1,
    discount: Number(item?.discount ?? 0),
    taxRate: Number(item?.taxRate ?? item?.tax_rate ?? 0),
    hsnCode: item?.hsnCode ?? item?.hsn ?? '',
    sku: item?.sku ?? 'NA',
  }))

  return products.length ? products : [{ productName: 'Product', price: 0, quantity: 1 }]
}

const toMoney = (value: unknown) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const getProductTotals = (products: Product[], fallback: unknown) => {
  const totals = products.reduce(
    (sum, product) => {
      const lineTaxable = Math.max(
        0,
        toMoney(product.price) * Math.max(1, toMoney(product.quantity ?? 1)) -
          toMoney(product.discount),
      )
      const lineTax = lineTaxable * (Math.max(0, toMoney(product.taxRate)) / 100)
      return {
        taxable: sum.taxable + lineTaxable,
        tax: sum.tax + lineTax,
      }
    },
    { taxable: 0, tax: 0 },
  )
  const totalWithTax = totals.taxable + totals.tax
  const fallbackAmount = toMoney(fallback)
  return {
    taxable: totals.taxable > 0 ? totals.taxable : fallbackAmount,
    totalWithTax: totalWithTax > 0 ? totalWithTax : fallbackAmount,
  }
}

const isSalesChannelOrder = (order: Record<string, any> | null) => {
  const orderId = String(order?.order_id || '').toLowerCase()
  const integrationType = String(order?.integration_type || '').toLowerCase()
  const tags = String(order?.tags || '').toLowerCase()

  return (
    orderId.startsWith('shopify_') ||
    orderId.startsWith('woo_') ||
    integrationType === 'shopify' ||
    integrationType === 'woocommerce' ||
    tags.includes('shopify_store:') ||
    tags.includes('woocommerce_store:')
  )
}

const isShopifySourceOrder = (order: Record<string, any> | null) => {
  const orderId = String(order?.order_id || '').toLowerCase()
  const integrationType = String(order?.integration_type || '').toLowerCase()
  const tags = String(order?.tags || '').toLowerCase()

  return (
    orderId.startsWith('shopify_') ||
    integrationType === 'shopify' ||
    integrationType === 'shopify_test' ||
    tags.includes('shopify_store:')
  )
}

const normalizeObject = (value: unknown): Record<string, any> => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {}
}

const getSalesChannelPaymentMeta = (order: Record<string, any> | null) => {
  const providerMeta = normalizeObject(order?.provider_meta)
  return normalizeObject(providerMeta.sales_channel_payment)
}

const normalizeAddressPart = (value: unknown) => String(value || '').trim().replace(/\s+/g, ' ')

const normalizeCourierPhone = (value: unknown) => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

const buildCourierReadyAddress = (order: Record<string, any> | null) => {
  const structuredParts = [
    order?.address_line_1,
    order?.address_line_2,
    order?.address_landmark,
    order?.address_locality,
  ]
    .map(normalizeAddressPart)
    .filter(Boolean)
  const parts = structuredParts.length
    ? structuredParts
    : [order?.address, order?.city].map(normalizeAddressPart).filter(Boolean)

  const uniqueParts = parts.filter((part, index) => {
    const normalizedPart = part.toLowerCase()
    return parts.findIndex((candidate) => candidate.toLowerCase() === normalizedPart) === index
  })

  return uniqueParts.join(', ')
}

const buildDefaultValues = (order: Record<string, any> | null): B2CFormData => {
  const products = normalizeProducts(order?.products)
  const productTotals = getProductTotals(products, order?.order_amount)
  const trustedOrderAmount = Math.max(0, Number(order?.order_amount ?? productTotals.totalWithTax ?? 0))
  const isSyncedOrder = isSalesChannelOrder(order)
  const orderType = String(order?.order_type || '').toLowerCase() === 'cod' ? 'cod' : 'prepaid'
  const sourceShippingCharges = isSyncedOrder ? 0 : Number(order?.shipping_charges ?? 0)
  const sourceTransactionFee = isSyncedOrder ? 0 : Number(order?.transaction_fee ?? 0)
  const sourceGiftWrap = isSyncedOrder ? 0 : Number(order?.gift_wrap ?? 0)
  const sourceDiscount = isSyncedOrder ? 0 : Number(order?.discount ?? 0)
  const sourcePrepaidAmount = isSyncedOrder
    ? 0
    : Number(order?.prepaid_amount ?? (orderType === 'prepaid' ? productTotals.totalWithTax : 0))
  const fallbackCollectable =
    productTotals.totalWithTax +
    sourceShippingCharges +
    sourceTransactionFee +
    sourceGiftWrap -
    sourceDiscount -
    sourcePrepaidAmount
  const amountForCourier =
    isSyncedOrder && trustedOrderAmount > 0 ? trustedOrderAmount : Math.max(0, fallbackCollectable)
  const defaultPickupSlot = getDefaultPickupSlot()

  return {
    buyerName: order?.buyer_name || '',
    buyerPhone: isShopifySourceOrder(order)
      ? normalizeCourierPhone(order?.buyer_phone)
      : order?.buyer_phone || '',
    buyerEmail: order?.buyer_email || '',
    address: buildCourierReadyAddress(order),
    addressLocality: order?.address_locality || order?.address_landmark || '',
    pincode: order?.pincode || '',
    city: order?.city || '',
    state: order?.state || '',
    country: order?.country || 'India',
    products,
    weight: Number(order?.weight ?? 0),
    length: Number(order?.length ?? 10),
    breadth: Number(order?.breadth ?? 10),
    height: Number(order?.height ?? 10),
    orderId: order?.order_number || '',
    orderDate: order?.order_date || new Date().toISOString().slice(0, 10),
    orderType,
    courierPartner: '',
    courierPartnerId: '',
    courierOptionKey: '',
    shippingCharges: sourceShippingCharges,
    transactionFee: sourceTransactionFee,
    giftWrap: sourceGiftWrap,
    discount: sourceDiscount,
    prepaidAmount: sourcePrepaidAmount,
    courierCod: 0,
    otherCharges: 0,
    forwardCharges: 0,
    courierCost: null,
    isRtoSame: true,
    orderAmount: amountForCourier,
    pickupDate: defaultPickupSlot.pickupDate,
    pickupTime: defaultPickupSlot.pickupTime,
    selectedMaxSlabWeight: null,
    amazonRequestToken: null,
    amazonRateId: null,
    amazonServiceId: null,
    amazonCarrierId: null,
  }
}

export default function SourceOrderCourierDrawer({
  open,
  order,
  onClose,
}: SourceOrderCourierDrawerProps) {
  const methods = useForm<B2CFormData>({
    defaultValues: buildDefaultValues(order),
  })
  const { handleSubmit, reset, setError, setValue } = methods
  const bookCourier = useBookExistingB2COrderCourier(onClose)
  const salesChannelPaymentMeta = useMemo(() => getSalesChannelPaymentMeta(order), [order])
  const requiresManualPaymentConfirmation =
    String(salesChannelPaymentMeta?.confirmationStatus || '').trim().toLowerCase() === 'unconfirmed'
  const [paymentTypeConfirmedByUser, setPaymentTypeConfirmedByUser] = useState(
    !requiresManualPaymentConfirmation,
  )

  useEffect(() => {
    if (open) {
      reset(buildDefaultValues(order))
    }
  }, [open, order, reset])

  useEffect(() => {
    setPaymentTypeConfirmedByUser(!requiresManualPaymentConfirmation)
  }, [requiresManualPaymentConfirmation, order?.id, open])

  const onSubmit = async (data: B2CFormData) => {
    if (!order?.id) return
    if (requiresManualPaymentConfirmation && !paymentTypeConfirmedByUser) {
      setError('orderType', {
        type: 'manual',
        message: PAYMENT_CONFIRMATION_MESSAGE,
      })
      toast.open({ message: PAYMENT_CONFIRMATION_MESSAGE, severity: 'error' })
      return
    }
    if (!data.courierPartnerId) {
      setError('courierPartnerId', {
        type: 'manual',
        message: 'Please select a courier partner',
      })
      return
    }

    let amazonRequestToken = data.amazonRequestToken ?? undefined
    let amazonRateId = data.amazonRateId ?? undefined
    let amazonServiceId = data.amazonServiceId ?? undefined
    let amazonCarrierId = data.amazonCarrierId ?? undefined

    if (data.integrationType === 'amazon' && (!amazonRequestToken || !amazonRateId)) {
      try {
        const refreshedCouriers = await fetchAvailableCouriers({
          origin: data.pickupLocationPincode,
          destination: data.pincode,
          pickupId: data.pickupLocationId,
          pickupName: data.pickupLocationName,
          pickupAddress: data.pickupAddress,
          pickupCity: data.pickupCity,
          pickupState: data.pickupState,
          deliveryName: data.buyerName,
          deliveryPhone: data.buyerPhone,
          deliveryAddress: data.address,
          deliveryCity: data.city,
          deliveryState: data.state,
          payment_type: data.orderType,
          order_amount: data.orderAmount,
          cod: data.orderType === 'cod' ? 1 : 0,
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
          const isAmazon =
            String(courier?.integration_type || '').trim().toLowerCase() === 'amazon'
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
        const message = 'Amazon live rate is not available right now. Refresh courier rates and try again.'
        setError('courierPartnerId', { type: 'manual', message })
        toast.open({ message, severity: 'error' })
        return
      }
    }

    bookCourier.mutate({
      orderId: String(order.id),
      data: {
        payment_type: data.orderType,
        payment_type_confirmed_by_user: requiresManualPaymentConfirmation
          ? paymentTypeConfirmedByUser
          : undefined,
        package_weight: Number(data.weight),
        package_length: Number(data.length),
        package_breadth: Number(data.breadth),
        package_height: Number(data.height),
        shipping_charges: Number(data.shippingCharges ?? 0),
        freight_charges: Number(data.forwardCharges ?? 0),
        courier_cost: data.courierCost ? Number(data.courierCost) : undefined,
        prepaid_amount: Number(data.prepaidAmount ?? 0),
        cod_charges: Number(data.courierCod ?? 0),
        other_charges: Number(data.otherCharges ?? 0),
        discount: Number(data.discount ?? 0),
        transaction_fee: Number(data.transactionFee ?? 0),
        gift_wrap: Number(data.giftWrap ?? 0),
        integration_type: data.integrationType,
        courier_id: Number(data.courierPartnerId),
        courier_partner: data.courierPartner,
        courier_option_key: data.courierOptionKey,
        amazon_request_token: amazonRequestToken,
        amazon_rate_id: amazonRateId,
        amazon_service_id: amazonServiceId,
        amazon_carrier_id: amazonCarrierId,
        shadowfax_forward_mode: data.shadowfaxForwardMode,
        shadowfax_service_mode: data.shadowfaxServiceMode,
        consignee: {
          name: data.buyerName,
          phone: data.buyerPhone,
          email: data.buyerEmail,
          address: data.address,
          address_line_1: data.address,
          locality: data.addressLocality || undefined,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
        selected_max_slab_weight:
          data.selectedMaxSlabWeight !== undefined && data.selectedMaxSlabWeight !== null
            ? Number(data.selectedMaxSlabWeight)
            : undefined,
        pickup_location_id: data.pickupLocationId,
        pickup_date: data.pickupDate,
        pickup_time: data.pickupTime,
        pickup: {
          warehouse_name: data.pickupLocationName ?? '',
          address: data.pickupAddress ?? '',
          name: data.pickupLocationPOCName ?? '',
          phone: data.pickupLocationPOCPhone ?? '',
          city: data.pickupCity ?? '',
          state: data.pickupState ?? '',
          pincode: data.pickupLocationPincode ?? '',
          pickup_date: data.pickupDate,
          pickup_time: data.pickupTime,
        },
        is_rto_different: data.isRtoSame ? 'no' : 'yes',
        ...(!data.isRtoSame && {
          rto: {
            warehouse_name: data.rtoLocationName ?? '',
            address: data.rtoAddress ?? '',
            name: data.rtoLocationPOCName ?? '',
            phone: data.rtoLocationPOCPhone ?? '',
            city: data.rtoCity ?? '',
            state: data.rtoState ?? '',
            pincode: data.rtoLocationPincode ?? '',
          },
        }),
        delivery_location: data.zone,
        zone_id: data.zoneId,
        chargedWeight: data.chargeableWeight ?? undefined,
        volumetricWeight: data.volumetricWeight ?? undefined,
      },
    })
  }

  return (
    <CustomDrawer
      open={open}
      onClose={onClose}
      title={order?.order_number ? `Select courier for ${order.order_number}` : 'Select courier'}
      width="100vw"
    >
      <FormProvider {...methods}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <DeliveryDetailsForm />
            <Divider />
            <PickupLocationForm compact />
            <Divider />
            <PackageDimensionsForm />
            <Divider />
            {requiresManualPaymentConfirmation && (
              <>
                <Alert severity="warning">{PAYMENT_CONFIRMATION_MESSAGE}</Alert>
                <CustomSelect
                  required
                  label="Confirm Payment Type"
                  value={methods.watch('orderType') || 'prepaid'}
                  onSelect={(value) => {
                    setValue('orderType', value as 'prepaid' | 'cod', {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                    setPaymentTypeConfirmedByUser(false)
                  }}
                  items={paymentTypeOptions}
                  helperText="Use this only when the store did not send a reliable payment method."
                  searchable={false}
                  topMargin={false}
                  dense
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={paymentTypeConfirmedByUser}
                      onChange={(event) =>
                        setPaymentTypeConfirmedByUser(event.target.checked)
                      }
                    />
                  }
                  label={`I confirm this order should be booked as ${methods.watch('orderType') || 'prepaid'}.`}
                />
                <Divider />
              </>
            )}
            <SelectCourierForm shipment_type="b2c" />

            <Stack direction="row" justifyContent="flex-end" spacing={1.2}>
              <Button onClick={onClose} disabled={bookCourier.isPending}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={bookCourier.isPending}>
                {bookCourier.isPending ? 'Booking...' : 'Book Courier'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </FormProvider>
    </CustomDrawer>
  )
}
